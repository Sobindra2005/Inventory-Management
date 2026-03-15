# Use an official lightweight Python image.
# We are using python:3.10-slim. NOTE: PaddlePaddle has specific version requirements.
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies required by PaddleOCR and OpenCV
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
# Also ensure pip is updated
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . .

# Expose the API port
EXPOSE 8000

# Command to run using Gunicorn and Uvicorn
CMD ["gunicorn", "main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "-b", "0.0.0.0:8000"]
