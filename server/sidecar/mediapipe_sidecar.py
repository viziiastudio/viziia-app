# v1776614656
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
try:
    import mediapipe as mp
    MEDIAPIPE_OK = True
except Exception as _mp_err:
    import sys
    print(f"[VIZIIA] mediapipe import failed: {_mp_err}", file=sys.stderr, flush=True)
    mp = None
    MEDIAPIPE_OK = False
import numpy as np
import base64
import cv2
import math

import sys as _sys
from contextlib import asynccontextmanager

@asynccontextmanager
async def _lifespan(app):
    print("LIFESPAN START", file=_sys.stderr, flush=True)
    yield
    print("LIFESPAN STOP", file=_sys.stderr, flush=True)

app = FastAPI(lifespan=_lifespan)
print(f"[VIZIIA] Loading sidecar with {len([l for l in open(__file__).readlines()])} lines")

class ImageRequest(BaseModel):
    image_b64: str

@app.get("/health")
def health():
    return {"status": "ok", "routes": [r.path for r in app.routes]}

@app.post("/landmarks")
@app.post("/face-geometry")
def get_face_geometry(req: ImageRequest):
    img_bytes = base64.b64decode(req.image_b64)
    img_array = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image")
    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    h, w = rgb.shape[:2]

    BaseOptions = mp.tasks.BaseOptions
    FaceLandmarker = mp.tasks.vision.FaceLandmarker
    FaceLandmarkerOptions = mp.tasks.vision.FaceLandmarkerOptions
    VisionRunningMode = mp.tasks.vision.RunningMode

    import urllib.request, os
    model_path = "/tmp/face_landmarker.task"
    if not os.path.exists(model_path):
        urllib.request.urlretrieve(
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            model_path
        )

    options = FaceLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=model_path),
        running_mode=VisionRunningMode.IMAGE,
        num_faces=1,
        output_face_blendshapes=False,
        output_facial_transformation_matrixes=True
    )
    with FaceLandmarker.create_from_options(options) as detector:
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        result = detector.detect(mp_image)

    if not result.face_landmarks:
        raise HTTPException(status_code=422, detail="No face detected")

    lm = result.face_landmarks[0]

    # Pixel coords
    def px(l): return {"x": l.x * w, "y": l.y * h}

    # Key landmarks
    left_iris   = px(lm[468])
    right_iris  = px(lm[473])
    sellion     = px(lm[168])   # nose bridge top
    nasion      = px(lm[6])     # nose tip area
    left_temple = px(lm[234])
    right_temple= px(lm[454])
    left_ear    = px(lm[234])
    right_ear   = px(lm[454])

    # IPD and face width
    ipd_px = math.sqrt((left_iris["x"]-right_iris["x"])**2 + (left_iris["y"]-right_iris["y"])**2)
    face_w_px = math.sqrt((left_temple["x"]-right_temple["x"])**2 + (left_temple["y"]-right_temple["y"])**2)

    # Head pose from transformation matrix
    yaw = pitch = roll = 0.0
    if result.facial_transformation_matrixes:
        mat = np.array(result.facial_transformation_matrixes[0].data).reshape(4,4)
        r = mat[:3,:3]
        pitch = math.degrees(math.atan2(-r[2][0], math.sqrt(r[2][1]**2 + r[2][2]**2)))
        yaw   = math.degrees(math.atan2(r[1][0], r[0][0]))
        roll  = math.degrees(math.atan2(r[2][1], r[2][2]))

    pose_ok = abs(yaw) <= 45 and abs(pitch) <= 30

    return {
        "faceDetected": True,
        "iris": {"leftCenter": left_iris, "rightCenter": right_iris},
        "ipdPx": ipd_px,
        "faceWidthPx": face_w_px,
        "headPose": {"yaw": yaw, "pitch": pitch, "roll": roll},
        "namedLandmarks": {
            "sellion":          sellion,
            "nasion":           nasion,
            "left_temple":      left_temple,
            "right_temple":     right_temple,
            "left_ear_tragus":  left_ear,
            "right_ear_tragus": right_ear,
        },
        "quality": {"poseWithinSupport": pose_ok},
        "confidence": 0.95,
        "imageSize": {"width": w, "height": h},
        "landmarks": [{"x": l.x * w, "y": l.y * h, "z": l.z} for l in lm],
    }

class FrameRequest(BaseModel):
    image_b64: str
    side: str = "left"  # "left" or "right"

@app.get("/test-routes")
def test_routes():
    return {"routes": "ok", "version": "2"}

@app.post("/hinge-temple")
def hinge_temple(req: FrameRequest):
    """
    Extract rim and temple from a 3/4 SKU photo using Harris corner hinge detection.
    Returns: hinge_x, rim_b64, temple_b64, temple_tip (distal end of temple)
    """
    try:
        img_bytes = base64.b64decode(req.image_b64)
        img_arr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(img_arr, cv2.IMREAD_UNCHANGED)

        if img is None:
            raise HTTPException(status_code=400, detail="Could not decode image")

        h, w = img.shape[:2]

        # Convert to 8-bit
        if img.dtype == np.uint16:
            img = (img >> 8).astype(np.uint8)

        # Get alpha channel
        if img.shape[2] >= 4:
            alpha = img[:, :, 3]
        else:
            _gray = cv2.cvtColor(img[:, :, :3], cv2.COLOR_BGR2GRAY)
            _, alpha = cv2.threshold(_gray, 240, 255, cv2.THRESH_BINARY_INV)

        # Harris corner detection for hinge
        bgr = img[:, :, :3]
        gray_float = np.float32(cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY))
        corners = cv2.cornerHarris(gray_float, 5, 3, 0.04)
        corners = cv2.dilate(corners, None)

        threshold = 0.01 * corners.max()
        corner_pts = np.where(corners > threshold)

        # Find bounding box
        nonzero = np.where(alpha > 10)
        if len(nonzero[0]) == 0:
            raise HTTPException(status_code=400, detail="No frame detected in image")

        x_min = int(np.min(nonzero[1]))
        x_max = int(np.max(nonzero[1]))

        # Hinge is on the right lateral edge (for left 3/4 view)
        # For right 3/4, mirror logic
        if req.side == "left":
            lateral_x = x_max
        else:
            lateral_x = x_min

        hinge_candidates = [
            (int(corner_pts[1][i]), int(corner_pts[0][i]))
            for i in range(len(corner_pts[0]))
            if abs(corner_pts[1][i] - lateral_x) < w * 0.15
        ]

        if not hinge_candidates:
            hinge_x = lateral_x - w // 5 if req.side == "left" else lateral_x + w // 5
        else:
            hinge_x = int(np.median([p[0] for p in hinge_candidates]))
            hinge_y = int(np.median([p[1] for p in hinge_candidates]))

        # Split into rim and temple
        if req.side == "left":
            rim = img[:, :hinge_x, :]
            temple = img[:, hinge_x:, :]
            temple_tip_x = x_max - hinge_x
        else:
            rim = img[:, hinge_x:, :]
            temple = img[:, :hinge_x, :]
            temple_tip_x = 0

        # Tight crop around non-transparent pixels
        def tight_crop(part):
            a = part[:, :, 3] if part.shape[2] == 4 else np.ones(part.shape[:2], np.uint8) * 255
            rows = np.any(a > 10, axis=1)
            cols = np.any(a > 10, axis=0)
            if not rows.any() or not cols.any():
                return part, 0, 0
            rmin, rmax = np.where(rows)[0][[0, -1]]
            cmin, cmax = np.where(cols)[0][[0, -1]]
            return part[rmin:rmax+1, cmin:cmax+1, :], int(cmin), int(rmin)

        rim_cropped, rim_cx, rim_cy = tight_crop(rim)
        temple_cropped, temple_cx, temple_cy = tight_crop(temple)

        # Temple tip position (distal end)
        temple_h, temple_w = temple_cropped.shape[:2]
        temple_tip = {"x": temple_tip_x, "y": temple_h // 2}

        # Encode to base64
        _, rim_enc = cv2.imencode('.png', rim_cropped)
        _, temple_enc = cv2.imencode('.png', temple_cropped)

        return {
            "hinge_x": hinge_x,
            "hinge_y": int(np.median([p[1] for p in hinge_candidates])) if hinge_candidates else h // 2,
            "rim_b64": base64.b64encode(rim_enc.tobytes()).decode(),
            "temple_b64": base64.b64encode(temple_enc.tobytes()).decode(),
            "temple_tip": temple_tip,
            "rim_size": {"w": rim_cropped.shape[1], "h": rim_cropped.shape[0]},
            "temple_size": {"w": temple_cropped.shape[1], "h": temple_cropped.shape[0]},
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class OccludeRequest(BaseModel):
    face_image_b64: str
    temple_image_b64: str
    temple_left: int
    temple_top: int
    side: str = "left"  # which side is the far temple

@app.post("/face-occlude")
def face_occlude(req: OccludeRequest):
    """
    Mask far-side temple behind face using MediaPipe convex hull.
    Returns composited image with temple correctly occluded.
    """
    try:
        # Decode face image
        face_bytes = base64.b64decode(req.face_image_b64)
        face_arr = np.frombuffer(face_bytes, np.uint8)
        face = cv2.imdecode(face_arr, cv2.IMREAD_UNCHANGED)
        if face.dtype == np.uint16:
            face = (face >> 8).astype(np.uint8)
        h, w = face.shape[:2]

        # Decode temple
        temple_bytes = base64.b64decode(req.temple_image_b64)
        temple_arr = np.frombuffer(temple_bytes, np.uint8)
        temple = cv2.imdecode(temple_arr, cv2.IMREAD_UNCHANGED)
        if temple.dtype == np.uint16:
            temple = (temple >> 8).astype(np.uint8)

        # Run MediaPipe on face
        mp_face = mp.solutions.face_mesh
        with mp_face.FaceMesh(static_image_mode=True, max_num_faces=1, refine_landmarks=True) as mesh:
            face_rgb = cv2.cvtColor(face[:,:,:3], cv2.COLOR_BGR2RGB)
            results = mesh.process(face_rgb)

        if not results.multi_face_landmarks:
            raise HTTPException(status_code=400, detail="No face detected")

        lms = results.multi_face_landmarks[0].landmark

        # Far-side face contour landmarks
        # Left far-side = right face contour (landmarks 234, 127, 162, 21, 54, 103, 67, 109, 10, 338, 297, 332, 284, 251, 389, 454)
        if req.side == "left":
            contour_ids = [234, 127, 162, 21, 54, 103, 67, 109, 10, 338, 297, 332, 284, 251, 389, 454]
        else:
            contour_ids = [454, 389, 251, 284, 332, 297, 338, 10, 109, 67, 103, 54, 21, 162, 127, 234]

        pts = np.array([
            [int(lms[i].x * w), int(lms[i].y * h)]
            for i in contour_ids
        ], dtype=np.int32)

        # Create face silhouette mask
        face_mask = np.zeros((h, w), dtype=np.uint8)
        cv2.fillPoly(face_mask, [pts], 255)

        # Composite temple onto face first
        composite = face.copy()
        th, tw = temple.shape[:2]
        tx, ty = req.temple_left, req.temple_top

        for y in range(th):
            for x in range(tw):
                fy, fx = ty + y, tx + x
                if 0 <= fy < h and 0 <= fx < w:
                    if temple.shape[2] == 4 and temple[y, x, 3] > 10:
                        # Only draw temple pixel if face mask is 0 (not face silhouette)
                        if face_mask[fy, fx] == 0:
                            composite[fy, fx] = temple[y, x, :composite.shape[2]]

        _, out_enc = cv2.imencode('.png', composite)
        return { "result_b64": base64.b64encode(out_enc.tobytes()).decode() }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class SegmentRequest(BaseModel):
    image_b64: str
    side: str = "left"  # near-side: "left" or "right"

@app.post("/segment-frame")
def segment_frame(req: SegmentRequest, debug: bool = False):
    """
    Segment a 3/4 SKU photo into 3 layers:
    - front_frame (rim + bridge + lenses)
    - near_temple
    - far_temple
    Uses Harris hinge detection + connected components.

    debug=true (query param) saves the intermediate foreground mask (and, for RGB
    inputs, the old fixed-threshold mask for comparison) to VIZIIA_DEBUG_DIR
    (default /tmp/viziia_debug) so the mask can be visually inspected.
    """
    # --- RGB white-background foreground-isolation tuning ---------------------
    # Only used on the RGB (no-alpha) path; RGBA inputs use their real matte.
    #
    # PRIMARY signal is value+saturation. The white background is the only thing
    # that is BOTH bright AND unsaturated, so foreground = frame = "dark OR
    # colored". This recovers translucent colored acetate (bright but saturated)
    # and dark frames alike, and it deliberately leaves bright low-saturation
    # regions (clear lenses) as background so the lens openings stay transparent.
    #   BG_VALUE_MIN   HSV V at/above this may be background. Lower = treats more
    #                  mid-grays as background (risks eating a bright frame).
    #   BG_SAT_MAX     HSV S at/below this may be background. Raise if pale/washed
    #                  acetate is dropped; too high lets a tinted background leak in.
    #
    # SHADOW rejection is a FIXED_RANGE border flood fill seeded from the corner
    # (background) color. FIXED_RANGE compares every pixel to the SEED, never to
    # its neighbour, so the fill CANNOT creep gradient-by-gradient into a
    # translucent frame body — it only clears the near-white/soft-shadow halo.
    #   SHADOW_FLOOD_TOLERANCE   per-channel distance from the corner color still
    #                  counted as background. Keep well below the frame's contrast
    #                  with white (< ~80) so it can't reach the frame. Higher eats
    #                  more soft shadow.
    #   MIN_COMPONENT_AREA_FRAC  connected components smaller than this fraction of
    #                  the largest are dropped as specks. Rim + temple are one
    #                  hinge-connected blob, so this won't remove real parts.
    #
    # CONFIDENCE GUARD (RGB path only). A clear/crystal frame is photometrically
    # identical to the white background except at lighting-dependent edges, so the
    # value+saturation mask collapses to a few scattered specks. Rather than emit a
    # garbage mask, we reject low-confidence results with 422 so the caller can
    # route the SKU to ML matting (Remove.bg / SAM2) instead.
    #   MIN_PLAUSIBLE_FG          minimum foreground fraction of the whole image for
    #                  the mask to be trusted. Real frames (incl. thin metal) sit
    #                  well above this; crystal failures fall far below.
    #   MIN_LARGEST_COMPONENT_FRAC  the largest connected component must hold at
    #                  least this share of all foreground. A real frame is one
    #                  hinge-connected blob (~1.0); a crystal failure is many tiny
    #                  disconnected specks (low).
    BG_VALUE_MIN = 200
    BG_SAT_MAX = 35
    SHADOW_FLOOD_TOLERANCE = 48
    MIN_COMPONENT_AREA_FRAC = 0.02
    MIN_PLAUSIBLE_FG = 0.02
    MIN_LARGEST_COMPONENT_FRAC = 0.5
    try:
        img_bytes = base64.b64decode(req.image_b64)
        img_arr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(img_arr, cv2.IMREAD_UNCHANGED)
        if img is None:
            raise HTTPException(status_code=400, detail="Could not decode image")
        if img.dtype == np.uint16:
            img = (img >> 8).astype(np.uint8)

        h, w = img.shape[:2]
        bgr = img[:, :, :3]
        _old_threshold_mask = None  # populated on RGB path for debug comparison
        used_rgb_mask = False       # gates the confidence guard below

        # An alpha channel is only a real matte if it actually varies. Many client
        # uploads are white-background photos saved in an RGBA container with a
        # FULLY OPAQUE alpha (min == max == 255) — trusting that as a matte yields
        # an all-255 mask and a whole-image bounding box. Treat opaque alpha as RGB.
        has_real_alpha = (
            img.shape[2] >= 4 and int(img[:, :, 3].min()) != int(img[:, :, 3].max())
        )
        if has_real_alpha:
            # RGBA: trust the real alpha matte (unchanged).
            alpha = img[:, :, 3]
        else:
            used_rgb_mask = True
            # RGB white-background product photo. A plain darkness threshold kills
            # bright/translucent acetate and keeps shadows; a floating-range flood
            # fill creeps through translucent frame bodies. Instead:
            #   1. PRIMARY foreground from value+saturation: the background is the
            #      only thing that is bright AND unsaturated, so frame = dark OR
            #      colored. Clear lenses are bright + unsaturated -> stay background
            #      (lens openings remain transparent, which is what try-on wants).
            #   2. Reject soft shadows with a FIXED_RANGE border flood fill seeded
            #      from the corner color; it cannot enter the frame body.
            #   3. Drop specks by area. NO interior hole fill (lenses stay open).
            hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
            sat, val = hsv[:, :, 1], hsv[:, :, 2]

            # Old fixed threshold kept only for the debug side-by-side comparison.
            if debug:
                _g = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
                _, _old_threshold_mask = cv2.threshold(_g, 200, 255, cv2.THRESH_BINARY_INV)

            # (1) Primary: background = bright AND unsaturated; foreground = rest.
            background = (val >= BG_VALUE_MIN) & (sat <= BG_SAT_MAX)
            alpha = np.where(background, 0, 255).astype(np.uint8)

            # (2) Shadow rejection. FIXED_RANGE => each pixel compared to the seed
            # (corner background color), never to its neighbour, so the fill clears
            # the near-white / soft-shadow halo but can NEVER creep into a dark or
            # colored (translucent) frame body. FLOODFILL_MASK_ONLY leaves the
            # image untouched.
            ff_mask = np.zeros((h + 2, w + 2), np.uint8)
            lo = (SHADOW_FLOOD_TOLERANCE,) * 3
            up = (SHADOW_FLOOD_TOLERANCE,) * 3
            flags = 8 | cv2.FLOODFILL_MASK_ONLY | cv2.FLOODFILL_FIXED_RANGE | (255 << 8)
            for seed in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
                cv2.floodFill(bgr.copy(), ff_mask, seed, 0, lo, up, flags)
            alpha[ff_mask[1:-1, 1:-1] > 0] = 0

            # (3) Seal small rim nicks, then drop specks (shadows, dust) by area.
            # Do NOT fill interior holes — lens openings must stay transparent.
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
            alpha = cv2.morphologyEx(alpha, cv2.MORPH_CLOSE, kernel)
            n_cc, cc_labels, cc_stats, _ = cv2.connectedComponentsWithStats(
                (alpha > 0).astype(np.uint8), 8
            )
            if n_cc > 2:
                areas = cc_stats[1:, cv2.CC_STAT_AREA]
                keep = 1 + np.where(areas >= MIN_COMPONENT_AREA_FRAC * areas.max())[0]
                alpha = np.where(np.isin(cc_labels, keep), 255, 0).astype(np.uint8)

        if debug:
            import os, time
            ts = int(time.time() * 1000)
            artifacts = [(f"segframe_{ts}_{req.side}_fg_mask.png", alpha)]
            if _old_threshold_mask is not None:
                artifacts.append((f"segframe_{ts}_{req.side}_old_threshold.png", _old_threshold_mask))

            # Local-dir write — always on, and the fallback when S3 is unconfigured.
            dbg_dir = os.environ.get("VIZIIA_DEBUG_DIR", "/tmp/viziia_debug")
            os.makedirs(dbg_dir, exist_ok=True)
            for fname, mask_img in artifacts:
                cv2.imwrite(f"{dbg_dir}/{fname}", mask_img)
            print(
                f"[VIZIIA][segment-frame] debug masks saved locally to {dbg_dir} (ts={ts}, side={req.side})",
                file=_sys.stderr, flush=True,
            )

            # S3 upload — reuses the SKU-cache bucket + creds (AWS_S3_BUCKET,
            # AWS_REGION, AWS_ACCESS_KEY_ID/SECRET picked up by boto3). Logs a
            # presigned GET URL so the mask opens straight from the Railway logs
            # even on a private bucket.
            bucket = os.environ.get("AWS_S3_BUCKET")
            if bucket:
                try:
                    import boto3
                    region = os.environ.get("AWS_REGION") or os.environ.get("AWS_DEFAULT_REGION")
                    s3 = boto3.client("s3", region_name=region)
                    for fname, mask_img in artifacts:
                        ok, buf = cv2.imencode(".png", mask_img)
                        if not ok:
                            continue
                        key = f"debug/segframe/{fname}"
                        s3.put_object(
                            Bucket=bucket, Key=key,
                            Body=buf.tobytes(), ContentType="image/png",
                        )
                        try:
                            url = s3.generate_presigned_url(
                                "get_object",
                                Params={"Bucket": bucket, "Key": key},
                                ExpiresIn=7 * 24 * 3600,  # 7d = SigV4 max
                            )
                        except Exception:
                            url = f"s3://{bucket}/{key}"
                        print(
                            f"[VIZIIA][segment-frame] debug mask uploaded: {url}",
                            file=_sys.stderr, flush=True,
                        )
                except Exception as _s3err:
                    print(
                        f"[VIZIIA][segment-frame] S3 debug upload failed ({_s3err}); local copy in {dbg_dir}",
                        file=_sys.stderr, flush=True,
                    )

        # --- Confidence guard (RGB-derived masks only) ---
        # A clear/crystal frame leaves only scattered specks here. Reject rather
        # than emit garbage, so the caller can re-route to ML matting. Runs after
        # the debug upload so the rejected mask is still inspectable. Real mattes
        # (has_real_alpha) are trusted and skip this check.
        if used_rgb_mask:
            fg_fraction = float((alpha > 0).mean())
            g_n, _g_lbl, g_stats, _ = cv2.connectedComponentsWithStats(
                (alpha > 0).astype(np.uint8), 8
            )
            total_fg = int((alpha > 0).sum())
            largest_frac = (
                int(g_stats[1:, cv2.CC_STAT_AREA].max()) / total_fg
                if g_n > 1 and total_fg > 0 else 0.0
            )
            if fg_fraction < MIN_PLAUSIBLE_FG or largest_frac < MIN_LARGEST_COMPONENT_FRAC:
                raise HTTPException(
                    status_code=422,
                    detail=(
                        "low-confidence mask: likely transparent frame "
                        f"(fg_fraction={fg_fraction:.4f}, "
                        f"largest_component_frac={largest_frac:.2f}); "
                        "route this SKU to ML matting"
                    ),
                )

        # --- Harris hinge detection ---
        gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
        gray_float = np.float32(gray)
        corners = cv2.cornerHarris(gray_float, 5, 3, 0.04)
        corners = cv2.dilate(corners, None)
        threshold = 0.01 * corners.max()
        corner_pts = np.where(corners > threshold)

        nonzero = np.where(alpha > 10)
        if len(nonzero[0]) == 0:
            raise HTTPException(status_code=400, detail="No frame detected")

        x_min, x_max = int(np.min(nonzero[1])), int(np.max(nonzero[1]))
        y_min, y_max = int(np.min(nonzero[0])), int(np.max(nonzero[0]))
        frame_w = x_max - x_min

        # Hinge at 18% from near side of actual frame bounding box
        if req.side == "left":
            hinge_x = x_min + int(frame_w * 0.18)
        else:
            hinge_x = x_max - int(frame_w * 0.18)
        hinge_y = int((y_min + y_max) / 2)

        # Refine with Harris corners near estimated hinge
        search_min = hinge_x - int(frame_w * 0.08)
        search_max = hinge_x + int(frame_w * 0.08)
        # Restrict candidates to the cleaned foreground mask so the refine step
        # can't lock onto shadow / background corner responses (which on the RGB
        # path used to leak in from the corrupted mask).
        hinge_candidates = [
            (int(corner_pts[1][i]), int(corner_pts[0][i]))
            for i in range(len(corner_pts[0]))
            if search_min <= corner_pts[1][i] <= search_max
            and alpha[corner_pts[0][i], corner_pts[1][i]] > 10
        ]
        if hinge_candidates:
            hinge_x = int(np.median([p[0] for p in hinge_candidates]))
            hinge_y = int(np.median([p[1] for p in hinge_candidates]))

        # --- Cut at hinge + connected components ---
        cut_mask = alpha.copy()
        # Cut a vertical slice at hinge to separate components
        cut_w = max(3, int(w * 0.008))
        if req.side == "left":
            cut_mask[:, hinge_x - cut_w:hinge_x + cut_w] = 0
        else:
            cut_mask[:, hinge_x - cut_w:hinge_x + cut_w] = 0

        binary = (cut_mask > 10).astype(np.uint8)
        num_labels, labels = cv2.connectedComponents(binary)

        # Identify components by X position
        components = {}
        for label in range(1, num_labels):
            mask = (labels == label).astype(np.uint8)
            cols = np.where(np.any(mask, axis=0))[0]
            if len(cols) == 0:
                continue
            cx = int(np.mean(cols))
            components[label] = {"mask": mask, "cx": cx, "size": int(mask.sum())}

        if not components:
            raise HTTPException(status_code=400, detail="No components found")

        # Sort by size ? largest is front frame
        sorted_by_size = sorted(components.items(), key=lambda x: x[1]["size"], reverse=True)
        front_label = sorted_by_size[0][0]

        # Near temple = component on far-lateral side
        # Far temple = component on opposite side
        remaining = [(lbl, info) for lbl, info in sorted_by_size[1:]]

        if req.side == "left":
            # near temple is rightmost (high cx)
            remaining_sorted = sorted(remaining, key=lambda x: x[1]["cx"], reverse=True)
        else:
            # near temple is leftmost (low cx)
            remaining_sorted = sorted(remaining, key=lambda x: x[1]["cx"])

        near_label = remaining_sorted[0][0] if remaining_sorted else None
        far_label = remaining_sorted[1][0] if len(remaining_sorted) > 1 else None

        def extract_layer(mask):
            h_, w_ = mask.shape[:2]
            layer = np.zeros((h_, w_, 4), dtype=np.uint8)
            layer[:, :, :3] = bgr
            layer[:, :, 3] = (mask * alpha).astype(np.uint8)
            # Tight crop
            rows = np.any(layer[:, :, 3] > 10, axis=1)
            cols = np.any(layer[:, :, 3] > 10, axis=0)
            if not rows.any() or not cols.any():
                return None, 0, 0, 0, 0
            rmin, rmax = np.where(rows)[0][[0, -1]]
            cmin, cmax = np.where(cols)[0][[0, -1]]
            cropped = layer[rmin:rmax+1, cmin:cmax+1]
            _, enc = cv2.imencode('.png', cropped)
            return base64.b64encode(enc.tobytes()).decode(), int(cmin), int(rmin), int(cmax-cmin+1), int(rmax-rmin+1)

        front_b64, fx, fy, fw, fh = extract_layer(components[front_label]["mask"])
        near_b64, nx, ny, nw, nh = extract_layer(components[near_label]["mask"]) if near_label else (None, 0, 0, 0, 0)
        far_b64, farx, fary, farw, farh = extract_layer(components[far_label]["mask"]) if far_label else (None, 0, 0, 0, 0)

        return {
            "hinge": {"x": hinge_x, "y": hinge_y},
            "front_frame": {"b64": front_b64, "x": fx, "y": fy, "w": fw, "h": fh},
            "near_temple": {"b64": near_b64, "x": nx, "y": ny, "w": nw, "h": nh} if near_b64 else None,
            "far_temple": {"b64": far_b64, "x": farx, "y": fary, "w": farw, "h": farh} if far_b64 else None,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def _save_segv2_debug(side, bgr, alpha, hinge_x, front_mask, temple_mask):
    """Save segment-frame-v2 debug artifacts (hinge overlay + near/front masks)
    locally to VIZIIA_DEBUG_DIR (default /tmp/viziia_debug), and to S3 when
    configured. Mirrors the /segment-frame debug path. Never raises."""
    try:
        import os, time
        ts = int(time.time() * 1000)
        overlay = bgr.copy()
        if hinge_x is not None:
            cv2.line(overlay, (hinge_x, 0), (hinge_x, overlay.shape[0]), (0, 170, 0), 6)
            cv2.putText(overlay, f"hinge x={hinge_x} (side={side})",
                        (max(10, hinge_x - 320), 60), cv2.FONT_HERSHEY_SIMPLEX, 1.4, (0, 170, 0), 4)
        artifacts = [(f"segframe2_{ts}_{side}_hinge_overlay.png", overlay),
                     (f"segframe2_{ts}_{side}_front_mask.png", front_mask)]
        if temple_mask is not None:
            artifacts.append((f"segframe2_{ts}_{side}_near_temple_mask.png", temple_mask))
        dbg_dir = os.environ.get("VIZIIA_DEBUG_DIR", "/tmp/viziia_debug")
        os.makedirs(dbg_dir, exist_ok=True)
        for fname, im in artifacts:
            cv2.imwrite(f"{dbg_dir}/{fname}", im)
        print(f"[VIZIIA][segment-frame-v2] debug saved to {dbg_dir} "
              f"(ts={ts}, side={side}, hinge_x={hinge_x})", file=_sys.stderr, flush=True)
        bucket = os.environ.get("AWS_S3_BUCKET")
        if bucket:
            try:
                import boto3
                region = os.environ.get("AWS_REGION") or os.environ.get("AWS_DEFAULT_REGION")
                s3 = boto3.client("s3", region_name=region)
                for fname, im in artifacts:
                    ok, buf = cv2.imencode(".png", im)
                    if not ok:
                        continue
                    key = f"debug/segframe2/{fname}"
                    s3.put_object(Bucket=bucket, Key=key, Body=buf.tobytes(), ContentType="image/png")
                    try:
                        url = s3.generate_presigned_url("get_object",
                            Params={"Bucket": bucket, "Key": key}, ExpiresIn=7 * 24 * 3600)
                    except Exception:
                        url = f"s3://{bucket}/{key}"
                    print(f"[VIZIIA][segment-frame-v2] debug uploaded: {url}", file=_sys.stderr, flush=True)
            except Exception as _s3err:
                print(f"[VIZIIA][segment-frame-v2] S3 debug upload failed ({_s3err}); "
                      f"local copy in {dbg_dir}", file=_sys.stderr, flush=True)
    except Exception as _dbgerr:
        print(f"[VIZIIA][segment-frame-v2] debug save failed: {_dbgerr}", file=_sys.stderr, flush=True)

@app.post("/segment-frame-v2")
def segment_frame_v2(req: SegmentRequest, debug: bool = False):
    """
    Split a 3/4 SKU into front_frame (both lenses + bridge, → Gemini) and a
    TEMPLE-ONLY near_temple (arm + endpiece, no lens), cut at the real hinge.

    The hinge is detected from the per-column vertical-extent profile: the lens
    front is tall, the temple arm is a thin bar, and the hinge is the sharp
    thin↔tall transition scanned inward from the near extreme. The projection
    model (math_hinge_x, 0.561·bbox) is the BRIDGE/front-center on real SKUs, not
    the hinge, so it is kept only as a labelled fallback.

    debug=true (query param) saves the hinge overlay + near/front masks to
    VIZIIA_DEBUG_DIR (default /tmp/viziia_debug), and to S3 when configured.
    """
    try:
        img_bytes = base64.b64decode(req.image_b64)
        img_arr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(img_arr, cv2.IMREAD_UNCHANGED)
        if img is None:
            raise HTTPException(status_code=400, detail="Could not decode image")
        if img.dtype != np.uint8:
            img = (img >> 8).astype(np.uint8)
        h, w = img.shape[:2]
        if img.shape[2] >= 4:
            alpha = img[:, :, 3]
        else:
            _gray = cv2.cvtColor(img[:, :, :3], cv2.COLOR_BGR2GRAY)
            _, alpha = cv2.threshold(_gray, 240, 255, cv2.THRESH_BINARY_INV)
        bgr = img[:, :, :3]
        _, binary = cv2.threshold(alpha, 10, 255, cv2.THRESH_BINARY)
        nonzero = np.where(binary > 0)
        if len(nonzero[0]) == 0:
            raise HTTPException(status_code=400, detail="No frame detected")
        x_min, x_max = int(np.min(nonzero[1])), int(np.max(nonzero[1]))
        y_min, y_max = int(np.min(nonzero[0])), int(np.max(nonzero[0]))
        bbox_w = x_max - x_min
        import math
        theta = math.radians(35)
        proj_frame = 130 * math.cos(theta)
        proj_temple = 145 * math.sin(theta)
        hinge_ratio = proj_frame / (proj_frame + proj_temple)
        math_hinge_x = int(x_min + bbox_w * hinge_ratio)
        def to_layer(mask):
            if mask.sum() == 0:
                return None, 0, 0, 0, 0
            layer = np.zeros((h, w, 4), dtype=np.uint8)
            layer[:, :, :3] = bgr
            layer[:, :, 3] = mask
            rows = np.any(layer[:, :, 3] > 10, axis=1)
            cols = np.any(layer[:, :, 3] > 10, axis=0)
            if not rows.any() or not cols.any():
                return None, 0, 0, 0, 0
            rmin, rmax = np.where(rows)[0][[0, -1]]
            cmin, cmax = np.where(cols)[0][[0, -1]]
            cropped = layer[rmin:rmax+1, cmin:cmax+1]
            _, enc = cv2.imencode(".png", cropped)
            return base64.b64encode(enc.tobytes()).decode(), int(cmin), int(rmin), int(cmax-cmin+1), int(rmax-rmin+1)

        # ── Hinge detection via per-column vertical-extent profile ──────────────
        # The lens front is tall; the temple arm is a thin horizontal bar. The
        # hinge is the sharp thin→tall transition scanned inward from the near
        # extreme. We cut near_temple there so it holds ONLY the arm + endpiece —
        # never a lens (the bridge cut's lens-fused half was the duplication seam).
        #
        # Tuning knobs:
        HINGE_TALL_FRAC = 0.5    # a column is "lens/front" when its vertical extent
                                 # is ≥ this × the tallest column (≈ lens height).
        HINGE_PERSIST_PX = 60    # the tall run must persist this many px to count as
                                 # the lens — skips rivet/nose-pad blips in the arm.
        MIN_TEMPLE_WIDTH_FRAC = 0.12  # the detected arm (near-extreme → hinge) must be
                                      # at least this fraction of the frame bbox width to
                                      # count as a real extended temple. Below this it is
                                      # just a folded hinge endpiece (front/near-frontal
                                      # SKU) → fall back to near_temple=None, don't paste.

        fg = alpha > 10
        col_extent = np.zeros(w, dtype=np.int32)
        for cx in range(x_min, x_max + 1):
            rows = np.where(fg[:, cx])[0]
            if rows.size:
                col_extent[cx] = int(rows[-1] - rows[0] + 1)
        max_extent = int(col_extent[x_min:x_max + 1].max()) if x_max >= x_min else 0
        tall_thr = HINGE_TALL_FRAC * max_extent

        # near temple sits at the near extreme: side=left → left edge (scan L→R),
        # side=right → right edge (scan R→L). Hinge = first thin→tall that persists.
        hinge_x = None
        if max_extent > 0:
            if req.side == "right":
                scan = range(x_max, x_min - 1, -1)
                def _persists(cx):
                    lo = max(x_min, cx - HINGE_PERSIST_PX)
                    seg = col_extent[lo:cx + 1]
                    return seg.size > 0 and float(np.mean(seg >= tall_thr)) > 0.8
            else:
                scan = range(x_min, x_max + 1)
                def _persists(cx):
                    seg = col_extent[cx:cx + HINGE_PERSIST_PX]
                    return seg.size > 0 and float(np.mean(seg >= tall_thr)) > 0.8
            seen_thin = False
            for cx in scan:
                if col_extent[cx] < tall_thr:
                    seen_thin = True
                elif seen_thin and _persists(cx):
                    hinge_x = int(cx)
                    break

        # Reject a too-narrow arm (folded hinge endpiece, not an extended temple).
        if hinge_x is not None:
            band_w = (hinge_x - x_min) if req.side != "right" else (x_max - hinge_x)
            if band_w < MIN_TEMPLE_WIDTH_FRAC * bbox_w:
                hinge_x = None

        # ── Fallback: no thin temple run (front view / temple-less SKU) ─────────
        # Do NOT fabricate a temple — return the whole frame as front_frame and
        # near_temple=None so front and other non-3/4 paths are never regressed.
        if hinge_x is None:
            full_b64, fx, fy, fw, fh = to_layer(alpha)
            if debug:
                _save_segv2_debug(req.side, bgr, alpha, None, alpha, None)
            return {
                "hinge": {"x": math_hinge_x, "y": int((y_min + y_max) / 2)},
                "hinge_ratio": round(hinge_ratio, 3),
                "hinge_source": "fallback-none",
                "front_frame": {"b64": full_b64, "x": fx, "y": fy, "w": fw, "h": fh} if full_b64 else None,
                "near_temple": None,
            }

        # ── Build masks from the hinge cut ──────────────────────────────────────
        near_band = np.zeros((h, w), dtype=np.uint8)
        if req.side == "right":
            near_band[:, hinge_x:x_max + 1] = 255    # near temple = right of hinge
        else:
            near_band[:, x_min:hinge_x + 1] = 255    # near temple = left of hinge
        temple_mask = cv2.bitwise_and(alpha, near_band)                    # arm + endpiece only
        front_mask = cv2.bitwise_and(alpha, cv2.bitwise_not(near_band))    # both lenses + bridge (+ far stub)

        if debug:
            _save_segv2_debug(req.side, bgr, alpha, hinge_x, front_mask, temple_mask)

        front_b64, fx, fy, fw, fh = to_layer(front_mask)
        temple_b64, tx, ty, tw, th = to_layer(temple_mask)
        return {
            "hinge": {"x": hinge_x, "y": int((y_min + y_max) / 2)},   # DETECTED hinge, not projection
            "hinge_ratio": round(hinge_ratio, 3),
            "hinge_source": "extent",
            "front_frame": {"b64": front_b64, "x": fx, "y": fy, "w": fw, "h": fh} if front_b64 else None,
            "near_temple": {"b64": temple_b64, "x": tx, "y": ty, "w": tw, "h": th} if temple_b64 else None,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── SKU orientation detection (validated standalone; see 3q-temple-placement-plan) ──
# Which way does the frame face? Signal = which side holds the thin extended temple
# vs the tall lens. Frame faces AWAY from the extended-temple side. Three mask-sanity
# guards keep clear/crystal frames and garbage masks in a safe low-confidence band so
# the caller never confidently flips them. Locked thresholds (validated on 6 SKUs):
_ORI_HINGE_TALL_FRAC = 0.5        # column is "lens/front" when extent >= this * max_extent
_ORI_PERSIST_PX_FRAC = 0.06       # tall run must persist this frac of bbox_w to be the lens
_ORI_EXTENDED_TEMPLE_MIN = 0.12   # arm width / bbox_w to count as a real extended temple
_ORI_EXTENDED_TEMPLE_MAX = 0.55   # above this = no lens region found = garbage mask
_ORI_FULLH_FRAC = 0.95            # max_extent >= this * img_h = spurious full-height column
_ORI_CLEAR_COVERAGE_MIN = 0.10    # bbox fg density below this = clear/crystal frame
_ORI_CONF_MIN = 0.60              # caller flips only when confidence >= this

def _orient_alpha(img):
    if img.ndim == 3 and img.shape[2] >= 4:
        a = img[:, :, 3]
        if int(a.min()) != int(a.max()):
            return a, "rgba-matte"
    g = cv2.cvtColor(img[:, :, :3], cv2.COLOR_BGR2GRAY)
    _, a = cv2.threshold(g, 240, 255, cv2.THRESH_BINARY_INV)
    return a, "rgb-threshold"

def _orient_temple_run(col_extent, x_min, x_max, tall_thr, persist, side):
    rng = range(x_min, x_max + 1) if side == "left" else range(x_max, x_min - 1, -1)
    seen_thin = False
    for cx in rng:
        if col_extent[cx] < tall_thr:
            seen_thin = True
        elif seen_thin:
            seg = col_extent[cx:cx + persist] if side == "left" else col_extent[max(x_min, cx - persist):cx + 1]
            if seg.size and float(np.mean(seg >= tall_thr)) > 0.8:
                return abs(cx - (x_min if side == "left" else x_max))
    return 0

@app.post("/sku-orientation")
def sku_orientation(req: ImageRequest):
    try:
        img = cv2.imdecode(np.frombuffer(base64.b64decode(req.image_b64), np.uint8), cv2.IMREAD_UNCHANGED)
        if img is None:
            raise HTTPException(status_code=400, detail="Could not decode image")
        if img.dtype != np.uint8:
            img = (img >> 8).astype(np.uint8)
        h, w = img.shape[:2]
        alpha, amode = _orient_alpha(img)
        fg = alpha > 10
        ys, xs = np.where(fg)
        if len(xs) == 0:
            raise HTTPException(status_code=400, detail="No foreground detected")
        x_min, x_max = int(xs.min()), int(xs.max())
        bbox_w = x_max - x_min
        bbox_h = int(ys.max() - ys.min() + 1)
        col_extent = np.zeros(w, dtype=np.int32)
        for cx in range(x_min, x_max + 1):
            r = np.where(fg[:, cx])[0]
            if r.size:
                col_extent[cx] = int(r[-1] - r[0] + 1)
        max_extent = int(col_extent[x_min:x_max + 1].max())
        tall_thr = _ORI_HINGE_TALL_FRAC * max_extent
        persist = max(10, int(_ORI_PERSIST_PX_FRAC * bbox_w))

        L = _orient_temple_run(col_extent, x_min, x_max, tall_thr, persist, "left")
        R = _orient_temple_run(col_extent, x_min, x_max, tall_thr, persist, "right")
        Lf, Rf = L / bbox_w, R / bbox_w

        # lens asymmetry: bridge = min-extent column in central 60% of the tall span
        tall_idx = np.where(col_extent[x_min:x_max + 1] >= tall_thr)[0] + x_min
        lens_ratio, lens_wider = 1.0, "none"
        if tall_idx.size > 20:
            t0, t1 = int(tall_idx.min()), int(tall_idx.max())
            lo, hi = int(t0 + 0.2 * (t1 - t0)), int(t1 - 0.2 * (t1 - t0))
            if hi > lo:
                bridge = lo + int(np.argmin(col_extent[lo:hi + 1]))
                lw, rw = bridge - t0, t1 - bridge
                if min(lw, rw) > 0:
                    lens_ratio = max(lw, rw) / min(lw, rw)
                    lens_wider = "left" if lw > rw else "right"

        density = float(fg.sum()) / (bbox_w * bbox_h)
        g_full_h = bool(max_extent >= _ORI_FULLH_FRAC * h)
        g_low_cov = bool(density < _ORI_CLEAR_COVERAGE_MIN)
        g_ceiling = bool(max(Lf, Rf) > _ORI_EXTENDED_TEMPLE_MAX)
        unreliable = g_full_h or g_low_cov or g_ceiling

        extended_side = "left" if Lf >= Rf else "right"
        extended_val, other_val = max(Lf, Rf), min(Lf, Rf)
        has_ext = (extended_val >= _ORI_EXTENDED_TEMPLE_MIN) and not unreliable
        facing = ("right" if extended_side == "left" else "left") if has_ext else "frontal"

        temple_term = min(1.0, (extended_val - other_val) / 0.25)
        lens_term = min(1.0, max(0.0, (lens_ratio - 1.0) / 0.5))
        if has_ext:
            conf = 0.6 * temple_term + 0.4 * lens_term
            conf = min(1.0, conf + 0.1) if (lens_wider == facing) else max(0.0, conf - 0.2)
        else:
            conf = 0.15 * lens_term
        if unreliable:
            facing = "frontal/uncertain"
            conf = min(conf, 0.20)

        return {
            "facing": facing,
            "confidence": round(conf, 2),
            "extended_temple_side": extended_side if has_ext else None,
            "should_flip": bool(has_ext and conf >= _ORI_CONF_MIN),  # caller flips iff this AND facing opposes head
            "signals": {
                "L_temple_frac": round(Lf, 3), "R_temple_frac": round(Rf, 3),
                "lens_wider_side": lens_wider, "lens_ratio": round(lens_ratio, 2),
                "density": round(density, 3), "max_extent": max_extent,
                "bbox_w": bbox_w, "alpha_mode": amode,
            },
            "guards_fired": {"full_h": g_full_h, "low_cov": g_low_cov, "ceiling": g_ceiling},
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/centerline-temple")
def centerline_temple(req: ImageRequest):
    """
    Extract centerline of a temple arm via skeletonization.
    Returns ordered list of points from hinge to tip.
    """
    try:
        # skimage replaced with opencv

        img_bytes = base64.b64decode(req.image_b64)
        img_arr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(img_arr, cv2.IMREAD_UNCHANGED)
        if img.dtype == np.uint16:
            img = (img >> 8).astype(np.uint8)

        h, w = img.shape[:2]
        if img.shape[2] >= 4:
            alpha = img[:, :, 3]
        else:
            _gray = cv2.cvtColor(img[:, :, :3], cv2.COLOR_BGR2GRAY)
            _, alpha = cv2.threshold(_gray, 240, 255, cv2.THRESH_BINARY_INV)

        # Binary mask
        binary = (alpha > 10).astype(np.uint8)

        # Skeletonize
        kernel = cv2.getStructuringElement(cv2.MORPH_CROSS, (3,3))
        skeleton = np.zeros_like(binary)
        temp = binary.copy()
        for _ in range(50):
            eroded = cv2.erode(temp, kernel)
            opened = cv2.dilate(eroded, kernel)
            diff = cv2.subtract(temp, opened)
            skeleton = cv2.bitwise_or(skeleton, diff)
            temp = eroded.copy()
            if cv2.countNonZero(temp) == 0: break

        # Get skeleton points
        pts = np.column_stack(np.where(skeleton > 0))  # (y, x)
        if len(pts) == 0:
            return {"centerline": [], "tip": None, "hinge_end": None}

        # Order from leftmost to rightmost (hinge = left, tip = right)
        pts_xy = [(int(p[1]), int(p[0])) for p in pts]
        pts_xy.sort(key=lambda p: p[0])

        # Subsample to max 50 points
        step = max(1, len(pts_xy) // 50)
        sampled = pts_xy[::step]

        return {
            "centerline": [{"x": p[0], "y": p[1]} for p in sampled],
            "hinge_end": {"x": sampled[0][0], "y": sampled[0][1]},
            "tip": {"x": sampled[-1][0], "y": sampled[-1][1]},
            "total_points": len(pts_xy)
        }

    except HTTPException:
        raise
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import sys, traceback
    try:
        import uvicorn
        print("Starting uvicorn...", file=sys.stderr, flush=True)
        uvicorn.run(app, host="0.0.0.0", port=8000, log_level="debug")
    except Exception as e:
        print("UVICORN CRASH:", file=sys.stderr, flush=True)
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)
