"""
Ranking Agent - Scores and ranks trains based on multiple factors
"""

from datetime import datetime
from typing import List, Dict
from backend.models import RankingScore

class RankingAgent:
    """Ranks trains based on scoring algorithm"""
    
    def __init__(self):
        self.name = "RankingAgent"
        self.session_id = ""
        # Weights for each scoring factor
        self.weights = {
            "availability": 0.25,
            "speed": 0.20,
            "price": 0.20,
            "tatkalSuccess": 0.20,
            "berthMatch": 0.15
        }
    
    async def rank_trains(self, trains: List[Dict], intent: dict, session_id: str = "") -> dict:
        """
        Rank trains based on multiple scoring factors
        
        Args:
            trains: List of trains from search results
            intent: Search intent from IntentAgent
            session_id: Unique session identifier
            
        Returns:
            dict with ranked trains and scoring details
        """
        self.session_id = session_id
        
        activity = {
            "timestamp": int(datetime.utcnow().timestamp()),
            "agent": self.name,
            "action": "rank_trains",
            "status": "running",
            "sessionId": session_id
        }
        
        try:
            if not trains:
                activity["status"] = "completed"
                activity["details"] = {"trainsRanked": 0}
                return {
                    "success": True,
                    "rankedTrains": [],
                    "activity": activity
                }
            
            # Score each train
            scored_trains = []
            for train in trains:
                score = await self._calculate_score(train, intent)
                scored_trains.append({
                    "train": train,
                    "score": score
                })
            
            # Sort by total score (descending)
            scored_trains.sort(key=lambda x: x["score"]["totalScore"], reverse=True)
            
            # Prepare ranked results
            ranked_results = [
                {
                    "train": st["train"],
                    "ranking": {
                        "position": idx + 1,
                        "totalScore": st["score"]["totalScore"],
                        "availabilityScore": st["score"]["availabilityScore"],
                        "speedScore": st["score"]["speedScore"],
                        "priceScore": st["score"]["priceScore"],
                        "tatkalSuccessProbability": st["score"]["tatkalSuccessProbability"],
                        "berthMatchScore": st["score"]["berthMatchScore"],
                        "reasoning": st["score"]["reasoning"]
                    }
                }
                for idx, st in enumerate(scored_trains)
            ]
            
            activity["status"] = "completed"
            activity["details"] = {
                "trainsRanked": len(scored_trains),
                "topTrain": ranked_results[0]["train"].get("name") if ranked_results else None,
                "topScore": ranked_results[0]["ranking"]["totalScore"] if ranked_results else 0
            }
            
            return {
                "success": True,
                "rankedTrains": ranked_results,
                "topRecommendation": ranked_results[0] if ranked_results else None,
                "activity": activity
            }
        
        except Exception as e:
            activity["status"] = "failed"
            activity["details"] = {"error": str(e)}
            
            return {
                "success": False,
                "error": f"Train ranking failed: {str(e)}",
                "rankedTrains": [],
                "activity": activity
            }
    
    async def _calculate_score(self, train: Dict, intent: dict) -> Dict:
        """Calculate composite score for a train"""
        
        class_type = intent.get("class", "sleeper").lower()
        
        # Calculate individual scores (0-1 scale)
        availability_score = self._score_availability(train, class_type)
        speed_score = self._score_speed(train)
        price_score = self._score_price(train, intent, class_type)
        tatkal_score = self._score_tatkal_success(train, intent)
        berth_score = self._score_berth_match(train, intent)
        
        # Calculate weighted total score (0-100 scale)
        total_score = (
            (availability_score * self.weights["availability"] +
             speed_score * self.weights["speed"] +
             price_score * self.weights["price"] +
             tatkal_score * self.weights["tatkalSuccess"] +
             berth_score * self.weights["berthMatch"]) * 100
        )
        
        # Generate reasoning
        reasoning = self._generate_reasoning(
            train, availability_score, speed_score, price_score, 
            tatkal_score, berth_score, intent
        )
        
        return {
            "availabilityScore": round(availability_score, 2),
            "speedScore": round(speed_score, 2),
            "priceScore": round(price_score, 2),
            "tatkalSuccessProbability": round(tatkal_score, 2),
            "berthMatchScore": round(berth_score, 2),
            "totalScore": round(total_score, 2),
            "reasoning": reasoning
        }
    
    def _score_availability(self, train: Dict, class_type: str) -> float:
        """Score based on seat availability (0-1)"""
        available = train.get("availableSeats", {}).get(class_type, 0)
        rac = train.get("racSeats", 0)
        
        if available >= 5:
            return 1.0
        elif available >= 3:
            return 0.8
        elif available >= 1:
            return 0.6
        elif rac > 0:
            return 0.4
        else:
            return 0.2  # Only waitlist
    
    def _score_speed(self, train: Dict) -> float:
        """Score based on journey duration (0-1)"""
        try:
            duration = train.get("duration", "00:00")
            hours = int(duration.split(":")[0])
            
            if hours <= 8:
                return 1.0
            elif hours <= 12:
                return 0.8
            elif hours <= 18:
                return 0.6
            elif hours <= 24:
                return 0.4
            else:
                return 0.2
        except:
            return 0.5
    
    def _score_price(self, train: Dict, intent: dict, class_type: str) -> float:
        """Score based on price competitiveness (0-1)"""
        try:
            is_tatkal = intent.get("isTatkal", False)
            price_key = "tatkalPrice" if is_tatkal else "price"
            price = train.get(price_key, {}).get(class_type, 9999)
            
            # Score inversely to price (lower price = higher score)
            if price <= 1000:
                return 1.0
            elif price <= 2000:
                return 0.8
            elif price <= 3500:
                return 0.6
            elif price <= 5000:
                return 0.4
            else:
                return 0.2
        except:
            return 0.5
    
    def _score_tatkal_success(self, train: Dict, intent: dict) -> float:
        """Score likelihood of Tatkal booking success (0-1)"""
        if not intent.get("isTatkal"):
            return 0.5  # Neutral for non-Tatkal
        
        available = train.get("availableSeats", {}).get("sleeper", 0)
        
        if available > 10:
            return 1.0
        elif available > 5:
            return 0.9
        elif available > 2:
            return 0.7
        elif available > 0:
            return 0.5
        else:
            return 0.3  # Low chance but possible with RAC->CNF conversion
    
    def _score_berth_match(self, train: Dict, intent: dict) -> float:
        """Score berth preference matching (0-1)"""
        pref = intent.get("berthPreference", "NO_PREFERENCE")
        if pref == "NO_PREFERENCE":
            return 1.0
        
        availability = train.get("berthAvailability", {})
        
        if pref == "LOWER":
            lower = availability.get("lower", 0) + availability.get("sideLower", 0)
            return 1.0 if lower > 0 else 0.4
        elif pref == "MIDDLE":
            middle = availability.get("middle", 0)
            return 1.0 if middle > 0 else 0.4
        elif pref == "UPPER":
            upper = availability.get("upper", 0) + availability.get("sideUpper", 0)
            return 1.0 if upper > 0 else 0.4
        
        return 0.5
    
    def _generate_reasoning(self, train: Dict, avail: float, speed: float, 
                            price: float, tatkal: float, berth: float, intent: dict) -> List[str]:
        """Generate human-readable reasoning for the score"""
        reasons = []
        
        # Availability reasoning
        available = train.get("availableSeats", {}).get(intent.get("class", "sleeper"), 0)
        if available >= 5:
            reasons.append(f"Excellent availability ({available} seats)")
        elif available >= 1:
            reasons.append(f"Limited availability ({available} seats)")
        else:
            reasons.append("Only RAC/Waitlist available")
        
        # Speed reasoning
        duration = train.get("duration", "N/A")
        reasons.append(f"Journey time: {duration}")
        
        # Price reasoning
        class_type = intent.get("class", "sleeper").lower()
        price_key = "tatkalPrice" if intent.get("isTatkal") else "price"
        price = train.get(price_key, {}).get(class_type, "N/A")
        if isinstance(price, int):
            reasons.append(f"₹{price} per seat")
        
        # Tatkal reasoning
        if intent.get("isTatkal"):
            reasons.append(f"Tatkal success probability: {int(tatkal*100)}%")
        
        return reasons
