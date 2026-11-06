"""Cloud contract tests use a fake SDK; no external requests or real credentials."""

import asyncio
import base64
import json
import httpx
from copy import deepcopy

import pytest

from backend import cloud_ai


@pytest.mark.parametrize("label", list(cloud_ai.EMOJI))
@pytest.mark.parametrize("fence", ["```json\n", "```JSON ", "```"])
def test_supported_labels_and_fenced_json(label, fence):
    text = json.dumps({"label": label, "reason": "The visible features are ambiguous."})
    assert cloud_ai.parse_result(fence + text + "\n```") == {
        "label": label, "reason": "The visible features are ambiguous.", "emoji": cloud_ai.EMOJI[label]}


@pytest.mark.parametrize("label", ["fear", "disgust", "excited", None, ["happy"]])
def test_unsupported_label_becomes_uncertain(label):
    result = cloud_ai.parse_result(json.dumps({"label": label, "reason": "Ignore this description."}))
    assert result["label"] == "uncertain"
    assert result["reason"] == "The service did not return a supported expression label."


@pytest.mark.parametrize("reason", [None, "", "x" * 301, []])
def test_invalid_reason_becomes_uncertain(reason):
    assert cloud_ai.parse_result(json.dumps({"label": "happy", "reason": reason}))["label"] == "uncertain"


@pytest.mark.parametrize("text", ["not JSON", "[]", "null", "", "{incomplete"])
def test_bad_json_is_rejected(text):
    with pytest.raises(ValueError):
        cloud_ai.parse_result(text)


def test_disabled_is_default(monkeypatch):
    monkeypatch.delenv("CLOUD_AI_ENABLED", raising=False)
    monkeypatch.setenv("OPENROUTER_API_KEY", "test-only-key")
    monkeypatch.setenv("OPENROUTER_MODEL", "test-only-model")
    assert not cloud_ai.available()
    with pytest.raises(RuntimeError, match="^cloud_unavailable$"):
        asyncio.run(cloud_ai.analyze_snapshot(b"unused"))


def catalog():
    return {"data": [{"id": "test/vision:free", "architecture": {
        "input_modalities": ["text", "image"], "output_modalities": ["text"]},
        "pricing": {"prompt": "0", "completion": "0", "request": "0", "image": "0"}}]}


@pytest.mark.parametrize("change", ["paid", "text-only", "missing", "price", "unknown-price", "nonfinite"])
def test_model_validation_fails_closed(change):
    data = deepcopy(catalog())
    model = "test/vision:free"
    if change == "paid": model = "test/vision"
    if change == "text-only": data["data"][0]["architecture"]["input_modalities"] = ["text"]
    if change == "missing": data["data"] = []
    if change == "price": data["data"][0]["pricing"]["image"] = "0.1"
    if change == "unknown-price": del data["data"][0]["pricing"]["prompt"]
    if change == "nonfinite": data["data"][0]["pricing"]["completion"] = "NaN"
    with pytest.raises(ValueError):
        cloud_ai.validate_model(data, model)


@pytest.mark.parametrize("failure", [None, "timeout", "provider", "bad-json", "rate-limit", "paid-model", "incomplete"])
def test_http_one_image_attempt_and_sanitized_errors(monkeypatch, failure):
    monkeypatch.setenv("CLOUD_AI_ENABLED", "true")
    monkeypatch.setenv("OPENROUTER_API_KEY", "test-only-key")
    monkeypatch.setenv("OPENROUTER_MODEL", "test/vision:free")
    calls, settings = [], {}
    def handler(request):
        calls.append(request)
        if request.method == "GET":
            assert "authorization" not in request.headers
            data = catalog()
            if failure == "paid-model": data["data"][0]["pricing"]["prompt"] = "0.1"
            return httpx.Response(200, json=data)
        if failure == "timeout": raise httpx.ReadTimeout("private detail", request=request)
        if failure == "provider": return httpx.Response(401, json={"error": "private key detail"})
        if failure == "rate-limit": return httpx.Response(429, json={"error": "rate limit"})
        text = "broken" if failure == "bad-json" else '{"label":"neutral","reason":"The mouth appears relaxed."}'
        return httpx.Response(200, json={"status": "incomplete" if failure == "incomplete" else "completed",
            "output": [{"type": "message", "content": [{"type": "output_text", "text": text}]}]})
    original = httpx.AsyncClient
    def factory(**kwargs):
        settings.update(kwargs)
        return original(transport=httpx.MockTransport(handler), **kwargs)
    monkeypatch.setattr(cloud_ai.httpx, "AsyncClient", factory)
    if failure:
        with pytest.raises(RuntimeError, match="^cloud_unavailable$"):
            asyncio.run(cloud_ai.analyze_snapshot(b"test JPEG bytes"))
    else:
        assert asyncio.run(cloud_ai.analyze_snapshot(b"test JPEG bytes"))["label"] == "neutral"
    assert len(calls) == (1 if failure == "paid-model" else 2)
    assert settings["timeout"] == 30 and settings["follow_redirects"] is False and settings["trust_env"] is False
    if failure != "paid-model":
        post = calls[-1]
        assert str(post.url) == "https://openrouter.ai/api/v1/responses"
        assert post.headers["authorization"] == "Bearer test-only-key"
        body = json.loads(post.content)
        assert body["model"] == "test/vision:free"
        assert body["provider"] == {"allow_fallbacks": False, "data_collection": "deny",
            "max_price": {"prompt": 0, "completion": 0, "request": 0, "image": 0}}
        assert body["store"] is False
        source = body["input"][0]["content"][1]["image_url"]
        assert source.startswith("data:image/jpeg;base64,")
        assert base64.b64decode(source.split(",", 1)[1]) == b"test JPEG bytes"
