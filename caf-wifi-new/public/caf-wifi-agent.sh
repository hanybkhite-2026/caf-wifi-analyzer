#!/bin/bash
# CAF-WIFI Local Agent - Linux/macOS
echo ""
echo " ====================================="
echo "  CAF-WIFI Local Agent v1.0"
echo " ====================================="
echo ""

# Check Node.js
if ! command -v node &>/dev/null; then
    echo " ERROR: Node.js not found!"
    echo " Install: sudo apt install nodejs   (Ubuntu/Debian)"
    echo "          brew install node          (macOS)"
    exit 1
fi

# Use agent.js next to this script
DIR="$(cd "$(dirname "$0")" && pwd)"
JSFILE="$DIR/caf-wifi-agent.js"

if [ ! -f "$JSFILE" ]; then
    echo " Downloading agent.js..."
    curl -fsSL "https://caf-wifi-new.vercel.app/caf-wifi-agent.js" -o "$JSFILE"
    if [ ! -f "$JSFILE" ]; then
        echo " Download failed. Check internet."
        exit 1
    fi
fi

echo " Starting... Press Ctrl+C to stop"
echo ""
node "$JSFILE"
