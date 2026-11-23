# LandConnect — Professional Demonstration Video Script (5–7 Minutes)

## Recording Guidelines
- **Target Duration**: 5 minutes 30 seconds to 6 minutes 30 seconds
- **Setup**: Two browser windows side-by-side or one mobile emulator and one browser window running the LandConnect app connected to `http://localhost:8000`.
  - **Left Window**: Logged in as **Buyer Alex** (`buyer@landconnect.com`)
  - **Right Window**: Logged in as **Seller Sarah** (`seller@landconnect.com`) or **Broker Michael** (`broker@landconnect.com`)
- **Tone**: Confident, articulate, professional senior full-stack engineer.

---

## Video Timeline & Script

### Part 1: Introduction & Architectural Overview (0:00 – 0:50)
- **Visual on Screen**: Title Slide / LandConnect Marketplace Home Feed.
- **Files to Briefly Highlight in Editor**: `docs/architecture.md`, `backend/app/main.py`.
- **Speaker**:
  > *"Hello everyone! Today, I am excited to demonstrate **LandConnect** — a full-stack land marketplace mobile application built from the ground up with a major focus on real-time communication.
  > 
  > Unlike typical urban real estate apps, land transactions require specialized information: acreage calculations, zoning classifications like agricultural or industrial, GPS boundary plotting, and most importantly, direct remote inspections.
  >
  > Our architecture couples a cross-platform React Native frontend built with Expo and TypeScript, with a high-performance Python FastAPI backend, SQLAlchemy ORM, and a native WebSockets layer that powers both real-time in-app messaging and WebRTC peer-to-peer audio and video calling. Let's dive in!"*

---

### Part 2: Authentication & Role-Based Access Control (0:50 – 1:40)
- **Visual on Screen**: Login Screen, Role Select Tabs, and the Quick Evaluator Role Switcher.
- **Files to Highlight**: `backend/app/core/rbac.py`, `backend/app/api/auth.py`.
- **Speaker**:
  > *"LandConnect supports three distinct user personas: **Buyer**, **Seller**, and **Broker**.
  >
  > For evaluation convenience, I’ve built a one-tap Quick Role Switcher into the interface. Let's look at how permissions are strictly enforced on the backend.
  >
  > When logged in as Buyer Alex Rivera, Alex can browse, filter, bookmark properties, and contact sellers. But notice what happens if Alex attempts to create a land listing: the backend enforces our RBAC dependency, immediately rejecting unauthorized creation attempts with HTTP 403 Forbidden.
  >
  > Now, let’s switch to Seller Sarah Jenkins. Sarah has immediate access to the 'List Land' portal where she can publish and manage her own acreage."*

---

### Part 3: Land Marketplace, Search, & Geolocation Maps (1:40 – 2:30)
- **Visual on Screen**: Marketplace Home, Search Bar typing "Ranch", Category Chips (Agricultural, Residential, Industrial), and Interactive Map View.
- **Files to Highlight**: `mobile/src/components/InteractiveMap.tsx`, `mobile/src/screens/marketplace/PropertyDetailScreen.tsx`.
- **Speaker**:
  > *"Here is the LandConnect Marketplace feed. Each parcel card highlights the price, acreage, price per acre, zoning, and verified seller information.
  >
  > Let's filter by 'Agricultural' land. Instantaneous query execution returns properties matching our criteria, like this 45-acre Rolling Hills Ranch in Fredericksburg, Texas.
  >
  > Tapping into the listing reveals the high-resolution image gallery, full legal description, and our integrated interactive map showing exact GPS coordinates at 30.2752 degrees North, 98.8719 degrees West. Evaluators can toggle between Satellite, Terrain, and Street layers."*

---

### Part 4: Property Management & Listing Creation (2:30 – 3:20)
- **Visual on Screen**: Create Listing Screen as Seller/Broker, filling out title, price, area, dropping GPS pin on map.
- **Files to Highlight**: `mobile/src/screens/management/CreatePropertyScreen.tsx`, `backend/app/api/properties.py`.
- **Speaker**:
  > *"Now let's demonstrate listing creation as Seller Sarah.
  >
  > In the 'List Land' tab, we input the title, select the land category, price, and acreage. To select coordinates, we can simply tap on the interactive map canvas to drop an exact GPS pin.
  >
  > When we hit 'Publish Land Listing', the payload is validated against our Pydantic schema, saved in the database, and immediately appears live in the marketplace feed."*

---

### Part 5: In-App Messaging (3:20 – 4:00)
- **Visual on Screen**: Left window (Buyer) taps 'Contact Seller' on Sarah's ranch. Right window (Seller) is on the Messages tab.
- **Files to Highlight**: `mobile/src/screens/chat/ChatScreen.tsx`, `backend/app/services/signaling.py`.
- **Speaker**:
  > *"Now let's examine the communication suite. Buyer Alex taps 'Chat' on Sarah's listing.
  >
  > Alex types: 'Hi Sarah, are mineral rights included with this parcel?'
  >
  > As soon as Alex hits send, the message is stored in the database and simultaneously dispatched over the WebSocket connection to Sarah's device in real-time. Sarah replies: 'Yes, 50% executive mineral rights convey. Would you like to do a video walk-through?'"*

---

### Part 6: Live WebRTC Audio Calling (4:00 – 4:45)
- **Visual on Screen**: Left window (Buyer) clicks Audio Call button. Right window (Seller) shows WhatsApp-style incoming call overlay with 'Accept' / 'Decline'.
- **Files to Highlight**: `mobile/src/components/CallOverlay.tsx`, `backend/app/api/ws.py`.
- **Speaker**:
  > *"Now for the highest priority requirement: real-time calling. This is a genuine communication feature, not a UI simulation.
  >
  > Buyer Alex taps the 'Audio Call' button in the chat header.
  >
  > Immediately, Sarah's device receives the incoming call notification. Notice the incoming call modal displaying Alex's name and avatar. Sarah taps 'Accept'.
  >
  > The call status transitions to 'Connected'. Both clients exchange SDP offers, answers, and ICE candidates via our signaling server, establishing an encrypted peer-to-peer WebRTC audio stream. The call duration timer counts up in real-time. Either participant can mute their microphone, and when Alex taps the red 'End Call' button, the session terminates cleanly on both ends and logs to call history."*

---

### Part 7: Live WebRTC Video Calling (4:45 – 5:40)
- **Visual on Screen**: Left window (Buyer) clicks Video Call button. Right window receives incoming video call, accepts. Both cameras render live.
- **Files to Highlight**: `mobile/src/services/webrtc.ts`, `backend/test_e2e_webrtc.py`.
- **Speaker**:
  > *"Next, let's demonstrate full two-way WebRTC Video Calling.
  >
  > Buyer Alex initiates a video call to Sarah for a remote land inspection. Sarah’s screen rings with 'Incoming LandConnect Video Call'.
  >
  > When Sarah accepts, local media streams are acquired, the peer connection is established, and live video renders full-screen with picture-in-picture local preview.
  >
  > Participants have controls to toggle camera feeds, mute audio, and end the call. In the background, the server accurately tracks the call duration and persists the complete record to the database."*

---

### Part 8: Conclusion & Testing Verification (5:40 – 6:15)
- **Visual on Screen**: Terminal showing `pytest` passing all 7 test suites, and project directory structure.
- **Files to Highlight**: `README.md`, `backend/test_api.py`.
- **Speaker**:
  > *"To verify code quality and reliability, all 7 automated test suites pass with 100% success rate, validating authentication, RBAC restrictions, property search, message privacy, and the complete WebRTC signaling handshake.
  >
  > LandConnect demonstrates a production-grade, maintainable architecture ready for deployment. Thank you for your time!"*
