"""
Booking Execution Agent - Executes bookings with step-by-step simulation
"""

from datetime import datetime
from typing import Dict, List, Optional
import random
import asyncio

class BookingExecutionAgent:
    """Executes train bookings with detailed step simulation"""
    
    def __init__(self):
        self.name = "BookingExecutionAgent"
        self.session_id = ""
    
    async def execute_booking(self, train: Dict, passengers: List[Dict], 
                             berth_preference: str, session_id: str = "", 
                             booking_repo=None) -> dict:
        """
        Execute booking with step-by-step simulation
        
        Args:
            train: Train to book
            passengers: List of passenger details
            berth_preference: Preferred berth type
            session_id: Unique session identifier
            booking_repo: BookingRepository instance for persistence
            
        Returns:
            dict with booking execution status and steps
        """
        self.session_id = session_id
        
        activity = {
            "timestamp": int(datetime.utcnow().timestamp()),
            "agent": self.name,
            "action": "execute_booking",
            "status": "running",
            "sessionId": session_id
        }
        
        try:
            # Initialize booking execution
            steps = []
            booking_data = {
                "trainId": train.get("_id"),
                "trainName": train.get("name"),
                "trainNumber": train.get("number"),
                "passengers": passengers,
                "berthPreference": berth_preference,
                "startTime": datetime.utcnow().isoformat()
            }
            
            # Step 1: Validate Passengers
            step1 = await self._step_validate_passengers(passengers)
            steps.append(step1)
            if not step1["success"]:
                activity["status"] = "failed"
                activity["details"] = {"failedAtStep": 1, "reason": step1.get("error")}
                return {
                    "success": False,
                    "error": f"Passenger validation failed: {step1.get('error')}",
                    "steps": steps,
                    "activity": activity
                }
            
            # Step 2: Check Availability
            step2 = await self._step_check_availability(train)
            steps.append(step2)
            if not step2["success"]:
                activity["status"] = "failed"
                activity["details"] = {"failedAtStep": 2, "reason": step2.get("error")}
                return {
                    "success": False,
                    "error": f"Availability check failed: {step2.get('error')}",
                    "steps": steps,
                    "activity": activity
                }
            
            # Step 3: Select Berth
            step3 = await self._step_select_berth(train, berth_preference)
            steps.append(step3)
            booking_data["selectedBerth"] = step3.get("selectedBerth")
            
            # Step 4: Validate Payment
            step4 = await self._step_validate_payment()
            steps.append(step4)
            if not step4["success"]:
                activity["status"] = "failed"
                activity["details"] = {"failedAtStep": 4, "reason": step4.get("error")}
                return {
                    "success": False,
                    "error": f"Payment validation failed: {step4.get('error')}",
                    "steps": steps,
                    "activity": activity
                }
            
            # Step 5: Generate PNR
            step5 = await self._step_generate_pnr()
            steps.append(step5)
            booking_data["pnrNumber"] = step5.get("pnrNumber")
            
            # Step 6: Confirm Booking
            step6 = await self._step_confirm_booking(booking_data)
            steps.append(step6)
            
            # Step 7: Send Confirmation
            step7 = await self._step_send_confirmation(booking_data)
            steps.append(step7)
            
            activity["status"] = "completed"
            activity["details"] = {
                "bookingSuccessful": True,
                "pnrNumber": booking_data.get("pnrNumber"),
                "totalSteps": len(steps),
                "completedSteps": sum(1 for s in steps if s.get("success", False))
            }
            
            return {
                "success": True,
                "bookingConfirmed": True,
                "pnrNumber": booking_data.get("pnrNumber"),
                "bookingData": booking_data,
                "steps": steps,
                "confirmationMessage": f"Ticket booked successfully! PNR: {booking_data.get('pnrNumber')}",
                "activity": activity
            }
        
        except Exception as e:
            activity["status"] = "failed"
            activity["details"] = {"error": str(e)}
            
            return {
                "success": False,
                "error": f"Booking execution failed: {str(e)}",
                "steps": steps,
                "activity": activity
            }
    
    async def _step_validate_passengers(self, passengers: List[Dict]) -> dict:
        """Step 1: Validate passenger information"""
        await asyncio.sleep(0.5)  # Simulate processing time
        
        if not passengers or len(passengers) == 0:
            return {
                "step": 1,
                "title": "Validate Passengers",
                "success": False,
                "error": "No passengers provided",
                "timestamp": datetime.utcnow().isoformat()
            }
        
        for p in passengers:
            if not all(k in p for k in ["name", "age", "gender"]):
                return {
                    "step": 1,
                    "title": "Validate Passengers",
                    "success": False,
                    "error": f"Missing required fields for passenger: {p}",
                    "timestamp": datetime.utcnow().isoformat()
                }
        
        return {
            "step": 1,
            "title": "Validate Passengers",
            "success": True,
            "passengersValidated": len(passengers),
            "details": [{"name": p.get("name"), "age": p.get("age"), "gender": p.get("gender")} 
                       for p in passengers],
            "timestamp": datetime.utcnow().isoformat()
        }
    
    async def _step_check_availability(self, train: Dict) -> dict:
        """Step 2: Check train seat availability"""
        await asyncio.sleep(0.3)
        
        available_sleeper = train.get("availableSeats", {}).get("sleeper", 0)
        available_ac2 = train.get("availableSeats", {}).get("ac2", 0)
        available_ac3 = train.get("availableSeats", {}).get("ac3", 0)
        
        return {
            "step": 2,
            "title": "Check Availability",
            "success": True,
            "availability": {
                "sleeper": available_sleeper,
                "ac2": available_ac2,
                "ac3": available_ac3,
                "totalAvailable": available_sleeper + available_ac2 + available_ac3
            },
            "timestamp": datetime.utcnow().isoformat()
        }
    
    async def _step_select_berth(self, train: Dict, preference: str) -> dict:
        """Step 3: Select berth based on preference"""
        await asyncio.sleep(0.4)
        
        berth_availability = train.get("berthAvailability", {})
        
        # Try to fulfill preference
        if preference == "LOWER":
            if berth_availability.get("lower", 0) > 0:
                selected = "LOWER"
            elif berth_availability.get("sideLower", 0) > 0:
                selected = "SIDE_LOWER"
            else:
                selected = "UPPER"  # Fallback
        elif preference == "MIDDLE":
            if berth_availability.get("middle", 0) > 0:
                selected = "MIDDLE"
            else:
                selected = "UPPER"
        elif preference == "UPPER":
            if berth_availability.get("upper", 0) > 0:
                selected = "UPPER"
            elif berth_availability.get("sideUpper", 0) > 0:
                selected = "SIDE_UPPER"
            else:
                selected = "LOWER"
        else:
            # Random selection
            options = ["LOWER", "MIDDLE", "UPPER"]
            selected = random.choice(options)
        
        return {
            "step": 3,
            "title": "Select Berth",
            "success": True,
            "preference": preference,
            "selectedBerth": selected,
            "details": f"Berth {selected} allocated",
            "timestamp": datetime.utcnow().isoformat()
        }
    
    async def _step_validate_payment(self) -> dict:
        """Step 4: Validate payment details"""
        await asyncio.sleep(0.6)
        
        # Simulate payment validation (success rate: 98%)
        if random.random() > 0.02:
            return {
                "step": 4,
                "title": "Validate Payment",
                "success": True,
                "paymentMethod": "Debit Card",
                "status": "Verified",
                "timestamp": datetime.utcnow().isoformat()
            }
        else:
            return {
                "step": 4,
                "title": "Validate Payment",
                "success": False,
                "error": "Payment validation timed out. Please retry.",
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def _step_generate_pnr(self) -> dict:
        """Step 5: Generate PNR (Passenger Name Record)"""
        await asyncio.sleep(0.3)
        
        # Generate 10-digit PNR
        pnr = ''.join([str(random.randint(0, 9)) for _ in range(10)])
        
        return {
            "step": 5,
            "title": "Generate PNR",
            "success": True,
            "pnrNumber": pnr,
            "details": f"PNR {pnr} generated successfully",
            "timestamp": datetime.utcnow().isoformat()
        }
    
    async def _step_confirm_booking(self, booking_data: Dict) -> dict:
        """Step 6: Confirm booking in system"""
        await asyncio.sleep(0.5)
        
        confirmation_time = datetime.utcnow()
        
        return {
            "step": 6,
            "title": "Confirm Booking",
            "success": True,
            "bookingStatus": "CONFIRMED",
            "confirmationTime": confirmation_time.isoformat(),
            "bookingDetails": {
                "pnrNumber": booking_data.get("pnrNumber"),
                "trainName": booking_data.get("trainName"),
                "trainNumber": booking_data.get("trainNumber"),
                "passengerCount": len(booking_data.get("passengers", []))
            },
            "timestamp": confirmation_time.isoformat()
        }
    
    async def _step_send_confirmation(self, booking_data: Dict) -> dict:
        """Step 7: Send confirmation to user"""
        await asyncio.sleep(0.4)
        
        return {
            "step": 7,
            "title": "Send Confirmation",
            "success": True,
            "confirmationChannels": ["Email", "SMS"],
            "emailSent": True,
            "smsSent": True,
            "details": f"Confirmation sent for PNR {booking_data.get('pnrNumber')}",
            "timestamp": datetime.utcnow().isoformat()
        }
    
    async def simulate_booking_outcome(self, train: Dict, success_probability: float = 0.75) -> dict:
        """
        Simulate booking outcome (for demo purposes)
        
        Args:
            train: Train information
            success_probability: Likelihood of successful booking (0-1)
            
        Returns:
            dict with simulated outcome
        """
        outcome = {
            "simulatedAt": datetime.utcnow().isoformat(),
            "train": train.get("name"),
            "trainNumber": train.get("number")
        }
        
        # Simulate outcome
        if random.random() < success_probability:
            pnr = ''.join([str(random.randint(0, 9)) for _ in range(10)])
            outcome.update({
                "status": "CONFIRMED",
                "pnr": pnr,
                "message": f"Ticket confirmed! PNR: {pnr}",
                "berth": random.choice(["LOWER", "MIDDLE", "UPPER"]),
                "coachNumber": f"A{random.randint(1, 8)}"
            })
        else:
            # Randomly assign RAC, Waitlist, or Cancellation
            outcome_type = random.choice(["RAC", "WAITLIST", "FAILED"])
            
            if outcome_type == "RAC":
                outcome.update({
                    "status": "RAC",
                    "racNumber": random.randint(1, 20),
                    "message": f"Booked with RAC Status (Reservation Against Cancellation)"
                })
            elif outcome_type == "WAITLIST":
                outcome.update({
                    "status": "WAITLIST",
                    "waitlistNumber": random.randint(1, 50),
                    "message": f"Added to waitlist. Position may improve."
                })
            else:
                outcome.update({
                    "status": "FAILED",
                    "message": "Booking failed. Try alternative trains."
                })
        
        return outcome
