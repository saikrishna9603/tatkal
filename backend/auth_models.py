"""
User Authentication and Profile Models
"""

from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, List
from enum import Enum

# ===== REQUEST/RESPONSE MODELS =====

class UserRegisterRequest(BaseModel):
    """User registration request"""
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: str = Field(..., pattern=r'^(\+\d{1,3})?[6-9]\d{9}$')
    password: str = Field(..., min_length=8)
    confirm_password: str
    
    class Config:
        example = {
            "full_name": "John Doe",
            "email": "john@example.com",
            "phone": "+919876543210",
            "password": "SecurePass123!",
            "confirm_password": "SecurePass123!"
        }

class UserLoginRequest(BaseModel):
    """User login request"""
    email: EmailStr
    password: str
    remember_me: bool = False
    
    class Config:
        example = {
            "email": "john@example.com",
            "password": "SecurePass123!",
            "remember_me": True
        }

class UserProfile(BaseModel):
    """User profile data"""
    user_id: str
    full_name: str
    email: EmailStr
    phone: str
    profile_picture: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    identity_type: Optional[str] = None  # PAN, Aadhar, Passport
    identity_number: Optional[str] = None
    member_since: datetime
    total_bookings: int = 0
    loyalty_points: int = 0
    is_verified: bool = False
    
    class Config:
        example = {
            "user_id": "usr_12345",
            "full_name": "John Doe",
            "email": "john@example.com",
            "phone": "+919876543210",
            "city": "Delhi",
            "state": "Delhi",
            "member_since": "2024-01-15T10:30:00",
            "total_bookings": 5,
            "loyalty_points": 1250
        }

class UserPreferences(BaseModel):
    """User travel preferences"""
    user_id: str
    preferred_class: Optional[str] = "AC3"
    preferred_departure_time: Optional[str] = "18:00"
    budget_per_ticket: Optional[int] = 2000
    berth_preference: Optional[str] = "LOWER"
    
    # Tatkal preferences
    tatkal_enabled: bool = False
    tatkal_time: Optional[str] = "08:00"
    tatkal_max_budget: Optional[int] = 3000
    tatkal_auto_book: bool = False
    
    # Notification preferences
    email_notifications: bool = True
    sms_notifications: bool = True
    push_notifications: bool = False
    
    # Saved routes
    saved_routes: List[dict] = []
    
    class Config:
        example = {
            "user_id": "usr_12345",
            "preferred_class": "AC3",
            "tatkal_enabled": True,
            "tatkal_time": "08:00",
            "saved_routes": [
                {"from": "Delhi", "to": "Mumbai"},
                {"from": "Delhi", "to": "Bangalore"}
            ]
        }

class PaymentMethod(BaseModel):
    """Saved payment method"""
    method_id: str
    user_id: str
    method_type: str  # "CARD", "UPI", "BANK"
    display_name: str
    is_default: bool = False
    created_at: datetime
    last_used: Optional[datetime] = None
    
    # For cards
    card_last_4: Optional[str] = None
    card_brand: Optional[str] = None  # "VISA", "MASTERCARD", "AMEX"
    
    # For UPI
    upi_id: Optional[str] = None
    
    # For Bank
    bank_name: Optional[str] = None
    account_last_4: Optional[str] = None
    
    class Config:
        example = {
            "method_id": "pm_12345",
            "user_id": "usr_12345",
            "method_type": "CARD",
            "display_name": "Visa ••• 4242",
            "card_last_4": "4242",
            "card_brand": "VISA",
            "is_default": True,
            "created_at": "2024-01-15T10:30:00"
        }

class UserResponse(BaseModel):
    """User response model"""
    user_id: str
    full_name: str
    email: str
    phone: str
    is_verified: bool
    member_since: datetime
    total_bookings: int
    
    class Config:
        example = {
            "user_id": "usr_12345",
            "full_name": "John Doe",
            "email": "john@example.com",
            "phone": "+919876543210",
            "is_verified": True,
            "member_since": "2024-01-15T10:30:00",
            "total_bookings": 5
        }

class AuthTokenResponse(BaseModel):
    """Authentication token response"""
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "Bearer"
    expires_in: int = 3600
    user: UserResponse
    
    class Config:
        example = {
            "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "token_type": "Bearer",
            "expires_in": 3600,
            "user": {
                "user_id": "usr_12345",
                "full_name": "John Doe",
                "email": "john@example.com"
            }
        }

class ForgotPasswordRequest(BaseModel):
    """Forgot password request"""
    email: EmailStr
    
    class Config:
        example = {
            "email": "john@example.com"
        }

class ResetPasswordRequest(BaseModel):
    """Reset password request"""
    token: str
    new_password: str
    confirm_password: str
    
    class Config:
        example = {
            "token": "reset_token_abc123",
            "new_password": "NewSecurePass123!",
            "confirm_password": "NewSecurePass123!"
        }

class ChangePasswordRequest(BaseModel):
    """Change password request"""
    current_password: str
    new_password: str
    confirm_password: str
    
    class Config:
        example = {
            "current_password": "OldPass123!",
            "new_password": "NewPass123!",
            "confirm_password": "NewPass123!"
        }

class VerifyEmailRequest(BaseModel):
    """Verify email request"""
    email: EmailStr
    otp: str
    
    class Config:
        example = {
            "email": "john@example.com",
            "otp": "123456"
        }

# ===== DATABASE MODELS (For MongoDB) =====

class UserDocument(BaseModel):
    """User document for MongoDB"""
    _id: Optional[str] = None
    full_name: str
    email: str
    phone: str
    password_hash: str  # Hashed password
    profile_picture: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    
    # Identity for booking
    identity_type: Optional[str] = None
    identity_number: Optional[str] = None
    
    # Account status
    is_active: bool = True
    is_verified: bool = False
    is_email_verified: bool = False
    is_phone_verified: bool = False
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    last_login: Optional[datetime] = None
    
    # Booking stats
    total_bookings: int = 0
    successful_bookings: int = 0
    cancelled_bookings: int = 0
    loyalty_points: int = 0
    
    # Preferences
    preferences: Optional[dict] = None
    saved_routes: List[dict] = []
    payment_methods: List[str] = []  # IDs of saved payment methods
    
    class Config:
        schema_extra = {
            "example": {
                "_id": "usr_12345",
                "full_name": "John Doe",
                "email": "john@example.com",
                "phone": "+919876543210",
                "is_verified": True,
                "total_bookings": 5,
                "created_at": "2024-01-15T10:30:00"
            }
        }
