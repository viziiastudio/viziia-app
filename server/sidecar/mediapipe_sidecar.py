from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import mediapipe as mp
import numpy as np
import base64
import cv2
import math

app = FastAPI()

class ImageRequest(BaseModel):
    image_b64: str

class SegmentRequest(BaseModel):
    image_b64: str
    side: str = "left"

@app.get("/health")
def health():
    return {"status": "ok", "v": "3.0"}

@app.post("/landmarks")
@app.post("/face-geometry")
def get_face_geometry(req: ImageRequest):
    img_bytes = base64.b64decode(req.image_b64)
    img_arr   = np.frombuffer(img_bytes, np.uint8)
    img       = cv2.imdecode(img_arr, cv2.IMREAD_COLOR)
    h, w      = img.shape[:2]

    mp_face = mp.solutions.face_mesh
    with mp_face.FaceMesh(static_image_mode=True, max_num_faces=1, refine_landmarks=True) as mesh:
        results = mesh.process(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))

    if not results.multi_face_landmarks:
        raise HTTPException(status_code=422, detail="No face detected in base model image")

    lms = results.multi_face_landmarks[0].landmark

    def px(l):
        return {"x": l.x * w, "y": l.y * h}

    LEFT_IRIS  = [474, 475, 476, 477]
    RIGHT_IRIS = [469, 470, 471, 472]

    left_center  = {"x": np.mean([lms[i].x for i in LEFT_IRIS])  * w,
                    "y": np.mean([lms[i].y for i in LEFT_IRIS])  * h}
    right_center = {"x": np.mean([lms[i].x for i in RIGHT_IRIS]) * w,
                    "y": np.mean([lms[i].y for i in RIGHT_IRIS]) * h}

    ipd_px = math.hypot(right_center["x"] - left_center["x"],
                        right_center["y"] - left_center["y"])

    LEFT_TEMPLE_LM  = 127
    RIGHT_TEMPLE_LM = 356
    LEFT_EAR_LM     = 234
    RIGHT_EAR_LM    = 454

    left_temple  = px(lms[LEFT_TEMPLE_LM])
    right_temple = px(lms[RIGHT_TEMPLE_LM])
    left_ear     = px(lms[LEFT_EAR_LM])
    right_ear    = px(lms[RIGHT_EAR_LM])

    sellion       = px(lms[6])
    nasion        = px(lms[4])
    left_temple_a = px(lms[LEFT_TEMPLE_LM])
    right_temple_a= px(lms[RIGHT_TEMPLE_LM])
    left_ear_t    = px(lms[LEFT_EAR_LM])
    right_ear_t   = px(lms[RIGHT_EAR_LM])

    FACE_OVAL = [10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109]
    face_width_pts = [lms[i].x * w for i in FACE_OVAL]
    face_width_px  = max(face_width_pts) - min(face_width_pts)

    yaw_raw   = lms[454].x - lms[234].x
    pitch_raw = lms[10].y  - lms[152].y
    nose_vec  = lms[1].z
    yaw_deg   = math.degrees(math.atan2(yaw_raw * w, abs(nose_vec) * w + 1e-6)) * 0.6
    pitch_deg = math.degrees(math.atan2(pitch_raw * h, abs(nose_vec) * h + 1e-6)) * 0.3

    pose_ok = abs(yaw_deg) <= 30 and abs(pitch_deg) <= 20
    conf    = round(1.0 - abs(yaw_deg)/90, 2)

    return {
        "faceDetected":    True,
        "iris": {
            "leftCenter":  left_center,
            "rightCenter": right_center,
        },
        "ipdPx":       ipd_px,
        "faceWidthPx": face_width_px,
        "headPose":    {"yaw": yaw_deg, "pitch": pitch_deg, "roll": 0.0},
        "namedLandmarks": {
            "sellion":       sellion,
            "nasion":        nasion,
            "left_temple":   left_temple_a,
            "right_temple":  right_temple_a,
            "left_ear_tragus":  left_ear_t,
            "right_ear_tragus": right_ear_t,
        },
        "leftEar":          left_ear,
        "rightEar":         right_ear,
        "leftTempleAnchor": left_temple,
        "rightTempleAnchor":right_temple,
        "quality": {
            "poseWithinSupport": pose_ok,
            "confidence":        conf,
        },
        "confidence": conf,
        "imageSize":  {"width": w, "height": h},
    }


@app.post("/segment-frame")
def segment_frame(req: SegmentRequest):
    try:
        img_bytes = base64.b64decode(req.image_b64)
        img_arr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(img_arr, cv2.IMREAD_UNCHANGED)
        if img is None:
            raise HTTPException(status_code=400, detail="Could not decode image")
        if img.dtype != np.uint8:
            img = (img >> 8).astype(np.uint8)
        h, w = img.shape[:2]
        alpha = img[:, :, 3] if img.shape[2] == 4 else np.ones((h, w), np.uint8) * 255
        bgr = img[:, :, :3]
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
        cut_w = max(3, int(w * 0.008))
        cut_mask = alpha.copy()
        cut_mask[:, max(0, hinge_x - cut_w):min(w, hinge_x + cut_w)] = 0
        binary = (cut_mask > 10).astype(np.uint8)
        num_labels, labels = cv2.connectedComponents(binary)
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
        sorted_by_size = sorted(components.items(), key=lambda x: x[1]["size"], reverse=True)
        front_label = sorted_by_size[0][0]
        remaining = [(lbl, info) for lbl, info in sorted_by_size[1:]]
        if req.side == "left":
            remaining_sorted = sorted(remaining, key=lambda x: x[1]["cx"], reverse=True)
        else:
            remaining_sorted = sorted(remaining, key=lambda x: x[1]["cx"])
        near_label = remaining_sorted[0][0] if remaining_sorted else None
        far_label = remaining_sorted[1][0] if len(remaining_sorted) > 1 else None

        def extract_layer(mask):
            layer = np.zeros((h, w, 4), dtype=np.uint8)
            layer[:, :, :3] = bgr
            layer[:, :, 3] = (mask * alpha).astype(np.uint8)
            rows = np.any(layer[:, :, 3] > 10, axis=1)
            cols2 = np.any(layer[:, :, 3] > 10, axis=0)
            if not rows.any() or not cols2.any():
                return None, 0, 0, 0, 0
            rmin, rmax = np.where(rows)[0][[0, -1]]
            cmin, cmax = np.where(cols2)[0][[0, -1]]
            cropped = layer[rmin:rmax+1, cmin:cmax+1]
            _, enc = cv2.imencode(".png", cropped)
            return base64.b64encode(enc.tobytes()).decode(), int(cmin), int(rmin), int(cmax-cmin+1), int(rmax-rmin+1)

        front_b64, fx, fy, fw, fh = extract_layer(components[front_label]["mask"])
        near_b64, nx, ny, nw, nh = extract_layer(components[near_label]["mask"]) if near_label else (None,0,0,0,0)
        far_b64, farx, fary, farw, farh = extract_layer(components[far_label]["mask"]) if far_label else (None,0,0,0,0)
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
