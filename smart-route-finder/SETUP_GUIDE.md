# Setup Guide - Smart Route Finder
## Step-by-Step Installation Instructions

---

## 📋 Table of Contents
1. [System Requirements](#system-requirements)
2. [Getting Google Maps API Key](#getting-google-maps-api-key)
3. [MongoDB Setup](#mongodb-setup)
4. [Backend Setup](#backend-setup)
5. [Frontend Setup](#frontend-setup)
6. [Testing the Application](#testing-the-application)
7. [Troubleshooting](#troubleshooting)

---

## 1. System Requirements

### Minimum Requirements
- **Operating System**: Windows 10/11, macOS 10.14+, or Linux (Ubuntu 20.04+)
- **Processor**: Intel Core i3 or equivalent
- **RAM**: 4 GB
- **Storage**: 5 GB free space
- **Internet**: Broadband connection

### Recommended Requirements
- **Processor**: Intel Core i5 or better
- **RAM**: 8 GB or more
- **Storage**: 10 GB free space

### Software Requirements
- **Python**: 3.8 or higher
- **MongoDB**: 4.4 or higher
- **Web Browser**: Chrome, Firefox, Safari, or Edge (latest version)
- **Text Editor**: VS Code, Sublime Text, or any code editor

---

## 2. Getting Google Maps API Key

### Step 1: Create Google Cloud Account
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Accept terms of service if prompted

### Step 2: Create New Project
1. Click on project dropdown (top left)
2. Click "New Project"
3. Enter project name: "Smart Route Finder"
4. Click "Create"

### Step 3: Enable Required APIs
1. Go to "APIs & Services" > "Library"
2. Search and enable the following APIs:
   - **Maps JavaScript API**
   - **Directions API**
   - **Geocoding API**
   - **Routes API**

### Step 4: Create API Key
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the API key (you'll need this later)
4. Click "Restrict Key" (recommended)
5. Under "API restrictions", select:
   - Maps JavaScript API
   - Directions API
   - Geocoding API
   - Routes API
6. Click "Save"

### Step 5: Enable Billing (Required)
1. Go to "Billing"
2. Link a billing account
3. Note: Google provides $200 free credit monthly

**⚠️ Important**: Keep your API key secure and never commit it to public repositories!

---

## 3. MongoDB Setup

### Option A: Install MongoDB Locally (Windows)

**Step 1: Download MongoDB**
1. Go to [MongoDB Download Center](https://www.mongodb.com/try/download/community)
2. Select:
   - Version: Latest
   - Platform: Windows
   - Package: MSI
3. Click "Download"

**Step 2: Install MongoDB**
1. Run the downloaded MSI file
2. Choose "Complete" installation
3. Install MongoDB as a Service (check the box)
4. Install MongoDB Compass (GUI tool)
5. Click "Install"

**Step 3: Verify Installation**
```cmd
mongod --version
```

**Step 4: Start MongoDB**
```cmd
net start MongoDB
```

### Option B: Install MongoDB Locally (macOS)

**Using Homebrew**:
```bash
# Install Homebrew if not installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community
```

### Option C: Install MongoDB Locally (Linux/Ubuntu)

```bash
# Import MongoDB public key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Create list file
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Update packages
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Option D: Use MongoDB Atlas (Cloud - Recommended for Beginners)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Click "Try Free"
3. Create account
4. Create a free cluster (M0)
5. Create database user
6. Whitelist IP address (0.0.0.0/0 for development)
7. Get connection string
8. Replace `<password>` with your password

---

## 4. Backend Setup

### Step 1: Install Python

**Windows**:
1. Download from [python.org](https://www.python.org/downloads/)
2. Run installer
3. ✅ Check "Add Python to PATH"
4. Click "Install Now"

**macOS**:
```bash
brew install python3
```

**Linux**:
```bash
sudo apt update
sudo apt install python3 python3-pip python3-venv
```

### Step 2: Verify Python Installation
```bash
python --version  # or python3 --version
pip --version     # or pip3 --version
```

### Step 3: Navigate to Backend Directory
```bash
cd smart-route-finder/backend
```

### Step 4: Create Virtual Environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

You should see `(venv)` in your terminal prompt.

### Step 5: Install Dependencies
```bash
pip install -r requirements.txt
```

This will install:
- Flask
- Flask-CORS
- pymongo
- requests
- python-dotenv
- And other dependencies

### Step 6: Configure Environment Variables
```bash
# Copy example file
cp .env.example .env

# Edit .env file
```

**Windows**: Use Notepad
```cmd
notepad .env
```

**macOS/Linux**: Use nano or vim
```bash
nano .env
```

**Add your configuration**:
```env
GOOGLE_MAPS_API_KEY=your_actual_google_maps_api_key_here
MONGODB_URI=mongodb://localhost:27017/
DATABASE_NAME=smart_route_finder
SECRET_KEY=your_random_secret_key_here
FLASK_ENV=development
PORT=5000
```

**To generate a secret key**:
```python
python -c "import secrets; print(secrets.token_hex(32))"
```

### Step 7: Start Backend Server
```bash
python app.py
```

You should see:
```
==================================================
🚀 Smart Route Finder API Server
==================================================
Environment: development
Port: 5000
Debug: True
==================================================

✓ Connected to MongoDB: smart_route_finder
✓ Database indexes created
 * Running on http://0.0.0.0:5000
```

**Keep this terminal open!**

---

## 5. Frontend Setup

### Step 1: Open New Terminal

Keep the backend terminal running and open a new terminal.

### Step 2: Navigate to Frontend Directory
```bash
cd smart-route-finder/frontend
```

### Step 3: Configure API Settings

Edit `js/config.js`:

**Windows**:
```cmd
notepad js\config.js
```

**macOS/Linux**:
```bash
nano js/config.js
```

**Update the configuration**:
```javascript
const API_CONFIG = {
    BASE_URL: 'http://localhost:5000/api',
    GOOGLE_MAPS_API_KEY: 'your_actual_google_maps_api_key_here',
    // ... rest of config
};
```

### Step 4: Update Dashboard Google Maps Script

Edit `pages/dashboard.html`:

Find this line:
```html
<script async defer src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initMap"></script>
```

Replace `YOUR_API_KEY` with your actual Google Maps API key.

### Step 5: Start Frontend Server

**Option A: Using Python (Recommended)**
```bash
python -m http.server 8000
```

**Option B: Using Node.js (if installed)**
```bash
npx http-server -p 8000
```

**Option C: Using VS Code Live Server**
1. Install "Live Server" extension
2. Right-click on `index.html`
3. Select "Open with Live Server"

You should see:
```
Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
```

---

## 6. Testing the Application

### Step 1: Open Browser

Navigate to:
```
http://localhost:8000
```

### Step 2: Test Home Page

1. You should see the Smart Route Finder home page
2. Try entering:
   - **Source**: "New York, NY"
   - **Destination**: "Boston, MA"
3. Click "Find Routes"

### Step 3: Register Account

1. Click "Login" in navigation
2. Click "Register here"
3. Fill in:
   - Username: testuser
   - Email: test@example.com
   - Password: Test123!
   - Confirm Password: Test123!
4. Click "Register"

### Step 4: Login

1. Use the credentials you just created
2. Click "Login"
3. You should be redirected to dashboard

### Step 5: Search Routes

1. Enter source and destination
2. Select travel mode
3. Click "Find Routes"
4. Wait for results (2-5 seconds)
5. View multiple routes with:
   - Distance
   - Duration
   - Traffic status
   - Recommendations

### Step 6: Test Other Features

- View route on map
- Save a route
- Check history page
- View saved routes

---

## 7. Troubleshooting

### Problem: "Module not found" error

**Solution**:
```bash
# Make sure virtual environment is activated
# Reinstall dependencies
pip install -r requirements.txt
```

### Problem: "MongoDB connection failed"

**Solution**:
```bash
# Check if MongoDB is running
# Windows
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Verify connection
mongo --eval "db.version()"
```

### Problem: "Google Maps API error"

**Solutions**:
1. Verify API key is correct
2. Check APIs are enabled in Google Cloud Console
3. Ensure billing is enabled
4. Check API key restrictions
5. Wait a few minutes after creating key

### Problem: "CORS error" in browser console

**Solution**:
- Ensure backend is running
- Check CORS_ORIGINS in `backend/config/config.py`
- Restart backend server

### Problem: "Port already in use"

**Solution**:
```bash
# Find process using port
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5000 | xargs kill -9

# Or use different port
python app.py --port 5001
```

### Problem: Routes not displaying

**Checklist**:
- [ ] Backend server is running
- [ ] Frontend server is running
- [ ] Google Maps API key is configured
- [ ] MongoDB is running
- [ ] Check browser console for errors
- [ ] Check backend terminal for errors

### Problem: "Invalid API key" error

**Solution**:
1. Double-check API key in both:
   - `backend/.env`
   - `frontend/js/config.js`
   - `frontend/pages/dashboard.html`
2. Ensure no extra spaces
3. Regenerate API key if needed

---

## 8. Verification Checklist

Before considering setup complete, verify:

- [ ] Backend server starts without errors
- [ ] Frontend loads in browser
- [ ] MongoDB connection successful
- [ ] Can register new user
- [ ] Can login successfully
- [ ] Can search for routes
- [ ] Routes display on map
- [ ] Can save routes
- [ ] Can view history
- [ ] No console errors

---

## 9. Next Steps

After successful setup:

1. **Explore Features**: Try all functionality
2. **Read Documentation**: Check README.md and other docs
3. **Customize**: Modify UI, add features
4. **Deploy**: Follow DEPLOYMENT.md for production
5. **Learn**: Study algorithm implementations

---

## 10. Getting Help

If you encounter issues:

1. **Check Documentation**: Read all .md files in docs/
2. **Console Logs**: Check browser and terminal for errors
3. **Google Search**: Search for specific error messages
4. **Stack Overflow**: Search for similar issues
5. **GitHub Issues**: Create issue with details

---

## 11. Useful Commands

### Backend Commands
```bash
# Activate virtual environment
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows

# Install new package
pip install package_name

# Update requirements.txt
pip freeze > requirements.txt

# Run Flask app
python app.py

# Deactivate virtual environment
deactivate
```

### MongoDB Commands
```bash
# Start MongoDB
mongod

# Connect to MongoDB shell
mongo

# Show databases
show dbs

# Use database
use smart_route_finder

# Show collections
show collections

# Query users
db.users.find()
```

### Frontend Commands
```bash
# Start server
python -m http.server 8000

# Different port
python -m http.server 3000
```

---

## 12. Development Tips

1. **Use MongoDB Compass**: Visual interface for database
2. **Use Postman**: Test API endpoints
3. **Browser DevTools**: Debug frontend issues
4. **VS Code Extensions**:
   - Python
   - MongoDB for VS Code
   - Live Server
   - Prettier

---

**Setup Complete! 🎉**

You're now ready to use Smart Route Finder!

For more information, see:
- README.md - Main documentation
- PROJECT_SUMMARY.md - Project overview
- DEPLOYMENT.md - Production deployment

**Happy Coding! 🚀**
