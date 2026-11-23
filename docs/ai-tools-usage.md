# AI Tools Usage Summary

## Overview & Disclosure
In accordance with Phase 11 requirements, this document outlines the utilization of AI tooling (Google DeepMind Antigravity / Gemini) during the engineering and implementation of LandConnect.

---

## 1. Architecture Planning
- **Assistance**: AI assisted in drafting initial architectural schemas, evaluating the trade-offs between managed WebRTC providers (LiveKit, Agora) versus self-hosted STUN signaling, and mapping out the database ERD.
- **Independent Decisions**: The decision to eliminate third-party cloud RTC credentials in favor of self-hosted WebSockets and Google public STUN was made to guarantee 100% self-contained reproducibility for the evaluator without risk of cloud trial expirations or network firewall blocks.

---

## 2. Implementation & Code Scaffolding
- **Assistance**: AI accelerated the scaffolding of boilerplate Pydantic schemas, SQLAlchemy database models, and React Native screen layouts.
- **Review & Validation**: Every schema was reviewed for strict type safety and validated against FastAPI and Pydantic V2 standards (`ConfigDict(from_attributes=True)`). The WebRTC connection manager was implemented specifically to support SDP Offer/Answer exchanges and ICE candidate queueing.

---

## 3. Debugging & Problem-Solving
AI assisted in diagnosing and resolving specific build and test discrepancies:
1. **Pydantic V2 Model Configs**: Fixed deprecation warnings by updating class-based `Config` blocks to `ConfigDict`.
2. **Missing Dependencies**: Promptly resolved `greenlet` requirement for SQLAlchemy asyncio and `email-validator` for Pydantic `EmailStr`.
3. **Database Test Constraints**: Identified that re-running tests with static room identifiers caused SQLite unique constraint errors (`calls.room_id`), resolving it by adopting dynamic UUID room tokens for clean, idempotent test execution.
4. **React Native 0.88 StyleSheet API**: Resolved TypeScript compilation errors regarding `StyleSheet.absoluteFillObject` by utilizing explicit absolute positioning styles.

---

## 4. Verification & Testing
All features and workflows were verified through real automated tests and compilation commands:
- `backend/seed.py`: Successfully initialized and seeded realistic demo land listings and accounts.
- `backend/test_api.py`: Automated pytest suite covering Auth, RBAC, Property Listings, Messaging, and Call initiation passed with 100% success rate.
- `backend/test_e2e_webrtc.py`: Full two-client WebRTC signaling and calling lifecycle verified across 8 sequential stages.
- `mobile/`: Full TypeScript validation (`npx tsc --noEmit`) and Expo Web production export (`npx expo export --platform web`) compiled 624 modules with zero errors.
