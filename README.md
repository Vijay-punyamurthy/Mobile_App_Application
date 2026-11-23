# LandConnect — Land Marketplace Mobile Application

A production-grade, full-stack mobile marketplace and real-time communication platform engineered specifically for land buyers, property sellers, and licensed real-estate brokers.

---

## 🌟 Highlights & Key Features

1. **Role-Based Access Control (RBAC)**:
   - **Buyer**: Browse, filter, bookmark land listings, contact sellers, initiate audio/video calls.
   - **Seller**: Publish, manage, and price personal acreage; receive inquiries and calls.
   - **Broker**: Licensed representation, multi-client property portfolio management, and virtual inspection rooms.
   - *Backend Enforced*: RBAC is strictly validated via FastAPI dependencies; buyers cannot create or edit listings.

2. **Core Land Marketplace**:
   - High-resolution imagery galleries, acreage calculation, price-per-acre metrics, zoning classifications (Agricultural, Residential, Commercial, Industrial).
   - Real-time search by keyword, city, state, price bounds, and land category.

3. **Maps & Geolocation**:
   - Visual plot mapping showing GPS coordinates.
   - Interactive pin-drop coordinate selector when creating new listings.
   - Satellite, Terrain, and Streets layer views.

4. **In-App Messaging**:
   - WhatsApp-inspired messaging experience.
   - Instant message delivery over WebSockets with database persistence.
   - Participant security isolation (unauthorized users cannot view or send messages).

5. **Integrated WebRTC Audio & Video Calling (Priority 1 Feature)**:
   - Genuine peer-to-peer WebRTC calling (not a UI mockup).
   - Full signaling over WebSockets exchanging SDP Offers, SDP Answers, and ICE Candidates.
   - Google public STUN connectivity (`stun.l.google.com:19302`).
   - Active call controls: mute/unmute microphone, toggle video camera, call duration counter, end call.
   - Automatic call session logging with duration and status (answered, missed, rejected, ended).

6. **Virtual Meeting Rooms**:
   - Room code generation for scheduled land surveys and broker walkthroughs.

7. **Evaluator Quick-Role Switcher**:
   - One-tap role switcher embedded in the mobile interface to instantly swap between Buyer (Alex), Seller (Sarah), and Broker (Michael).

---

## 🏗️ Architecture & Technology Stack

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Mobile Client** | React Native, Expo SDK 58, TypeScript | Universal cross-platform client (iOS, Android, and Web preview). |
| **Navigation** | React Navigation (Stack + Bottom Tabs) | Polished native transitions and tabbed navigation. |
| **State Management** | Zustand | Lightweight, high-performance stores for Auth, Properties, Chat, and Calls. |
| **Backend API** | Python FastAPI (ASGI) | Asynchronous throughput, automatic Swagger OpenAPI docs, Pydantic data validation. |
| **Database** | SQLAlchemy 2.0 (Async) + SQLite / PostgreSQL | Zero-setup portability via `aiosqlite`; instant production scale via PostgreSQL. |
| **Real-Time Layer** | FastAPI WebSockets | Unified duplex channel for signaling, live chat, and presence. |
| **Media Transport** | WebRTC (P2P + STUN) | Zero external third-party vendor lock-in or expiring cloud trial barriers. |

---

## 📁 Repository Structure

```
LandConnect_Assignment/
├── backend/
│   ├── app/
│   │   ├── api/             # REST routers (auth, properties, conversations, calls, meetings, ws)
│   │   ├── core/            # Config, security (BCrypt, PyJWT), RBAC dependencies
│   │   ├── database/        # Async SQLAlchemy session and Base
│   │   ├── models/          # User, Property, Chat, Call, Meeting models
│   │   ├── schemas/         # Pydantic V2 request & response schemas
│   │   ├── services/        # WebSocket signaling manager and file storage
│   │   └── main.py          # FastAPI app initialization and CORS
│   ├── seed.py              # Realistic database seeder script
│   ├── test_api.py          # Automated pytest suite (Auth, RBAC, Listings, Chat, Calls)
│   ├── test_e2e_webrtc.py   # Two-client WebRTC calling E2E test suite
│   └── requirements.txt     # Backend dependencies
│
├── mobile/
│   ├── src/
│   │   ├── components/      # PropertyCard, CallOverlay, InteractiveMap, RoleBadge, RoleSwitcher
│   │   ├── navigation/      # RootNavigator, Stack & Tab navigators
│   │   ├── screens/         # Auth, Marketplace, Property Management, Chat, Calls, Account
│   │   ├── services/        # API client, WebSocket client, WebRTC manager
│   │   ├── store/           # Zustand stores (auth, property, chat, call)
│   │   └── types/           # TypeScript interfaces
│   ├── App.tsx              # Root mobile application component
│   └── package.json         # Mobile dependencies
│
├── docs/
│   ├── architecture.md             # System architecture & Mermaid diagrams
│   ├── api-documentation.md        # Complete REST & WebSocket API specification
│   ├── technical-documentation.md   # Comprehensive engineering decisions & solutions
│   ├── ai-tools-usage.md           # Transparent AI tool usage disclosure
│   └── demo-video-script.md        # Professional 5-7 minute walkthrough script
│
├── .env.example
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started & Execution

### Prerequisites
- **Python**: 3.10+ (Tested on Python 3.13)
- **Node.js**: 18+ (Tested on Node.js v24)
- **npm** or **yarn**

---

### Step 1: Backend Setup & Execution

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Seed the database with realistic demo accounts and land listings:
   ```bash
   python seed.py
   ```
   *Output confirmation:*
   ```text
   🌱 Initializing LandConnect database and seeding demo data...
   ✅ Database seeding complete!
   Demo Accounts:
     - Buyer:  buyer@landconnect.com  / Password123!
     - Seller: seller@landconnect.com / Password123!
     - Broker: broker@landconnect.com / Password123!
   ```

4. Start the FastAPI backend server:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   - **Interactive API Documentation (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

---

### Step 2: Mobile Application Setup & Execution

1. Navigate to the mobile directory in a separate terminal:
   ```bash
   cd mobile
   ```

2. Install dependencies (if not already installed):
   ```bash
   npm install --legacy-peer-deps
   ```

3. Launch the application:
   ```bash
   npm run web
   ```
   *Or for native development:*
   ```bash
   npm run android  # For Android device or emulator
   npm run ios      # For iOS simulator (macOS required)
   ```

4. Open the browser at `http://localhost:8081` (or the URL output by Expo).

---

## 🧪 Automated Testing

LandConnect includes a comprehensive automated test suite. Run tests directly from the `backend/` directory:

```bash
cd backend
pytest -v
```

### Test Suite Results:
- `test_api.py::test_health_check` **PASSED** (Verifies API service status)
- `test_api.py::test_auth_login` **PASSED** (Verifies JWT login for Buyer, Seller, Broker, and invalid credentials)
- `test_api.py::test_rbac_property_creation` **PASSED** (Proves Buyer is blocked with 403, Seller allowed with 201)
- `test_api.py::test_property_search_and_filter` **PASSED** (Tests keyword search and category filters)
- `test_api.py::test_messaging_and_conversation_security` **PASSED** (Proves conversation privacy and unauthorized block)
- `test_api.py::test_calls_initiation_and_status` **PASSED** (Tests call initiation and status updates)
- `test_e2e_webrtc.py::test_full_webrtc_signaling_and_calling_lifecycle` **PASSED** (Simulates two concurrent WebSocket clients executing full 8-step WebRTC calling and signaling flow)

**Result**: 7 passed in 4.38s (100% Success).

---

## 📱 Live Demonstration Guide (Two-Device / Two-Window Walkthrough)

To evaluate real-time messaging and live audio/video calling:

1. **Window A (Buyer)**:
   - Open browser at `http://localhost:8081` in a normal window.
   - Use the 1-Tap Quick Role Switcher or log in with:
     - **Email**: `buyer@landconnect.com`
     - **Password**: `Password123!`

2. **Window B (Seller)**:
   - Open browser in an **Incognito / Private** window at `http://localhost:8081`.
   - Log in with:
     - **Email**: `seller@landconnect.com`
     - **Password**: `Password123!`

3. **Demonstrate Audio Calling**:
   - In Window A (Buyer), navigate to Sarah's 45-acre ranch and tap **"Audio Call"** (or tap the call icon in their chat).
   - In Window B (Seller), observe the incoming call overlay ringing with Alex's name.
   - Tap **"Accept"** on Window B.
   - Both devices establish an encrypted WebRTC audio channel; duration counter counts up.
   - Tap the red **"End Call"** button to conclude and log the call.

4. **Demonstrate Video Calling**:
   - In Window A (Buyer), tap **"Live Video Walk"** on the property.
   - Window B (Seller) rings with incoming video call notification.
   - Tap **"Accept"**.
   - Two-way WebRTC video streams are active with full-screen remote feed and picture-in-picture local camera.
   - Test camera disable and microphone mute controls.

---

## 🔒 Privacy & Security Highlights

- **Phone Number Obfuscation**: Users communicate securely through in-app WebRTC and WebSockets without exposing personal cellular numbers.
- **Backend Role Enforcement**: Non-sellers cannot bypass UI controls; API endpoints reject unauthorized modifications.
- **Credential Protection**: Passwords hashed with BCrypt (12 rounds); API tokens signed via HMAC-SHA256.
- **Environment Isolation**: No hardcoded API keys; `.env.example` provided for deployment.

---

## 📄 Documentation Index
- [Architecture & ERD Specification](file:///c:/Users/punya/OneDrive/Documents/LandConnect_Assignment/docs/architecture.md)
- [REST & WebSocket API Documentation](file:///c:/Users/punya/OneDrive/Documents/LandConnect_Assignment/docs/api-documentation.md)
- [Technical Engineering Documentation](file:///c:/Users/punya/OneDrive/Documents/LandConnect_Assignment/docs/technical-documentation.md)
- [AI Tools Usage Disclosure](file:///c:/Users/punya/OneDrive/Documents/LandConnect_Assignment/docs/ai-tools-usage.md)
- [Demonstration Video Script](file:///c:/Users/punya/OneDrive/Documents/LandConnect_Assignment/docs/demo-video-script.md)
