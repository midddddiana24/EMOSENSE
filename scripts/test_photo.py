"""Analyze an authorized existing photo without saving or uploading images.

Run from emosense: python scripts/test_photo.py /path/to/photo.jpg
The shared emotion engine is introduced in Phase 2.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys

PROJECT_ROOT = Path(__file__).resolve().parents[1]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("photo", type=Path, help="Consented or authorized local image")
    args = parser.parse_args()

    if not args.photo.is_file():
        print("Error: photo does not exist or is not a file.", file=sys.stderr)
        return 2
    if not (PROJECT_ROOT / "backend" / "emotion_engine.py").is_file():
        print("Phase 2 required: backend/emotion_engine.py is not available yet.",
              file=sys.stderr)
        return 2

    sys.path.insert(0, str(PROJECT_ROOT))
    try:
        import cv2
        import numpy as np
        from dotenv import load_dotenv

        load_dotenv(PROJECT_ROOT / "backend" / ".env", override=False)
        from backend.emotion_engine import analyze_frame

        # Decode bytes to support Unicode paths on Windows. No image writes.
        image_bytes = args.photo.read_bytes()
        if not image_bytes:
            print("Error: image is empty.", file=sys.stderr)
            return 2
        frame = cv2.imdecode(np.frombuffer(image_bytes, dtype=np.uint8), cv2.IMREAD_COLOR)
        if frame is None:
            print("Error: file is not a supported, readable image.", file=sys.stderr)
            return 2
        result = analyze_frame(frame)
        # ASCII escapes keep emoji JSON valid on legacy Windows terminals.
        print(json.dumps(result, ensure_ascii=True, allow_nan=False, indent=2))
        return 0
    except ImportError:
        print("Error: dependency import failed. Use the project venv and setup commands.",
              file=sys.stderr)
    except OSError:
        print("Error: image or model could not be read. Check access and model setup.",
              file=sys.stderr)
    except Exception:
        # Do not dump image data, secrets, or third-party exception payloads.
        print("Error: analysis failed. Check model setup and retry with a valid image.",
              file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
