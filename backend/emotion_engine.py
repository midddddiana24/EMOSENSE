"""Local expression estimates. Frames stay in memory; only model weights are cached."""

from __future__ import annotations

import math
import os
from pathlib import Path
from threading import RLock
from typing import Any

import cv2
import numpy as np
from dotenv import load_dotenv

load_dotenv(Path(__file__).with_name(".env"), override=False)
CONFIDENCE_MIN = float(os.getenv("CONFIDENCE_MIN", "45"))
if not math.isfinite(CONFIDENCE_MIN) or not 0 <= CONFIDENCE_MIN <= 100:
    raise ValueError("CONFIDENCE_MIN must be a finite number from 0 to 100")

HAAR_SCALE_FACTOR = 1.1
HAAR_MIN_NEIGHBORS = 5
HAAR_MIN_SIZE = (40, 40)
FACE_PADDING = 0.10  # Ten percent on each side, clipped to frame boundaries.
RAW_LABELS = ("happy", "sad", "angry", "surprise", "neutral", "fear", "disgust")
LABEL_MAP = {
    "happy": "happy", "sad": "sad", "angry": "angry",
    "surprise": "surprised", "neutral": "neutral",
    "fear": "uncertain", "disgust": "uncertain",
}
SUPPORTED_LABELS = ("happy", "sad", "angry", "surprised", "neutral")
EMOJI = {
    "happy": "😊", "sad": "😢", "angry": "😠",
    "surprised": "😲", "neutral": "😐", "uncertain": "🤔",
}

_lock = RLock()
_cascade: Any = None
_ready = False


def model_ready() -> bool:
    """Non-blocking readiness flag for the future health endpoint."""
    return _ready


def _detect_faces(bgr: np.ndarray) -> Any:
    """Detection boundary: replace this function to adopt another detector."""
    global _cascade
    if _cascade is None:
        _cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        )
        if _cascade.empty():
            _cascade = None
            raise RuntimeError("face_detector_unavailable")
    gray = cv2.equalizeHist(cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY))
    return _cascade.detectMultiScale(
        gray, scaleFactor=HAAR_SCALE_FACTOR,
        minNeighbors=HAAR_MIN_NEIGHBORS, minSize=HAAR_MIN_SIZE,
    )


def _predict_scores(crop: np.ndarray) -> dict[str, Any]:
    # Lazy import keeps no-face processing independent of TensorFlow/model loading.
    from deepface import DeepFace

    result = DeepFace.analyze(
        img_path=crop, actions=["emotion"], detector_backend="skip",
        enforce_detection=False, align=False, silent=True,
    )
    if isinstance(result, list):
        result = result[0]
    return result["emotion"]


def _classify(raw: dict[str, Any]) -> dict[str, Any]:
    values = {key: float(raw[key]) for key in RAW_LABELS}
    if any(not math.isfinite(v) or v < 0 for v in values.values()):
        raise ValueError("invalid_model_scores")
    total = sum(values.values())
    if not math.isfinite(total) or total <= 0:
        raise ValueError("invalid_model_scores")
    # Keep fear/disgust scores so evaluation can inspect unsupported expressions.
    scores = {
        "surprised" if key == "surprise" else key: value / total * 100
        for key, value in values.items()
    }
    winner = max(values, key=values.get)
    confidence = float(values[winner] / total * 100)
    label = LABEL_MAP[winner]
    tied = sum(math.isclose(v, values[winner], rel_tol=1e-9, abs_tol=1e-9)
               for v in values.values()) > 1
    if confidence < CONFIDENCE_MIN or tied:
        label = "uncertain"
    return {"label": label, "emoji": EMOJI[label],
            "confidence": confidence, "scores": scores}


def warmup() -> None:
    """Run one dummy inference once. Failure leaves readiness false for retry."""
    global _ready
    with _lock:
        if _ready:
            return
        try:
            _classify(_predict_scores(np.full((48, 48, 3), 127, dtype=np.uint8)))
        except Exception:
            raise RuntimeError("model_unavailable") from None
        _ready = True


def analyze_frame(bgr: np.ndarray) -> dict[str, Any]:
    """Return JSON-safe results; raise ValueError('bad_frame') for invalid input.

    Coordinates refer to the original, unmirrored frame. Confidence is the top
    model score, not measured accuracy. No-face results omit all emotion fields.
    The future server must call this synchronous function in a worker thread.
    """
    global _ready
    if (not isinstance(bgr, np.ndarray) or bgr.dtype != np.uint8
            or bgr.ndim != 3 or bgr.shape[2] != 3 or bgr.size == 0):
        raise ValueError("bad_frame")
    height, width = map(int, bgr.shape[:2])
    frame = {"width": width, "height": height}
    # Serialize Haar and model access; do not retain frames in global state.
    with _lock:
        faces = _detect_faces(bgr)
        if len(faces) == 0:
            return {"face": False, "frame": frame}
        x, y, w, h = map(int, max(faces, key=lambda box: int(box[2]) * int(box[3])))
        pad_x, pad_y = round(w * FACE_PADDING), round(h * FACE_PADDING)
        crop = bgr[max(0, y - pad_y):min(height, y + h + pad_y),
                   max(0, x - pad_x):min(width, x + w + pad_x)].copy()
        try:
            classification = _classify(_predict_scores(crop))
        except Exception:
            _ready = False
            raise RuntimeError("model_unavailable") from None
        _ready = True
        return {"face": True, "box": {"x": x, "y": y, "width": w, "height": h},
                "frame": frame, **classification}
