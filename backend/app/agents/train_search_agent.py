"""
Train Search Agent - Queries available trains from database
"""
from typing import List, Dict
from motor.motor_asyncio import AsyncIOMotorDatabase
import random
from datetime import datetime, timedelta

class Train:
    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)

class TrainSearchAgent:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.trains_collection = db["trains"]
    
    async def search_trains(self, criteria: dict) -> List[Dict]:
        """
        Search trains matching the criteria
        """
        print(f"[Train Search Agent] Searching: {criteria['from_city']} → {criteria['to_city']}")
        
        query = {
            "from_city": criteria["from_city"],
            "to_city": criteria["to_city"],
            "active": True
        }
        
        trains = await self.trains_collection.find(query).to_list(length=None)
        
        # Sort by departure time
        trains.sort(key=lambda x: x.get("departure_time", "00:00"))
        
        print(f"✓ [Train Search Agent] Found {len(trains)} trains")
        
        return trains
    
    async def get_train_by_id(self, train_id: str) -> Dict:
        """Get specific train by ID"""
        train = await self.trains_collection.find_one({"_id": train_id})
        return train
    
    async def generate_sample_trains(self):
        """
        Generate sample trains for testing
        (Call this once to populate database)
        """
        routes = [
            {"from": "DELHI", "to": "MUMBAI", "distance": 1438},
            {"from": "DELHI", "to": "BANGALORE", "distance": 2156},
            {"from": "DELHI", "to": "KOLKATA", "distance": 1450},
            {"from": "MUMBAI", "to": "BANGALORE", "distance": 981},
            {"from": "MUMBAI", "to": "DELHI", "distance": 1438},
            {"from": "BANGALORE", "to": "DELHI", "distance": 2156},
            {"from": "BANGALORE", "to": "MUMBAI", "distance": 981},
            {"from": "KOLKATA", "to": "DELHI", "distance": 1450},
            {"from": "DELHI", "to": "HYDERABAD", "distance": 1576},
            {"from": "MUMBAI", "to": "HYDERABAD", "distance": 725},
        ]
        
        train_names = [
            "Rajdhani Express", "Shatabdi Express", "Duronto Express",
            "Garib Rath", "Janta Express", "Express Train",
            "Superfast Express", "Mail Express"
        ]
        
        trains_to_insert = []
        train_id = 1
        
        for route in routes:
            for i in range(12):  # 12 trains per route
                dep_hour = random.randint(0, 23)
                dep_minute = random.randint(0, 3) * 15
                dep_time = f"{str(dep_hour).zfill(2)}:{str(dep_minute).zfill(2)}"
                
                # Calculate arrival
                duration_hours = 8 + (route["distance"] // 60)
                arr_hour = (dep_hour + duration_hours) % 24
                arr_time = f"{str(arr_hour).zfill(2)}:{str(dep_minute).zfill(2)}"
                
                trains_to_insert.append({
                    "_id": f"TRAIN_{train_id}",
                    "number": f"{10000 + train_id}",
                    "name": train_names[random.randint(0, len(train_names)-1)],
                    "from_city": route["from"],
                    "to_city": route["to"],
                    "departure_time": dep_time,
                    "arrival_time": arr_time,
                    "duration": f"{duration_hours}h {dep_minute}m",
                    "distance": route["distance"],
                    "available_seats": {
                        "sleeper": random.randint(10, 50),
                        "ac2": random.randint(5, 30),
                        "ac3": random.randint(15, 40),
                    },
                    "berth_availability": {
                        "lower": random.randint(2, 20),
                        "middle": random.randint(2, 20),
                        "upper": random.randint(2, 20),
                        "side_lower": random.randint(1, 10),
                        "side_upper": random.randint(1, 10),
                    },
                    "rac_seats": random.randint(2, 20),
                    "waitlist_number": random.randint(0, 50),
                    "price": {
                        "sleeper": int(route["distance"] * 0.8),
                        "ac2": int(route["distance"] * 1.5),
                        "ac3": int(route["distance"] * 2.0),
                    },
                    "tatkal_price": {
                        "sleeper": int(route["distance"] * 0.8 * 1.3),
                        "ac2": int(route["distance"] * 1.5 * 1.3),
                        "ac3": int(route["distance"] * 2.0 * 1.3),
                    },
                    "active": True,
                    "created_at": datetime.now()
                })
                
                train_id += 1
        
        # Clear existing trains and insert new ones
        await self.trains_collection.delete_many({})
        result = await self.trains_collection.insert_many(trains_to_insert)
        print(f"✓ Generated {len(result.inserted_ids)} trains in MongoDB")
