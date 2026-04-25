#!/bin/bash
set -e

# Build do frontend Flutter para web com variáveis de ambiente

SENTRY_DSN="${SENTRY_DSN:-}"

if command -v flutter &> /dev/null; then
    FLUTTER_CMD="flutter"
else
    # Instala Flutter se não estiver disponível (Vercel build environment)
    git config --global --add safe.directory /tmp/flutter || true
    curl -fsSL https://storage.googleapis.com/flutter_infra_release/releases/stable/linux/flutter_linux_3.41.7-stable.tar.xz | tar -xJ -C /tmp
    export PATH="/tmp/flutter/bin:$PATH"
    flutter config --no-cli-animations
    FLUTTER_CMD="/tmp/flutter/bin/flutter"
fi

cd app

# Passa SENTRY_DSN como dart-define se estiver definido
if [ -n "$SENTRY_DSN" ]; then
    $FLUTTER_CMD build web --dart-define=SENTRY_DSN="$SENTRY_DSN"
else
    echo "⚠️  SENTRY_DSN não definido — Sentry será desabilitado no frontend"
    $FLUTTER_CMD build web
fi
