#!/bin/bash
# Install systemd services for Undervolt on Jetson AGX Orin
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
NODE_BIN="/home/red/.nvm/versions/node/v24.12.0/bin"

echo "=== Installing Undervolt Services ==="
echo "Machine: Jetson AGX Orin (R35.4.1)"
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    echo "Please run with sudo: sudo $0"
    exit 1
fi

# Copy service files
echo "Copying service files..."
cp "$SCRIPT_DIR/undervolt-frontend.service" /etc/systemd/system/
cp "$SCRIPT_DIR/ollama.service" /etc/systemd/system/

# Build frontend for production
echo ""
echo "Building frontend for production..."
cd /home/red/Documents/github/undervolt/frontend
sudo -u red bash -c "export PATH=$NODE_BIN:\$PATH && npm run build"

# Reload systemd
echo ""
echo "Reloading systemd..."
systemctl daemon-reload

# Enable services
echo "Enabling services..."
systemctl enable undervolt-frontend.service
systemctl enable ollama.service

echo ""
echo "=== Services Installed ==="
echo ""
echo "To start services:"
echo "  sudo systemctl start ollama"
echo "  sudo systemctl start undervolt-frontend"
echo ""
echo "To check status:"
echo "  sudo systemctl status undervolt-frontend"
echo "  sudo systemctl status ollama"
echo ""
echo "To view logs:"
echo "  journalctl -u undervolt-frontend -f"
echo "  journalctl -u ollama -f"
echo ""
echo "Frontend will be available at: http://localhost:3000"
echo "Ollama API will be available at: http://localhost:11434"
