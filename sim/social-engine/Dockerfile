FROM python:3.11-slim

WORKDIR /app

# Upgrade pip and install curl
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Fix unicode encoding for Windows/Linux boundaries
ENV PYTHONIOENCODING=utf-8
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8

# Install dependencies first
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Run FastAPI server
CMD ["python", "main.py"]
