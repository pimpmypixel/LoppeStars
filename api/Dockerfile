FROM python:3.11-slim

# Accept build-time args
ARG SUPABASE_URL
ARG SUPABASE_SERVICE_ROLE_KEY
ARG SUPABASE_ANON_KEY
ARG SOURCE_BUCKET
ARG STORAGE_BUCKET


RUN apt-get update && apt-get install -y --no-install-recommends \
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

WORKDIR /app

COPY api/requirements.txt ./requirements.txt
# Ensure NumPy 1.x compatibility with installed modules
RUN pip install --no-cache-dir "numpy<2.0"
RUN pip install --no-cache-dir -r requirements.txt

RUN mkdir -p /models
RUN wget -O /models/deploy.prototxt \
https://raw.githubusercontent.com/opencv/opencv/master/samples/dnn/face_detector/deploy.prototxt \
 && wget -O /models/res10_300x300_ssd_iter_140000.caffemodel \
https://raw.githubusercontent.com/opencv/opencv_3rdparty/dnn_samples_face_detector_20170830/res10_300x300_ssd_iter_140000.caffemodel

COPY api/main.py ./main.py
COPY api/scraper_cron.py ./scraper_cron.py
COPY api/scrapy.cfg ./scrapy.cfg
COPY api/scrapy_project ./scrapy_project

# Create log directory
RUN mkdir -p /app/logs

# Add cron job for daily scraping at 2 AM
RUN echo "0 2 * * * /usr/local/bin/python /app/scraper_cron.py >> /app/logs/scraper.log 2>&1" > /etc/cron.d/scraper-cron
RUN chmod 0644 /etc/cron.d/scraper-cron
RUN crontab /etc/cron.d/scraper-cron

# Promote them to runtime env vars
ENV SUPABASE_URL=$SUPABASE_URL \
    SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY \
    SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY \
    SOURCE_BUCKET=$SOURCE_BUCKET \
    STORAGE_BUCKET=$STORAGE_BUCKET

# ENV SOURCE_BUCKET="stall-photos"
# ENV STORAGE_BUCKET="stall-photos-processed"
EXPOSE 8080

# Start both the web service and cron daemon
CMD ["sh", "-c", "cron && uvicorn main:app --host 0.0.0.0 --port 8080 --workers 1"]

