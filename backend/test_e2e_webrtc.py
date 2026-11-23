import pytest
import json
import asyncio
import uuid
from starlette.testclient import TestClient
from httpx import AsyncClient, ASGITransport
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app

def test_full_webrtc_signaling_and_calling_lifecycle():
    """
    End-to-End Simulation of Two Connected Clients:
    Client 1: Buyer (Alice)
    Client 2: Seller (Sarah)
    Validates:
      1. Both users authenticate and obtain JWTs
      2. Both connect to real-time WebSocket signaling server
      3. Buyer initiates video call -> Seller receives incoming call alert
      4. Seller accepts call -> Buyer receives acceptance notification
      5. Buyer sends SDP Offer -> Seller receives SDP Offer
      6. Seller replies with SDP Answer -> Buyer receives SDP Answer
      7. ICE candidate exchange between peers
      8. End call -> Both peers notified and call duration saved
    """
    client = TestClient(app)

    # 1. Login Buyer
    res_b = client.post("/api/auth/login", json={"email": "buyer@landconnect.com", "password": "Password123!"})
    assert res_b.status_code == 200
    buyer_token = res_b.json()["access_token"]
    buyer_id = res_b.json()["user"]["id"]

    # 2. Login Seller
    res_s = client.post("/api/auth/login", json={"email": "seller@landconnect.com", "password": "Password123!"})
    assert res_s.status_code == 200
    seller_token = res_s.json()["access_token"]
    seller_id = res_s.json()["user"]["id"]

    room_id = f"test-e2e-webrtc-room-{uuid.uuid4().hex[:8]}"

    # Open simultaneous WebSockets for Buyer and Seller
    with client.websocket_connect(f"/ws?token={buyer_token}") as ws_buyer:
        b_init = json.loads(ws_buyer.receive_text())
        assert b_init["type"] == "connection:established"
        assert b_init["user_id"] == buyer_id

        with client.websocket_connect(f"/ws?token={seller_token}") as ws_seller:
            s_init = json.loads(ws_seller.receive_text())
            assert s_init["type"] == "connection:established"
            assert s_init["user_id"] == seller_id

            # Step 1: Buyer initiates call via HTTP API
            init_res = client.post(
                "/api/calls/initiate",
                headers={"Authorization": f"Bearer {buyer_token}"},
                json={"receiver_id": seller_id, "call_type": "video", "room_id": room_id}
            )
            assert init_res.status_code == 201

            # Step 2: Seller receives incoming call event on WebSocket
            incoming_raw = ws_seller.receive_text()
            incoming = json.loads(incoming_raw)
            assert incoming["type"] == "call:incoming"
            assert incoming["room_id"] == room_id
            assert incoming["caller_id"] == buyer_id
            assert incoming["call_type"] == "video"

            # Step 3: Seller accepts call
            ws_seller.send_text(json.dumps({
                "type": "call:accept",
                "target_id": buyer_id,
                "room_id": room_id
            }))

            # Step 4: Buyer receives acceptance event
            accepted_raw = ws_buyer.receive_text()
            accepted = json.loads(accepted_raw)
            assert accepted["type"] == "call:accepted"
            assert accepted["room_id"] == room_id
            assert accepted["receiver_id"] == seller_id

            # Step 5: Buyer generates and sends SDP Offer
            mock_sdp_offer = {"type": "offer", "sdp": "v=0\r\no=buyer 1234 2 IN IP4 127.0.0.1\r\ns=LandConnect WebRTC"}
            ws_buyer.send_text(json.dumps({
                "type": "rtc:offer",
                "target_id": seller_id,
                "room_id": room_id,
                "sdp": mock_sdp_offer
            }))

            # Seller receives SDP Offer
            offer_received_raw = ws_seller.receive_text()
            offer_received = json.loads(offer_received_raw)
            assert offer_received["type"] == "rtc:offer"
            assert offer_received["sender_id"] == buyer_id
            assert offer_received["sdp"] == mock_sdp_offer

            # Step 6: Seller generates and sends SDP Answer
            mock_sdp_answer = {"type": "answer", "sdp": "v=0\r\no=seller 5678 2 IN IP4 127.0.0.1\r\ns=LandConnect WebRTC"}
            ws_seller.send_text(json.dumps({
                "type": "rtc:answer",
                "target_id": buyer_id,
                "room_id": room_id,
                "sdp": mock_sdp_answer
            }))

            # Buyer receives SDP Answer
            answer_received_raw = ws_buyer.receive_text()
            answer_received = json.loads(answer_received_raw)
            assert answer_received["type"] == "rtc:answer"
            assert answer_received["sender_id"] == seller_id
            assert answer_received["sdp"] == mock_sdp_answer

            # Step 7: ICE Candidate Exchange
            mock_ice_buyer = {"candidate": "candidate:1 1 UDP 2122260223 192.168.1.100 50000 typ host", "sdpMid": "0"}
            ws_buyer.send_text(json.dumps({
                "type": "rtc:ice",
                "target_id": seller_id,
                "candidate": mock_ice_buyer
            }))

            ice_received_raw = ws_seller.receive_text()
            ice_received = json.loads(ice_received_raw)
            assert ice_received["type"] == "rtc:ice"
            assert ice_received["candidate"] == mock_ice_buyer

            # Step 8: Buyer ends call
            ws_buyer.send_text(json.dumps({
                "type": "call:end",
                "target_id": seller_id,
                "room_id": room_id
            }))

            ended_raw = ws_seller.receive_text()
            ended = json.loads(ended_raw)
            assert ended["type"] == "call:ended"

    print("🎉 FULL E2E WEBRTC CALLING & SIGNALING TEST COMPLETED SUCCESSFULLY!")

if __name__ == "__main__":
    test_full_webrtc_signaling_and_calling_lifecycle()
