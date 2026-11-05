import pytest

from backend.emotion_engine import EMOJI, LABEL_MAP, SUPPORTED_LABELS


@pytest.mark.parametrize("label,emoji", [
    ("happy", "😊"), ("sad", "😢"), ("angry", "😠"),
    ("surprised", "😲"), ("neutral", "😐"),
])
def test_exact_emoji(label, emoji):
    assert EMOJI[label] == emoji


def test_categories_and_ui_states():
    assert set(SUPPORTED_LABELS) == {"happy", "sad", "angry", "surprised", "neutral"}
    assert set(EMOJI) == set(SUPPORTED_LABELS) | {"uncertain"}
    assert EMOJI["uncertain"] == "🤔"
    assert LABEL_MAP["surprise"] == "surprised"
    assert LABEL_MAP["fear"] == LABEL_MAP["disgust"] == "uncertain"
