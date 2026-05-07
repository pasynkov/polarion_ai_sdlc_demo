#!/bin/sh
# Load .env from project root
ENV_FILE="$(dirname "$0")/../.env"
if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' "$ENV_FILE" | xargs)
fi
exec node "$(dirname "$0")/server.js"
