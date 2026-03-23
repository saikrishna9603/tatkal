"""
Pydantic models for API requests/responses
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime

# Train Models
class BerthAvailability(BaseModel):
    lower: int
    middle: int
    upper: int
    sideLower: int
    sideUpper: int

class AvailableSeats(BaseModel):
    sleeper: int
    ac2: int
    ac3: int

class TrainPrice(BaseModel):
    sleeper: int
    ac2: int
    ac3: int

class TrainCreate(BaseModel):
    name: str
    number: str
    from_city: str = Field(..., alias="from")
    to_city: str = Field(..., alias="to")
    departureTime: str
    arrivalTime: str
    duration: str
    distance: int
    availableSeats: AvailableSeats
    berthAvailability: BerthAvailability
    racSeats: int
    waitlistNumber: int
    price: TrainPrice
    tatkalPrice: TrainPrice

class Train(TrainCreate):
    id: str = Field(..., alias="_id")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True

# Search Models
class SearchCriteria(BaseModel):
    from_city: str = Field(..., alias="from")
    to_city: str = Field(..., alias="to")
    date: str
    class_: str = Field(..., alias="class")
    quota: str = "GENERAL"
    berthPreference: str = "NO_PREFERENCE"
    tatkalTime: Optional[str] = "08:00"
    passengerCount: int = 1
    
    class Config:
        populate_by_name = True

# Booking Models
class PassengerInfo(BaseModel):
    name: str
    age: int
    gender: str
    reservation: str

class BookingCreate(BaseModel):
    user_id: str
    train_id: str
    passengers: List[PassengerInfo]
    selectedBerth: str
    selectedClass: str = Field(..., alias="class")
    totalPrice: float
    searchCriteria: SearchCriteria
    
    class Config:
        populate_by_name = True

class Booking(BookingCreate):
    id: str = Field(..., alias="_id")
    status: str = "pending"  # pending, confirmed, rac, waitlist, failed
    pnrNumber: str = ""
    bookingTime: datetime = Field(default_factory=datetime.utcnow)
    confirmationTime: Optional[datetime] = None
    
    class Config:
        populate_by_name = True

# Ranking Score Model
class RankingScore(BaseModel):
    trainId: str
    availabilityScore: float
    speedScore: float
    priceScore: float
    tatkalSuccessProbability: float
    berthMatchScore: float
    totalScore: float
    reasoning: List[str]

# Agent Activity Model
class AgentActivity(BaseModel):
    timestamp: int
    agent: str  # intent, search, ranking, fallback, booking, etc.
    action: str
    status: str  # running, completed, failed
    details: Optional[Dict] = None
    sessionId: str = ""

# API Response Models
class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict] = None
    error: Optional[str] = None

class SearchResponse(BaseModel):
    success: bool
    trains: List[Train]
    rankedTrains: List[Dict]  # Train with score
    agentLogs: List[AgentActivity]
    totalCount: int
