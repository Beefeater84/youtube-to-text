FROM python:3.12-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl unzip \
    && curl -fsSL https://deno.land/install.sh | DENO_INSTALL=/usr/local sh \
    && apt-get purge -y curl unzip && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY worker/pyproject.toml .
RUN pip install --no-cache-dir .

COPY worker/src ./src

CMD ["python", "-m", "src.main"]
