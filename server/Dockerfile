FROM node:20-slim

WORKDIR /app
COPY api/package.json api/package-lock.json ./
RUN npm ci
COPY api/ ./
COPY middleware ./middleware
CMD ["node", "server.js"]
