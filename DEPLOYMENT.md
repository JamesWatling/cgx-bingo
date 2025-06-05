# CGX Bingo - DigitalOcean Deployment Guide

## Prerequisites

- DigitalOcean droplet with Ubuntu 20.04+ or similar
- Node.js 16+ installed
- Domain name pointed to your droplet (optional but recommended)
- SSH access to your droplet

## Quick Deployment

### 1. Connect to Your Droplet

```bash
ssh root@your-droplet-ip
```

### 2. Install Node.js (if not already installed)

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 3. Clone and Deploy Your Project

```bash
# Navigate to web directory
cd /var/www

# Clone your project (replace with your repository)
git clone https://github.com/your-username/cgx-bingo.git
cd cgx-bingo

# Make deployment script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

## HTTPS Setup with Cloudflare

### Option 1: Cloudflare Proxy SSL (Recommended)

This is the easiest setup where Cloudflare handles SSL termination:

#### Cloudflare Configuration:
1. **Add your domain to Cloudflare**
2. **Set A record**: `@ → YOUR_DROPLET_IP` (Proxied ✅)
3. **SSL/TLS → Overview**: Set to "Flexible"
4. **SSL/TLS → Edge Certificates**: Enable "Always Use HTTPS"

#### Server Configuration:
```bash
# Update nginx.conf with your domain
sed -i 's/your-domain.com/yourdomain.com/g' /etc/nginx/sites-available/cgx-bingo

# Reload nginx
nginx -t && systemctl reload nginx

# Restart your app
pm2 restart cgx-bingo
```

Your app will be available at:
- `https://yourdomain.com` (SSL via Cloudflare)
- `http://yourdomain.com` (redirects to HTTPS if enabled)

### Option 2: Full SSL with Let's Encrypt

For end-to-end encryption:

```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get SSL certificate
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Set Cloudflare to "Full (strict)" mode
# In Cloudflare: SSL/TLS → Overview → Full (strict)
```

## Manual Deployment Steps

If you prefer manual deployment:

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Application

```bash
npm run build
```

### 3. Install PM2 Globally

```bash
npm install -g pm2
```

### 4. Start the Application

```bash
# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

## Firewall Configuration

### Allow necessary ports:

```bash
# Allow SSH (if not already allowed)
ufw allow ssh

# Allow HTTP
ufw allow 80

# Allow HTTPS (for future SSL setup)
ufw allow 443

# Allow your application port (if accessing directly)
ufw allow 8080

# Enable firewall
ufw enable
```

## Nginx Setup (Recommended)

### 1. Install Nginx

```bash
apt install nginx -y
```

### 2. Configure Nginx

```bash
# Remove default configuration
rm /etc/nginx/sites-enabled/default

# Copy our configuration
cp nginx.conf /etc/nginx/sites-available/cgx-bingo

# Enable the site
ln -s /etc/nginx/sites-available/cgx-bingo /etc/nginx/sites-enabled/

# Update the domain name in the config
nano /etc/nginx/sites-available/cgx-bingo
# Replace 'your-domain.com' with your actual domain

# Test configuration
nginx -t

# Restart Nginx
systemctl restart nginx
systemctl enable nginx
```

## SSL Certificate Setup (Optional but Recommended)

### Using Let's Encrypt (Free SSL):

```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get SSL certificate (replace with your domain)
certbot --nginx -d your-domain.com -d www.your-domain.com

# Test automatic renewal
certbot renew --dry-run
```

## Environment Variables

Create a `.env` file for production settings:

```bash
# Create environment file
cat > .env << EOF
NODE_ENV=production
PORT=8080
HOST=0.0.0.0
EOF
```

## Monitoring and Maintenance

### PM2 Commands

```bash
# Check application status
pm2 status

# View logs
pm2 logs cgx-bingo

# Restart application
pm2 restart cgx-bingo

# Stop application
pm2 stop cgx-bingo

# Monitor in real-time
pm2 monit
```

### System Monitoring

```bash
# Check system resources
htop

# Check disk usage
df -h

# Check memory usage
free -h

# Check network connections
netstat -tulpn | grep :8080
```

## Troubleshooting

### Common Issues:

1. **Port 8080 already in use:**
   ```bash
   # Find process using port 8080
   lsof -i :8080
   
   # Kill the process
   kill -9 <PID>
   ```

2. **Application not starting:**
   ```bash
   # Check PM2 logs
   pm2 logs cgx-bingo
   
   # Check if all dependencies are installed
   npm install
   ```

3. **WebSocket connection issues:**
   - Ensure firewall allows port 8080
   - Check if Nginx is properly configured for WebSocket proxying
   - Verify the application is running: `pm2 status`

4. **Build failures:**
   ```bash
   # Clear npm cache
   npm cache clean --force
   
   # Remove node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

## Updating the Application

```bash
# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Rebuild the application
npm run build

# Restart with PM2
pm2 restart cgx-bingo
```

## Security Considerations

1. **Change default SSH port:**
   ```bash
   nano /etc/ssh/sshd_config
   # Change Port 22 to something else
   systemctl restart ssh
   ```

2. **Disable root login:**
   ```bash
   # Create a new user
   adduser your-username
   usermod -aG sudo your-username
   
   # Disable root login in SSH config
   nano /etc/ssh/sshd_config
   # Set PermitRootLogin no
   ```

3. **Keep system updated:**
   ```bash
   apt update && apt upgrade -y
   ```

## Performance Optimization

1. **Enable Nginx gzip compression:**
   ```bash
   nano /etc/nginx/nginx.conf
   # Uncomment gzip settings
   ```

2. **Set up log rotation:**
   ```bash
   # PM2 log rotation
   pm2 install pm2-logrotate
   ```

## Support

If you encounter issues:

1. Check the application logs: `pm2 logs cgx-bingo`
2. Check Nginx logs: `tail -f /var/log/nginx/error.log`
3. Check system logs: `journalctl -u nginx -f`

## Access Your Application

- **Direct access:** `http://your-droplet-ip:8080`
- **With Nginx:** `http://your-domain.com` (or `http://your-droplet-ip`)
- **With SSL:** `https://your-domain.com`

Your CGX Bingo application should now be running and accessible! 