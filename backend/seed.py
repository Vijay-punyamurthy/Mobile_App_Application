import asyncio
import os
import sys

# Ensure backend root is on PYTHONPATH
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.session import AsyncSessionLocal, engine, Base
from app.models.user import User, UserProfile
from app.models.property import Property, PropertyImage, PropertyFavorite
from app.models.chat import Conversation, ConversationParticipant, Message
from app.models.call import MeetingRoom
from app.core.security import get_password_hash

async def seed_database():
    print("🌱 Initializing LandConnect database and seeding demo data...")
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
        
    async with AsyncSessionLocal() as session:
        # 1. Create Users for each Role
        pwd_hash = get_password_hash("Password123!")
        
        buyer = User(
            email="buyer@landconnect.com",
            hashed_password=pwd_hash,
            role="buyer",
            is_active=True
        )
        seller = User(
            email="seller@landconnect.com",
            hashed_password=pwd_hash,
            role="seller",
            is_active=True
        )
        broker = User(
            email="broker@landconnect.com",
            hashed_password=pwd_hash,
            role="broker",
            is_active=True
        )
        session.add_all([buyer, seller, broker])
        await session.flush()
        
        # User Profiles
        p_buyer = UserProfile(
            user_id=buyer.id,
            full_name="Alex Rivera",
            phone_number="+1 (555) 234-5678",
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
            bio="Active investor seeking residential and agricultural plots for sustainable development."
        )
        p_seller = UserProfile(
            user_id=seller.id,
            full_name="Sarah Jenkins",
            phone_number="+1 (555) 876-5432",
            avatar_url="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80",
            bio="Private landholder with prime acreage across Texas Hill Country and Colorado foothills."
        )
        p_broker = UserProfile(
            user_id=broker.id,
            full_name="Michael Vance",
            phone_number="+1 (555) 345-6789",
            avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
            bio="Senior Licensed Commercial & Agricultural Land Specialist. 14 years experience closing multi-acre acquisitions.",
            company_or_agency="Apex Land Realty Group",
            license_number="CA-DRE-01948210"
        )
        session.add_all([p_buyer, p_seller, p_broker])
        await session.flush()
        
        # 2. Seed Real Properties
        props_data = [
            {
                "owner_id": seller.id,
                "title": "Rolling Hills Ranch & Timberland",
                "description": "Stunning 45-acre parcel with mature hardwood oak timber, perennial creek, and rolling elevation changes. Road frontage on County Road 142 with available municipal water and high-voltage electric at the property boundary. Ideal for custom private ranch estate, equestrian facility, or recreational hunting retreat.",
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
                "images": [
                    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1500076656116-558758c991c1?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1200&q=80"
                ]
            },
            {
                "owner_id": seller.id,
                "title": "Sierra Foothills Panoramic Estate Lot",
                "description": "5.2-acre ready-to-build residential homesite situated above the fog line with sweeping panoramic views of the Sierra Nevada snowcaps. Perc-tested with approved 4-bedroom septic design, underground utilities stubbed, and graded driveway pad in place.",
                "price": 249000.0,
                "price_unit": "USD",
                "land_area": 5.2,
                "area_unit": "acres",
                "property_type": "residential",
                "status": "available",
                "address": "880 Whispering Pines Way",
                "city": "Auburn",
                "state": "California",
                "country": "United States",
                "latitude": 38.8966,
                "longitude": -121.0769,
                "zoning_classification": "R-1 Low Density Residential",
                "images": [
                    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80"
                ]
            },
            {
                "owner_id": broker.id,
                "title": "Industrial Logistics Land & Rail Access",
                "description": "Prime 18.5-acre development opportunity zoned Light Industrial (M-1) with direct spur access to regional freight rail. Fully flat topography with storm water detention basin engineering pre-approved. 3 miles from Interstate corridor.",
                "price": 1250000.0,
                "price_unit": "USD",
                "land_area": 18.5,
                "area_unit": "acres",
                "property_type": "industrial",
                "status": "available",
                "address": "400 Commerce Park Boulevard",
                "city": "Dallas",
                "state": "Texas",
                "country": "United States",
                "latitude": 32.7767,
                "longitude": -96.7970,
                "zoning_classification": "M-1 Heavy Commercial / Light Industrial",
                "images": [
                    "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80"
                ]
            },
            {
                "owner_id": broker.id,
                "title": "Biscayne Bay Perimeter Waterfront Parcel",
                "description": "Rare 2.4-acre deepwater canal-front development site. Riparian rights, existing composite seawall, and quick open-bay access with no fixed bridges. Architectural conceptual renderings for luxury multi-home enclave included.",
                "price": 2890000.0,
                "price_unit": "USD",
                "land_area": 2.4,
                "area_unit": "acres",
                "property_type": "residential",
                "status": "available",
                "address": "11200 Bayview Drive",
                "city": "Miami",
                "state": "Florida",
                "country": "United States",
                "latitude": 25.7617,
                "longitude": -80.1918,
                "zoning_classification": "T3-R Coastal Residential",
                "images": [
                    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80"
                ]
            },
            {
                "owner_id": seller.id,
                "title": "Sedona Red Rock Vista Homestead",
                "description": "10-acre unobstructed red rock view parcel bordering Coconino National Forest. Completely unencumbered dark-sky preserve, drilled domestic well producing 25 GPM, and solar micro-grid ready.",
                "price": 620000.0,
                "price_unit": "USD",
                "land_area": 10.0,
                "area_unit": "acres",
                "property_type": "residential",
                "status": "available",
                "address": "330 Canyon Mesa Trail",
                "city": "Sedona",
                "state": "Arizona",
                "country": "United States",
                "latitude": 34.8697,
                "longitude": -111.7610,
                "zoning_classification": "RC-1 Rural Conservation",
                "images": [
                    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80"
                ]
            }
        ]
        
        created_props = []
        for p in props_data:
            images = p.pop("images")
            prop = Property(**p)
            session.add(prop)
            await session.flush()
            
            for idx, img_url in enumerate(images):
                img = PropertyImage(
                    property_id=prop.id,
                    image_url=img_url,
                    is_primary=(idx == 0),
                    sort_order=idx
                )
                session.add(img)
            created_props.append(prop)
            
        # 3. Seed Buyer Favorites
        fav1 = PropertyFavorite(user_id=buyer.id, property_id=created_props[0].id)
        fav2 = PropertyFavorite(user_id=buyer.id, property_id=created_props[1].id)
        session.add_all([fav1, fav2])
        
        # 4. Seed Conversation between Buyer and Seller
        convo1 = Conversation(
            property_id=created_props[0].id,
            title="Inquiry: Rolling Hills Ranch"
        )
        session.add(convo1)
        await session.flush()
        
        cp1 = ConversationParticipant(conversation_id=convo1.id, user_id=buyer.id)
        cp2 = ConversationParticipant(conversation_id=convo1.id, user_id=seller.id)
        session.add_all([cp1, cp2])
        
        m1 = Message(
            conversation_id=convo1.id,
            sender_id=buyer.id,
            content="Hello Sarah! I am very interested in the 45-acre ranch in Fredericksburg. Are mineral rights included in the sale?",
            message_type="text"
        )
        m2 = Message(
            conversation_id=convo1.id,
            sender_id=seller.id,
            content="Hi Alex! Yes, 50% of executive mineral rights convey with the parcel. Would you like to do a live video call to review survey maps?",
            message_type="text"
        )
        session.add_all([m1, m2])
        
        # 5. Seed Meeting Room
        meeting = MeetingRoom(
            code="land-inspection-live",
            title="Virtual Boundary & Survey Inspection",
            host_id=broker.id,
            property_id=created_props[2].id,
            status="scheduled"
        )
        session.add(meeting)
        
        await session.commit()
        print("✅ Database seeding complete!")
        print("Demo Accounts:")
        print("  - Buyer:  buyer@landconnect.com  / Password123!")
        print("  - Seller: seller@landconnect.com / Password123!")
        print("  - Broker: broker@landconnect.com / Password123!")

if __name__ == "__main__":
    asyncio.run(seed_database())
