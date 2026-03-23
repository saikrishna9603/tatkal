"""
Train Search Agent - Retrieves trains matching search criteria
"""

from datetime import datetime
from typing import List, Dict, Optional
from backend.database import TrainRepository

class TrainSearchAgent:
    """Searches for trains matching given criteria"""
    
    def __init__(self):
        self.name = "TrainSearchAgent"
        self.session_id = ""
        self.train_repo = None
    
    async def search_trains(self, intent: dict, session_id: str = "", train_repo: Optional[TrainRepository] = None) -> dict:
        """
        Search for trains matching intent criteria
        
        Args:
            intent: Parsed intent from IntentAgent
            session_id: Unique session identifier
            train_repo: TrainRepository instance
            
        Returns:
            dict with matching trains and search metadata
        """
        self.session_id = session_id
        self.train_repo = train_repo
        
        activity = {
            "timestamp": int(datetime.utcnow().timestamp()),
            "agent": self.name,
            "action": "search_trains",
            "status": "running",
            "sessionId": session_id
        }
        
        try:
            if not train_repo:
                raise ValueError("TrainRepository is required")
            
            # Build query from intent
            query = {
                "from_city": intent.get("from"),
                "to_city": intent.get("to")
            }
            
            # Execute search
            trains = await train_repo.find_trains(query)
            
            if not trains:
                activity["status"] = "completed"
                activity["details"] = {
                    "trainsFound": 0,
                    "searchCriteria": intent
                }
                
                return {
                    "success": True,
                    "trains": [],
                    "searchMetadata": {
                        "totalTrains": 0,
                        "searchTime": datetime.utcnow().isoformat(),
                        "filtersApplied": self._describe_filters(intent)
                    },
                    "activity": activity
                }
            
            # Filter trains based on intent
            filtered_trains = await self._apply_filters(trains, intent)
            
            # Sort by departure time
            filtered_trains.sort(
                key=lambda t: datetime.strptime(t.get("departureTime"), "%H:%M")
            )
            
            activity["status"] = "completed"
            activity["details"] = {
                "trainsFound": len(trains),
                "trainsFiltered": len(filtered_trains),
                "searchCriteria": intent,
                "filtersApplied": self._describe_filters(intent)
            }
            
            return {
                "success": True,
                "trains": filtered_trains,
                "totalResults": len(trains),
                "filteredResults": len(filtered_trains),
                "searchMetadata": {
                    "from": intent.get("from"),
                    "to": intent.get("to"),
                    "date": intent.get("date"),
                    "classFilter": intent.get("class"),
                    "totalTrains": len(trains),
                    "searchTime": datetime.utcnow().isoformat(),
                    "filtersApplied": self._describe_filters(intent)
                },
                "activity": activity
            }
        
        except Exception as e:
            activity["status"] = "failed"
            activity["details"] = {"error": str(e)}
            
            return {
                "success": False,
                "error": f"Train search failed: {str(e)}",
                "trains": [],
                "activity": activity
            }
    
    async def _apply_filters(self, trains: List[Dict], intent: dict) -> List[Dict]:
        """Apply filters to trains based on intent"""
        filtered = trains
        
        # Filter by class availability
        class_filter = intent.get("class", "sleeper").lower()
        filtered = [
            t for t in filtered 
            if self._has_class_availability(t, class_filter)
        ]
        
        # Filter by passenger count
        passenger_count = intent.get("passengerCount", 1)
        filtered = [
            t for t in filtered
            if self._has_enough_seats(t, class_filter, passenger_count)
        ]
        
        # If Tatkal, filter by Tatkal seats
        if intent.get("isTatkal"):
            filtered = [
                t for t in filtered
                if t.get("tatkalPrice", {}).get(class_filter, 0) > 0
            ]
        
        return filtered
    
    def _has_class_availability(self, train: Dict, class_type: str) -> bool:
        """Check if train has the requested class"""
        available_seats = train.get("availableSeats", {})
        return available_seats.get(class_type, 0) > 0
    
    def _has_enough_seats(self, train: Dict, class_type: str, count: int) -> bool:
        """Check if train has enough seats for passengers"""
        available_seats = train.get("availableSeats", {})
        return available_seats.get(class_type, 0) >= count
    
    def _describe_filters(self, intent: dict) -> List[str]:
        """Describe which filters were applied"""
        filters = []
        if intent.get("class"):
            filters.append(f"class={intent.get('class')}")
        if intent.get("quota"):
            filters.append(f"quota={intent.get('quota')}")
        if intent.get("berthPreference") and intent.get("berthPreference") != "NO_PREFERENCE":
            filters.append(f"berth={intent.get('berthPreference')}")
        if intent.get("passengerCount"):
            filters.append(f"passengers={intent.get('passengerCount')}")
        return filters if filters else ["none"]
