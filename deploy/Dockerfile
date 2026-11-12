# Shadow313 NEXUS v4.0.0 — multi-stage container build
# Build context: repository root (see deploy/docker-compose.yml)

ARG HTTP_PROXY=""
ARG HTTPS_PROXY=""

FROM python:3.12-slim AS builder
ARG HTTP_PROXY
ARG HTTPS_PROXY
ENV http_proxy=${HTTP_PROXY} https_proxy=${HTTPS_PROXY}
WORKDIR /app

RUN apt-get update -o Acquire::Retries=3 \
    && apt-get install -y --no-install-recommends gcc g++ libssl-dev libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# The maintained Python package and its dependency manifest live in core/.
COPY core/ /app/
RUN pip install --no-cache-dir --upgrade pip wheel \
    && pip install --no-cache-dir --prefix=/install -r /app/requirements.txt

FROM python:3.12-slim AS production
ARG HTTP_PROXY
ARG HTTPS_PROXY
ENV http_proxy=${HTTP_PROXY} https_proxy=${HTTPS_PROXY}

LABEL org.opencontainers.image.title="Shadow313 NEXUS"
LABEL org.opencontainers.image.description="Local-First AI-Powered Security Intelligence"
LABEL org.opencontainers.image.version="4.0.0"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.url="https://shadow313.dev"

RUN apt-get update -o Acquire::Retries=3 \
    && apt-get install -y --no-install-recommends tcpdump nmap dnsutils iputils-ping libssl3 \
    && rm -rf /var/lib/apt/lists/*

ENV http_proxy="" https_proxy=""
COPY --from=builder /install /usr/local
COPY --from=builder /app /app

RUN useradd -m -s /bin/bash shadow313 \
    && mkdir -p /home/shadow313/.shadow313/{sessions,plugins,wordlists,logs,data,reports,receipts,campaigns,agent_runs} \
    && chown -R shadow313:shadow313 /home/shadow313/.shadow313

ENV PYTHONPATH=/app
ENV SHADOW313_AI_BACKEND=ollama
ENV SHADOW313_AI_ENDPOINT=http://ollama:11434
ENV SHADOW313_AI_MODEL=mistral:7b
WORKDIR /app
USER shadow313

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD python -c "import shadow313; print('ok')" || exit 1

EXPOSE 7313 7314 8313
ENTRYPOINT ["python", "-m", "shadow313.cli.main"]
CMD ["--help"]

# Full NEXUS image includes additional runtime utilities.
FROM production AS nexus
USER root
RUN apt-get update -o Acquire::Retries=3 \
    && apt-get install -y --no-install-recommends python3-dev libpcap-dev whois \
    && rm -rf /var/lib/apt/lists/*
USER shadow313
