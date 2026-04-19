FROM python:3.11.9-slim

RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libgl1 \
    libgomp1 \
    libgles2 \
    libxcb1 \
    libegl1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ARG CACHEBUST=1776609122.72067
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY mediapipe_sidecar.py .
CMD ["python", "mediapipe_sidecar.py"]
