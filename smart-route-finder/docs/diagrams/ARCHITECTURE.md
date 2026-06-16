# System Architecture
## Smart Route Finder - Architecture Documentation

---

## Table of Contents
1. [Overview](#overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Component Details](#component-details)
4. [Data Flow](#data-flow)
5. [Technology Stack](#technology-stack)
6. [Deployment Architecture](#deployment-architecture)

---

## 1. Overview

Smart Route Finder follows a **Three-Tier Architecture** pattern, separating concerns into:
- **Presentation Layer**: User interface and client-side logic
- **Application Layer**: Business logic and API services
- **Data Layer**: Database and data persistence

This architecture ensures:
- **Scalability**: Each layer can scale independently
- **Maintainability**: Clear separation of concerns
- **Security**: Layered security approach
- **Flexibility**: Easy to modify or replace components

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                           │
│                         (Frontend - Client)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   HTML5      │  │    CSS3      │  │ JavaScript   │              │
│  │   Pages      │  │   Styling    │  │   (ES6+)     │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                       │
│  ┌────────────────────────────────────────────────────┐             │
│  │         Google Maps JavaScript API                  │             │
│  │  - Map Rendering  - Markers  - Polylines           │             │
│  └────────────────────────────────────────────────────┘             │
│                                                                       │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            │ HTTPS/REST API
                            │ JSON Data Exchange
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        APPLICATION LAYER                             │
│                      (Backend - Flask Server)                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Flask Application                         │   │
│  │                                                              │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │   │
│  │  │ Auth Routes  │  │Route Routes  │  │History Routes│     │   │
│  │  │  /api/auth   │  │ /api/routes  │  │ /api/history │     │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘     │   │
│  │                                                              │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │   │
│  │  │Saved Routes  │  │   Models     │  │    Utils     │     │   │
│  │  │  /api/saved  │  │   Layer      │  │   Helpers    │     │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘     │   │
│  │                                                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                  Algorithm Engine                            │   │
│  │                                                              │   │
│  │  ┌──────────────────┐        ┌──────────────────┐          │   │
│  │  │    Dijkstra      │        │    A* Algorithm  │          │   │
│  │  │   Algorithm      │        │                  │          │   │
│  │  │ (Shortest Path)  │        │  (Fastest Path)  │          │   │
│  │  └──────────────────┘        └──────────────────┘          │   │
│  │                                                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              External API Integration                        │   │
│  │                                                              │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │   │
│  │  │  Directions  │  │  Geocoding   │  │   Routes     │     │   │
│  │  │     API      │  │     API      │  │     API      │     │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘     │   │
│  │                                                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            │ PyMongo Driver
                            │ BSON Protocol
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           DATA LAYER                                 │
│                      (MongoDB Database)                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │    users     │  │route_history │  │saved_routes  │              │
│  │  Collection  │  │  Collection  │  │  Collection  │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                       │
│  ┌────────────────────────────────────────────────────┐             │
│  │              Indexes & Optimization                 │             │
│  │  - Unique indexes on email, username               │             │
│  │  - Compound indexes for queries                    │             │
│  │  - TTL indexes for data retention                  │             │
│  └────────────────────────────────────────────────────┘             │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

                            ▲
                            │
                            │ External Services
                            │
                    ┌───────┴───────┐
                    │               │
            ┌───────▼──────┐ ┌─────▼──────┐
            │   Google     │ │   Cloud    │
            │   Maps API   │ │  Storage   │
            └──────────────┘ └────────────┘
```

---

## 3. Component Details

### 3.1 Presentation Layer

#### Frontend Components

**HTML Pages**
- `index.html`: Landing page with search interface
- `dashboard.html`: Main application dashboard
- `login.html` / `register.html`: Authentication pages
- `history.html`: Route history and saved routes
- `about.html`: Project information

**CSS Styling**
- `style.css`: Main stylesheet
- Dark theme design
- Responsive grid layouts
- CSS animations and transitions

**JavaScript Modules**
- `config.js`: Configuration and constants
- `api.js`: API communication layer
- `auth.js`: Authentication logic
- `dashboard.js`: Route display and map integration
- `history.js`: History management
- `main.js`: Home page functionality

**Google Maps Integration**
- Maps JavaScript API for rendering
- Directions Service for route calculation
- Geocoding Service for address conversion
- Traffic Layer for real-time data

---

### 3.2 Application Layer

#### Flask Application

**Core Components**

1. **app.py**: Main application entry point
   - Flask app initialization
   - CORS configuration
   - Blueprint registration
   - Error handlers

2. **Configuration** (`config/`)
   - `config.py`: Application settings
   - Environment variables
   - API keys management

3. **Models** (`models/`)
   - `database.py`: MongoDB connection
   - `user.py`: User model and operations
   - `route_history.py`: History model
   - `saved_routes.py`: Saved routes model

4. **Routes** (`routes/`)
   - `auth_routes.py`: Authentication endpoints
   - `route_routes.py`: Route search endpoints
   - `history_routes.py`: History management
   - `saved_routes.py`: Favorites management

5. **Algorithms** (`algorithms/`)
   - `dijkstra.py`: Dijkstra's algorithm
   - `astar.py`: A* algorithm
   - Graph construction and optimization

6. **Utilities** (`utils/`)
   - `maps_api.py`: Google Maps API wrapper
   - `route_optimizer.py`: Route analysis
   - Helper functions

#### API Endpoints

**Authentication**
```
POST   /api/auth/register      - Register new user
POST   /api/auth/login         - User login
GET    /api/auth/user/:id      - Get user details
PUT    /api/auth/preferences   - Update preferences
```

**Routes**
```
POST   /api/routes/search      - Search routes
POST   /api/routes/compare     - Compare routes
POST   /api/routes/optimize    - Optimize routes
GET    /api/routes/traffic/:id - Get traffic info
```

**History**
```
GET    /api/history/:userId           - Get history
DELETE /api/history/:userId/:id       - Delete entry
DELETE /api/history/:userId/clear     - Clear all
```

**Saved Routes**
```
POST   /api/saved                     - Save route
GET    /api/saved/:userId             - Get saved routes
PUT    /api/saved/:userId/:id         - Update route
DELETE /api/saved/:userId/:id         - Delete route
```

---

### 3.3 Data Layer

#### MongoDB Database

**Collections**

1. **users**
   - User credentials (hashed passwords)
   - Profile information
   - Preferences
   - Indexes: email (unique), username (unique)

2. **route_history**
   - Search history
   - Route details
   - Traffic information
   - Indexes: (user_id, created_at), created_at

3. **saved_routes**
   - Favorite routes
   - Custom names and notes
   - Usage tracking
   - Indexes: user_id, (user_id, last_used)

**Data Operations**
- CRUD operations via PyMongo
- Aggregation pipelines for analytics
- Indexing for query optimization
- Data validation and sanitization

---

## 4. Data Flow

### 4.1 Route Search Flow

```
1. User Input
   ↓
2. Frontend Validation
   ↓
3. API Request (POST /api/routes/search)
   ↓
4. Backend Processing
   ├─→ Geocode addresses (Google Geocoding API)
   ├─→ Fetch routes (Google Directions API)
   ├─→ Analyze traffic
   ├─→ Apply Dijkstra algorithm
   ├─→ Apply A* algorithm
   └─→ Generate recommendations
   ↓
5. Save to History (if user logged in)
   ↓
6. Return JSON Response
   ↓
7. Frontend Display
   ├─→ Render route cards
   ├─→ Display map
   └─→ Show recommendations
```

### 4.2 Authentication Flow

```
1. User Registration/Login
   ↓
2. Frontend Form Submission
   ↓
3. API Request (POST /api/auth/register or /login)
   ↓
4. Backend Processing
   ├─→ Validate input
   ├─→ Hash password (SHA-256)
   ├─→ Check database
   └─→ Generate token
   ↓
5. Store in Database
   ↓
6. Return Response with Token
   ↓
7. Frontend Storage
   ├─→ Save token (localStorage)
   └─→ Redirect to dashboard
```

### 4.3 Algorithm Processing Flow

```
1. Receive Route Data
   ↓
2. Build Graph Structure
   ├─→ Nodes: Waypoints
   └─→ Edges: Road segments with weights
   ↓
3. Dijkstra Processing
   ├─→ Weight: Distance (meters)
   ├─→ Find shortest path
   └─→ Return optimized route
   ↓
4. A* Processing
   ├─→ Weight: Duration (seconds)
   ├─→ Heuristic: Haversine distance
   ├─→ Find fastest path
   └─→ Return optimized route
   ↓
5. Compare Results
   ├─→ Identify fastest route
   ├─→ Identify shortest route
   └─→ Generate recommendations
```

---

## 5. Technology Stack

### 5.1 Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| HTML5 | - | Structure and markup |
| CSS3 | - | Styling and layout |
| JavaScript | ES6+ | Client-side logic |
| Google Maps API | v3 | Map visualization |
| Font Awesome | 6.4.0 | Icons |

### 5.2 Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.8+ | Programming language |
| Flask | 3.0.0 | Web framework |
| Flask-CORS | 4.0.0 | Cross-origin requests |
| PyMongo | 4.6.1 | MongoDB driver |
| Requests | 2.31.0 | HTTP library |
| python-dotenv | 1.0.0 | Environment variables |

### 5.3 Database

| Technology | Version | Purpose |
|------------|---------|---------|
| MongoDB | 4.4+ | NoSQL database |
| MongoDB Compass | - | Database GUI |

### 5.4 External APIs

| API | Purpose |
|-----|---------|
| Google Maps Directions API | Route calculation |
| Google Maps Geocoding API | Address conversion |
| Google Maps Routes API | Advanced routing |
| Google Maps JavaScript API | Map rendering |

---

## 6. Deployment Architecture

### 6.1 Development Environment

```
┌─────────────────────────────────────┐
│      Developer Machine              │
│                                     │
│  ┌──────────────┐  ┌─────────────┐ │
│  │   Frontend   │  │   Backend   │ │
│  │ localhost:   │  │ localhost:  │ │
│  │    8000      │  │    5000     │ │
│  └──────────────┘  └─────────────┘ │
│                                     │
│  ┌──────────────────────────────┐  │
│  │   MongoDB (Local)            │  │
│  │   localhost:27017            │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

### 6.2 Production Environment

```
┌─────────────────────────────────────────────────────────┐
│                    Cloud Infrastructure                  │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │              Load Balancer                      │    │
│  │              (HTTPS/SSL)                        │    │
│  └──────────────────┬─────────────────────────────┘    │
│                     │                                    │
│         ┌───────────┴───────────┐                       │
│         │                       │                       │
│  ┌──────▼──────┐        ┌──────▼──────┐               │
│  │   Web       │        │   Web       │               │
│  │   Server 1  │        │   Server 2  │               │
│  │   (Flask)   │        │   (Flask)   │               │
│  └──────┬──────┘        └──────┬──────┘               │
│         │                       │                       │
│         └───────────┬───────────┘                       │
│                     │                                    │
│              ┌──────▼──────┐                            │
│              │   MongoDB   │                            │
│              │   Cluster   │                            │
│              │  (Replica   │                            │
│              │    Set)     │                            │
│              └─────────────┘                            │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │         Static File CDN                         │    │
│  │         (Frontend Assets)                       │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### 6.3 Deployment Steps

**Backend Deployment**
1. Set up cloud server (AWS, Azure, GCP)
2. Install Python and dependencies
3. Configure environment variables
4. Set up MongoDB connection
5. Configure Gunicorn/uWSGI
6. Set up Nginx reverse proxy
7. Configure SSL certificate
8. Start application

**Frontend Deployment**
1. Build optimized assets
2. Upload to CDN or static hosting
3. Configure domain and DNS
4. Enable HTTPS
5. Update API endpoints

**Database Deployment**
1. Set up MongoDB Atlas or self-hosted cluster
2. Configure replica set
3. Set up backups
4. Configure security (authentication, encryption)
5. Create indexes

---

## 7. Security Architecture

### 7.1 Security Layers

**Frontend Security**
- Input validation
- XSS prevention
- CSRF protection
- Secure token storage

**Backend Security**
- Password hashing (SHA-256)
- API authentication
- Rate limiting
- Input sanitization
- SQL injection prevention

**Database Security**
- Authentication enabled
- Encrypted connections
- Role-based access control
- Regular backups

**Network Security**
- HTTPS/SSL encryption
- CORS configuration
- Firewall rules
- DDoS protection

---

## 8. Scalability Considerations

### 8.1 Horizontal Scaling

- Multiple Flask instances behind load balancer
- MongoDB replica set for read scaling
- CDN for static assets
- Caching layer (Redis) for frequent queries

### 8.2 Vertical Scaling

- Increase server resources (CPU, RAM)
- Optimize database queries
- Code optimization
- Algorithm efficiency improvements

---

## 9. Monitoring and Logging

### 9.1 Application Monitoring

- Request/response logging
- Error tracking
- Performance metrics
- API usage statistics

### 9.2 Infrastructure Monitoring

- Server health checks
- Database performance
- Network latency
- Resource utilization

---

**End of Architecture Documentation**
