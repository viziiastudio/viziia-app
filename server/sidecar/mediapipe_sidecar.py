from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import mediapipe as mp
import numpy as np
import base64
import cv2

app = FastAPI()

class ImageRequest(BaseModel):
    image_b64: str

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/landmarks")
def get_landmarks(req: ImageRequest):
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
        output_facial_transformation_matrixes=False
    )
    with FaceLandmarker.create_from_options(options) as detector:
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        result = detector.detect(mp_image)

    if not result.face_landmarks:
        raise HTTPException(status_code=422, detail="No face detected")

    lm = result.face_landmarks[0]
    landmarks = [{"x": l.x * w, "y": l.y * h, "z": l.z} for l in lm]
    left_iris  = {"x": lm[468].x * w, "y": lm[468].y * h}
    right_iris = {"x": lm[473].x * w, "y": lm[473].y * h}
    return {"landmarks": landmarks, "left_iris": left_iris,
            "right_iris": right_iris, "width": w, "height": h}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
