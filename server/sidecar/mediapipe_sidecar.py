from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import mediapipe as mp
import numpy as np
import base64
import cv2
import math

app = FastAPI()
print(f"[VIZIIA] Loading sidecar with {len([l for l in open(__file__).readlines()])} lines")

class ImageRequest(BaseModel):
    image_b64: str

@app.get("/health")
import sys as _s; print("ROUTE REGISTERED: @app.get("/health")", file=_s.stderr, flush=True)
def health():
    return {"status": "ok", "endpoints": ["segment-frame", "centerline-temple", "hinge-temple", "face-occlude"]}

@app.post("/landmarks")
import sys as _s; print("ROUTE REGISTERED: @app.post("/landmarks")", file=_s.stderr, flush=True)
@app.post("/face-geometry")
import sys as _s; print("ROUTE REGISTERED: @app.post("/face-geometry")", file=_s.stderr, flush=True)
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

class FrameRequest(BaseModel):
    image_b64: str
    side: str = "left"  # "left" or "right"

@app.get("/test-routes")
import sys as _s; print("ROUTE REGISTERED: @app.get("/test-routes")", file=_s.stderr, flush=True)
def test_routes():
    return {"routes": "ok", "version": "2"}

@app.post("/hinge-temple")
import sys as _s; print("ROUTE REGISTERED: @app.post("/hinge-temple")", file=_s.stderr, flush=True)
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
        if img.shape[2] == 4:
            alpha = img[:, :, 3]
        else:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            _, alpha = cv2.threshold(gray, 10, 255, cv2.THRESH_BINARY)

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
import sys as _s; print("ROUTE REGISTERED: @app.post("/face-occlude")", file=_s.stderr, flush=True)
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
import sys as _s; print("ROUTE REGISTERED: @app.post("/segment-frame")", file=_s.stderr, flush=True)
def segment_frame(req: SegmentRequest):
    """
    Segment a 3/4 SKU photo into 3 layers:
    - front_frame (rim + bridge + lenses)
    - near_temple
    - far_temple
    Uses Harris hinge detection + connected components.
    """
    try:
        img_bytes = base64.b64decode(req.image_b64)
        img_arr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(img_arr, cv2.IMREAD_UNCHANGED)
        if img is None:
            raise HTTPException(status_code=400, detail="Could not decode image")
        if img.dtype == np.uint16:
            img = (img >> 8).astype(np.uint8)

        h, w = img.shape[:2]
        alpha = img[:, :, 3] if img.shape[2] == 4 else np.ones((h, w), np.uint8) * 255
        bgr = img[:, :, :3]

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

        # Hinge on lateral edge ? right side for "left" 3/4 view
        lateral_x = x_max if req.side == "left" else x_min
        hinge_candidates = [
            (int(corner_pts[1][i]), int(corner_pts[0][i]))
            for i in range(len(corner_pts[0]))
            if abs(corner_pts[1][i] - lateral_x) < w * 0.15
        ]

        if hinge_candidates:
            hinge_x = int(np.median([p[0] for p in hinge_candidates]))
            hinge_y = int(np.median([p[1] for p in hinge_candidates]))
        else:
            hinge_x = lateral_x - w // 5 if req.side == "left" else lateral_x + w // 5
            hinge_y = h // 2

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
            layer = np.zeros_like(img)
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

@app.post("/centerline-temple")
import sys as _s; print("ROUTE REGISTERED: @app.post("/centerline-temple")", file=_s.stderr, flush=True)
def centerline_temple(req: ImageRequest):
    """
    Extract centerline of a temple arm via skeletonization.
    Returns ordered list of points from hinge to tip.
    """
    try:
        from skimage.morphology import skeletonize
        from skimage.measure import label as sk_label

        img_bytes = base64.b64decode(req.image_b64)
        img_arr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(img_arr, cv2.IMREAD_UNCHANGED)
        if img.dtype == np.uint16:
            img = (img >> 8).astype(np.uint8)

        h, w = img.shape[:2]
        alpha = img[:, :, 3] if img.shape[2] == 4 else np.ones((h, w), np.uint8) * 255

        # Binary mask
        binary = (alpha > 10).astype(np.uint8)

        # Skeletonize
        skeleton = skeletonize(binary).astype(np.uint8)

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

    except ImportError:
        raise HTTPException(status_code=500, detail="skimage not installed ? run: pip install scikit-image")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
