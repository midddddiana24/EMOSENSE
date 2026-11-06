# Peeking crew implementation

Goal: replace the small thumbnail crew with original oversized faces peeking from a clipped stage beside the camera. A stable supported expression raises only its matching character. The user approved the result-panel stage inspired by the local reference image; that image is not shipped as an application asset.

## Implementation decisions

- Keep the current vanilla JavaScript application, existing six-frame smoothing, consent, and camera lifecycle. No backend or API changes.
- Render original square SVG faces through the existing `Mascots.svg(label, track)` interface. Photo cards use a square destination to retain proportions and export the full illustration.
- Keep artwork decorative and clipped; place all keyboard-operable greeting controls outside the clipped stage. Clicking a greeting never selects an expression.
- Use a 400ms CSS transition for poses. A ResizeObserver computes resting scale and edge inset from the actual stage dimensions; the stage reserves 224px, or 192px at viewport heights up to 768px and mobile widths.
- Remove the duplicate active illustration. Keep the label, backend-provided emoji, model score, selection text, captions, and permanent estimate notice.
- Ruling: compact the desktop header at heights up to 800px and move caption mute beside captions. This makes room for the approved larger artwork while keeping controls and the estimate notice visible.
- Ruling: continue in the existing authorized checkout so the documented launch directory immediately shows the change. Reference files remain untouched and uncommitted.

## Verification ledger

- Watched `scripts/test_peek_stage.cjs` fail before implementation because the stage did not exist.
- Stage interaction checks and the existing UI/photo regression checks are run before completion; results are recorded in `UI_VERIFICATION.md`.
- A separate reviewer found no important bug; requested follow-up coverage for reduced-motion pupil reset and photo export.

No physical-camera, live cloud, accuracy, or cross-browser claim follows from synthetic-video checks.
