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
