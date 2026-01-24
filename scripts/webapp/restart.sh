#!/bin/bash
# Restart DocuTalk webapp services

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔄 Restarting DocuTalk services..."
echo ""

"$SCRIPT_DIR/stop.sh"
sleep 1
"$SCRIPT_DIR/start.sh"
