# Deployment Guide
## Smart Route Finder - Production Deployment

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Backend Deployment](#backend-deployment)
3. [Frontend Deployment](#frontend-deployment)
4. [Database Setup](#database-setup)
5. [Domain and SSL](#domain-and-ssl)
6. [Monitoring](#monitoring)

---

## 1. Prerequisites

### Required Accounts
- Cloud provider account (AWS/Azure/GCP/DigitalOcean)
- MongoDB Atlas account (or self-hosted MongoDB)
- Google Cloud Platform account (for Maps API)
- Domain name (optional but recommended)

### Required Tools
- Git
- SSH client
- Text editor

---

## 2. Backend Deployment

### Option A: Deploy on Ubuntu Server

**Step 1: Set up server**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python and pip
sudo apt install python3 python3-pip python3-venv -y

# Install Nginx
sudo apt install nginx -y

# Install MongoDB (if self-hosting)
sudo apt install mongodb -y
```

**Step 2: Clone repository**
```bash
cd /var/www
sudo git clone <your-repo-url> smart-route-finder
cd smart-route-finder/backend
```

**Step 3: Set up Python environment**
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn
```

**Step 4: Configure environment**
```bash
cp .env.example .env
nano .env
```

Add your configuration:
```env
GOOGLE_MAPS_API_KEY=your_actual_api_key
MONGODB_URI=mongodb://localhost:27017/
DATABASE_NAME=smart_route_finder
SECRET_KEY=your_production_secret_key
FLASK_ENV=production
PORT=5000
```

**Step 5: Set up Gunicorn**

Create `/etc/systemd/system/smart-route.service`:
```ini
[Unit]
Description=Smart Route Finder Flask App
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/smart-route-finder/backend
Environment="PATH=/var/www/smart-route-finder/backend/venv/bin"
ExecStart=/var/www/smart-route-finder/backend/venv/bin/gunicorn --workers 4 --bind 0.0.0.0:5000 app:app

[Install]
WantedBy=multi-user.target
```

Start service:
```bash
sudo systemctl start smart-route
sudo systemctl enable smart-route
sudo systemctl status smart-route
```

**Step 6: Configure Nginx**

Create `/etc/nginx/sites-available/smart-route`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        root /var/www/smart-route-finder/frontend;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/smart-route /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Option B: Deploy on Heroku

**Step 1: Create Procfile**
```
web: gunicorn app:app
```

**Step 2: Deploy**
```bash
heroku login
heroku create smart-route-finder
heroku config:set GOOGLE_MAPS_API_KEY=your_key
heroku config:set MONGODB_URI=your_mongodb_uri
git push heroku main
```

---

## 3. Frontend Deployment

### Option A: Static Hosting (Netlify/Vercel)

**Step 1: Update API configuration**

Edit `frontend/js/config.js`:
```javascript
const API_CONFIG = {
    BASE_URL: 'https://your-api-domain.com/api',
    GOOGLE_MAPS_API_KEY: 'your_google_maps_key'
};
```

**Step 2: Deploy to Netlify**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
cd frontend
netlify deploy --prod
```

### Option B: Same Server as Backend

Files are already served by Nginx configuration above.

---

## 4. Database Setup

### Option A: MongoDB Atlas (Recommended)

**Step 1: Create cluster**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Create database user
4. Whitelist IP addresses
5. Get connection string

**Step 2: Update backend .env**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
DATABASE_NAME=smart_route_finder
```

### Option B: Self-Hosted MongoDB

**Step 1: Install MongoDB**
```bash
sudo apt install mongodb -y
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

**Step 2: Secure MongoDB**
```bash
mongo
> use admin
> db.createUser({
    user: "admin",
    pwd: "strong_password",
    roles: ["root"]
})
```

**Step 3: Enable authentication**

Edit `/etc/mongodb.conf`:
```yaml
security:
  authorization: enabled
```

Restart:
```bash
sudo systemctl restart mongodb
```

---

## 5. Domain and SSL

### Set up SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

Update Nginx config will be automatic.

---

## 6. Monitoring

### Set up logging

**Backend logs**
```bash
# View Gunicorn logs
sudo journalctl -u smart-route -f

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Set up monitoring tools

**Option 1: PM2 (for Node.js-like process management)**
```bash
npm install -g pm2
pm2 start app.py --interpreter python3
pm2 startup
pm2 save
```

**Option 2: Uptime monitoring**
- Use services like UptimeRobot
- Set up health check endpoint monitoring

---

## 7. Backup Strategy

### Database Backups

**Automated MongoDB backup**
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="$MONGODB_URI" --out="/backups/mongo_$DATE"
```

Add to crontab:
```bash
0 2 * * * /path/to/backup.sh
```

---

## 8. Environment Variables

### Production Environment Variables

```env
# Google Maps API
GOOGLE_MAPS_API_KEY=your_production_api_key

# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/
DATABASE_NAME=smart_route_finder

# Flask
SECRET_KEY=generate_strong_random_key_here
FLASK_ENV=production
PORT=5000

# CORS (update with your domain)
CORS_ORIGINS=https://your-domain.com
```

---

## 9. Performance Optimization

### Backend Optimization
- Enable Gzip compression in Nginx
- Use caching for frequent API calls
- Optimize database queries with indexes
- Use connection pooling

### Frontend Optimization
- Minify CSS and JavaScript
- Compress images
- Enable browser caching
- Use CDN for static assets

---

## 10. Security Checklist

- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] MongoDB authentication enabled
- [ ] Firewall configured
- [ ] Rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] CORS properly configured
- [ ] Regular security updates
- [ ] Backup system in place
- [ ] Monitoring and alerts set up

---

## 11. Troubleshooting

### Common Issues

**Issue: Cannot connect to MongoDB**
- Check MongoDB is running
- Verify connection string
- Check firewall rules
- Verify IP whitelist (Atlas)

**Issue: API requests failing**
- Check CORS configuration
- Verify API endpoint URLs
- Check server logs
- Verify Google Maps API key

**Issue: 502 Bad Gateway**
- Check Gunicorn is running
- Verify Nginx configuration
- Check application logs

---

## 12. Maintenance

### Regular Tasks
- Monitor server resources
- Check application logs
- Review error rates
- Update dependencies
- Backup verification
- Security patches

### Monthly Tasks
- Review API usage and costs
- Database optimization
- Performance analysis
- Security audit

---

**Deployment Complete!**

Your Smart Route Finder application should now be live and accessible.
