"""
Tatkal Scheduler Agent - Manages Tatkal countdown and booking timing
"""

from datetime import datetime, timedelta
from typing import Dict, Optional

class TatkalSchedulerAgent:
    """Manages Tatkal booking schedule and countdown"""
    
    def __init__(self):
        self.name = "TatkalSchedulerAgent"
        self.session_id = ""
        # Tatkal booking opens 4 AM daily for trains departing next 4 days
        self.tatkal_booking_hour = 4
        self.tatkal_days_advance = 4
    
    async def calculate_tatkal_schedule(self, intent: dict, session_id: str = "") -> dict:
        """
        Calculate Tatkal booking schedule for given search date
        
        Args:
            intent: Search intent with date
            session_id: Unique session identifier
            
        Returns:
            dict with schedule and countdown information
        """
        self.session_id = session_id
        
        activity = {
            "timestamp": int(datetime.utcnow().timestamp()),
            "agent": self.name,
            "action": "calculate_tatkal_schedule",
            "status": "running",
            "sessionId": session_id
        }
        
        try:
            if not intent.get("isTatkal"):
                activity["status"] = "completed"
                activity["details"] = {"isTatkalSearch": False}
                
                return {
                    "success": True,
                    "isTatkalEligible": False,
                    "message": "Not a Tatkal search",
                    "activity": activity
                }
            
            search_date = datetime.strptime(intent.get("date"), "%Y-%m-%d")
            current_time = datetime.utcnow()
            
            # Calculate booking time
            booking_date = search_date - timedelta(days=self.tatkal_days_advance)
            booking_time = booking_date.replace(hour=self.tatkal_booking_hour, minute=0, second=0)
            
            # Check if booking time is in future
            if booking_time <= current_time:
                activity["status"] = "completed"
                activity["details"] = {
                    "tatkalEligible": False,
                    "reason": "Booking window has passed"
                }
                
                return {
                    "success": True,
                    "isTatkalEligible": False,
                    "message": "Tatkal booking window has passed",
                    "activity": activity
                }
            
            # Calculate countdown
            time_until_booking = booking_time - current_time
            hours_remaining = time_until_booking.total_seconds() / 3600
            
            # Prepare schedule
            schedule = {
                "searchDate": intent.get("date"),
                "bookingOpenDate": booking_date.strftime("%Y-%m-%d"),
                "bookingOpenTime": booking_date.strftime("%H:%M"),
                "currentTime": current_time.isoformat(),
                "timeUntilBooking": {
                    "days": time_until_booking.days,
                    "hours": int((time_until_booking.seconds % 86400) / 3600),
                    "minutes": int((time_until_booking.seconds % 3600) / 60),
                    "seconds": time_until_booking.seconds % 60,
                    "totalHours": round(hours_remaining, 2)
                },
                "isUrgent": hours_remaining < 24,
                "suggestedBookingBuffer": self._get_booking_buffer_recommendation(hours_remaining)
            }
            
            # Generate booking preparation steps
            prep_steps = self._generate_prep_steps(booking_time, current_time, intent)
            
            activity["status"] = "completed"
            activity["details"] = {
                "tatkalEligible": True,
                "hoursRemaining": round(hours_remaining, 2),
                "isUrgent": hours_remaining < 24
            }
            
            return {
                "success": True,
                "isTatkalEligible": True,
                "schedule": schedule,
                "preparationSteps": prep_steps,
                "activity": activity
            }
        
        except ValueError as e:
            activity["status"] = "failed"
            activity["details"] = {"error": f"Invalid date format: {str(e)}"}
            
            return {
                "success": False,
                "error": f"Schedule calculation failed: {str(e)}",
                "activity": activity
            }
        
        except Exception as e:
            activity["status"] = "failed"
            activity["details"] = {"error": str(e)}
            
            return {
                "success": False,
                "error": f"Tatkal schedule error: {str(e)}",
                "activity": activity
            }
    
    async def schedule_tatkal_reminder(self, booking_time: str, phone: Optional[str] = None) -> dict:
        """
        Schedule a Tatkal booking reminder
        
        Args:
            booking_time: ISO format booking time
            phone: Optional phone for SMS reminder
            
        Returns:
            dict with reminder scheduling status
        """
        activity = {
            "timestamp": int(datetime.utcnow().timestamp()),
            "agent": self.name,
            "action": "schedule_reminder",
            "status": "completed"
        }
        
        try:
            booking_dt = datetime.fromisoformat(booking_time)
            reminder_times = self._generate_reminder_times(booking_dt)
            
            activity["details"] = {
                "remindersScheduled": len(reminder_times),
                "reminderTimes": [rt.isoformat() for rt in reminder_times]
            }
            
            return {
                "success": True,
                "reminders": [
                    {
                        "time": rt.isoformat(),
                        "minutesBefore": int((booking_dt - rt).total_seconds() / 60),
                        "message": f"Tatkal booking opens in {int((booking_dt - rt).total_seconds() / 60)} minutes"
                    }
                    for rt in reminder_times
                ],
                "activity": activity
            }
        
        except Exception as e:
            activity["status"] = "failed"
            activity["details"] = {"error": str(e)}
            return {
                "success": False,
                "error": str(e),
                "activity": activity
            }
    
    async def optimize_booking_strategy(self, schedule: dict, train: Dict) -> dict:
        """
        Optimize booking strategy based on schedule and train details
        
        Args:
            schedule: Booking schedule from calculate_tatkal_schedule
            train: Train details for Tatkal booking
            
        Returns:
            dict with optimized booking strategy
        """
        try:
            hours_remaining = schedule["timeUntilBooking"]["totalHours"]
            tatkal_price = train.get("tatkalPrice", {}).get("sleeper", 0)
            available_seats = train.get("availableSeats", {}).get("sleeper", 0)
            
            strategy = {
                "phase": self._determine_booking_phase(hours_remaining),
                "urgencyLevel": self._calculate_urgency(available_seats, hours_remaining),
                "recommendations": [],
                "riskLevel": ""
            }
            
            # Phase-specific recommendations
            if hours_remaining > 48:
                strategy["recommendations"] = [
                    "Ensure all passenger details are ready",
                    "Verify payment method and limits",
                    "Have alternative trains shortlisted",
                    "Test booking system if possible"
                ]
                strategy["riskLevel"] = "LOW"
            elif hours_remaining > 12:
                strategy["recommendations"] = [
                    "Begin active monitoring",
                    "Prepare payment method",
                    "Have quick fallback options ready",
                    "Set multiple reminders"
                ]
                strategy["riskLevel"] = "MEDIUM"
            elif hours_remaining > 2:
                strategy["recommendations"] = [
                    "Stay alert for booking opening",
                    "Be ready at computer/mobile",
                    "Have payment method ready",
                    "Know fallback strategy"
                ]
                strategy["riskLevel"] = "HIGH"
            else:
                strategy["recommendations"] = [
                    "URGENT: Be ready now",
                    "Have all details finalized",
                    "Ensure stable internet connection",
                    "Know exact booking steps"
                ]
                strategy["riskLevel"] = "CRITICAL"
            
            return {
                "success": True,
                "strategy": strategy
            }
        
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def _get_booking_buffer_recommendation(self, hours_remaining: float) -> str:
        """Get recommended buffer time before booking"""
        if hours_remaining > 48:
            return "Have 2-3 days buffer. Ensure payment method ready."
        elif hours_remaining > 24:
            return "Have 24+ hours buffer. Begin active monitoring."
        elif hours_remaining > 12:
            return "Have 12+ hours buffer. Be alert and ready."
        elif hours_remaining > 4:
            return "Have 4+ hours buffer. Stay by device."
        elif hours_remaining > 2:
            return "Have 2+ hours buffer. Prepare immediately."
        else:
            return "URGENT: Less than 2 hours. Be ready NOW."
    
    def _generate_prep_steps(self, booking_time: datetime, current_time: datetime, 
                            intent: dict) -> list:
        """Generate step-by-step preparation tasks"""
        hours_until = (booking_time - current_time).total_seconds() / 3600
        
        steps = []
        
        if hours_until > 48:
            steps = [
                {
                    "step": 1,
                    "title": "Prepare Documentation",
                    "tasks": ["Gather passenger IDs", "Verify mobile/email", "Note preferences"],
                    "timeline": "Next 24 hours"
                },
                {
                    "step": 2,
                    "title": "Prepare Payment",
                    "tasks": ["Set card OTP limits", "Verify payment method", "Ensure sufficient balance"],
                    "timeline": "Next 48 hours"
                },
                {
                    "step": 3,
                    "title": "Research Options",
                    "tasks": ["Finalize train choice", "Shortlist alternatives", "Note timings"],
                    "timeline": "24 hours before"
                }
            ]
        elif hours_until > 12:
            steps = [
                {
                    "step": 1,
                    "title": "Finalize Bookings",
                    "tasks": ["Confirm passenger details", "Ready payment", "Have backup trains"],
                    "timeline": "Next 12 hours"
                },
                {
                    "step": 2,
                    "title": "Set Reminders",
                    "tasks": ["15 min before", "5 min before", "At booking time"],
                    "timeline": "Immediately"
                }
            ]
        else:
            steps = [
                {
                    "step": 1,
                    "title": "URGENT: Ready Now",
                    "tasks": ["Sit at computer", "Have payment ready", "Know booking steps"],
                    "timeline": "Right now"
                }
            ]
        
        return steps
    
    def _determine_booking_phase(self, hours_remaining: float) -> str:
        """Determine current booking phase"""
        if hours_remaining > 48:
            return "EARLY_PREPARATION"
        elif hours_remaining > 12:
            return "ACTIVE_MONITORING"
        elif hours_remaining > 2:
            return "RED_ALERT"
        else:
            return "FINAL_COUNTDOWN"
    
    def _calculate_urgency(self, available_seats: int, hours_remaining: float) -> str:
        """Calculate overall urgency level"""
        if hours_remaining < 2:
            return "CRITICAL"
        elif hours_remaining < 6 and available_seats < 5:
            return "HIGH"
        elif hours_remaining < 24 or available_seats < 3:
            return "MEDIUM"
        else:
            return "LOW"
    
    def _generate_reminder_times(self, booking_time: datetime) -> list:
        """Generate reminder times before booking"""
        reminders = [
            booking_time - timedelta(days=1),      # 1 day before
            booking_time - timedelta(hours=2),     # 2 hours before
            booking_time - timedelta(minutes=15),  # 15 minutes before
            booking_time - timedelta(minutes=5)    # 5 minutes before
        ]
        return [r for r in reminders if r > datetime.utcnow()]
