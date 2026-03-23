"""
Intent Agent - Parses and validates search criteria
"""

from pydantic import ValidationError
from datetime import datetime
from backend.models import SearchCriteria, AgentActivity

class IntentAgent:
    """Parses user search criteria and extracts intent"""
    
    def __init__(self):
        self.name = "IntentAgent"
        self.session_id = ""
    
    async def parse_search_intent(self, search_data: dict, session_id: str = "") -> dict:
        """
        Parse search request and validate criteria
        
        Args:
            search_data: Raw search request dict
            session_id: Unique session identifier
            
        Returns:
            dict with parsed criteria and validation status
        """
        self.session_id = session_id
        activity = {
            "timestamp": int(datetime.utcnow().timestamp()),
            "agent": self.name,
            "action": "parse_intent",
            "status": "running",
            "sessionId": session_id
        }
        
        try:
            # Validate using Pydantic model
            criteria = SearchCriteria(**search_data)
            
            # Extract and enrich intent
            intent = {
                "from": criteria.from_city,
                "to": criteria.to_city,
                "date": criteria.date,
                "class": criteria.class_,
                "quota": criteria.quota,
                "berthPreference": criteria.berthPreference,
                "tatkalTime": criteria.tatkalTime,
                "passengerCount": criteria.passengerCount,
                "isUrgent": self._check_if_urgent(criteria),
                "isTatkal": criteria.quota == "TATKAL",
                "preferenceCode": self._generate_preference_code(criteria)
            }
            
            activity["status"] = "completed"
            activity["details"] = {
                "validationPassed": True,
                "intentExtracted": intent
            }
            
            return {
                "success": True,
                "intent": intent,
                "criteria": criteria.dict(by_alias=True),
                "activity": activity
            }
        
        except ValidationError as e:
            activity["status"] = "failed"
            activity["details"] = {"error": str(e)}
            
            return {
                "success": False,
                "error": f"Invalid search criteria: {str(e)}",
                "activity": activity
            }
        
        except Exception as e:
            activity["status"] = "failed"
            activity["details"] = {"error": str(e)}
            
            return {
                "success": False,
                "error": f"Intent parsing failed: {str(e)}",
                "activity": activity
            }
    
    def _check_if_urgent(self, criteria: SearchCriteria) -> bool:
        """Check if search is time-sensitive"""
        try:
            search_date = datetime.strptime(criteria.date, "%Y-%m-%d")
            days_until = (search_date - datetime.utcnow()).days
            # Urgent if within 2 days
            return days_until <= 2
        except:
            return False
    
    def _generate_preference_code(self, criteria: SearchCriteria) -> str:
        """Generate a preference code for this search"""
        code = f"{criteria.from_city[:3].upper()}-{criteria.to_city[:3].upper()}-{criteria.class_[0]}"
        if criteria.quota == "TATKAL":
            code += "-T"
        if criteria.berthPreference != "NO_PREFERENCE":
            code += f"-{criteria.berthPreference[0]}"
        return code
