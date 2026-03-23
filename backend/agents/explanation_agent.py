"""
Explanation Agent - Provides reasoning for AI decisions and rankings
"""

from datetime import datetime
from typing import Dict, List, Optional

class ExplanationAgent:
    """Generates natural language explanations for booking decisions"""
    
    def __init__(self):
        self.name = "ExplanationAgent"
        self.session_id = ""
    
    async def explain_ranking(self, ranking_result: Dict, intent: dict, session_id: str = "") -> dict:
        """
        Explain why trains are ranked in a particular order
        
        Args:
            ranking_result: Result from RankingAgent with ranked trains
            intent: Original search intent
            session_id: Unique session identifier
            
        Returns:
            dict with detailed explanations
        """
        self.session_id = session_id
        
        activity = {
            "timestamp": int(datetime.utcnow().timestamp()),
            "agent": self.name,
            "action": "explain_ranking",
            "status": "running",
            "sessionId": session_id
        }
        
        try:
            explanations = []
            ranked_trains = ranking_result.get("rankedTrains", [])
            
            for idx, train_result in enumerate(ranked_trains[:5]):  # Top 5 trains
                train = train_result.get("train", {})
                ranking = train_result.get("ranking", {})
                
                explanation = {
                    "position": idx + 1,
                    "trainName": train.get("name"),
                    "trainNumber": train.get("number"),
                    "score": ranking.get("totalScore"),
                    "explanation": self._generate_train_explanation(train, ranking, intent),
                    "pros": self._extract_pros(train, ranking, intent),
                    "cons": self._extract_cons(train, ranking, intent),
                    "bestFor": self._determine_best_for(train, ranking, intent)
                }
                
                explanations.append(explanation)
            
            # Generate overall comparison explanation
            overall_explanation = self._generate_overall_comparison(ranked_trains, intent)
            
            activity["status"] = "completed"
            activity["details"] = {
                "trainExplained": len(explanations),
                "topTrain": explanations[0].get("trainName") if explanations else None
            }
            
            return {
                "success": True,
                "explanations": explanations,
                "overallComparison": overall_explanation,
                "activity": activity
            }
        
        except Exception as e:
            activity["status"] = "failed"
            activity["details"] = {"error": str(e)}
            
            return {
                "success": False,
                "error": f"Explanation generation failed: {str(e)}",
                "activity": activity
            }
    
    async def explain_booking_decision(self, booking_result: Dict, intent: dict) -> dict:
        """
        Explain why a particular train was chosen for booking
        
        Args:
            booking_result: Result from booking process
            intent: Original search intent
            
        Returns:
            dict with decision explanation
        """
        try:
            explanation = {
                "decision": "BOOKING_CONFIRMED",
                "pnr": booking_result.get("pnrNumber"),
                "reasoning": [
                    f"Train selected based on highest composite score ({booking_result.get('score', 'N/A')} points)",
                    f"Availability: {booking_result.get('availabilityReason', 'Seats available')}",
                    f"Duration: {booking_result.get('duration', 'Reasonable')}",
                    f"Price: Competitive within class"
                ],
                "alternativeApproaches": [
                    "Could have chosen next-ranked train (slightly lower score but similar amenities)",
                    "Could have waited for different date (might have better prices)",
                    "Could have chosen different class (more options available)"
                ],
                "riskAssessment": {
                    "cancelationRisk": "LOW",
                    "waitlistRisk": "NONE (confirmed booking)",
                    "priceChangeRisk": "NONE (locked in)"
                }
            }
            
            return {
                "success": True,
                "explanation": explanation
            }
        
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def _generate_train_explanation(self, train: Dict, ranking: Dict, intent: dict) -> str:
        """Generate explanation for why this train scored well"""
        parts = []
        
        # Start with the score
        score = ranking.get("totalScore", 0)
        parts.append(f"This train scores {score}/100 overall.")
        
        # Add score components
        avail_score = ranking.get("availabilityScore", 0)
        if avail_score > 0.8:
            parts.append("Strong seat availability.")
        elif avail_score > 0.5:
            parts.append("Moderate availability, but some seats may be limited.")
        
        speed_score = ranking.get("speedScore", 0)
        duration = train.get("duration", "N/A")
        if speed_score > 0.8:
            parts.append(f"Fast journey ({duration}), saving travel time.")
        elif speed_score > 0.5:
            parts.append(f"Reasonable journey time ({duration}).")
        
        price_score = ranking.get("priceScore", 0)
        price_key = "tatkalPrice" if intent.get("isTatkal") else "price"
        price = train.get(price_key, {}).get(intent.get("class", "sleeper"), "N/A")
        if price_score > 0.8:
            parts.append(f"Excellent value at ₹{price}.")
        elif price_score > 0.5:
            parts.append(f"Competitive pricing at ₹{price}.")
        
        # Tatkal reasoning
        if intent.get("isTatkal"):
            tatkal_prob = ranking.get("tatkalSuccessProbability", 0)
            parts.append(f"High Tatkal booking success probability ({int(tatkal_prob*100)}%).")
        
        return " ".join(parts)
    
    def _extract_pros(self, train: Dict, ranking: Dict, intent: dict) -> List[str]:
        """Extract key strengths of this train"""
        pros = []
        
        if ranking.get("availabilityScore", 0) > 0.7:
            available = train.get("availableSeats", {}).get(intent.get("class", "sleeper"), 0)
            pros.append(f"Many seats available ({available} in your class)")
        
        if ranking.get("speedScore", 0) > 0.7:
            pros.append(f"Fast journey ({train.get('duration', 'N/A')})")
        
        if ranking.get("priceScore", 0) > 0.7:
            pros.append("Excellent price for the class")
        
        if train.get("name", "").lower().find("express") >= 0:
            pros.append("Premium express service")
        
        # Berth preferences
        if intent.get("berthPreference") != "NO_PREFERENCE":
            avail = train.get("berthAvailability", {})
            if avail.get(intent.get("berthPreference", "").lower(), 0) > 0:
                pros.append(f"Your preferred {intent.get('berthPreference')} berth available")
        
        return pros if pros else ["Good overall score"]
    
    def _extract_cons(self, train: Dict, ranking: Dict, intent: dict) -> List[str]:
        """Extract potential drawbacks of this train"""
        cons = []
        
        if ranking.get("availabilityScore", 0) < 0.5:
            rac = train.get("racSeats", 0)
            if rac > 0:
                cons.append(f"Limited confirmed seats, only RAC available (position {rac})")
            else:
                cons.append("Mostly waitlisted - low chance of confirmation")
        
        if ranking.get("speedScore", 0) < 0.5:
            duration = train.get("duration", "N/A")
            cons.append(f"Long journey time ({duration})")
        
        if ranking.get("priceScore", 0) < 0.5:
            cons.append("Higher price for this route")
        
        if intent.get("berthPreference") != "NO_PREFERENCE":
            avail = train.get("berthAvailability", {})
            if avail.get(intent.get("berthPreference", "").lower(), 0) == 0:
                cons.append(f"Your preferred berth unavailable")
        
        return cons if cons else ["No significant drawbacks"]
    
    def _determine_best_for(self, train: Dict, ranking: Dict, intent: dict) -> str:
        """Determine what type of traveler this train is best for"""
        score_components = {
            "availability": ranking.get("availabilityScore", 0),
            "speed": ranking.get("speedScore", 0),
            "price": ranking.get("priceScore", 0)
        }
        
        max_component = max(score_components, key=score_components.get)
        
        if max_component == "availability":
            return "Travelers prioritizing guaranteed seating and comfort"
        elif max_component == "speed":
            return "Travelers in a hurry or with tight schedules"
        elif max_component == "price":
            return "Budget-conscious travelers"
        else:
            return "Balanced travelers looking for good value"
    
    def _generate_overall_comparison(self, ranked_trains: List[Dict], intent: dict) -> str:
        """Generate overall comparison summary"""
        if not ranked_trains:
            return "No trains to compare."
        
        top_train = ranked_trains[0] if ranked_trains else {}
        top_name = top_train.get("train", {}).get("name", "TBD")
        top_score = top_train.get("ranking", {}).get("totalScore", 0)
        
        comparison = f"""
        Recommendation Summary:
        
        Top Choice: {top_name} (Score: {top_score}/100)
        
        This train is our top recommendation based on a comprehensive analysis of:
        - Seat availability ({top_train.get('ranking', {}).get('availabilityScore', 0)}/10)
        - Journey speed ({top_train.get('ranking', {}).get('speedScore', 0)}/10)
        - Price competitiveness ({top_train.get('ranking', {}).get('priceScore', 0)}/10)
        - Booking reliability ({top_train.get('ranking', {}).get('tatkalSuccessProbability', 0)}/10)
        
        Alternative options are also available if you prefer different trade-offs.
        """.strip()
        
        return comparison
