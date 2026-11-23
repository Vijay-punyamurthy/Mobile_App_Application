import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
import sys
import os
import uuid

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.core.config import settings

@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "online"

@pytest.mark.asyncio
async def test_auth_login():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Test Buyer login
        res = await client.post("/api/auth/login", json={
            "email": "buyer@landconnect.com",
            "password": "Password123!"
        })
        assert res.status_code == 200
        data = res.json()
        assert "access_token" in data
        assert data["user"]["role"] == "buyer"
        assert data["user"]["profile"]["full_name"] == "Alex Rivera"

        # Test Seller login
        res_seller = await client.post("/api/auth/login", json={
            "email": "seller@landconnect.com",
            "password": "Password123!"
        })
        assert res_seller.status_code == 200
        assert res_seller.json()["user"]["role"] == "seller"

        # Test Broker login
        res_broker = await client.post("/api/auth/login", json={
            "email": "broker@landconnect.com",
            "password": "Password123!"
        })
        assert res_broker.status_code == 200
        assert res_broker.json()["user"]["role"] == "broker"

        # Test Invalid credentials
        res_fail = await client.post("/api/auth/login", json={
            "email": "buyer@landconnect.com",
            "password": "WrongPassword!"
        })
        assert res_fail.status_code == 401

@pytest.mark.asyncio
async def test_rbac_property_creation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Login as buyer
        res_b = await client.post("/api/auth/login", json={
            "email": "buyer@landconnect.com",
            "password": "Password123!"
        })
        buyer_token = res_b.json()["access_token"]
        buyer_headers = {"Authorization": f"Bearer {buyer_token}"}

        # Attempt to create property as Buyer -> MUST FAIL WITH 403 FORBIDDEN
        res_create_fail = await client.post("/api/properties", headers=buyer_headers, json={
            "title": "Unauthorized Listing by Buyer",
            "description": "This should be blocked by RBAC",
            "price": 100000,
            "land_area": 5.0,
            "address": "123 Test St",
            "city": "Austin",
            "state": "Texas",
            "latitude": 30.2672,
            "longitude": -97.7431
        })
        assert res_create_fail.status_code == 403
        assert "not permitted" in res_create_fail.json()["detail"].lower()

        # Login as seller
        res_s = await client.post("/api/auth/login", json={
            "email": "seller@landconnect.com",
            "password": "Password123!"
        })
        seller_token = res_s.json()["access_token"]
        seller_headers = {"Authorization": f"Bearer {seller_token}"}

        # Create property as Seller -> MUST SUCCEED WITH 201 CREATED
        res_create_ok = await client.post("/api/properties", headers=seller_headers, json={
            "title": "Golden Valley Agricultural Acreage",
            "description": "Fertile soil, deep irrigation well, fenced perimeter.",
            "price": 275000,
            "price_unit": "USD",
            "land_area": 30.0,
            "area_unit": "acres",
            "property_type": "agricultural",
            "status": "available",
            "address": "500 Valley Road",
            "city": "Bakersfield",
            "state": "California",
            "latitude": 35.3733,
            "longitude": -119.0187,
            "zoning_classification": "A-1"
        })
        assert res_create_ok.status_code == 201
        created_id = res_create_ok.json()["id"]

        # Buyer attempts to edit seller's property -> MUST FAIL WITH 403 FORBIDDEN
        res_edit_fail = await client.put(f"/api/properties/{created_id}", headers=buyer_headers, json={
            "title": "Hacked Title"
        })
        assert res_edit_fail.status_code == 403

        # Seller edits their own property -> MUST SUCCEED
        res_edit_ok = await client.put(f"/api/properties/{created_id}", headers=seller_headers, json={
            "title": "Golden Valley Agricultural Acreage - Updated Price",
            "price": 265000
        })
        assert res_edit_ok.status_code == 200
        assert res_edit_ok.json()["price"] == 265000

@pytest.mark.asyncio
async def test_property_search_and_filter():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Search by keyword
        res = await client.get("/api/properties?q=Ranch")
        assert res.status_code == 200
        items = res.json()
        assert len(items) >= 1
        assert "Ranch" in items[0]["title"]

        # Filter by property type
        res_type = await client.get("/api/properties?property_type=agricultural")
        assert res_type.status_code == 200
        for p in res_type.json():
            assert p["property_type"] == "agricultural"

@pytest.mark.asyncio
async def test_messaging_and_conversation_security():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Login as buyer
        res_b = await client.post("/api/auth/login", json={"email": "buyer@landconnect.com", "password": "Password123!"})
        buyer_token = res_b.json()["access_token"]
        buyer_headers = {"Authorization": f"Bearer {buyer_token}"}

        # Login as seller
        res_s = await client.post("/api/auth/login", json={"email": "seller@landconnect.com", "password": "Password123!"})
        seller_token = res_s.json()["access_token"]
        seller_headers = {"Authorization": f"Bearer {seller_token}"}

        # Login as broker
        res_br = await client.post("/api/auth/login", json={"email": "broker@landconnect.com", "password": "Password123!"})
        broker_token = res_br.json()["access_token"]
        broker_headers = {"Authorization": f"Bearer {broker_token}"}

        # Get buyer's conversations
        convos_res = await client.get("/api/conversations", headers=buyer_headers)
        assert convos_res.status_code == 200
        convos = convos_res.json()
        assert len(convos) > 0
        convo_id = convos[0]["id"]

        # Buyer sends message
        send_res = await client.post(f"/api/conversations/{convo_id}/messages", headers=buyer_headers, json={
            "content": "Can we schedule a video walk-through?",
            "message_type": "text"
        })
        assert send_res.status_code == 200
        assert send_res.json()["content"] == "Can we schedule a video walk-through?"

        # Broker (who is NOT in this conversation) attempts to read messages -> MUST BE 403 FORBIDDEN
        unauth_res = await client.get(f"/api/conversations/{convo_id}/messages", headers=broker_headers)
        assert unauth_res.status_code == 403
        assert "not authorized" in unauth_res.json()["detail"].lower()

@pytest.mark.asyncio
async def test_calls_initiation_and_status():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Login as buyer
        res_b = await client.post("/api/auth/login", json={"email": "buyer@landconnect.com", "password": "Password123!"})
        buyer_token = res_b.json()["access_token"]
        buyer_headers = {"Authorization": f"Bearer {buyer_token}"}

        # Login as seller
        res_s = await client.post("/api/auth/login", json={"email": "seller@landconnect.com", "password": "Password123!"})
        seller_id = res_s.json()["user"]["id"]

        # Buyer initiates video call to seller
        room_id = f"test-call-room-{uuid.uuid4().hex[:8]}"
        init_res = await client.post("/api/calls/initiate", headers=buyer_headers, json={
            "receiver_id": seller_id,
            "call_type": "video",
            "room_id": room_id
        })
        assert init_res.status_code == 201
        call_data = init_res.json()
        assert call_data["status"] == "initiated"
        assert call_data["room_id"] == room_id

        # Update call status to answered
        ans_res = await client.post(f"/api/calls/{room_id}/status", headers=buyer_headers, json={
            "status": "answered"
        })
        assert ans_res.status_code == 200
        assert ans_res.json()["status"] == "answered"

        # End call with duration
        end_res = await client.post(f"/api/calls/{room_id}/status", headers=buyer_headers, json={
            "status": "ended",
            "duration_seconds": 142
        })
        assert end_res.status_code == 200
        assert end_res.json()["status"] == "ended"
        assert end_res.json()["duration_seconds"] == 142
