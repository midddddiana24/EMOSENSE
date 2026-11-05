"""Cloud contract tests use a fake SDK; no external requests or real credentials."""

import asyncio
import base64
import json
from types import SimpleNamespace

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
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-only-key")
    monkeypatch.setenv("ANTHROPIC_MODEL", "test-only-model")
    assert not cloud_ai.available()
    with pytest.raises(RuntimeError, match="^cloud_unavailable$"):
        asyncio.run(cloud_ai.analyze_snapshot(b"unused"))


@pytest.mark.parametrize("failure", [None, "timeout", "provider", "bad-json"])
def test_sdk_one_attempt_and_sanitized_errors(monkeypatch, failure):
    monkeypatch.setenv("CLOUD_AI_ENABLED", "true")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-only-key")
    monkeypatch.setenv("ANTHROPIC_MODEL", "test-only-model")
    options, calls = {}, []
    class FakeClient:
        def __init__(self, **kwargs):
            options.update(kwargs)
            self.messages = self

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return False

        async def create(self, **kwargs):
            calls.append(kwargs)
            if failure == "timeout":
                raise TimeoutError("private timeout detail")
            if failure == "provider":
                raise RuntimeError("private API key or image detail")
            text = "broken" if failure else '{"label":"neutral","reason":"The mouth appears relaxed."}'
            return SimpleNamespace(content=[SimpleNamespace(type="text", text=text)])

    monkeypatch.setattr(cloud_ai, "AsyncAnthropic", FakeClient)
    if failure:
        with pytest.raises(RuntimeError, match="^cloud_unavailable$"):
            asyncio.run(cloud_ai.analyze_snapshot(b"test JPEG bytes"))
    else:
        assert asyncio.run(cloud_ai.analyze_snapshot(b"test JPEG bytes"))["label"] == "neutral"
    assert len(calls) == 1
    assert options["max_retries"] == 0 and options["timeout"] == 30
    assert options["api_key"] == "test-only-key" and options["auth_token"] == ""
    assert options["base_url"] == "https://api.anthropic.com"
    assert calls[0]["model"] == "test-only-model"
    source = calls[0]["messages"][0]["content"][0]["source"]
    assert source["type"] == "base64" and source["media_type"] == "image/jpeg"
    assert base64.b64decode(source["data"]) == b"test JPEG bytes"
