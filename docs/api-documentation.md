# LandConnect API Documentation

## Overview
LandConnect provides a high-throughput, async REST API and real-time WebSocket signaling server built with Python FastAPI and SQLAlchemy.

- **Base URL (Local)**: `http://localhost:8000/api`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **WebSocket Endpoint**: `ws://localhost:8000/ws?token={jwt_token}`

---

## 1. Authentication & User Management

### Register User
`POST /api/auth/register`

**Request Body:**
```json
{
  "email": "buyer@landconnect.com",
  "password": "Password123!",
  "role": "buyer",
  "full_name": "Alex Rivera",
  "phone_number": "+1 (555) 234-5678",
  "company_or_agency": null,
  "license_number": null
}
```

**Response (201 Created):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "buyer@landconnect.com",
    "role": "buyer",
    "is_active": true,
    "created_at": "2026-11-23T05:00:00Z",
    "profile": {
      "id": 1,
      "user_id": 1,
      "full_name": "Alex Rivera",
      "phone_number": "+1 (555) 234-5678",
      "avatar_url": null,
      "bio": null,
      "company_or_agency": null,
      "license_number": null,
      "updated_at": "2026-11-23T05:00:00Z"
    }
  }
}
```

### Login
`POST /api/auth/login`

**Request Body:**
```json
{
  "email": "seller@landconnect.com",
  "password": "Password123!"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
  "token_type": "bearer",
  "user": { ... }
}
```

### Current User Profile
`GET /api/auth/me`  
*Headers: `Authorization: Bearer <token>`*

---

## 2. Land Marketplace & Property Management

### List & Search Properties
`GET /api/properties?q=Ranch&property_type=agricultural&min_price=100000&max_price=500000&sort_by=price_asc`

**Query Parameters:**
- `q` (string): Keyword matching title, description, address, city, state.
- `property_type` (string): `agricultural`, `residential`, `commercial`, `industrial`.
- `status` (string): `available`, `pending`, `sold`, `all` (default: `available`).
- `min_price` / `max_price` (float): Price bounds.
- `city` (string): Location filtering.
- `sort_by` (string): `newest`, `price_asc`, `price_desc`.

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "owner_id": 2,
    "title": "Rolling Hills Ranch & Timberland",
    "description": "Stunning 45-acre parcel with mature hardwood oak timber...",
    "price": 385000.0,
    "price_unit": "USD",
    "land_area": 45.0,
    "area_unit": "acres",
    "property_type": "agricultural",
    "status": "available",
    "address": "14200 Timber Ridge Trail",
    "city": "Fredericksburg",
    "state": "Texas",
    "country": "United States",
    "latitude": 30.2752,
    "longitude": -98.8719,
    "zoning_classification": "Agricultural Exemption (Ag-1)",
    "created_at": "2026-11-23T05:00:00Z",
    "updated_at": "2026-11-23T05:00:00Z",
    "images": [
      {
        "id": 1,
        "property_id": 1,
        "image_url": "https://images.unsplash.com/photo-1500382017468-9049fed747ef",
        "is_primary": true,
        "sort_order": 0
      }
    ],
    "owner": { ... },
    "is_favorited": false
  }
]
```

### Create Property Listing
`POST /api/properties`  
*Headers: `Authorization: Bearer <token>` (RBAC: `seller` or `broker` only)*

**Request Body:**
```json
{
  "title": "Sierra Foothills Panoramic Estate Lot",
  "description": "5.2-acre ready-to-build residential homesite...",
  "price": 249000.0,
  "price_unit": "USD",
  "land_area": 5.2,
  "area_unit": "acres",
  "property_type": "residential",
  "status": "available",
  "address": "880 Whispering Pines Way",
  "city": "Auburn",
  "state": "California",
  "latitude": 38.8966,
  "longitude": -121.0769,
  "zoning_classification": "R-1 Low Density Residential",
  "images": [
    { "image_url": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b", "is_primary": true, "sort_order": 0 }
  ]
}
```

### Toggle Favorite Bookmark
`POST /api/properties/{property_id}/favorite`

**Response:**
```json
{
  "property_id": 1,
  "is_favorited": true
}
```

---

## 3. In-App Messaging & Conversations

### List User Conversations
`GET /api/conversations`

### Create / Retrieve Conversation
`POST /api/conversations`

**Request Body:**
```json
{
  "participant_user_id": 2,
  "property_id": 1,
  "initial_message": "Hello, is this tract still available for inspection?"
}
```

### Send Message
`POST /api/conversations/{conversation_id}/messages`

**Request Body:**
```json
{
  "content": "Yes, it is! When would you like to schedule a video walkthrough?",
  "message_type": "text"
}
```

---

## 4. Audio & Video Calling (WebRTC)

### Initiate Call
`POST /api/calls/initiate`

**Request Body:**
```json
{
  "receiver_id": 2,
  "call_type": "video",
  "room_id": "room-1700000-abc123"
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "caller_id": 1,
  "receiver_id": 2,
  "call_type": "video",
  "status": "initiated",
  "room_id": "room-1700000-abc123",
  "duration_seconds": 0,
  "started_at": "2026-11-23T05:00:00Z",
  "ended_at": null
}
```

### Update Call Status
`POST /api/calls/{room_id}/status`

**Request Body:**
```json
{
  "status": "ended",
  "duration_seconds": 185
}
```

---

## 5. WebSocket Real-Time Signaling Protocol

Endpoint: `ws://localhost:8000/ws?token={jwt_token}`

### Event Formats:

#### 1. Incoming Call Notification
```json
{
  "type": "call:incoming",
  "room_id": "room-1700000-abc123",
  "caller_id": 1,
  "caller_name": "Alex Rivera",
  "caller_avatar": "https://...",
  "call_type": "video"
}
```

#### 2. Call Accepted
```json
{
  "type": "call:accept",
  "target_id": 1,
  "room_id": "room-1700000-abc123"
}
```

#### 3. SDP Offer
```json
{
  "type": "rtc:offer",
  "target_id": 2,
  "room_id": "room-1700000-abc123",
  "sdp": { "type": "offer", "sdp": "v=0\r\no=..." }
}
```

#### 4. SDP Answer
```json
{
  "type": "rtc:answer",
  "target_id": 1,
  "room_id": "room-1700000-abc123",
  "sdp": { "type": "answer", "sdp": "v=0\r\no=..." }
}
```

#### 5. ICE Candidate
```json
{
  "type": "rtc:ice",
  "target_id": 2,
  "candidate": { "candidate": "candidate:...", "sdpMid": "0" }
}
```

#### 6. End Call
```json
{
  "type": "call:end",
  "target_id": 2,
  "room_id": "room-1700000-abc123"
}
```
