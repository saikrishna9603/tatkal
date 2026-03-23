"""
Fallback Agent - Implements contingency strategies for unavailable trains
"""

from datetime import datetime, timedelta
from typing import List, Dict, Optional

class FallbackAgent:
    """Provides fallback and contingency strategies for unavailable trains"""
    
    def __init__(self):
        self.name = "FallbackAgent"
        self.session_id = ""
    
    async def execute_fallback_strategy(self, preferred_train: Dict, all_trains: List[Dict], 
                                       intent: dict, session_id: str = "") -> dict:
        """
        Execute fallback strategies when preferred train is unavailable
        
        Args:
            preferred_train: The preferred train from ranking
            all_trains: All available trains in results
            intent: Search intent
            session_id: Unique session identifier
            
        Returns:
            dict with alternative options and strategies
        """
        self.session_id = session_id
        
        activity = {
            "timestamp": int(datetime.utcnow().timestamp()),
            "agent": self.name,
            "action": "execute_fallback",
            "status": "running",
            "sessionId": session_id
        }
        
        try:
            class_type = intent.get("class", "sleeper").lower()
            is_available = self._check_train_availability(preferred_train, class_type)
            
            if is_available:
                activity["status"] = "completed"
                activity["details"] = {"status": "preferred_train_available"}
                
                return {
                    "success": True,
                    "preferredTrainAvailable": True,
                    "strategies": [],
                    "activity": activity
                }
            
            # Preferred train not available, execute fallback strategies
            strategies = []
            
            # Strategy 1: Waitlist option
            if preferred_train.get("waitlistNumber", 0) < 50:  # Good waitlist position
                strategies.append({
                    "strategy": "WAITLIST",
                    "priority": 1,
                    "description": f"Join waitlist (current position: WL/{preferred_train.get('waitlistNumber')})",
                    "probability": self._calculate_waitlist_conversion_probability(
                        preferred_train, class_type
                    ),
                    "recommendation": "Recommended if position is low",
                    "action": {
                        "type": "waitlist_booking",
                        "trainId": preferred_train.get("_id"),
                        "class": class_type
                    }
                })
            
            # Strategy 2: RAC (Reservation Against Cancellation)
            if preferred_train.get("racSeats", 0) > 0:
                strategies.append({
                    "strategy": "RAC",
                    "priority": 1,
                    "description": f"Booked as RAC (can convert to confirmed seat)",
                    "probability": 0.65,
                    "recommendation": "High chance of confirmation",
                    "action": {
                        "type": "rac_booking",
                        "trainId": preferred_train.get("_id"),
                        "class": class_type
                    }
                })
            
            # Strategy 3: Alternative class
            alt_class = self._suggest_alternative_class(preferred_train, class_type)
            if alt_class and alt_class != class_type:
                alt_availability = preferred_train.get("availableSeats", {}).get(alt_class, 0)
                if alt_availability > 0:
                    strategies.append({
                        "strategy": "ALTERNATIVE_CLASS",
                        "priority": 2,
                        "description": f"Book {alt_class.upper()} instead (same train)",
                        "availableSeats": alt_availability,
                        "recommendation": "Better comfort option",
                        "action": {
                            "type": "upgraded_class_booking",
                            "trainId": preferred_train.get("_id"),
                            "fromClass": class_type,
                            "toClass": alt_class
                        }
                    })
            
            # Strategy 4: Alternative date (next day)
            strategies.append({
                "strategy": "ALTERNATIVE_DATE",
                "priority": 2,
                "description": "Book next day for confirmed seat",
                "recommendation": "If schedule flexibility exists",
                "action": {
                    "type": "date_extension",
                    "trainId": preferred_train.get("_id"),
                    "currentDate": intent.get("date"),
                    "alternateDate": self._get_next_available_date(intent.get("date"))
                }
            })
            
            # Strategy 5: Alternative train
            alternatives = self._find_alternative_trains(all_trains, preferred_train, intent)
            if alternatives:
                for alt_train in alternatives[:2]:  # Top 2 alternatives
                    strategies.append({
                        "strategy": "ALTERNATIVE_TRAIN",
                        "priority": 3,
                        "trainName": alt_train.get("name"),
                        "trainNumber": alt_train.get("number"),
                        "departureTime": alt_train.get("departureTime"),
                        "arrivalTime": alt_train.get("arrivalTime"),
                        "availableSeats": alt_train.get("availableSeats", {}).get(class_type, 0),
                        "description": f"Try {alt_train.get('name')} ({alt_train.get('departureTime')})",
                        "recommendation": "Different timing, same route",
                        "action": {
                            "type": "alternative_train_booking",
                            "trainId": alt_train.get("_id"),
                            "class": class_type
                        }
                    })
            
            # Strategy 6: Combination booking
            if len(all_trains) > 1:
                strategies.append({
                    "strategy": "COMBINATION_BOOKING",
                    "priority": 3,
                    "description": "Book multiple trains for segment coverage",
                    "recommendation": "Complex but comprehensive solution",
                    "action": {
                        "type": "multi_train_booking",
                        "segments": []
                    }
                })
            
            activity["status"] = "completed"
            activity["details"] = {
                "preferredTrainAvailable": False,
                "strategiesGenerated": len(strategies),
                "topStrategy": strategies[0].get("strategy") if strategies else None
            }
            
            return {
                "success": True,
                "preferredTrainAvailable": False,
                "strategies": strategies,
                "recommendedStrategy": strategies[0] if strategies else None,
                "activity": activity
            }
        
        except Exception as e:
            activity["status"] = "failed"
            activity["details"] = {"error": str(e)}
            
            return {
                "success": False,
                "error": f"Fallback strategy execution failed: {str(e)}",
                "strategies": [],
                "activity": activity
            }
    
    def _check_train_availability(self, train: Dict, class_type: str) -> bool:
        """Check if train has confirmed seats in requested class"""
        available = train.get("availableSeats", {}).get(class_type, 0)
        return available > 0
    
    def _calculate_waitlist_conversion_probability(self, train: Dict, class_type: str) -> float:
        """Calculate probability of waitlist converting to confirmed seat"""
        waitlist_num = train.get("waitlistNumber", 0)
        
        if waitlist_num == 0:
            return 0.0
        elif waitlist_num <= 10:
            return 0.85
        elif waitlist_num <= 25:
            return 0.65
        elif waitlist_num <= 50:
            return 0.40
        else:
            return 0.15
    
    def _suggest_alternative_class(self, train: Dict, current_class: str) -> Optional[str]:
        """Suggest an alternative class if current is unavailable"""
        class_hierarchy = ["ac2", "ac3", "sleeper"]
        
        try:
            current_idx = class_hierarchy.index(current_class)
        except ValueError:
            return None
        
        # Try next higher class first (better comfort)
        for i in range(current_idx):
            alt_class = class_hierarchy[i]
            if train.get("availableSeats", {}).get(alt_class, 0) > 0:
                return alt_class
        
        # Then try lower classes
        for i in range(current_idx + 1, len(class_hierarchy)):
            alt_class = class_hierarchy[i]
            if train.get("availableSeats", {}).get(alt_class, 0) > 0:
                return alt_class
        
        return None
    
    def _get_next_available_date(self, current_date: str) -> str:
        """Get next date for availability check"""
        try:
            date_obj = datetime.strptime(current_date, "%Y-%m-%d")
            next_date = date_obj + timedelta(days=1)
            return next_date.strftime("%Y-%m-%d")
        except:
            return "N/A"
    
    def _find_alternative_trains(self, all_trains: List[Dict], preferred_train: Dict, 
                                 intent: dict) -> List[Dict]:
        """Find alternative trains with similar route/timing"""
        class_type = intent.get("class", "sleeper").lower()
        alternatives = []
        
        for train in all_trains:
            if train.get("_id") == preferred_train.get("_id"):
                continue  # Skip preferred train itself
            
            # Check if has availability
            if train.get("availableSeats", {}).get(class_type, 0) > 0:
                # Check if timing is different but reasonable
                try:
                    pref_time = datetime.strptime(preferred_train.get("departureTime", "00:00"), "%H:%M")
                    alt_time = datetime.strptime(train.get("departureTime", "00:00"), "%H:%M")
                    time_diff = abs((alt_time - pref_time).total_seconds() / 3600)
                    
                    # Accept if within 4 hours
                    if time_diff >= 1 and time_diff <= 4:
                        alternatives.append(train)
                except:
                    pass
        
        return alternatives[:3]  # Return top 3 alternatives
