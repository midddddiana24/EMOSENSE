"""Same-origin API. Run one Uvicorn worker; frames are never persisted."""

from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager
from io import BytesIO
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit

import cv2
import numpy as np
from PIL import Image
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.concurrency import run_in_threadpool

from backend import emotion_engine as engine
from backend import cloud_ai

MAX_FRAME_BYTES = 2 * 1024 * 1024
MAX_FRAME_SIDE = 1920
MAX_FRAME_PIXELS = 1920 * 1080
FRONTEND_DIR = Path(__file__).resolve().parents[1] / "frontend"


def decode_jpeg(payload: bytes) -> np.ndarray:
    """Check encoded size and dimensions before OpenCV allocates decoded pixels."""
    if not payload or len(payload) > MAX_FRAME_BYTES:
        raise ValueError("bad_frame")
    try:
        with Image.open(BytesIO(payload)) as image:
            width, height = image.size
            if (image.format != "JPEG" or min(width, height) < 1
                    or max(width, height) > MAX_FRAME_SIDE
                    or width * height > MAX_FRAME_PIXELS):
                raise ValueError("bad_frame")
            image.verify()
        if not payload.endswith(b"\xff\xd9"):
            raise ValueError("bad_frame")
        frame = cv2.imdecode(np.frombuffer(payload, dtype=np.uint8), cv2.IMREAD_COLOR)
        if frame is None or frame.shape[:2] != (height, width):
            raise ValueError("bad_frame")
        return frame
    except Exception:
        raise ValueError("bad_frame") from None


def analyze_jpeg(payload: bytes) -> dict[str, Any]:
    return engine.analyze_frame(decode_jpeg(payload))


def create_app(frontend_dir: Path = FRONTEND_DIR) -> FastAPI:
    @asynccontextmanager
    async def lifespan(application: FastAPI):
        # Only one inference/warmup enters the threadpool at a time.
        application.state.inference_slot = asyncio.Semaphore(1)
        yield

    application = FastAPI(title="EmoSense", lifespan=lifespan)

    @application.get("/api/health")
    async def health() -> dict[str, Any]:
        return {"status": "ok", "model_ready": engine.model_ready(),
                "cloud_available": cloud_ai.available()}

    @application.post("/api/warmup")
    async def warmup(request: Request):
        try:
            async with request.app.state.inference_slot:
                await run_in_threadpool(engine.warmup)
        except Exception:
            return JSONResponse(status_code=503, content={
                "error": "model_unavailable", "model_ready": False,
                "message": "Local AI could not load. Check model setup and try again.",
            })
        return {"status": "ready", "model_ready": engine.model_ready()}

    @application.post("/api/analyze-cloud")
    async def analyze_cloud(request: Request):
        def error(code: int, name: str, message: str):
            return JSONResponse(status_code=code, content={"error": name, "message": message})

        if not cloud_ai.enabled():
            return error(503, "cloud_disabled", "Cloud AI is off. Local analysis is available.")
        if not cloud_ai.available():
            return error(503, "cloud_unavailable", "Cloud AI is not configured. Use local analysis.")
        origin = request.headers.get("origin")
        if origin and origin.rstrip("/") != str(request.base_url).rstrip("/"):
            return error(403, "origin_denied", "Use the app on the same server.")
        if request.headers.get("x-confirm-cloud") != "true":
            return error(403, "confirmation_required", "Confirm sending one image before using Cloud AI.")
        if request.headers.get("content-type", "").split(";")[0].strip().lower() != "image/jpeg":
            return error(415, "bad_frame", "Send one JPEG image.")
        length = request.headers.get("content-length")
        if length is not None:
            if not length.isdigit():
                return error(400, "bad_frame", "Invalid image upload length.")
            if int(length) > MAX_FRAME_BYTES:
                return error(413, "frame_too_large", "The snapshot must be at most 2 MiB.")
        payload = bytearray()
        try:
            # Streaming into bounded memory avoids UploadFile's disk spooling.
            async with asyncio.timeout(15):
                async for chunk in request.stream():
                    if len(payload) + len(chunk) > MAX_FRAME_BYTES:
                        return error(413, "frame_too_large", "The snapshot must be at most 2 MiB.")
                    payload.extend(chunk)
            async with request.app.state.inference_slot:
                local = await run_in_threadpool(analyze_jpeg, bytes(payload))
            if not local["face"]:
                return {"face": False, "label": None, "emoji": "",
                        "reason": "No face detected. No image was sent to the external service."}
            if await request.is_disconnected():
                return error(400, "request_cancelled", "Snapshot request cancelled.")
            result = await cloud_ai.analyze_snapshot(bytes(payload))
            return {"face": True, **result}
        except ValueError:
            return error(400, "bad_frame", "The snapshot is not a valid supported JPEG.")
        except Exception:
            return error(502, "cloud_unavailable", "Cloud AI is unavailable. No automatic retry was made. Use local analysis.")
        finally:
            payload.clear()

    @application.websocket("/ws/analyze")
    async def analyze_socket(websocket: WebSocket):
        # Browsers must originate from this server. CLI clients may omit Origin.
        origin = websocket.headers.get("origin")
        if origin:
            parsed = urlsplit(origin)
            if (parsed.scheme not in {"http", "https"}
                    or parsed.netloc != websocket.headers.get("host")):
                await websocket.close(code=1008)
                return
        await websocket.accept()
        try:
            while True:
                message = await websocket.receive()
                if message["type"] == "websocket.disconnect":
                    break
                payload = message.get("bytes")
                if payload is None:
                    await websocket.send_json({"error": "bad_frame"})
                    continue
                if len(payload) > MAX_FRAME_BYTES:
                    await websocket.send_json({"error": "bad_frame"})
                    await websocket.close(code=1009)
                    break
                try:
                    async with websocket.app.state.inference_slot:
                        result = await run_in_threadpool(analyze_jpeg, payload)
                except ValueError:
                    result = {"error": "bad_frame"}
                except Exception:
                    result = {"error": "analysis_unavailable",
                              "message": "Local analysis failed. Stop and retry model setup."}
                finally:
                    # Release references before waiting for the next message.
                    payload = None
                    message = None
                await websocket.send_json(result)
        except (WebSocketDisconnect, OSError):
            pass

    # An empty frontend directory returns 404, not a server crash.
    frontend_dir.mkdir(parents=True, exist_ok=True)
    application.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
    return application


app = create_app()
