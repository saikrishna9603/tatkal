"""
MongoDB Atlas Database Connection and Operations
"""

from motor.motor_asyncio import AsyncIOMotorClient
try:
    from backend.config import MONGODB_URL, DB_NAME, COLLECTIONS
except ImportError:
    from config import MONGODB_URL, DB_NAME, COLLECTIONS
from typing import List, Dict, Optional, Any
import asyncio

class MongoDBClient:
    """MongoDB Atlas async client wrapper"""
    
    client = None
    db = None
    
    @classmethod
    async def connect_db(cls):
        """Establish connection to MongoDB Atlas"""
        try:
            cls.client = AsyncIOMotorClient(MONGODB_URL, serverSelectionTimeoutMS=5000)
            cls.db = cls.client[DB_NAME]
            
            # Test connection
            await cls.db.command('ping')
            print("✓ MongoDB Atlas connected successfully")
            print(f"✓ Database: {DB_NAME}")
            
        except Exception as e:
            print(f"⚠ MongoDB connection warning: {e}")
            print("⚠ Backend will run with demo data. MongoDB will connect when available.")
            # Don't raise - allow app to start anyway
    
    @classmethod
    async def close_db(cls):
        """Close MongoDB connection"""
        if cls.client:
            cls.client.close()
            print("✓ MongoDB connection closed")
    
    @classmethod
    def get_collection(cls, collection_name: str):
        """Get specific collection"""
        return cls.db[collection_name]


class TrainRepository:
    """Train data operations"""
    
    @staticmethod
    async def create_trains(trains: List[Dict]) -> int:
        """Insert trains into database"""
        collection = MongoDBClient.get_collection(COLLECTIONS["trains"])
        result = await collection.insert_many(trains)
        return len(result.inserted_ids)
    
    @staticmethod
    async def find_trains(query: Dict) -> List[Dict]:
        """Find trains by criteria"""
        collection = MongoDBClient.get_collection(COLLECTIONS["trains"])
        trains = await collection.find(query).to_list(None)
        return trains
    
    @staticmethod
    async def find_by_route(from_city: str, to_city: str) -> List[Dict]:
        """Find trains by route"""
        collection = MongoDBClient.get_collection(COLLECTIONS["trains"])
        trains = await collection.find({
            "from": from_city.upper(),
            "to": to_city.upper()
        }).to_list(None)
        return trains
    
    @staticmethod
    async def get_all_trains() -> List[Dict]:
        """Get all trains"""
        collection = MongoDBClient.get_collection(COLLECTIONS["trains"])
        trains = await collection.find().to_list(None)
        return trains


class BookingRepository:
    """Booking data operations"""
    
    @staticmethod
    async def create_booking(booking_data: Dict) -> str:
        """Create new booking"""
        collection = MongoDBClient.get_collection(COLLECTIONS["bookings"])
        result = await collection.insert_one(booking_data)
        return str(result.inserted_id)
    
    @staticmethod
    async def find_booking(booking_id: str) -> Optional[Dict]:
        """Find booking by ID"""
        from bson import ObjectId
        collection = MongoDBClient.get_collection(COLLECTIONS["bookings"])
        booking = await collection.find_one({"_id": ObjectId(booking_id)})
        return booking
    
    @staticmethod
    async def update_booking(booking_id: str, update_data: Dict) -> bool:
        """Update booking status"""
        from bson import ObjectId
        collection = MongoDBClient.get_collection(COLLECTIONS["bookings"])
        result = await collection.update_one(
            {"_id": ObjectId(booking_id)},
            {"$set": update_data}
        )
        return result.modified_count > 0
    
    @staticmethod
    async def find_user_bookings(user_id: str) -> List[Dict]:
        """Find all bookings for a user"""
        collection = MongoDBClient.get_collection(COLLECTIONS["bookings"])
        bookings = await collection.find({"user_id": user_id}).to_list(None)
        return bookings


class AgentActivityRepository:
    """Agent activity logging"""
    
    @staticmethod
    async def log_activity(activity_data: Dict) -> str:
        """Log agent activity"""
        collection = MongoDBClient.get_collection(COLLECTIONS["agent_activities"])
        result = await collection.insert_one(activity_data)
        return str(result.inserted_id)
    
    @staticmethod
    async def get_activities(limit: int = 100) -> List[Dict]:
        """Get recent activities"""
        collection = MongoDBClient.get_collection(COLLECTIONS["agent_activities"])
        activities = await collection.find().sort("_id", -1).limit(limit).to_list(None)
        return activities
    
    @staticmethod
    async def get_session_activities(session_id: str) -> List[Dict]:
        """Get activities for a session"""
        collection = MongoDBClient.get_collection(COLLECTIONS["agent_activities"])
        activities = await collection.find({
            "session_id": session_id
        }).to_list(None)
        return activities


class SearchLogRepository:
    """Search query logging"""
    
    @staticmethod
    async def log_search(search_data: Dict) -> str:
        """Log search query"""
        collection = MongoDBClient.get_collection(COLLECTIONS["search_logs"])
        result = await collection.insert_one(search_data)
        return str(result.inserted_id)
    
    @staticmethod
    async def get_search_history(user_id: str, limit: int = 10) -> List[Dict]:
        """Get user search history"""
        collection = MongoDBClient.get_collection(COLLECTIONS["search_logs"])
        logs = await collection.find({
            "user_id": user_id
        }).sort("_id", -1).limit(limit).to_list(None)
        return logs
