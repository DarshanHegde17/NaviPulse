# Quick Start Guide
## Get Smart Route Finder Running in 10 Minutes

---

## ⚡ Prerequisites

Before starting, ensure you have:
- [ ] Python 3.8+ installed
- [ ] MongoDB installed and running
- [ ] Google Maps API Key
- [ ] Internet connection

---

## 🚀 5-Step Setup

### Step 1: Get Google Maps API Key (2 minutes)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project
3. Enable these APIs:
   - Maps JavaScript API
   - Directions API
   - Geocoding API
4. Create API Key
5. Copy the key

### Step 2: Start MongoDB (1 minute)

**Windows**:
```cmd
net start MongoDB
```

**macOS**:
```bash
brew services start mongodb-community
```

**Linux**:
```bash
sudo systemctl start mongod
```

### Step 3: Setup Backend (3 minutes)

```bash
# Navigate to backend
cd smart-route-finder/backend

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Edit .env and add your Google Maps API key
# GOOGLE_MAPS_API_KEY=your_key_here

# Start server
python app.py
```

### Step 4: Setup Frontend (2 minutes)

**Open NEW terminal** (keep backend running)

```bash
# Navigate to frontend
cd smart-route-finder/frontend

# Edit js/config.js
# Replace YOUR_GOOGLE_MAPS_API_KEY with your actual key

# Edit pages/dashboard.html
# Replace YOUR_API_KEY in the Google Maps script tag

# Start frontend server
python -m http.server 8000
```

### Step 5: Open Browser (1 minute)

1. Open browser
2. Go to: `http://localhost:8000`
3. Try searching: "New York" to "Boston"
4. Done! 🎉

---

## 🎯 Quick Test

### Test Route Search

1. **Home Page**: Enter locations
   - Source: `Times Square, New York`
   - Destination: `Central Park, New York`
   - Mode: Driving
   - Click "Find Routes"

2. **View Results**:
   - See multiple routes
   - Check traffic status
   - View on map
   - Compare distances and times

3. **Create Account**:
   - Click "Login" → "Register"
   - Fill form and submit
   - Login with credentials

4. **Save Route**:
   - Search for a route
   - Click "Save" on any route
   - Check "History" page

---

## 📝 Configuration Files to Edit

### 1. Backend: `.env`
```env
GOOGLE_MAPS_API_KEY=your_actual_key_here
MONGODB_URI=mongodb://localhost:27017/
DATABASE_NAME=smart_route_finder
SECRET_KEY=generate_random_key
FLASK_ENV=development
PORT=5000
```

### 2. Frontend: `js/config.js`
```javascript
const API_CONFIG = {
    BASE_URL: 'http://localhost:5000/api',
    GOOGLE_MAPS_API_KEY: 'your_actual_key_here',
    // ...
};
```

### 3. Frontend: `pages/dashboard.html`
```html
<!-- Find this line and replace YOUR_API_KEY -->
<script async defer src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initMap"></script>
```

---

## ❗ Common Issues & Quick Fixes

### Issue: "Module not found"
```bash
pip install -r requirements.txt
```

### Issue: "MongoDB connection failed"
```bash
# Check if MongoDB is running
mongod --version
# Start MongoDB (see Step 2)
```

### Issue: "Port already in use"
```bash
# Use different port
python -m http.server 3000
```

### Issue: "Google Maps not loading"
- Double-check API key in all 3 locations
- Ensure APIs are enabled in Google Cloud
- Wait 2-3 minutes after creating API key

---

## 🎓 What's Next?

After successful setup:

1. **Explore Features**:
   - Try different travel modes
   - Save favorite routes
   - View history
   - Compare routes

2. **Read Documentation**:
   - `README.md` - Full documentation
   - `PROJECT_SUMMARY.md` - Project overview
   - `SETUP_GUIDE.md` - Detailed setup

3. **Customize**:
   - Modify UI colors in `css/style.css`
   - Add new features
   - Experiment with algorithms

4. **Deploy**:
   - See `DEPLOYMENT.md` for production setup

---

## 📚 Project Structure

```
smart-route-finder/
├── backend/              # Flask API
│   ├── algorithms/      # Dijkstra & A*
│   ├── models/          # Database models
│   ├── routes/          # API endpoints
│   └── app.py           # Main app
├── frontend/            # Web interface
│   ├── css/            # Styles
│   ├── js/             # JavaScript
│   └── pages/          # HTML pages
└── docs/               # Documentation
```

---

## 🔗 Important URLs

- **Frontend**: http://localhost:8000
- **Backend API**: http://localhost:5000
- **API Health**: http://localhost:5000/api/health
- **MongoDB**: mongodb://localhost:27017

---

## 🆘 Need Help?

1. Check `SETUP_GUIDE.md` for detailed instructions
2. See `README.md` for full documentation
3. Check browser console for errors (F12)
4. Check backend terminal for errors

---

## ✅ Verification Checklist

- [ ] Backend server running (port 5000)
- [ ] Frontend server running (port 8000)
- [ ] MongoDB running
- [ ] Can access home page
- [ ] Can search routes
- [ ] Routes display on map
- [ ] Can register/login
- [ ] Can save routes

---

## 🎉 Success!

If all checks pass, you're ready to use Smart Route Finder!

**Enjoy exploring the application! 🚀**

---

## 📞 Quick Reference

### Start Backend
```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python app.py
```

### Start Frontend
```bash
cd frontend
python -m http.server 8000
```

### Start MongoDB
```bash
# Windows
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

---

**Total Setup Time**: ~10 minutes  
**Difficulty**: Easy  
**Prerequisites**: Python, MongoDB, API Key

**Happy Routing! 🗺️**
