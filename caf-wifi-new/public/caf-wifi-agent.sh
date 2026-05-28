#!/bin/bash
echo ""
echo " CAF-WIFI Local Agent"
echo " ===================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo " ERROR: Node.js is not installed!"
    echo ""
    echo " Install on Ubuntu/Debian:"
    echo "   sudo apt install nodejs"
    echo ""
    echo " Install on Mac:"
    echo "   brew install node"
    echo ""
    exit 1
fi

echo " Starting agent..."
echo " Press Ctrl+C to stop"
echo ""

node "$(dirname "$0")/caf-wifi-agent.js"
