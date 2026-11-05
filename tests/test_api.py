"""API behavior tests; no model download, external AI call, or camera required."""

from threading import Event, Thread

import cv2
import numpy as np
import pytest
from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect

from backend import main


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(main.engine, "_ready", False)
    monkeypatch.setenv("CLOUD_AI_ENABLED", "false")
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    monkeypatch.delenv("ANTHROPIC_MODEL", raising=False)
    with TestClient(main.create_app(tmp_path)) as test_client:
        yield test_client


def jpeg(width=320, height=240):
    ok, encoded = cv2.imencode(".jpg", np.zeros((height, width, 3), dtype=np.uint8))
    assert ok
    return encoded.tobytes()


def test_health_and_static_route_order(client):
    assert client.get("/api/health").json() == {"status": "ok", "model_ready": False, "cloud_available": False}
    assert client.get("/").status_code == 404
    assert main.app.routes[-1].name == "frontend"


def test_warmup_success_and_failure(client, monkeypatch):
    monkeypatch.setattr(main.engine, "warmup", lambda: monkeypatch.setattr(main.engine, "_ready", True))
    assert client.post("/api/warmup").json() == {"status": "ready", "model_ready": True}
    def fail():
        raise RuntimeError("private diagnostic")
    monkeypatch.setattr(main.engine, "warmup", fail)
    response = client.post("/api/warmup")
    assert response.status_code == 503
    assert response.json()["error"] == "model_unavailable"
    assert "private diagnostic" not in response.text


@pytest.mark.parametrize("enabled,status,error", [
    ("false", 503, "cloud_disabled"), ("true", 503, "cloud_unavailable"),
])
def test_cloud_disabled_or_unconfigured(client, monkeypatch, enabled, status, error):
    monkeypatch.setenv("CLOUD_AI_ENABLED", enabled)
    response = client.post("/api/analyze-cloud", content=b"unused")
    assert response.status_code == status
    assert response.json()["error"] == error


@pytest.fixture
def cloud_client(client, monkeypatch):
    monkeypatch.setenv("CLOUD_AI_ENABLED", "true")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-only-key")
    monkeypatch.setenv("ANTHROPIC_MODEL", "test-only-model")
    return client


CLOUD_HEADERS = {"content-type": "image/jpeg", "x-confirm-cloud": "true"}


def test_cloud_health_exposes_no_credentials(cloud_client):
    response = cloud_client.get("/api/health")
    assert response.json()["cloud_available"] is True
    assert "test-only" not in response.text


def test_cloud_requires_confirmation_and_same_origin(cloud_client, monkeypatch):
    async def forbidden(_):
        pytest.fail("No provider call before confirmation")
    monkeypatch.setattr(main.cloud_ai, "analyze_snapshot", forbidden)
    assert cloud_client.post("/api/analyze-cloud", content=jpeg(), headers={"content-type": "image/jpeg"}).status_code == 403
    assert cloud_client.post("/api/analyze-cloud", content=jpeg(), headers={**CLOUD_HEADERS, "origin": "https://elsewhere.invalid"}).status_code == 403


@pytest.mark.parametrize("body,headers,expected", [
    (b"bad", CLOUD_HEADERS, 400),
    (b"", CLOUD_HEADERS, 400),
    (b"bad", {"x-confirm-cloud": "true", "content-type": "image/png"}, 415),
    (b"x" * (main.MAX_FRAME_BYTES + 1), CLOUD_HEADERS, 413),
    (b"bad", {**CLOUD_HEADERS, "content-length": "invalid"}, 400),
], ids=["invalid-jpeg", "empty", "wrong-type", "oversize", "invalid-length"])
def test_cloud_upload_rejection(cloud_client, monkeypatch, body, headers, expected):
    async def forbidden(_):
        pytest.fail("Rejected images must not reach the provider")
    monkeypatch.setattr(main.cloud_ai, "analyze_snapshot", forbidden)
    assert cloud_client.post("/api/analyze-cloud", content=body, headers=headers).status_code == expected


def test_cloud_chunked_size_limit(cloud_client):
    response = cloud_client.post("/api/analyze-cloud", headers=CLOUD_HEADERS,
        content=iter([b"x" * main.MAX_FRAME_BYTES, b"x"]))
    assert response.status_code == 413


def test_cloud_no_face_never_sends_image(cloud_client, monkeypatch):
    async def forbidden(_):
        pytest.fail("No-face snapshots must stay local")
    monkeypatch.setattr(main.cloud_ai, "analyze_snapshot", forbidden)
    result = cloud_client.post("/api/analyze-cloud", content=jpeg(), headers=CLOUD_HEADERS).json()
    assert result["face"] is False and result["label"] is None and result["emoji"] == ""


def test_cloud_success_exactly_one_call_and_safe_failure(cloud_client, monkeypatch):
    monkeypatch.setattr(main.engine, "analyze_frame", lambda _: {"face": True})
    calls = []
    async def provider(payload):
        calls.append(payload)
        return {"label": "happy", "reason": "The mouth corners appear raised.", "emoji": main.engine.EMOJI["happy"]}
    monkeypatch.setattr(main.cloud_ai, "analyze_snapshot", provider)
    payload = jpeg()
    response = cloud_client.post("/api/analyze-cloud", content=payload, headers=CLOUD_HEADERS)
    assert response.status_code == 200
    assert response.json()["face"] is True and response.json()["label"] == "happy"
    assert calls == [payload]
    async def fail(_):
        raise RuntimeError("private provider error with sensitive content")
    monkeypatch.setattr(main.cloud_ai, "analyze_snapshot", fail)
    response = cloud_client.post("/api/analyze-cloud", content=payload, headers=CLOUD_HEADERS)
    assert response.status_code == 502 and response.json()["error"] == "cloud_unavailable"
    assert "sensitive" not in response.text


def test_websocket_no_face_and_recovery(client):
    with client.websocket_connect("/ws/analyze") as socket:
        socket.send_text("not binary")
        assert socket.receive_json() == {"error": "bad_frame"}
        socket.send_bytes(b"broken jpeg")
        assert socket.receive_json() == {"error": "bad_frame"}
        socket.send_bytes(jpeg())
        assert socket.receive_json() == {"face": False, "frame": {"width": 320, "height": 240}}


def test_websocket_inference_failure(client, monkeypatch):
    def fail(_):
        raise RuntimeError("private diagnostic")
    monkeypatch.setattr(main.engine, "analyze_frame", fail)
    with client.websocket_connect("/ws/analyze") as socket:
        socket.send_bytes(jpeg())
        result = socket.receive_json()
        assert result["error"] == "analysis_unavailable"
        assert "private diagnostic" not in str(result)


def test_websocket_oversize_closes(client):
    with client.websocket_connect("/ws/analyze") as socket:
        socket.send_bytes(b"x" * (main.MAX_FRAME_BYTES + 1))
        assert socket.receive_json() == {"error": "bad_frame"}
        with pytest.raises(WebSocketDisconnect) as error:
            socket.receive_json()
        assert error.value.code == 1009


def test_reject_cross_origin_browser(client):
    with pytest.raises(WebSocketDisconnect):
        with client.websocket_connect("/ws/analyze", headers={"origin": "https://elsewhere.invalid"}):
            pass


@pytest.mark.parametrize("payload", [b"", b"invalid", jpeg()[:-2], jpeg(1921, 1)])
def test_decode_rejects_invalid_or_excessive_images(payload):
    with pytest.raises(ValueError, match="^bad_frame$"):
        main.decode_jpeg(payload)


def test_health_responds_while_model_thread_is_busy(client, monkeypatch):
    started, release = Event(), Event()
    responses = []
    def slow_warmup():
        started.set()
        assert release.wait(5)
    monkeypatch.setattr(main.engine, "warmup", slow_warmup)
    worker = Thread(target=lambda: responses.append(client.post("/api/warmup")))
    worker.start()
    try:
        assert started.wait(2)
        assert client.get("/api/health").status_code == 200
    finally:
        release.set()
        worker.join(timeout=6)
    assert not worker.is_alive()
    assert responses[0].status_code == 200
