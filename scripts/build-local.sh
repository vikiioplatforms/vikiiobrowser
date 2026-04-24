#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Vikiio Browser — Local Build Script
# Builds a distributable installer for the current platform
# ─────────────────────────────────────────────────────────────────────────────

set -e

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║         Vikiio Browser — Local Build                ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "❌  Node.js not found. Install from https://nodejs.org (v18+)"
  exit 1
fi

NODE_VER=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VER" -lt 18 ]; then
  echo "❌  Node.js v$NODE_VER found. Please upgrade to v18 or higher."
  exit 1
fi
echo "✅  Node.js $(node -v)"

# Install deps if needed
if [ ! -d "node_modules" ]; then
  echo "📦  Installing dependencies..."
  npm install
fi

# Detect platform
PLATFORM=$(uname -s)
echo ""
echo "🖥️   Detected platform: $PLATFORM"
echo ""

case "$PLATFORM" in
  Darwin)
    echo "🍎  Building macOS .dmg (arm64 + x64)..."
    npm run dist:mac
    echo ""
    echo "✅  Done! Find your installer in: ./release/"
    echo "    - Vikiio Browser-*-arm64.dmg  (Apple Silicon)"
    echo "    - Vikiio Browser-*-x64.dmg    (Intel Mac)"
    ;;
  Linux)
    echo "🐧  Building Linux .AppImage + .deb..."
    npm run dist:linux
    echo ""
    echo "✅  Done! Find your installer in: ./release/"
    echo "    - Vikiio Browser-*.AppImage"
    echo "    - Vikiio Browser-*.deb"
    ;;
  MINGW*|CYGWIN*|MSYS*)
    echo "🪟  Building Windows .exe installer..."
    npm run dist:win
    echo ""
    echo "✅  Done! Find your installer in: ./release/"
    echo "    - Vikiio Browser Setup *.exe  (installer)"
    echo "    - Vikiio Browser *.exe        (portable)"
    ;;
  *)
    echo "⚠️   Unknown platform. Running generic build..."
    npm run dist
    ;;
esac

echo ""
echo "📁  Output directory: $(pwd)/release/"
ls -lh release/ 2>/dev/null || true
