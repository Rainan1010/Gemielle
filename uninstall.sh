#!/bin/bash
set -e

DEST="$HOME/Library/Application Support/Google/Chrome/Default/Extensions/Gemielle"

echo "🗑️ Dang go cai dat Gemielle Extension cho macOS..."

if [ -d "$DEST" ]; then
    rm -rf "$DEST"
    echo "[OK] Da xoa thu muc Extension tai: $DEST"
else
    echo "[!] Khong tim thay thu muc Extension tai: $DEST"
fi

echo "-> Dang mo trang chrome://extensions/..."
open -a "Google Chrome" "chrome://extensions/" 2>/dev/null || open "chrome://extensions/" 2>/dev/null || true

echo ""
echo "=== HOAN THANH GO CAI DAT ==="
echo "1. Vui long tim 'Gemielle' tren trang chrome://extensions/."
echo "2. Nhan 'Xoa' (Remove) de go han extension khoi Chrome."
