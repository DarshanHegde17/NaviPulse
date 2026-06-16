# Entity-Relationship Diagram
## Smart Route Finder Database Design

---

## ER Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USERS                                    │
├─────────────────────────────────────────────────────────────────┤
│ PK  _id              : ObjectId                                  │
│     username         : String (unique)                           │
│     email            : String (unique)                           │
│     password         : String (hashed)                           │
│     created_at       : DateTime                                  │
│     updated_at       : DateTime                                  │
│     preferences      : Object {                                  │
│         default_travel_mode : String                             │
│         avoid_tolls         : Boolean                            │
│         avoid_highways      : Boolean                            │
│     }                                                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 1
                              │
                              │ has
                              │
                              │ *
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ROUTE_HISTORY                               │
├─────────────────────────────────────────────────────────────────┤
│ PK  _id                  : ObjectId                              │
│ FK  user_id              : String                                │
│     source               : String                                │
│     destination          : String                                │
│     source_coords        : Object {                              │
│         lat : Number                                             │
│         lng : Number                                             │
│     }                                                            │
│     destination_coords   : Object {                              │
│         lat : Number                                             │
│         lng : Number                                             │
│     }                                                            │
│     route_name           : String                                │
│     distance             : Number (meters)                       │
│     duration             : Number (seconds)                      │
│     traffic_status       : String (Low/Medium/Heavy)             │
│     delay_time           : Number (seconds)                      │
│     travel_mode          : String (driving/walking/etc)          │
│     route_type           : String (fastest/shortest)             │
│     created_at           : DateTime                              │
└─────────────────────────────────────────────────────────────────┘

                              │
                              │ 1
                              │
                              │ saves
                              │
                              │ *
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SAVED_ROUTES                                │
├─────────────────────────────────────────────────────────────────┤
│ PK  _id                  : ObjectId                              │
│ FK  user_id              : String                                │
│     route_name           : String                                │
│     source               : String                                │
│     destination          : String                                │
│     source_coords        : Object {                              │
│         lat : Number                                             │
│         lng : Number                                             │
│     }                                                            │
│     destination_coords   : Object {                              │
│         lat : Number                                             │
│         lng : Number                                             │
│     }                                                            │
│     distance             : Number (meters)                       │
│     duration             : Number (seconds)                      │
│     travel_mode          : String                                │
│     notes                : String                                │
│     created_at           : DateTime                              │
│     last_used            : DateTime                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Relationships

### 1. User → Route History (One-to-Many)
- **Cardinality**: 1:N
- **Description**: One user can have multiple route search history entries
- **Foreign Key**: `user_id` in `route_history` references `_id` in `users`
- **Cascade**: Delete user → Delete all history entries

### 2. User → Saved Routes (One-to-Many)
- **Cardinality**: 1:N
- **Description**: One user can save multiple favorite routes
- **Foreign Key**: `user_id` in `saved_routes` references `_id` in `users`
- **Cascade**: Delete user → Delete all saved routes

---

## Entity Descriptions

### USERS Entity

**Purpose**: Store user account information and preferences

**Attributes**:
- `_id` (PK): Unique identifier (MongoDB ObjectId)
- `username`: User's display name (unique, indexed)
- `email`: User's email address (unique, indexed)
- `password`: Hashed password (SHA-256)
- `created_at`: Account creation timestamp
- `updated_at`: Last profile update timestamp
- `preferences`: User preferences object
  - `default_travel_mode`: Preferred travel mode
  - `avoid_tolls`: Whether to avoid toll roads
  - `avoid_highways`: Whether to avoid highways

**Constraints**:
- `username` must be unique
- `email` must be unique and valid format
- `password` must be hashed before storage

**Indexes**:
- Primary: `_id`
- Unique: `email`, `username`

---

### ROUTE_HISTORY Entity

**Purpose**: Track user's route search history

**Attributes**:
- `_id` (PK): Unique identifier
- `user_id` (FK): Reference to user
- `source`: Starting location address
- `destination`: Ending location address
- `source_coords`: Source coordinates (lat, lng)
- `destination_coords`: Destination coordinates (lat, lng)
- `route_name`: Name/identifier of the route
- `distance`: Total distance in meters
- `duration`: Total duration in seconds
- `traffic_status`: Current traffic level
- `delay_time`: Traffic delay in seconds
- `travel_mode`: Mode of transportation
- `route_type`: Type of optimization (fastest/shortest)
- `created_at`: Search timestamp

**Constraints**:
- `user_id` must reference valid user
- `distance` must be positive
- `duration` must be positive
- `traffic_status` must be: Low, Medium, or Heavy

**Indexes**:
- Primary: `_id`
- Compound: `(user_id, created_at)` for efficient history queries
- Single: `created_at` for time-based queries

---

### SAVED_ROUTES Entity

**Purpose**: Store user's favorite/frequently used routes

**Attributes**:
- `_id` (PK): Unique identifier
- `user_id` (FK): Reference to user
- `route_name`: Custom name for the route
- `source`: Starting location
- `destination`: Ending location
- `source_coords`: Source coordinates
- `destination_coords`: Destination coordinates
- `distance`: Route distance in meters
- `duration`: Estimated duration in seconds
- `travel_mode`: Transportation mode
- `notes`: User notes about the route
- `created_at`: When route was saved
- `last_used`: Last time route was accessed

**Constraints**:
- `user_id` must reference valid user
- `route_name` can be custom or auto-generated
- `distance` and `duration` are estimates

**Indexes**:
- Primary: `_id`
- Single: `user_id` for user-specific queries
- Compound: `(user_id, last_used)` for sorting by usage

---

## Data Types

### MongoDB Data Types Used

| Type | Usage | Example |
|------|-------|---------|
| ObjectId | Primary keys | `_id` fields |
| String | Text data | addresses, names |
| Number | Numeric data | distance, duration |
| Boolean | True/false flags | preferences |
| DateTime | Timestamps | created_at, updated_at |
| Object | Nested documents | coordinates, preferences |

---

## Normalization

### Current Normal Form: 3NF (Third Normal Form)

**1NF (First Normal Form)**
- ✅ All attributes contain atomic values
- ✅ No repeating groups
- ✅ Each record is unique

**2NF (Second Normal Form)**
- ✅ In 1NF
- ✅ No partial dependencies
- ✅ All non-key attributes depend on entire primary key

**3NF (Third Normal Form)**
- ✅ In 2NF
- ✅ No transitive dependencies
- ✅ All attributes depend only on primary key

---

## Indexing Strategy

### Users Collection
```javascript
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "username": 1 }, { unique: true })
```

### Route History Collection
```javascript
db.route_history.createIndex({ "user_id": 1, "created_at": -1 })
db.route_history.createIndex({ "created_at": -1 })
```

### Saved Routes Collection
```javascript
db.saved_routes.createIndex({ "user_id": 1 })
db.saved_routes.createIndex({ "user_id": 1, "last_used": -1 })
```

---

## Sample Data

### Users Collection
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "username": "john_doe",
  "email": "john@example.com",
  "password": "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
  "created_at": ISODate("2026-01-15T10:30:00Z"),
  "updated_at": ISODate("2026-01-15T10:30:00Z"),
  "preferences": {
    "default_travel_mode": "DRIVE",
    "avoid_tolls": false,
    "avoid_highways": false
  }
}
```

### Route History Collection
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439012"),
  "user_id": "507f1f77bcf86cd799439011",
  "source": "New York, NY",
  "destination": "Boston, MA",
  "source_coords": { "lat": 40.7128, "lng": -74.0060 },
  "destination_coords": { "lat": 42.3601, "lng": -71.0589 },
  "route_name": "Route 1",
  "distance": 346000,
  "duration": 14400,
  "traffic_status": "Medium",
  "delay_time": 1200,
  "travel_mode": "driving",
  "route_type": "fastest",
  "created_at": ISODate("2026-05-23T08:00:00Z")
}
```

### Saved Routes Collection
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439013"),
  "user_id": "507f1f77bcf86cd799439011",
  "route_name": "Home to Office",
  "source": "123 Main St, New York",
  "destination": "456 Work Ave, New York",
  "source_coords": { "lat": 40.7580, "lng": -73.9855 },
  "destination_coords": { "lat": 40.7489, "lng": -73.9680 },
  "distance": 5200,
  "duration": 900,
  "travel_mode": "driving",
  "notes": "Fastest route during morning rush hour",
  "created_at": ISODate("2026-01-20T09:00:00Z"),
  "last_used": ISODate("2026-05-23T07:30:00Z")
}
```

---

## Database Queries

### Common Queries

**1. Get User by Email**
```javascript
db.users.findOne({ email: "john@example.com" })
```

**2. Get User's Recent History**
```javascript
db.route_history.find({ user_id: "507f1f77bcf86cd799439011" })
  .sort({ created_at: -1 })
  .limit(20)
```

**3. Get User's Saved Routes**
```javascript
db.saved_routes.find({ user_id: "507f1f77bcf86cd799439011" })
  .sort({ last_used: -1 })
```

**4. Delete Old History (> 90 days)**
```javascript
db.route_history.deleteMany({
  created_at: { $lt: new Date(Date.now() - 90*24*60*60*1000) }
})
```

**5. Update Route Last Used**
```javascript
db.saved_routes.updateOne(
  { _id: ObjectId("507f1f77bcf86cd799439013") },
  { $set: { last_used: new Date() } }
)
```

---

## Cardinality Summary

| Relationship | Type | Description |
|--------------|------|-------------|
| User → Route History | 1:N | One user, many history entries |
| User → Saved Routes | 1:N | One user, many saved routes |

---

**End of ER Diagram Documentation**
