"""
Intent Agent - Parses and validates user search criteria
"""
from pydantic import BaseModel
from typing import Optional

class SearchCriteria(BaseModel):
    from_city: str
    to_city: str
    date: str
    train_class: str = "ac3"
    quota: str = "GENERAL"
    berth_preference: str = "NO_PREFERENCE"
    tatkal_time: Optional[str] = None
    passenger_count: int = 1

class IntentAgent:
    @staticmethod
    def process_input(criteria: SearchCriteria) -> dict:
        """
        Parse and normalize user input
        """
        print(f"[Intent Agent] Processing: {criteria.from_city} → {criteria.to_city}")
        
        # Normalize input
        normalized = {
            "from_city": criteria.from_city.upper(),
            "to_city": criteria.to_city.upper(),
            "date": criteria.date,
            "train_class": criteria.train_class.lower() or "ac3",
            "quota": criteria.quota.upper() or "GENERAL",
            "berth_preference": criteria.berth_preference.upper() or "NO_PREFERENCE",
            "tatkal_time": criteria.tatkal_time or "08:00",
            "passenger_count": max(1, min(6, criteria.passenger_count)),
        }
        
        # Validate
        if not normalized["from_city"] or not normalized["to_city"]:
            raise ValueError("From and To cities are required")
        
        if normalized["from_city"] == normalized["to_city"]:
            raise ValueError("From and To cities cannot be the same")
        
        print(f"✓ [Intent Agent] Input validated and normalized")
        
        return normalized
    
    @staticmethod
    def parse_natural_language(text: str) -> dict:
        """
        Parse natural language queries (optional feature)
        """
        import re
        
        result = {}
        
        # Extract cities
        if "from" in text.lower() and "to" in text.lower():
            parts = text.lower().split("from")
            if len(parts) > 1:
                city_part = parts[1].split("to")
                if len(city_part) > 1:
                    result["from_city"] = city_part[0].strip()
                    result["to_city"] = city_part[1].split()[0].strip()
        
        # Extract class
        if "ac3" in text.lower():
            result["train_class"] = "ac3"
        elif "ac2" in text.lower():
            result["train_class"] = "ac2"
        elif "sleeper" in text.lower():
            result["train_class"] = "sleeper"
        
        # Extract berth
        if "lower" in text.lower():
            result["berth_preference"] = "LOWER"
        elif "middle" in text.lower():
            result["berth_preference"] = "MIDDLE"
        elif "upper" in text.lower():
            result["berth_preference"] = "UPPER"
        
        return result
