"""Offline behavior tests. Mocked scores are fixtures, never accuracy evidence."""

import json

import numpy as np
import pytest

from backend import emotion_engine as engine


def scores(winner="happy", value=70):
    result = {key: np.float32((100 - value) / 6) for key in engine.RAW_LABELS}
    result[winner] = np.float32(value)
    return result


@pytest.fixture(autouse=True)
def isolate(monkeypatch):
    monkeypatch.setattr(engine, "_ready", False)
    monkeypatch.setattr(engine, "CONFIDENCE_MIN", 45)


def test_blank_has_no_face_and_never_calls_model(monkeypatch):
    def forbidden(_):
        pytest.fail("No-face images must not invoke the emotion model")
    monkeypatch.setattr(engine, "_predict_scores", forbidden)
    result = engine.analyze_frame(np.zeros((240, 320, 3), dtype=np.uint8))
    assert result == {"face": False, "frame": {"width": 320, "height": 240}}
    assert not engine.model_ready()
    json.dumps(result, allow_nan=False)


def test_schema_largest_face_and_padding(monkeypatch):
    monkeypatch.setattr(engine, "_detect_faces", lambda _: np.array([
        [1, 1, 40, 40], [100, 60, 100, 80]], dtype=np.int32))
    seen = []
    def predict(crop):
        seen.append(crop.shape)
        return scores()
    monkeypatch.setattr(engine, "_predict_scores", predict)
    result = engine.analyze_frame(np.zeros((240, 320, 3), dtype=np.uint8))
    assert seen == [(96, 120, 3)]
    assert result["box"] == {"x": 100, "y": 60, "width": 100, "height": 80}
    assert result["face"] is True
    assert result["frame"] == {"width": 320, "height": 240}
    assert result["label"] == "happy" and result["emoji"] == "😊"
    assert result["confidence"] == pytest.approx(70)
    assert set(result["scores"]) == set(engine.SUPPORTED_LABELS) | {"fear", "disgust"}
    assert sum(result["scores"].values()) == pytest.approx(100)
    assert json.loads(json.dumps(result, allow_nan=False)) == result
    assert engine.model_ready()


@pytest.mark.parametrize("winner,expected", [
    ("happy", "happy"), ("sad", "sad"), ("angry", "angry"),
    ("surprise", "surprised"), ("neutral", "neutral"),
    ("fear", "uncertain"), ("disgust", "uncertain"),
])
def test_dominant_emotion(winner, expected):
    assert engine._classify(scores(winner))["label"] == expected


def test_low_confidence_threshold_and_tie(monkeypatch):
    assert engine._classify(scores(value=44))["label"] == "uncertain"
    boundary = {key: 0 for key in engine.RAW_LABELS}
    boundary.update(happy=45, sad=30, neutral=25)
    assert engine._classify(boundary)["label"] == "happy"
    monkeypatch.setattr(engine, "CONFIDENCE_MIN", 80)
    assert engine._classify(scores())["label"] == "uncertain"
    monkeypatch.setattr(engine, "CONFIDENCE_MIN", 0)
    assert engine._classify(dict.fromkeys(engine.RAW_LABELS, 1))["label"] == "uncertain"


@pytest.mark.parametrize("bad", [None, np.zeros((0, 0, 3), dtype=np.uint8),
    np.zeros((20, 20), dtype=np.uint8), np.zeros((20, 20, 3), dtype=np.float32)])
def test_bad_frame(bad):
    with pytest.raises(ValueError, match="^bad_frame$"):
        engine.analyze_frame(bad)


def test_padding_clips_at_frame_edge(monkeypatch):
    monkeypatch.setattr(engine, "_detect_faces", lambda _: [(0, 0, 50, 50)])
    def predict(crop):
        assert crop.shape == (50, 50, 3)
        return scores()
    monkeypatch.setattr(engine, "_predict_scores", predict)
    engine.analyze_frame(np.zeros((50, 50, 3), dtype=np.uint8))


@pytest.mark.parametrize("invalid", [float("nan"), float("inf"), -1])
def test_invalid_scores_fail_without_inventing_emotion(monkeypatch, invalid):
    monkeypatch.setattr(engine, "_detect_faces", lambda _: [(0, 0, 50, 50)])
    raw = scores()
    raw["happy"] = invalid
    monkeypatch.setattr(engine, "_predict_scores", lambda _: raw)
    with pytest.raises(RuntimeError, match="^model_unavailable$"):
        engine.analyze_frame(np.zeros((50, 50, 3), dtype=np.uint8))
    assert not engine.model_ready()


def test_warmup_once_and_failure_recovery(monkeypatch):
    calls = []
    def predict(dummy):
        calls.append(dummy.shape)
        if len(calls) == 1:
            raise OSError("Simulated missing model")
        return scores()
    monkeypatch.setattr(engine, "_predict_scores", predict)
    with pytest.raises(RuntimeError, match="^model_unavailable$"):
        engine.warmup()
    assert not engine.model_ready()
    engine.warmup()
    engine.warmup()
    assert engine.model_ready()
    assert calls == [(48, 48, 3), (48, 48, 3)]
