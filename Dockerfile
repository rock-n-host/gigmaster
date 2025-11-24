# --- Stage 1: Build Frontend ---
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend

# Install frontend dependencies
COPY frontend/package*.json ./
RUN npm install

# Copy source and build
COPY frontend/ ./
RUN npm run build

# --- Stage 2: Final Runtime ---
FROM node:18-alpine
WORKDIR /app

# 1. Setup Backend
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --production
COPY backend/ ./

# 2. Copy Built Frontend from Stage 1
# We recreate the structure /app/frontend/dist so the backend can find it via ../../frontend/dist
WORKDIR /app/frontend
COPY --from=frontend-builder /app/frontend/dist ./dist

# 3. Setup Lyrics Mount Point
WORKDIR /app
RUN mkdir lyrics

# 4. Start
EXPOSE 3000
CMD ["node", "backend/src/index.js"]

