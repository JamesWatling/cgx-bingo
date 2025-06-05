#!/bin/bash

# Transfer script for CGX Bingo to DigitalOcean droplet
# Usage: ./transfer-to-server.sh <droplet-ip> [user]

if [ $# -eq 0 ]; then
    echo "Usage: $0 <droplet-ip> [user]"
    echo "Example: $0 192.168.1.100 root"
    echo "Note: This script supports both SSH key and password authentication"
    exit 1
fi

DROPLET_IP=$1
USER=${2:-root}
PROJECT_NAME="cgx-bingo"

echo "🚀 Transferring CGX Bingo to $USER@$DROPLET_IP..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Test SSH connection (supports both key and password auth)
print_status "Testing SSH connection..."
print_warning "You may be prompted for your password..."

if ! ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no $USER@$DROPLET_IP "echo 'SSH connection successful'" 2>/dev/null; then
    print_error "Cannot connect to $USER@$DROPLET_IP"
    print_warning "Make sure:"
    print_warning "1. The droplet IP is correct: $DROPLET_IP"
    print_warning "2. The username is correct: $USER"
    print_warning "3. Your password is correct"
    print_warning "4. The droplet is running and SSH is enabled"
    print_warning "5. Port 22 is open on the droplet"
    exit 1
fi

print_status "SSH connection successful!"

# Create project directory on server
print_status "Creating project directory on server..."
ssh -o StrictHostKeyChecking=no $USER@$DROPLET_IP "mkdir -p /var/www/$PROJECT_NAME"

# Build the project locally first
print_status "Building project locally..."
npm run build

# Create a temporary archive excluding unnecessary files
print_status "Creating project archive..."
tar --exclude='node_modules' \
    --exclude='.git' \
    --exclude='*.log' \
    --exclude='.DS_Store' \
    --exclude='logs' \
    -czf /tmp/$PROJECT_NAME.tar.gz .

# Transfer the archive
print_status "Transferring files to server..."
print_warning "You may be prompted for your password again..."
scp -o StrictHostKeyChecking=no /tmp/$PROJECT_NAME.tar.gz $USER@$DROPLET_IP:/tmp/

# Extract and set up on server
print_status "Extracting files on server..."
print_warning "You may be prompted for your password one more time..."
ssh -o StrictHostKeyChecking=no $USER@$DROPLET_IP << EOF
    cd /var/www/$PROJECT_NAME
    tar -xzf /tmp/$PROJECT_NAME.tar.gz
    rm /tmp/$PROJECT_NAME.tar.gz
    
    # Make scripts executable
    chmod +x deploy.sh
    chmod +x transfer-to-server.sh
    
    echo "✅ Files transferred successfully!"
    echo "📁 Project location: /var/www/$PROJECT_NAME"
    echo ""
    echo "🚀 Next steps:"
    echo "1. cd /var/www/$PROJECT_NAME"
    echo "2. ./deploy.sh"
    echo ""
    echo "📋 Or run manual deployment:"
    echo "1. npm install"
    echo "2. npm run build"
    echo "3. pm2 start ecosystem.config.js --env production"
    echo ""
    echo "🔧 Don't forget to configure your firewall:"
    echo "   ufw allow ssh"
    echo "   ufw allow 80"
    echo "   ufw allow 443"
    echo "   ufw allow 8080"
    echo "   ufw enable"
EOF

# Clean up local temp file
rm /tmp/$PROJECT_NAME.tar.gz

print_status "🎉 Transfer completed successfully!"
echo ""
print_warning "📝 Next steps:"
print_warning "1. SSH into your droplet: ssh $USER@$DROPLET_IP"
print_warning "2. Navigate to project: cd /var/www/$PROJECT_NAME"
print_warning "3. Run deployment: ./deploy.sh"
echo ""
print_status "🌐 After deployment, your app will be available at:"
print_status "   http://$DROPLET_IP:8080" 