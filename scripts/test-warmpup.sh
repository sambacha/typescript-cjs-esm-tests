#!/usr/bin/env bash
set -o errexit
echo "warmup testing..."
node --expose-gc node_modules/.bin/jest --coverage --globals "{\"coverage\":true}"