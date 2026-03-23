"""
Waitlist Progression Agent - Simulates waitlist status and conversion
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional
import random

class WaitlistProgressionAgent:
    """Manages waitlist tracking and simulates conversion to confirmed status"""
    
    def __init__(self):
        self.name = "WaitlistProgressionAgent"
        self.session_id = ""
        # Conversion rates based on historical data
        self.conversion_rates = {
            "sleeper": 0.45,    # 45% of waitlisted sleeper seats convert
            "ac2": 0.35,        # 35% AC2
            "ac3": 0.55         # 55% AC3 (higher convertibility)
        }
    
    async def track_waitlist(self, pnr: str, booking_class: str, 
                            waitlist_position: int, session_id: str = "") -> dict:
        """
        Track waitlist status and provide conversion probability
        
        Args:
            pnr: PNR number for booking
            booking_class: Class of booking (sleeper, ac2, ac3)
            waitlist_position: Current waitlist position
            session_id: Unique session identifier
            
        Returns:
            dict with waitlist status and conversion forecast
        """
        self.session_id = session_id
        
        activity = {
            "timestamp": int(datetime.utcnow().timestamp()),
            "agent": self.name,
            "action": "track_waitlist",
            "status": "running",
            "sessionId": session_id
        }
        
        try:
            # Calculate conversion probability
            conversion_prob = self._calculate_conversion_probability(
                waitlist_position, booking_class
            )
            
            # Estimate days until confirmation/cancellation
            days_to_result = self._estimate_days_to_confirmation(
                waitlist_position, booking_class
            )
            
            # Generate status timeline
            timeline = self._generate_status_timeline(
                waitlist_position, booking_class, conversion_prob, days_to_result
            )
            
            # Get conversion patterns
            patterns = self._get_historical_patterns(booking_class)
            
            activity["status"] = "completed"
            activity["details"] = {
                "pnr": pnr,
                "conversionProbability": round(conversion_prob * 100, 1),
                "estimatedDays": days_to_result
            }
            
            return {
                "success": True,
                "pnr": pnr,
                "waitlistStatus": {
                    "position": waitlist_position,
                    "class": booking_class,
                    "conversionProbability": round(conversion_prob, 3),
                    "conversionPercentage": f"{round(conversion_prob * 100, 1)}%"
                },
                "timeline": timeline,
                "historicalPatterns": patterns,
                "recommendation": self._generate_waitlist_recommendation(
                    conversion_prob, days_to_result
                ),
                "activity": activity
            }
        
        except Exception as e:
            activity["status"] = "failed"
            activity["details"] = {"error": str(e)}
            
            return {
                "success": False,
                "error": f"Waitlist tracking failed: {str(e)}",
                "activity": activity
            }
    
    async def simulate_waitlist_progression(self, pnr: str, initial_position: int,
                                           booking_class: str, days: int = 7) -> dict:
        """
        Simulate waitlist progression over specified days
        
        Args:
            pnr: PNR number
            initial_position: Starting waitlist position
            booking_class: Class of booking
            days: Number of days to simulate
            
        Returns:
            dict with day-by-day progression simulation
        """
        try:
            progression = []
            current_position = initial_position
            status = "WAITLIST"
            confirmed_date = None
            
            for day in range(1, days + 1):
                # Simulate daily changes
                position_change = random.randint(-3, 0)  # Positions improve daily
                current_position = max(1, current_position + position_change)
                
                # Check for conversion
                conversion_chance = self.conversion_rates.get(booking_class, 0.4)
                if random.random() < conversion_chance / (days - day + 1):
                    status = "CONFIRMED"
                    confirmed_date = (datetime.utcnow() + timedelta(days=day)).isoformat()
                    break
                
                progression.append({
                    "day": day,
                    "position": current_position,
                    "status": "WAITLIST",
                    "changeFromPrevious": position_change,
                    "conversionProbabilityRemaining": round(
                        self._calculate_conversion_probability(current_position, booking_class),
                        3
                    )
                })
            
            # Add final status
            if status == "CONFIRMED":
                progression.append({
                    "day": day,
                    "position": 0,
                    "status": "CONFIRMED",
                    "confirmedDate": confirmed_date,
                    "message": f"Ticket confirmed on day {day}"
                })
            elif current_position <= 10:
                progression.append({
                    "day": days,
                    "position": current_position,
                    "status": "LIKELY_TO_CONVERT",
                    "message": "High probability of confirmation"
                })
            else:
                progression.append({
                    "day": days,
                    "position": current_position,
                    "status": "UNCERTAIN",
                    "message": "Conversion uncertain, consider fallback options"
                })
            
            return {
                "success": True,
                "pnr": pnr,
                "simulationDays": days,
                "initialPosition": initial_position,
                "finalStatus": status,
                "progression": progression
            }
        
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "progression": []
            }
    
    def _calculate_conversion_probability(self, position: int, booking_class: str) -> float:
        """Calculate probability of waitlist converting to confirmed"""
        base_rate = self.conversion_rates.get(booking_class, 0.4)
        
        # Adjust based on position
        if position <= 5:
            return base_rate * 0.95  # Very high chance
        elif position <= 10:
            return base_rate * 0.85  # High chance
        elif position <= 20:
            return base_rate * 0.70  # Good chance
        elif position <= 30:
            return base_rate * 0.50  # Moderate chance
        elif position <= 50:
            return base_rate * 0.30  # Lower chance
        else:
            return base_rate * 0.10  # Very low chance
    
    def _estimate_days_to_confirmation(self, position: int, booking_class: str) -> int:
        """Estimate days until confirmation or cancellation"""
        if position <= 5:
            return 2  # Very likely soon
        elif position <= 10:
            return 3
        elif position <= 20:
            return 4
        elif position <= 30:
            return 5
        elif position <= 50:
            return 6
        else:
            return 7 or more  # Might not confirm
    
    def _generate_status_timeline(self, position: int, booking_class: str,
                                 conversion_prob: float, days: int) -> List[Dict]:
        """Generate timeline of expected status changes"""
        timeline = []
        
        # Current status
        timeline.append({
            "timeframe": "Now",
            "status": f"WL/{position}",
            "description": f"You are at position {position} on waitlist"
        })
        
        # 24-48 hours
        expected_pos_1 = max(1, position - random.randint(1, 3))
        timeline.append({
            "timeframe": "24-48 hours",
            "status": f"WL/{expected_pos_1}",
            "description": f"Likely to improve to position {expected_pos_1}",
            "probability": "80%"
        })
        
        if conversion_prob > 0.5:
            timeline.append({
                "timeframe": f"2-3 days",
                "status": "CONFIRMED",
                "description": "High probability of confirmation",
                "probability": f"{round(conversion_prob * 100)}%"
            })
        elif conversion_prob > 0.3:
            timeline.append({
                "timeframe": f"3-5 days",
                "status": "CONFIRMED",
                "description": "Moderate probability of confirmation",
                "probability": f"{round(conversion_prob * 100)}%"
            })
        else:
            timeline.append({
                "timeframe": f"4-7 days",
                "status": "CHECK_STATUS",
                "description": "Low confirmation probability, check alternatives",
                "probability": f"{round(conversion_prob * 100)}%"
            })
        
        return timeline
    
    def _get_historical_patterns(self, booking_class: str) -> Dict:
        """Get historical conversion patterns for this class"""
        patterns = {
            "sleeper": {
                "avgTimeDays": 3.2,
                "conversionRate": 45,
                "avgPositionForConfirmation": 12,
                "peakConversionTime": "2-3 days",
                "notes": "Sleeper class has moderate conversion rates"
            },
            "ac2": {
                "avgTimeDays": 4.1,
                "conversionRate": 35,
                "avgPositionForConfirmation": 8,
                "peakConversionTime": "3-4 days",
                "notes": "AC2 has lower conversion rates, premium travel demand"
            },
            "ac3": {
                "avgTimeDays": 2.8,
                "conversionRate": 55,
                "avgPositionForConfirmation": 15,
                "peakConversionTime": "2 days",
                "notes": "AC3 has highest conversion rates, good value option"
            }
        }
        
        return patterns.get(booking_class, patterns["sleeper"])
    
    def _generate_waitlist_recommendation(self, conversion_prob: float, days: int) -> str:
        """Generate recommendation based on waitlist status"""
        if conversion_prob > 0.7:
            return "Excellent chances of confirmation. Monitor status daily but don't worry."
        elif conversion_prob > 0.5:
            return "Good chances of confirmation. Keep alternative options ready."
        elif conversion_prob > 0.3:
            return "Moderate chances. Seriously consider booking alternative trains."
        else:
            return "Low confirmation probability. Book an alternative or wait and see."
