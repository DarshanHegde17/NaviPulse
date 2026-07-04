# Smart Route Finder with Live Traffic

An advanced navigation system that helps users find the most efficient routes between locations using real-time traffic data, Google Maps API, and intelligent algorithms (Dijkstra & A*).

## 🎯 Project Overview
Smart Route Finder is a web-based application that provides:
- Multiple route alternatives between source and destination
- Real-time traffic information and delay predictions
- AI-powered route optimization using Dijkstra and A* algorithms
- Interactive map visualization
- Route history and favorites management
- 


## 🚀 Features
### Core Features
1. **Multi-Route Search**
   - Find multiple routes between any two locations
   - Support for different travel modes (Driving, Walking, Bicycling, Transit)
   - Real-time route calculation

2. **Live Traffic Integration**
   - Real-time traffic status (Low, Medium, Heavy)
   - Traffic delay estimation
   - Dynamic route recommendations based on current conditions

3. **Algorithm-Based Optimization**
   - **Dijkstra's Algorithm**: Finds shortest path by distance
   - **A* Algorithm**: Finds fastest path considering traffic
   - Intelligent route comparison and recommendations

4. **Interactive Map Visualization**
   - Google Maps integration
   - Visual route display with polylines
   - Source and destination markers
   - Zoom and pan controls

5. **User Management**
   - User registration and authentication
   - Personalized dashboard
   - Route search history
   - Save favorite routes

6. **Route History**
   - Track all previous searches
   - Quick repeat searches
   - Filter and search history

## 🛠️ Technology Stack

### Frontend
- **HTML5**: Structure and semantic markup
- **CSS3**: Modern styling with CSS Grid and Flexbox
- **JavaScript (ES6+)**: Interactive functionality
- **Google Maps JavaScript API**: Map visualization

### Backend
- **Python 3.8+**: Core programming language
- **Flask**: Web framework for REST APIs
- **PyMongo**: MongoDB driver
- **Requests**: HTTP library for API calls

### Database
- **MongoDB**: NoSQL database for flexible data storage
- Collections: users, route_history, saved_routes

### APIs
- **Google Maps Directions API**: Route calculation
- **Google Maps Geocoding API**: Address to coordinates conversion
- **Google Maps Routes API**: Advanced routing features

### Algorithms
- **Dijkstra's Algorithm**: Shortest path calculation
- **A* Algorithm**: Fastest path with heuristics

## 📁 Project Structure

```
smart-route-finder/
├── backend/
│   ├── algorithms/
│   │   ├── dijkstra.py          # Dijkstra's algorithm implementation
│   │   ├── astar.py             # A* algorithm implementation
│   │   └── __init__.py
│   ├── config/
│   │   ├── config.py            # Configuration settings
│   │   └── __init__.py
│   ├── models/
│   │   ├── database.py          # MongoDB connection
│   │   ├── user.py              # User model
│   │   ├── route_history.py    # Route history model
│   │   ├── saved_routes.py     # Saved routes model
│   │   └── __init__.py
│   ├── routes/
│   │   ├── auth_routes.py       # Authentication endpoints
│   │   ├── route_routes.py      # Route search endpoints
│   │   ├── history_routes.py    # History endpoints
│   │   ├── saved_routes.py      # Saved routes endpoints
│   │   └── __init__.py
│   ├── utils/
│   │   ├── maps_api.py          # Google Maps API wrapper
│   │   ├── route_optimizer.py   # Route optimization logic
│   │   └── __init__.py
│   ├── app.py                   # Flask application entry point
│   ├── requirements.txt         # Python dependencies
│   ├── .env.example            # Environment variables template
│   └── .gitignore
├── frontend/
│   ├── css/
│   │   └── style.css           # Main stylesheet
│   ├── js/
│   │   ├── config.js           # Frontend configuration
│   │   ├── api.js              # API helper functions
│   │   ├── auth.js             # Authentication logic
│   │   ├── main.js             # Home page logic
│   │   ├── dashboard.js        # Dashboard functionality
│   │   └── history.js          # History page logic
│   ├── pages/
│   │   ├── login.html          # Login page
│   │   ├── register.html       # Registration page
│   │   ├── dashboard.html      # Main dashboard
│   │   ├── history.html        # Route history
│   │   └── about.html          # About project
│   ├── images/                 # Image assets
│   └── index.html              # Home page
├── docs/
│   ├── documentation/
│   │   └── PROJECT_REPORT.md   # Detailed project report
│   └── diagrams/
│       ├── ER_DIAGRAM.md       # Database ER diagram
│       ├── ARCHITECTURE.md     # System architecture
│       └── API_FLOW.md         # API flow diagrams
├── database/
│   └── schema.md               # Database schema documentation
└── README.md                   # This file
```

## 🔧 Installation & Setup

### Prerequisites
- Python 3.8 or higher
- MongoDB 4.4 or higher
- Google Maps API Key
- Modern web browser

### Backend Setup

1. **Clone the repository**
```bash
cd smart-route-finder/backend
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` file:
```env
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
MONGODB_URI=mongodb://localhost:27017/
DATABASE_NAME=smart_route_finder
SECRET_KEY=your_secret_key_here
FLASK_ENV=development
PORT=5000
```

5. **Start MongoDB**
```bash
mongod
```

6. **Run the Flask application**
```bash
python app.py
```

Server will start at `http://localhost:5000`

### Frontend Setup

1. **Configure API settings**

Edit `frontend/js/config.js`:
```javascript
const API_CONFIG = {
    BASE_URL: 'http://localhost:5000/api',
    GOOGLE_MAPS_API_KEY: 'YOUR_GOOGLE_MAPS_API_KEY'
};
```

2. **Serve frontend files**

Using Python's built-in server:
```bash
cd frontend
python -m http.server 8000
```

Or use any static file server like Live Server (VS Code extension)

3. **Access the application**

Open browser and navigate to:
```
http://localhost:8000
```

## 🔑 Getting Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Directions API
   - Geocoding API
   - Routes API
4. Create credentials (API Key)
5. Copy the API key to your configuration files

## 📊 Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  username: String,
  email: String (unique),
  password: String (hashed),
  created_at: DateTime,
  updated_at: DateTime,
  preferences: {
    default_travel_mode: String,
    avoid_tolls: Boolean,
    avoid_highways: Boolean
  }
}
```

### Route History Collection
```javascript
{
  _id: ObjectId,
  user_id: String,
  source: String,
  destination: String,
  source_coords: { lat: Number, lng: Number },
  destination_coords: { lat: Number, lng: Number },
  route_name: String,
  distance: Number (meters),
  duration: Number (seconds),
  traffic_status: String,
  delay_time: Number (seconds),
  travel_mode: String,
  route_type: String,
  created_at: DateTime
}
```

### Saved Routes Collection
```javascript
{
  _id: ObjectId,
  user_id: String,
  route_name: String,
  source: String,
  destination: String,
  source_coords: { lat: Number, lng: Number },
  destination_coords: { lat: Number, lng: Number },
  distance: Number,
  duration: Number,
  travel_mode: String,
  notes: String,
  created_at: DateTime,
  last_used: DateTime
}
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/user/:id` - Get user details
- `PUT /api/auth/preferences/:id` - Update preferences

### Routes
- `POST /api/routes/search` - Search for routes
- `POST /api/routes/compare` - Compare routes
- `POST /api/routes/optimize` - Optimize routes
- `GET /api/routes/traffic/:id` - Get traffic info

### History
- `GET /api/history/:userId` - Get user history
- `DELETE /api/history/:userId/:historyId` - Delete history entry
- `DELETE /api/history/:userId/clear` - Clear all history

### Saved Routes
- `POST /api/saved` - Save a route
- `GET /api/saved/:userId` - Get saved routes
- `PUT /api/saved/:userId/:routeId` - Update route
- `DELETE /api/saved/:userId/:routeId` - Delete saved route

## 🧮 Algorithm Implementation

### Dijkstra's Algorithm
- Used for finding shortest path by distance
- Guarantees optimal solution
- Time Complexity: O((V + E) log V)

### A* Algorithm
- Used for finding fastest path considering traffic
- Uses heuristic function (Haversine distance)
- More efficient than Dijkstra for large graphs
- Time Complexity: O(E log V)

## 🎨 UI Features

- **Dark Theme**: Modern dark UI for better user experience
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Animated Loading**: Smooth loading indicators
- **Interactive Cards**: Hover effects and transitions
- **Color-Coded Traffic**: Visual traffic status indicators

## 🚀 Future Enhancements

1. **Voice Search**: Voice-based route input
2. **AI Traffic Prediction**: Machine learning for traffic forecasting
3. **Weather Integration**: Weather impact on travel time
4. **Multi-Stop Routes**: Plan routes with multiple waypoints
5. **Nearby POI**: Find fuel stations, restaurants, etc.
6. **Emergency Mode**: Fastest route for emergencies
7. **Mobile App**: Native iOS and Android applications
8. **Offline Maps**: Cached maps for offline use
9. **Route Sharing**: Share routes with other users
10. **Carbon Footprint**: Calculate environmental impact

## 📝 Testing

### Manual Testing
1. Test user registration and login
2. Search routes with different travel modes
3. Verify traffic information accuracy
4. Test route saving and history
5. Check map visualization

### API Testing
Use tools like Postman or curl:
```bash
# Health check
curl http://localhost:5000/api/health

# Search routes
curl -X POST http://localhost:5000/api/routes/search \
  -H "Content-Type: application/json" \
  -d '{"origin":"New York","destination":"Boston","travel_mode":"driving"}'
```

## 🐛 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod`
- Check connection string in `.env`

### Google Maps API Error
- Verify API key is correct
- Ensure required APIs are enabled
- Check API quota limits

### CORS Error
- Verify CORS_ORIGINS in `config.py`
- Check frontend is running on allowed origin

## 👥 Contributors

**MCA Final Year Project**
- Project Type: Web Application
- Domain: Navigation, GIS, Algorithms
- Year: 2026

## 📄 License

This project is created for educational purposes as part of MCA curriculum.

## 📞 Support

For issues and questions:
- Create an issue in the repository
- Contact: info@smartroute.com

## 🙏 Acknowledgments

- Google Maps Platform for mapping services
- MongoDB for database solution
- Flask community for excellent documentation
- Open source community for various libraries

---

**Made with ❤️ for MCA Final Year Project 2026**
