#!/bin/bash

# ==============================================================================
# SpineSurge Pro Local Build & Sign Script
# ==============================================================================

# Fail on error
set -e

# Support loading from .env if present (for local testing)
if [ -f .env ]; then
  export $(echo $(cat .env | sed 's/#.*//g' | xargs) | envsubst)
fi

# Function to check required env vars
check_env() {
  local var_name=$1
  if [ -z "${!var_name}" ]; then
    echo "Error: Required environment variable $var_name is missing."
    exit 1
  fi
}

echo "🚀 Preparing build for SpineSurge Pro..."

# Detect Platform
OS_TYPE="$(uname)"

if [ "$OS_TYPE" == "Darwin" ]; then
  echo "🍎 Detected macOS. Checking notarization credentials..."
  check_env "APPLE_ID"
  check_env "APPLE_APP_SPECIFIC_PASSWORD"
  check_env "APPLE_TEAM_ID"
  
  echo "📦 Building and Signing macOS app..."
  npm run build
  npx electron-builder --mac
  
elif [[ "$OS_TYPE" == "MINGW"* || "$OS_TYPE" == "MSYS"* ]]; then
  echo "🪟 Detected Windows. Checking certificate credentials..."
  check_env "CSC_LINK"
  check_env "CSC_KEY_PASSWORD"
  
  echo "📦 Building and Signing Windows app..."
  npm run build
  npx electron-builder --win
else
  echo "⚠️ Unsupported OS for local signing script."
  exit 1
fi

echo "✅ Build and signing complete. Artifacts are in dist_electron/"
