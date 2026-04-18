#!/bin/bash
git config --global --add safe.directory /tmp/flutter
curl -fsSL https://storage.googleapis.com/flutter_infra_release/releases/stable/linux/flutter_linux_3.41.7-stable.tar.xz | tar -xJ -C /tmp
export PATH="/tmp/flutter/bin:$PATH"
flutter config --no-cli-animations
cd app && flutter build web
