#!/bin/sh
set -eu

MODEL="${SHADOW313_AI_MODEL:-matarmohamad313/shadow313-nexus}"
OLLAMA_HOST="${OLLAMA_HOST:-http://ollama:11434}"

export OLLAMA_HOST

echo "Waiting for Ollama at ${OLLAMA_HOST}..."
attempt=0
until ollama list >/dev/null 2>&1; do
    attempt=$((attempt + 1))
    if [ "$attempt" -ge 30 ]; then
        echo "Ollama did not become ready after 30 attempts." >&2
        exit 1
    fi
    sleep 2
done

echo "Pulling configured Shadow313 model: ${MODEL}"
ollama pull "$MODEL"
echo "Model pull completed."
