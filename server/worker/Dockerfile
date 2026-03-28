FROM node:20-slim

RUN apt-get update && apt-get install -y \
    libglib2.0-0 libgl1 libxcb1 python3 make g++ pkg-config \
    libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY worker.js ./
COPY pipeline ./pipeline
CMD ["node", "worker.js"]
