"""Exercise the real WebSocket with an in-memory blank JPEG; no photo required."""

from __future__ import annotations

import argparse
import asyncio
import json
from pathlib import Path

import cv2
import numpy as np
from websockets.asyncio.client import connect

FRAME_WIDTH = 320
JPEG_QUALITY = 75
MAX_FRAME_BYTES = 2 * 1024 * 1024


async def check(url: str, photo: Path | None) -> None:
    if photo is None:
        frame = np.zeros((240, FRAME_WIDTH, 3), dtype=np.uint8)
    else:
        # Read only an existing authorized photo; never write a captured frame.
        if photo.stat().st_size > MAX_FRAME_BYTES:
            raise ValueError("Use a photo under 2 MiB")
        frame = cv2.imdecode(np.frombuffer(photo.read_bytes(), np.uint8), cv2.IMREAD_COLOR)
        if frame is None:
            raise ValueError("Photo is unreadable")
        height, width = frame.shape[:2]
        frame = cv2.resize(frame, (FRAME_WIDTH, max(1, round(height * FRAME_WIDTH / width))))
    ok, encoded = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, JPEG_QUALITY])
    if not ok:
        raise ValueError("JPEG encoding failed")
    async with connect(url, open_timeout=10, max_size=MAX_FRAME_BYTES) as socket:
        await socket.send(encoded.tobytes())
        result = json.loads(await asyncio.wait_for(socket.recv(), timeout=180))
        print(json.dumps(result, indent=2, ensure_ascii=True))
        if photo is None:
            assert result == {"face": False, "frame": {"width": 320, "height": 240}}
        elif "error" in result:
            raise RuntimeError("Server could not analyze the photo")
        # Send the next message only after the previous response arrives.
        await socket.send(b"not-a-jpeg")
        assert json.loads(await asyncio.wait_for(socket.recv(), timeout=10)) == {"error": "bad_frame"}
        print("PASS: JPEG response and malformed-frame rejection")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", default="ws://127.0.0.1:8000/ws/analyze")
    parser.add_argument("--photo", type=Path, help="Optional consented/authorized photo")
    args = parser.parse_args()
    try:
        asyncio.run(check(args.url, args.photo))
    except Exception as exc:
        print(f"Check failed ({type(exc).__name__}). Check server, URL, model, and photo.")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
