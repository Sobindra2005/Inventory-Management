# Use an official lightweight Python image.
# We are using python:3.10-slim. NOTE: PaddlePaddle has specific version requirements.
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies required by PaddleOCR, OpenCV and PaddlePaddle (libgomp)
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /opt/venv

# Activate venv automatically by adding it to PATH
ENV PATH="/opt/venv/bin:$PATH"

# Copy requirements file
COPY requirements.txt .

# Upgrade pip and install dependencies inside venv
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose API port
EXPOSE 8000

# Run FastAPI app using Gunicorn (now found in the venv PATH)
CMD ["gunicorn", "main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "-b", "0.0.0.0:8000"]
