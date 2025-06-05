#!/bin/bash

# CGX Bingo Deployment Script
echo "🚀 Starting CGX Bingo deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_status "Node.js version: $(node --version)"
print_status "npm version: $(npm --version)"

# Install dependencies
print_status "Installing dependencies..."
npm install

# Build the application
print_status "Building the application..."
npm run build

# Create logs directory
print_status "Creating logs directory..."
mkdir -p logs

# Install PM2 globally if not installed
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2 globally..."
    npm install -g pm2
fi

# Stop existing PM2 processes
print_status "Stopping existing PM2 processes..."
pm2 stop cgx-bingo 2>/dev/null || true
pm2 delete cgx-bingo 2>/dev/null || true

# Start the application with PM2
print_status "Starting application with PM2..."
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
print_status "Saving PM2 configuration..."
pm2 save

# Setup PM2 startup script
print_status "Setting up PM2 startup script..."
pm2 startup

print_status "✅ Deployment completed successfully!"
print_status "🌐 Your application should be running on port 8080"
print_status "📊 Check status with: pm2 status"
print_status "📝 View logs with: pm2 logs cgx-bingo"
print_status "🔄 Restart with: pm2 restart cgx-bingo"

echo ""
print_warning "Don't forget to:"
print_warning "1. Configure your firewall to allow port 8080"
print_warning "2. Set up Nginx reverse proxy (optional but recommended)"
print_warning "3. Configure SSL certificate for HTTPS" 