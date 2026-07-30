#!/bin/bash
set -e

DEST="$HOME/Library/Application Support/Google/Chrome/Default/Extensions/Gemielle"
REPO_ZIP_URL="https://github.com/Rainan1010/Gemielle/archive/refs/heads/main.zip"

echo "🌸 Dang cai dat Gemielle Extension cho macOS..."

# Tao thu muc dich
mkdir -p "$DEST"

# Kiem tra xem dang chay local hay remote
if [ -f "./manifest.json" ]; then
    echo "-> Phat hien file local, dang sao chep..."
    cp -R manifest.json content.js style.css assets "$DEST/"
else
    echo "-> Dang tai extension tu GitHub (Rainan1010/Gemielle)..."
    TEMP_ZIP="/tmp/Gemielle_main.zip"
    TEMP_DIR="/tmp/Gemielle_temp"

    rm -f "$TEMP_ZIP"
    rm -rf "$TEMP_DIR"

    curl -fsSL "$REPO_ZIP_URL" -o "$TEMP_ZIP"
    unzip -q "$TEMP_ZIP" -d "$TEMP_DIR"

    EXTRACTED_FOLDER=$(find "$TEMP_DIR" -mindepth 1 -maxdepth 1 -type d | head -n 1)
    if [ -n "$EXTRACTED_FOLDER" ]; then
        cp -R "$EXTRACTED_FOLDER/manifest.json" "$EXTRACTED_FOLDER/content.js" "$EXTRACTED_FOLDER/style.css" "$EXTRACTED_FOLDER/assets" "$DEST/"
    fi

    rm -f "$TEMP_ZIP"
    rm -rf "$TEMP_DIR"
fi

# Copy duong dan vao Clipboard mac (pbcopy)
if command -v pbcopy >/dev/null 2>&1; then
    echo -n "$DEST" | pbcopy
    echo "[OK] Duong dan thu muc da duoc luu vao Clipboard!"
fi

echo "[OK] Da cai dat thanh cong extension vao: $DEST"
echo "-> Dang mo trang chrome://extensions/..."

# Mo Chrome extensions page tren macOS
open -a "Google Chrome" "chrome://extensions/" 2>/dev/null || open "chrome://extensions/" 2>/dev/null || true

echo ""
echo "=== CAC BUOC TIEP THEO TREN CHROME ==="
echo "1. Bat 'Che do danh cho nha phat trien' (Developer mode) o goc tren ben phai."
echo "2. Bam 'Tai tien ich da giai nen' (Load unpacked)."
echo "3. Nhan Command + Shift + G, dan (Command + V) duong dan va nhan Return!"
