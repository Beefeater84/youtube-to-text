FROM python:3.12-slim

# Install Node.js for yt-dlp JavaScript runtime
RUN apt-get update && apt-get install -y nodejs && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY worker/pyproject.toml .
RUN pip install --no-cache-dir .

COPY worker/src ./src

CMD ["python", "-m", "src.main"]
