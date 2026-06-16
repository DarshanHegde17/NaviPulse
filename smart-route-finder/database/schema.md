# Database Schema Documentation
## Smart Route Finder - MongoDB Collections

---

## Collections Overview

The Smart Route Finder database consists of three main collections:
1. **users** - User accounts and preferences
2. **route_history** - Route search history
3. **saved_routes** - User's favorite routes

---

## 1. Users Collection

### Purpose
Store user account information, credentials, and preferences.

### Schema

```javascript
{
  _id: ObjectId,                    // Primary key (auto-generated)
  username: String,                 // Unique username
  email: String,                    // Unique email address
  password: String,                 // Hashed password (SHA-256)
  created_at: ISODate,             // Account creation timestamp
  updated_at: ISODate,             // Last update timestamp
  preferences: {                    // User preferences object
    default_travel_mode: String,   // Default: "DRIVE"
    avoid_tolls: Boolean,          // Default: false
    avoid_highways: Boolean        // Default: false
  }
}
```

### Indexes

```javascript
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "username": 1 }, { unique: true })
```

### Sample Document

```json
{
  "_id": ObjectId("6475a1b2c3d4e5f6a7b8c9d0"),
  "username": "john_doe",
  "email": "john@example.com",
  "password": "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
  "created_at": ISODate("2026-05-23T10:00:00Z"),
  "updated_at": ISODate("2026-05-23T10:00:00Z"),
  "preferences": {
    "default_travel_mode": "DRIVE",
    "avoid_tolls": false,
    "avoid_highways": false
  }
}
```

---

## 2. Route History Collection

### Purpose
Track all route searches performed by users for history and analytics.

### Schema

```javascript
{
  _id: ObjectId,                    // Primary key
  user_id: String,                  // Reference to users._id
  source: String,                   // Starting location address
  destination: String,              // Ending location address
  source_coords: {                  // Source coordinates
    lat: Number,                    // Latitude
    lng: Number                     // Longitude
  },
  destination_coords: {             // Destination coordinates
    lat: Number,                    // Latitude
    lng: Number                     // Longitude
  },
  route_name: String,               // Route identifier
  distance: Number,                 // Distance in meters
  duration: Number,                 // Duration in seconds
  traffic_status: String,           // "Low", "Medium", or "Heavy"
  delay_time: Number,               // Traffic delay in seconds
  travel_mode: String,              // "driving", "walking", etc.
  route_type: String,               // "fastest" or "shortest"
  created_at: ISODate              // Search timestamp
}
```

### Indexes

```javascript
db.route_history.createIndex({ "user_id": 1, "created_at": -1 })
db.route_history.createIndex({ "created_at": -1 })
```

### Sample Document

```json
{
  "_id": ObjectId("6475a1b2c3d4e5f6a7b8c9d1"),
  "user_id": "6475a1b2c3d4e5f6a7b8c9d0",
  "source": "Times Square, New York, NY",
  "destination": "Central Park, New York, NY",
  "source_coords": {
    "lat": 40.7580,
    "lng": -73.9855
  },
  "destination_coords": {
    "lat": 40.7829,
    "lng": -73.9654
  },
  "route_name": "Route 1",
  "distance": 3200,
  "duration": 720,
  "traffic_status": "Medium",
  "delay_time": 120,
  "travel_mode": "driving",
  "route_type": "fastest",
  "created_at": ISODate("2026-05-23T14:30:00Z")
}
```

---

## 3. Saved Routes Collection

### Purpose
Store user's favorite or frequently used routes for quick access.

### Schema

```javascript
{
  _id: ObjectId,                    // Primary key
  user_id: String,                  // Reference to users._id
  route_name: String,               // Custom route name
  source: String,                   // Starting location
  destination: String,              // Ending location
  source_coords: {                  // Source coordinates
    lat: Number,
    lng: Number
  },
  destination_coords: {             // Destination coordinates
    lat: Number,
    lng: Number
  },
  distance: Number,                 // Distance in meters
  duration: Number,                 // Duration in seconds
  travel_mode: String,              // Travel mode
  notes: String,                    // User notes (optional)
  created_at: ISODate,             // When saved
  last_used: ISODate               // Last accessed
}
```

### Indexes

```javascript
db.saved_routes.createIndex({ "user_id": 1 })
db.saved_routes.createIndex({ "user_id": 1, "last_used": -1 })
```

### Sample Document

```json
{
  "_id": ObjectId("6475a1b2c3d4e5f6a7b8c9d2"),
  "user_id": "6475a1b2c3d4e5f6a7b8c9d0",
  "route_name": "Home to Office",
  "source": "123 Main Street, Brooklyn, NY",
  "destination": "456 Work Avenue, Manhattan, NY",
  "source_coords": {
    "lat": 40.6782,
    "lng": -73.9442
  },
  "destination_coords": {
    "lat": 40.7589,
    "lng": -73.9851
  },
  "distance": 12500,
  "duration": 1800,
  "travel_mode": "driving",
  "notes": "Best route during morning rush hour",
  "created_at": ISODate("2026-05-01T08:00:00Z"),
  "last_used": ISODate("2026-05-23T07:45:00Z")
}
```

---

## Data Types Reference

| Type | Description | Example |
|------|-------------|---------|
| ObjectId | MongoDB unique identifier | ObjectId("...") |
| String | Text data | "New York" |
| Number | Numeric values | 1234.56 |
| Boolean | True/false | true, false |
| ISODate | Date and time | ISODate("2026-05-23T10:00:00Z") |
| Object | Nested document | { lat: 40.7, lng: -73.9 } |

---

## Validation Rules

### Users Collection
- `email`: Must be unique, valid email format
- `username`: Must be unique, 3-30 characters
- `password`: Must be hashed before storage
- `preferences.default_travel_mode`: Must be valid travel mode

### Route History Collection
- `user_id`: Must reference existing user
- `distance`: Must be positive number
- `duration`: Must be positive number
- `traffic_status`: Must be "Low", "Medium", or "Heavy"
- `travel_mode`: Must be valid mode

### Saved Routes Collection
- `user_id`: Must reference existing user
- `route_name`: Required, max 100 characters
- `distance`: Must be positive number
- `duration`: Must be positive number

---

## Query Examples

### Find user by email
```javascript
db.users.findOne({ email: "john@example.com" })
```

### Get user's recent history (last 20)
```javascript
db.route_history.find({ user_id: "6475a1b2c3d4e5f6a7b8c9d0" })
  .sort({ created_at: -1 })
  .limit(20)
```

### Get user's saved routes
```javascript
db.saved_routes.find({ user_id: "6475a1b2c3d4e5f6a7b8c9d0" })
  .sort({ last_used: -1 })
```

### Delete old history (older than 90 days)
```javascript
const ninetyDaysAgo = new Date(Date.now() - 90*24*60*60*1000);
db.route_history.deleteMany({ created_at: { $lt: ninetyDaysAgo } })
```

### Update saved route last used
```javascript
db.saved_routes.updateOne(
  { _id: ObjectId("6475a1b2c3d4e5f6a7b8c9d2") },
  { $set: { last_used: new Date() } }
)
```

### Count routes by traffic status
```javascript
db.route_history.aggregate([
  { $group: { _id: "$traffic_status", count: { $sum: 1 } } }
])
```

---

## Backup and Maintenance

### Backup Command
```bash
mongodump --uri="mongodb://localhost:27017/smart_route_finder" --out=/backup/
```

### Restore Command
```bash
mongorestore --uri="mongodb://localhost:27017/smart_route_finder" /backup/smart_route_finder/
```

### Index Maintenance
```javascript
// Rebuild indexes
db.users.reIndex()
db.route_history.reIndex()
db.saved_routes.reIndex()

// Check index usage
db.route_history.aggregate([{ $indexStats: {} }])
```

---

**End of Schema Documentation**
