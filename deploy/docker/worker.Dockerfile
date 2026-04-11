FROM python:3.12-slim

WORKDIR /app

COPY worker/pyproject.toml .
RUN pip install --no-cache-dir .

COPY worker/src ./src

CMD ["python", "-m", "src.main"]
