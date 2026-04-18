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

@app.get("/health")
def health():
    return {"status": "ok"}

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

class FrameRequest(BaseModel):
    image_b64: str
    side: str = "left"  # "left" or "right"

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
