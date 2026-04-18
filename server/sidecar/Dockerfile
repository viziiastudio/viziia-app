FROM python:3.11.9-slim

RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libgl1 \
    libgles2 \
    libxcb1 \
    libegl1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY mediapipe_sidecar.py .
CMD ["uvicorn", "mediapipe_sidecar:app", "--host", "0.0.0.0", "--port", "8000"]
