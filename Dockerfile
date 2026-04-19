# --- Stage 1: Build ---
FROM node:22-slim AS builder

WORKDIR /app

# Build-time args for Vite (baked into the bundle)
# Default empty = use relative paths (works on any domain)
ARG VITE_API_BASE_URL=""
ARG VITE_API_FALLBACK_TO_MOCKS="false"
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_API_FALLBACK_TO_MOCKS=$VITE_API_FALLBACK_TO_MOCKS

# Copy dependency files first for better layer caching
COPY package.json package-lock.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the frontend (tsc + vite)
RUN npm run build

# --- Stage 2: Production ---
FROM node:22-slim

WORKDIR /app

# Copy dependency files
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm ci --omit=dev --ignore-scripts

# Copy built frontend from builder
COPY --from=builder /app/dist ./dist

# Copy server files
COPY server ./server

# Copy public data (pvz.json etc.)
COPY public/data ./public/data

EXPOSE 3000

CMD ["node", "server/index.js"]
