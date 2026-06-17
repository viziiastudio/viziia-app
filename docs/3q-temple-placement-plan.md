# 3/4 Temple Placement — Landmark-Free Geometric Plan

Starting point for the next session. The sidecar split is done and correct; the
**worker's temple placement** is what remains.

## Where we are

- **Done (committed, `fix/3q-near-temple-hinge-crop`):** `/segment-frame-v2` now
  hinge-crops, so `near_temple` is a **temple-only arm** (no lens). The
  lens-duplication seam is eliminated at the source. Mask-validated (hinge at the
  real arm↔lens joint, e.g. x=1195 on `3q-right.png`).
- **Broken (this task):** the worker's post-Gemini temple paste. A live render
  showed a flat riveted temple fragment sitting **on the lens above the eye**.
  This placement was always wrong — it was *masked* by the old lens-fused layer
  (which roughly overlaid the frame). Three faults, all in the placement block:
  1. **Scale too small** — `box.w * frameBox.width/2409` ≈ 58px stub, can't reach the ear.
  2. **No rotation** — flat SKU arm not angled back on the 3/4 head.
  3. **Anchor on the lens** — envelope pasted inside the frame, not at the hinge.
  (The "arm sweeping to the ear" in the render is Gemini hallucinating it.)

## Dead end — do NOT use landmarks

`decomposeAndAlignTemple` (`/hinge-temple`, ~line 1603) computes an ear-directed
rotation, but it's **dead code and unusable**: the sidecar aliases ear to temple
(`mediapipe_sidecar.py:84-87`, `left_ear = lm[234] = left_temple`), so the
hinge→ear vector is always zero. There is no real ear landmark. `headPose.yaw` is
also unreliable on synthesized 3/4 faces (measured 7° on a clear turn). Verified
read-only — both `left_temple`/`left_ear_tragus` returned identical coords on the
render *and* on a clean frontal face.

## The bar (lowered, realistically)

In a 3/4 photo the temple is **mostly hidden behind the hair**. We do NOT need a
pixel-perfect sweep to a precise ear. We need: **start at the hinge, head back and
slightly down, recede behind the hair, and stay off the lens.** That's achievable
with pure geometry — no landmarks.

## Inputs available at the placement block (worker `index.js`, ~2000–2030)

- `angleRefinedTransform.frameBox = {x, y, width, height}` — the placed frame on
  the angle model (model-image space). **Reliable.**
- `angleRefinedTransform._nearTemple = { buffer, box, hinge, segSide, mirrored }`
  - `box = {x, y, w, h}` — `near_temple` bbox in **SKU space**.
  - For `segSide=left`: in the cropped layer, **earpiece at local x≈0 (left),
    hinge-end at local x≈box.w (right)**. (Mirror for `segSide=right`.)
- `job.frameMetadata.dimensions` — PIM: `templeLengthMm` (e.g. 145),
  `frameWidthMm` (e.g. 138).
- `segSide` decides the near (visible) side. For `three-quarter-right`, `segSide=left`
  → visible temple on the **image-left**, attaches at the frame's **left** edge.

## The three fixes (replace the block at 2009–2025)

### 1. Scale — from PIM, not /2409
Temple length in model px:
```
templeLenPx = frameBox.width * (dimensions.templeLengthMm / dimensions.frameWidthMm)
            ≈ frameBox.width * (145/138) ≈ 1.05 * frameBox.width
```
Scale the layer so its arm axis (`box.w`) maps to `templeLenPx`:
```
scale   = templeLenPx / box.w
scaledW = round(box.w * scale)      // ≈ frame-width-sized, NOT a 58px stub
scaledH = round(box.h * scale)
```

### 2. Rotation — fixed sweep angle (landmark-free)
Temples angle slightly **down** toward the (hidden) ear. Use a fixed angle, tuned
by render:
```
SWEEP_DEG = 12        // downward tilt from horizontal; tune 8–18 at validation
theta = segSide === "left" ? +SWEEP_DEG : -SWEEP_DEG   // sign per side; confirm by render
rotated = sharp(scaledLayer).rotate(theta, { background: transparent })
```
The layer's arm already runs earpiece→hinge horizontally, so only the downward
tilt is added. (No yaw term — yaw landmark is unreliable and the hair hides the
far reach anyway.)

### 3. Anchor — hinge-END at the frame hinge edge
Hinge point on the face (model space), near/visible side:
```
hingeHeightFrac = 0.20                       // hinge sits near lens top; tune
H = segSide === "left"
  ? { x: frameBox.x,                 y: frameBox.y + hingeHeightFrac*frameBox.height }
  : { x: frameBox.x + frameBox.width, y: frameBox.y + hingeHeightFrac*frameBox.height }
```
Place the rotated layer so its **hinge-end pixel lands on H**. The hinge-end in
the *scaled, unrotated* layer is `P = (scaledW, hingeHeightFrac*scaledH)` for
`segSide=left` (right edge). After `sharp.rotate` (rotates about center, expands
canvas), compute where P moves:
```
cOld = (scaledW/2, scaledH/2)                 // pre-rotate center
cNew = (rotatedW/2, rotatedH/2)               // expanded-canvas center (from rotated metadata)
Prot = cNew + R(theta) · (P - cOld)           // R = standard 2D rotation
left = round(H.x - Prot.x)
top  = round(H.y - Prot.y)
composite(rotated at {left, top})
```
This is the fiddly part — `sharp.rotate` auto-expands and re-centers, so the
expand offset must be taken from the rotated buffer's metadata, not assumed.
Expect 1–2 validation renders to nail the sign of `theta` and `hingeHeightFrac`.

## Replaces / supersedes

This replaces the entire current paste (lines ~2009–2025: `hingeScaled`, the
`mirrored` left/right-edge `templeLeft`, `templeTop = fb.y - 0.3*scaledH`). The
`mirrored` flag / `NEAR_SIDE_BY_ANGLE` role in *placement* collapses into "anchor
at this `segSide`'s frame edge, sweep that way" — `segSide` still selects the side.

## Tuning knobs (name them)
- `SWEEP_DEG` (~12) — downward tilt.
- `hingeHeightFrac` (~0.20) — hinge height down the lens.
- Scale via PIM `templeLengthMm/frameWidthMm` (no magic 2409).

## Validation
- Cheap first: dump `frameBox` + computed `H`, `theta`, `templeLenPx` and overlay
  the predicted temple polyline on the rendered face (no Gemini) to sanity-check
  geometry before spending.
- Then the scoped render (front + three-quarter-right, ~4 Gemini calls; mind the
  GCP billing-propagation flap — settle on 3 stable probes first).
- Pass bar: temple starts at the hinge, recedes back/down behind the hair, **not
  on the lens**.

## Open items
- **Side generality:** validated path is `three-quarter-right` → `segSide=left`.
  `three-quarter-left` is unvalidated (currently `segSide=left` too, per
  `NEAR_SIDE_BY_ANGLE`); confirm the edge/sweep sign for it.
- **`angleRefined` vs `angleModel` size:** confirm same dimensions, else scale
  `frameBox`/`H` into the refined image's space before compositing.
- **Fallback:** when `near_temple` is `None` (sidecar fallback), skip placement
  entirely — already the case (`if (angleRefinedTransform._nearTemple)`).

## Reproduce the validation render
Throwaway runner was deleted. Recreate `server/worker/_validation_run.mjs`:
upload `Front.png` (clientPhotos.front) + `3q-right.png` (threeQuarter +
threeQuarterRight), synth model, `angles: ["front","three-quarter-right"]`,
`maxAttempts: 1`, fetch outputs by S3 prefix `outputs/<jobId>...`. Run with
`node --env-file=.env`, remap `REMOVE_BG_API_KEY ||= REMOVEBG_API_KEY`, sidecar
on `localhost:8000`.
