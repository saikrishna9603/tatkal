"""
Booking Models - Pydantic models for normal and Tatkal train bookings
"""

from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class BookingStatusEnum(str, Enum):
    """Booking status enumeration"""
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"
    TATKAL_SCHEDULED = "TATKAL_SCHEDULED"
    TATKAL_CONFIRMED = "TATKAL_CONFIRMED"


class PaymentStatusEnum(str, Enum):
    """Payment status enumeration"""
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"


class PassengerDetails(BaseModel):
    """Individual passenger information"""
    name: str = Field(..., min_length=2, max_length=100)
    age: int = Field(..., ge=1, le=120)
    gender: str = Field(..., pattern="^(M|F|O)$")  # Male, Female, Other
    document_type: str  # Aadhaar, Passport, PAN, DL, etc.
    document_number: str
    phone: str = Field(..., pattern="^(\\+\\d{1,3})?[6-9]\\d{9}$")
    email: Optional[str] = None


class SeatSelection(BaseModel):
    """Seat selection details"""
    passenger_index: int
    seat_number: str
    seat_class: str  # General, Sleeper, AC3, AC2, AC1
    berth_type: Optional[str] = None  # Lower, Middle, Upper, Coupe


class PaymentRequest(BaseModel):
    """Payment information"""
    payment_method: str  # CREDIT_CARD, DEBIT_CARD, UPI, NET_BANKING
    amount: float = Field(..., gt=0)
    currency: str = "INR"
    card_details: Optional[Dict[str, str]] = None  # For card payments
    upi_id: Optional[str] = None  # For UPI payments
    bank_name: Optional[str] = None  # For net banking


class NormalBookingRequest(BaseModel):
    """Normal train booking request"""
    user_id: str
    train_id: str
    train_number: str
    from_station: str
    to_station: str
    departure_date: str  # YYYY-MM-DD format
    departure_time: str
    return_date: Optional[str] = None  # For round trip
    passengers: List[PassengerDetails] = Field(..., min_items=1, max_items=6)
    seat_selections: List[SeatSelection]
    seat_class: str
    quota: str  # GENERAL, TATKAL, SENIOR_CITIZEN, etc.
    payment: PaymentRequest
    mobile_number: str
    email: str
    special_requirements: Optional[str] = None


class TatkalBookingRequest(BaseModel):
    """Tatkal booking request"""
    user_id: str
    train_id: str
    train_number: str
    from_station: str
    to_station: str
    departure_date: str  # YYYY-MM-DD format
    departure_time: str
    passengers: List[PassengerDetails] = Field(..., min_items=1, max_items=6)
    seat_class: str
    payment: PaymentRequest
    mobile_number: str
    email: str
    scheduled_time: str  # Time to start Tatkal booking (HH:MM format)
    retry_count: int = 5
    retry_interval: int = 2  # seconds


class BookingConfirmation(BaseModel):
    """Booking confirmation response"""
    pnr: str
    booking_id: str
    user_id: str
    train_number: str
    train_name: str
    from_station: str
    to_station: str
    departure_date: str
    departure_time: str
    passengers: List[Dict[str, Any]]
    seat_class: str
    seats_assigned: List[str]
    total_fare: float
    booking_status: BookingStatusEnum
    payment_status: PaymentStatusEnum
    booking_timestamp: datetime
    confirmation_details: Dict[str, Any]
    qr_code: Optional[str] = None  # QR code for e-ticket
    ticket_url: Optional[str] = None


class BookingHistory(BaseModel):
    """User booking history"""
    booking_id: str
    pnr: str
    train_number: str
    train_name: str
    from_station: str
    to_station: str
    departure_date: str
    status: BookingStatusEnum
    payment_status: PaymentStatusEnum
    total_fare: float
    number_of_passengers: int
    booking_date: datetime
    ticket_url: Optional[str] = None


class PaymentResponse(BaseModel):
    """Payment processing response"""
    payment_id: str
    booking_id: str
    amount: float
    currency: str
    status: PaymentStatusEnum
    transaction_id: str
    timestamp: datetime
    message: str


class CancellationRequest(BaseModel):
    """Booking cancellation request"""
    booking_id: str
    pnr: str
    reason: Optional[str] = None
    user_id: str


class CancellationResponse(BaseModel):
    """Cancellation response"""
    cancellation_id: str
    booking_id: str
    pnr: str
    refund_amount: float
    cancellation_charges: float
    status: str
    refund_status: PaymentStatusEnum
    timestamp: datetime


class TatkalStatusUpdate(BaseModel):
    """Tatkal booking status update"""
    tatkal_booking_id: str
    status: str  # WAITING, PROCESSING, RETRY, SUCCESS, FAILED
    attempt_number: int
    message: str
    next_retry_at: Optional[datetime] = None
    timestamp: datetime


class BookingDocument(BaseModel):
    """MongoDB document for booking storage"""
    _id: Optional[str] = None
    booking_id: str
    pnr: str
    user_id: str
    train_id: str
    train_number: str
    train_name: str
    from_station: str
    to_station: str
    departure_date: str
    departure_time: str
    arrival_time: str
    seat_class: str
    seats_booked: List[str]
    quota: str
    passengers: List[Dict[str, Any]]
    total_fare: float
    booking_status: BookingStatusEnum
    payment_status: PaymentStatusEnum
    payment_id: str
    payment_method: str
    booking_timestamp: datetime
    confirmation_timestamp: Optional[datetime] = None
    cancellation_timestamp: Optional[datetime] = None
    refund_amount: Optional[float] = None
    booking_type: str  # NORMAL or TATKAL
    tatkal_scheduled_time: Optional[str] = None
    tatkal_retry_count: int = 0
    special_requirements: Optional[str] = None
    mobile_number: str
    email: str
    qr_code_url: Optional[str] = None
    ticket_url: Optional[str] = None
    
    class Config:
        from_attributes = True


class BookingStats(BaseModel):
    """User booking statistics"""
    total_bookings: int
    successful_bookings: int
    cancelled_bookings: int
    total_money_spent: float
    favorite_routes: List[Dict[str, str]]
    last_booking_date: Optional[datetime] = None
    average_advanced_days: float
    tatkal_success_rate: float
    preferred_class: str
    preferred_time: str


class AvailabilityCheckRequest(BaseModel):
    """Check train availability"""
    train_id: str
    departure_date: str
    seat_class: str
    number_of_passengers: int = 1
    quota: str = "GENERAL"


class AvailabilityCheckResponse(BaseModel):
    """Availability check response"""
    train_id: str
    train_number: str
    departure_date: str
    seat_class: str
    available_count: int
    rac_count: int
    waitlist_count: int
    is_available: bool
    price_per_seat: float
    total_price: float


class SeatAvailabilityMap(BaseModel):
    """Seat availability map for visual display"""
    train_id: str
    seat_class: str
    total_seats: int
    available_seats: List[str]
    booked_seats: List[str]
    rac_seats: List[str]
    waitlist_seats: List[str]


class BookingRecommendation(BaseModel):
    """AI recommendation for booking"""
    train_id: str
    train_number: str
    recommendation_score: float
    reason: str
    availability_score: float
    price_score: float
    duration_score: float
    comfort_score: float
    tatkal_probability: float
    estimated_success_rate: float


class PartialPaymentRequest(BaseModel):
    """Partial payment option"""
    booking_id: str
    amount: float
    payment_date: str
    auto_debit_remaining: bool = False


# Example usage and test data
if __name__ == "__main__":
    # Test passenger creation
    passenger = PassengerDetails(
        name="John Doe",
        age=30,
        gender="M",
        document_type="Aadhaar",
        document_number="123456789012",
        phone="9876543210",
        email="john@example.com"
    )
    print(f"Passenger created: {passenger}")
    
    # Test booking request
    booking_req = NormalBookingRequest(
        user_id="user_123",
        train_id="train_001",
        train_number="12345",
        from_station="Delhi",
        to_station="Mumbai",
        departure_date="2024-02-15",
        departure_time="08:00",
        passengers=[passenger],
        seat_selections=[SeatSelection(passenger_index=0, seat_number="1A", seat_class="AC2")],
        seat_class="AC2",
        quota="GENERAL",
        payment=PaymentRequest(payment_method="CREDIT_CARD", amount=2500),
        mobile_number="9876543210",
        email="john@example.com"
    )
    print(f"Booking request validated: {booking_req.train_number}")
