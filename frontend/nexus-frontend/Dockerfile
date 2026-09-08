# =============================================================================
# STAGE 1: BUILD — Compile React app with Node.js + Vite
# =============================================================================
# node:20-alpine = Node.js 20 on Alpine Linux (~50MB, much smaller than full node image)
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files first (Docker layer caching — dependencies cached unless package.json changes)
COPY package.json package-lock.json ./

# Install dependencies (ci = clean install, uses exact versions from lock file)
RUN npm ci

# Vite needs these env vars AT BUILD TIME to bake them into the JS bundle.
# Why? Vite replaces import.meta.env.VITE_* with literal strings during build.
# If they're not set, the frontend has no idea where the backend or Clerk lives.
#
# Usage: docker build --build-arg VITE_API_URL=https://your-backend.onrender.com ...
ARG VITE_API_URL
ARG VITE_CLERK_PUBLISHABLE_KEY
ARG VITE_VAPID_PUBLIC_KEY

# Convert build args to env vars so Vite can see them during `npm run build`
ENV VITE_API_URL=$VITE_API_URL \
    VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY \
    VITE_VAPID_PUBLIC_KEY=$VITE_VAPID_PUBLIC_KEY

# Copy source code
COPY src/ src/
COPY public/ public/
COPY index.html .
COPY vite.config.js .

# Build the production bundle (output goes to /app/dist/)
RUN npm run build


# =============================================================================
# STAGE 2: SERVE — Serve static files with nginx
# =============================================================================
# nginx:alpine = tiny, fast web server (~20MB) purpose-built for serving static files.
# Why nginx instead of Node.js? nginx handles 10x more concurrent connections,
# uses 100x less memory, and is designed for exactly this: serving HTML/CSS/JS.
FROM nginx:alpine AS runtime

# Remove the default nginx config (it doesn't know about SPA routing)
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom nginx config (SPA fallback, gzip, etc.)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built static files from Stage 1
# Vite outputs to /app/dist/ by default
COPY --from=build /app/dist /usr/share/nginx/html

# Nginx listens on port 80 by default
EXPOSE 80

# nginx:alpine's default CMD already runs `nginx -g 'daemon off;'`
# No need to override — it just works.
