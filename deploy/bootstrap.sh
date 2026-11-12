#!/bin/sh
set -eu

DATA_DIR="${SHADOW313_DATA_DIR:-/opt/shadow313/data}"

if [ "$(id -u)" -ne 0 ]; then
    echo "Run this script as root (for example: sudo sh deploy/bootstrap.sh)." >&2
    exit 1
fi

install -d -o 10313 -g 10313 -m 0750 "$DATA_DIR"
echo "Prepared Shadow313 data directory: $DATA_DIR (UID/GID 10313)"
