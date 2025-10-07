# syntax=docker/dockerfile:1.4
# BuildX-optimized multi-stage build with layer caching

# ============================================================================
# Stage 1: Base image with system dependencies (cached layer)
# ============================================================================
FROM python:3.11-slim AS base

# Install system dependencies in a single layer
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libglib2.0-0 \
    libsm6 \
    libxrender1 \
    libxext6 \
    libgtk2.0-dev \
    ca-certificates \
    wget \
    cron \
    && rm -rf /var/lib/apt/lists/*

# ============================================================================
# Stage 2: Dependencies layer (cached unless requirements.txt changes)
# ============================================================================
FROM base AS dependencies

WORKDIR /app

# Copy only requirements first for better caching
COPY api/requirements.txt ./requirements.txt

# Install Python dependencies with pip cache mount
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --no-cache-dir "numpy<2.0" && \
    pip install --no-cache-dir -r requirements.txt

# ============================================================================
# Stage 3: Model download layer (cached, rarely changes)
# ============================================================================
FROM dependencies AS models

# Download face detection models
RUN mkdir -p /models && \
    wget -q -O /models/deploy.prototxt \
    https://raw.githubusercontent.com/opencv/opencv/master/samples/dnn/face_detector/deploy.prototxt && \
    wget -q -O /models/res10_300x300_ssd_iter_140000.caffemodel \
    https://raw.githubusercontent.com/opencv/opencv_3rdparty/dnn_samples_face_detector_20170830/res10_300x300_ssd_iter_140000.caffemodel

# ============================================================================
# Stage 4: Final runtime image
# ============================================================================
FROM models AS runtime

# Accept build-time args
ARG SUPABASE_URL
ARG SUPABASE_SERVICE_ROLE_KEY
ARG SUPABASE_ANON_KEY
ARG SOURCE_BUCKET
ARG STORAGE_BUCKET
ARG GEOAPIFY_API_KEY

WORKDIR /app

# Copy application code (changes most frequently, so copied last)
COPY api/main.py ./main.py
COPY api/face_processor.py ./face_processor.py
COPY api/scraper_cron.py ./scraper_cron.py
COPY api/scrapy.cfg ./scrapy.cfg
COPY api/scrapy_project ./scrapy_project

# Create log directory
RUN mkdir -p /app/logs

# Configure cron job for daily scraping at 2 AM
RUN echo "0 2 * * * /usr/local/bin/python /app/scraper_cron.py >> /app/logs/scraper.log 2>&1" > /etc/cron.d/scraper-cron && \
    chmod 0644 /etc/cron.d/scraper-cron && \
    crontab /etc/cron.d/scraper-cron

# Set runtime environment variables
ENV SUPABASE_URL=$SUPABASE_URL \
    SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY \
    SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY \
    SOURCE_BUCKET=$SOURCE_BUCKET \
    STORAGE_BUCKET=$STORAGE_BUCKET \
    GEOAPIFY_API_KEY=$GEOAPIFY_API_KEY

EXPOSE 8080

# Create startup script with better error handling
RUN echo '#!/bin/bash\n\
set -e\n\
echo "Starting Loppestars API..."\n\
echo "SUPABASE_URL: ${SUPABASE_URL}"\n\
echo "SOURCE_BUCKET: ${SOURCE_BUCKET}"\n\
echo "STORAGE_BUCKET: ${STORAGE_BUCKET}"\n\
\n\
# Start cron in background\n\
cron\n\
echo "Cron started"\n\
\n\
# Start uvicorn\n\
echo "Starting uvicorn on 0.0.0.0:8080..."\n\
exec uvicorn main:app --host 0.0.0.0 --port 8080 --workers 1 --log-level info\n\
' > /app/start.sh && chmod +x /app/start.sh

# Start both the web service and cron daemon
CMD ["/app/start.sh"]
