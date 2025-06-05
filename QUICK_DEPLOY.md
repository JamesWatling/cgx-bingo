# 🚀 Quick Deploy to DigitalOcean

## Option 1: Automated Transfer (Recommended)

```bash
# From your local machine, run:
./transfer-to-server.sh YOUR_DROPLET_IP

# Then SSH to your droplet and run:
ssh root@YOUR_DROPLET_IP
cd /var/www/cgx-bingo
./deploy.sh
```

## Option 2: Manual Upload

1. **Zip your project:**
   ```bash
   npm run build
   zip -r cgx-bingo.zip . -x "node_modules/*" ".git/*" "*.log"
   ```

2. **Upload to your droplet** (using SCP, SFTP, or web interface)

3. **SSH to your droplet:**
   ```bash
   ssh root@YOUR_DROPLET_IP
   cd /var/www
   unzip cgx-bingo.zip -d cgx-bingo
   cd cgx-bingo
   chmod +x deploy.sh
   ./deploy.sh
   ```

## Option 3: Git Clone (If you have a repository)

```bash
ssh root@YOUR_DROPLET_IP
cd /var/www
git clone https://github.com/your-username/cgx-bingo.git
cd cgx-bingo
chmod +x deploy.sh
./deploy.sh
```

## After Deployment

Your app will be running on:
- **Direct access:** `http://YOUR_DROPLET_IP:8080`
- **With domain:** `http://your-domain.com` (after Nginx setup)

## Quick Commands

```bash
# Check if app is running
pm2 status

# View logs
pm2 logs cgx-bingo

# Restart app
pm2 restart cgx-bingo

# Stop app
pm2 stop cgx-bingo
```

## Firewall Setup (Important!)

```bash
# Allow necessary ports
ufw allow ssh
ufw allow 80
ufw allow 443
ufw allow 8080
ufw enable
```

## Need Help?

Check the full deployment guide: `DEPLOYMENT.md`

---

**Replace `YOUR_DROPLET_IP` with your actual DigitalOcean droplet IP address!** 