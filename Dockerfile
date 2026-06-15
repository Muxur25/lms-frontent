# ==========================================
# STAGE 1: Build Enterprise Frontend
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Accept build-time env vars for Vite
ARG VITE_API_URL=https://api.lms.agmk.uz/api/v1
ARG VITE_WS_URL=wss://api.lms.agmk.uz/realtime
ARG VITE_APP_VERSION=1.0.0

# Set as environment for Vite build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL
ENV VITE_APP_VERSION=$VITE_APP_VERSION

# Install dependencies first for Docker layer caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the project with production configurations
RUN npm run build

# ==========================================
# STAGE 2: Serve with Secure NGINX
# ==========================================
FROM nginx:1.27-alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy build files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy enterprise nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
