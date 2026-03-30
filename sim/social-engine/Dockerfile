FROM python:3.11-slim

WORKDIR /app

# System deps (gọn hơn)
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# Env
ENV PYTHONIOENCODING=utf-8 \
    LANG=C.UTF-8 \
    LC_ALL=C.UTF-8

# Copy dependency trước (tối ưu cache layer)
COPY requirements.txt .

# DÙNG CACHE (quan trọng nhất)
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt

# Copy source
COPY . .

CMD ["python", "main.py"]