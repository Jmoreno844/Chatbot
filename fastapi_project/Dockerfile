FROM python:3.11-slim as builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy only requirements first (for better caching)
COPY requirements.txt .

# Create a virtual environment and install dependencies
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir --upgrade pip setuptools && \
    pip install --no-cache-dir -r requirements.txt

# Final stage
FROM python:3.11-slim

# Create a non-root user
RUN useradd -m appuser

WORKDIR /app

# Copy virtual env from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy application code by order of change frequency
# First copy configuration files that change less frequently
COPY ./app/config ./app/config/

# Then copy the rest of the application code
COPY . .

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    APP_ENV=test \
    DEBUG=false \
    PORT=8080

# Change ownership to non-root user
RUN chown -R appuser:appuser /app
USER appuser

# Expose port (for documentation)
EXPOSE 8080

# Run the application using the PORT environment variable
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}