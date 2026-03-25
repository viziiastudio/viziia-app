FROM node:20-slim

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
COPY ../middleware ./middleware
CMD ["node", "server.js"]
