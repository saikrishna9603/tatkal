"""
FastAPI Main Application - API Routes for Tatkal Booking System
Combines authentication, trains, bookings, and PRAL agents
"""

from fastapi import FastAPI, HTTPException, Depends, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime, timedelta
import uuid
from typing import List, Optional, Dict, Any
import json

# Import all custom modules
try:
    # Try relative imports first (when run as module)
    from .auth_utils import AuthUtility, SessionManager
    from .auth_models import (
        UserRegisterRequest, UserLoginRequest, UserProfile, 
        AuthTokenResponse, UserResponse, UserPreferences, PaymentMethod
    )
    from .booking_models import (
        NormalBookingRequest, TatkalBookingRequest, BookingConfirmation,
        PaymentRequest, AvailabilityCheckRequest, AvailabilityCheckResponse,
        BookingStatusEnum, PaymentStatusEnum, SeatAvailabilityMap,
        BookingHistory, CancellationRequest, CancellationResponse
    )
    from .pral_agents import PRALOrchestrator, PerceiveAgent, ActAgent, ReasonAgent, LearnAgent
    from .mock_trains_data import generate_trains_data
except ImportError:
    # Fall back to absolute imports (when run directly)
    from auth_utils import AuthUtility, SessionManager
    from auth_models import (
        UserRegisterRequest, UserLoginRequest, UserProfile, 
        AuthTokenResponse, UserResponse, UserPreferences, PaymentMethod
    )
    from booking_models import (
        NormalBookingRequest, TatkalBookingRequest, BookingConfirmation,
        PaymentRequest, AvailabilityCheckRequest, AvailabilityCheckResponse,
        BookingStatusEnum, PaymentStatusEnum, SeatAvailabilityMap,
        BookingHistory, CancellationRequest, CancellationResponse
    )
    from pral_agents import PRALOrchestrator, PerceiveAgent, ActAgent, ReasonAgent, LearnAgent
    from mock_trains_data import generate_trains_data


# Initialize FastAPI app
app = FastAPI(
    title="Tatkal Train Booking System",
    description="AI-powered train booking with PRAL agents",
    version="1.0.0"
)

# Add CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global data storage (In production, use MongoDB)
users_db: Dict[str, Dict] = {}
sessions_db: Dict[str, Dict] = {}
bookings_db: Dict[str, Dict] = {}
trains_data: List[Dict] = []
session_manager = SessionManager()

# Initialize PRAL agents
pral_orchestrator = PRALOrchestrator()

# Initialize train data on startup
@app.on_event("startup")
async def startup_event():
    """Initialize application data"""
    global trains_data
    print("📚 Generating 1000 trains data...")
    trains_data = generate_trains_data(1000)
    print(f"✅ Loaded {len(trains_data)} trains")
    print("🤖 PRAL agents initialized")


# ==================== AUTHENTICATION ROUTES ====================

@app.post("/api/auth/register", response_model=UserResponse)
async def register(request: UserRegisterRequest):
    """User registration endpoint"""
    # Validate email format
    if not AuthUtility.validate_email(request.email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    # Check if user already exists
    if request.email in users_db:
        raise HTTPException(status_code=409, detail="Email already registered")
    
    # Validate password strength
    if not AuthUtility.is_password_strong(request.password):
        raise HTTPException(
            status_code=400, 
            detail="Password must be 8+ chars with uppercase, lowercase, digit, and special character"
        )
    
    # Verify passwords match
    if request.password != request.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    
    # Create new user
    user_id = str(uuid.uuid4())
    hashed_password = AuthUtility.hash_password(request.password)
    
    users_db[request.email] = {
        "user_id": user_id,
        "email": request.email,
        "full_name": request.full_name,
        "phone": request.phone,
        "password_hash": hashed_password,
        "created_at": datetime.utcnow().isoformat(),
        "email_verified": False,
        "is_active": True,
        "preferences": {},
        "booking_stats": {
            "total_bookings": 0,
            "successful_bookings": 0,
            "cancelled_bookings": 0
        }
    }
    
    return UserResponse(
        user_id=user_id,
        email=request.email,
        full_name=request.full_name,
        phone=request.phone,
        is_verified=False,
        member_since=datetime.utcnow(),
        total_bookings=0
    )


@app.post("/api/auth/login", response_model=AuthTokenResponse)
async def login(request: UserLoginRequest):
    """User login endpoint"""
    if request.email not in users_db:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user = users_db[request.email]
    if not AuthUtility.verify_password(request.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create tokens
    tokens = AuthUtility.create_access_token(
        user["user_id"], 
        user["email"], 
        user["full_name"]
    )
    
    refresh_token = AuthUtility.create_refresh_token(user["user_id"])
    
    # Create session
    session_id = session_manager.create_session(
        user["user_id"],
        tokens["access_token"],
        refresh_token["refresh_token"]
    )
    
    sessions_db[session_id] = {
        "user_id": user["user_id"],
        "session_id": session_id,
        "created_at": datetime.utcnow().isoformat(),
        "expires_at": (datetime.utcnow() + timedelta(hours=24)).isoformat()
    }
    
    return AuthTokenResponse(
        access_token=tokens["access_token"],
        refresh_token=refresh_token["refresh_token"],
        expires_in=tokens.get("expires_in", 86400),
        user=UserResponse(
            user_id=user["user_id"],
            email=user["email"],
            full_name=user["full_name"],
            phone=user["phone"],
            is_verified=user.get("email_verified", False),
            member_since=datetime.fromisoformat(user["created_at"]) if isinstance(user["created_at"], str) else user["created_at"],
            total_bookings=user.get("booking_stats", {}).get("total_bookings", 0)
        )
    )


@app.post("/api/auth/logout")
async def logout(session_id: str):
    """User logout endpoint"""
    if session_id in sessions_db:
        session_manager.invalidate_session(session_id)
        del sessions_db[session_id]
        return {"message": "Logout successful"}
    raise HTTPException(status_code=404, detail="Session not found")


@app.post("/api/auth/forgot-password")
async def forgot_password(email: str):
    """Request password reset"""
    if email not in users_db:
        raise HTTPException(status_code=404, detail="Email not found")
    
    user = users_db[email]
    reset_token = AuthUtility.create_password_reset_token(user["user_id"], email)
    
    return {
        "message": "Password reset link sent to email",
        "reset_token": reset_token["reset_token"],
        "expires_in": "15 minutes"
    }


@app.post("/api/auth/reset-password")
async def reset_password(token: str, new_password: str):
    """Reset password with token"""
    if not AuthUtility.is_password_strong(new_password):
        raise HTTPException(status_code=400, detail="Password not strong enough")
    
    payload = AuthUtility.verify_reset_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired reset token")
    
    user_id = payload.get("sub")
    # Find user by ID and update password
    for email, user in users_db.items():
        if user["user_id"] == user_id:
            user["password_hash"] = AuthUtility.hash_password(new_password)
            return {"message": "Password reset successful"}
    
    raise HTTPException(status_code=404, detail="User not found")


@app.get("/api/profile/{user_id}", response_model=UserProfile)
async def get_profile(user_id: str):
    """Get user profile"""
    for email, user in users_db.items():
        if user["user_id"] == user_id:
            return UserProfile(
                user_id=user["user_id"],
                email=user["email"],
                full_name=user["full_name"],
                phone=user["phone"],
                profile_picture=user.get("profile_photo"),
                member_since=datetime.fromisoformat(user["created_at"]) if isinstance(user["created_at"], str) else user["created_at"],
                total_bookings=user.get("booking_stats", {}).get("total_bookings", 0),
                loyalty_points=user.get("loyalty_points", 0),
                is_verified=user.get("email_verified", False)
            )
    raise HTTPException(status_code=404, detail="User not found")


# ==================== TRAIN BROWSING ROUTES ====================

@app.get("/api/trains/search")
async def search_trains(
    from_station: str,
    to_station: str,
    departure_date: str,
    seat_class: Optional[str] = "AC2"
):
    """Search trains by route and date"""
    matching_trains = [
        train for train in trains_data
        if train.get("from", "").lower() == from_station.lower() and
           train.get("to", "").lower() == to_station.lower()
    ]
    
    if not matching_trains:
        raise HTTPException(status_code=404, detail="No trains found for this route")
    
    # Use PRAL Perceive Agent to analyze search
    perception = {
        "total_trains_found": len(matching_trains),
        "seats_available": sum(train.get("availability", {}).get("confirmed", 0) for train in matching_trains)
    }
    
    return {
        "from_station": from_station,
        "to_station": to_station,
        "departure_date": departure_date,
        "total_results": len(matching_trains),
        "trains": matching_trains[:10],  # Return top 10
        "ai_analysis": perception
    }


@app.get("/api/trains/{train_id}")
async def get_train_details(train_id: str):
    """Get detailed train information"""
    train = next((t for t in trains_data if t.get("_id") == train_id), None)
    if not train:
        raise HTTPException(status_code=404, detail="Train not found")
    return train


@app.post("/api/trains/availability", response_model=AvailabilityCheckResponse)
async def check_availability(request: AvailabilityCheckRequest):
    """Check seat availability for a train"""
    train = next((t for t in trains_data if t.get("_id") == request.train_id), None)
    if not train:
        raise HTTPException(status_code=404, detail="Train not found")
    
    availability = train.get("availability", {})
    available = availability.get("confirmed", 0)
    price = train.get("price", {}).get(request.seat_class, 0)
    
    return AvailabilityCheckResponse(
        train_id=request.train_id,
        train_number=train.get("number"),
        departure_date=request.departure_date,
        seat_class=request.seat_class,
        available_count=available,
        rac_count=availability.get("rac", 0),
        waitlist_count=availability.get("waitlist", 0),
        is_available=available >= request.number_of_passengers,
        price_per_seat=price,
        total_price=price * request.number_of_passengers
    )


@app.get("/api/trains/{train_id}/seat-map")
async def get_seat_map(train_id: str, seat_class: str):
    """Get seat availability map for visualization"""
    train = next((t for t in trains_data if t.get("_id") == train_id), None)
    if not train:
        raise HTTPException(status_code=404, detail="Train not found")
    
    # Generate realistic seat data
    import random
    total_seats = 72
    available = random.randint(10, 60)
    
    available_seats = [f"{chr(65+i)}{j+1}" for i in range(6) for j in range(12)][:available]
    booked_seats = [f"{chr(65+i)}{j+1}" for i in range(6) for j in range(12)][available:available+40]
    
    return SeatAvailabilityMap(
        train_id=train_id,
        seat_class=seat_class,
        total_seats=total_seats,
        available_seats=available_seats,
        booked_seats=booked_seats,
        rac_seats=[],
        waitlist_seats=[]
    )


# ==================== BOOKING ROUTES ====================

@app.post("/api/bookings/normal", response_model=BookingConfirmation)
async def create_normal_booking(request: NormalBookingRequest):
    """Create normal train booking"""
    # Validate train exists
    train = next((t for t in trains_data if t.get("_id") == request.train_id), None)
    if not train:
        raise HTTPException(status_code=404, detail="Train not found")
    
    # Use PRAL Act Agent to execute booking
    booking_id = str(uuid.uuid4())
    pnr = f"AB{datetime.now().strftime('%y%m%d')}{booking_id[-4:]}"
    
    booking_confirmation = BookingConfirmation(
        pnr=pnr,
        booking_id=booking_id,
        user_id=request.user_id,
        train_number=train.get("number"),
        train_name=train.get("name"),
        from_station=request.from_station,
        to_station=request.to_station,
        departure_date=request.departure_date,
        departure_time=request.departure_time,
        passengers=[{"name": p.name, "age": p.age} for p in request.passengers],
        seat_class=request.seat_class,
        seats_assigned=[s.seat_number for s in request.seat_selections],
        total_fare=train.get("price", {}).get(request.seat_class, 0) * len(request.passengers),
        booking_status=BookingStatusEnum.CONFIRMED,
        payment_status=PaymentStatusEnum.COMPLETED,
        booking_timestamp=datetime.utcnow(),
        confirmation_details={
            "quota": request.quota,
            "special_requirements": request.special_requirements
        }
    )
    
    # Store booking
    bookings_db[booking_id] = {
        "booking_id": booking_id,
        "pnr": pnr,
        "user_id": request.user_id,
        "train_id": request.train_id,
        "status": "CONFIRMED",
        "created_at": datetime.utcnow().isoformat()
    }
    
    # Update user booking stats
    for email, user in users_db.items():
        if user["user_id"] == request.user_id:
            user["booking_stats"]["total_bookings"] += 1
            user["booking_stats"]["successful_bookings"] += 1
            break
    
    return booking_confirmation


@app.post("/api/bookings/tatkal")
async def create_tatkal_booking(request: TatkalBookingRequest):
    """Schedule Tatkal train booking"""
    train = next((t for t in trains_data if t.get("_id") == request.train_id), None)
    if not train:
        raise HTTPException(status_code=404, detail="Train not found")
    
    if not train.get("tatkal_eligible"):
        raise HTTPException(status_code=400, detail="Train not eligible for Tatkal booking")
    
    tatkal_id = str(uuid.uuid4())
    
    return {
        "tatkal_booking_id": tatkal_id,
        "status": "SCHEDULED",
        "scheduled_time": request.scheduled_time,
        "train_number": train.get("number"),
        "from_station": request.from_station,
        "to_station": request.to_station,
        "departure_date": request.departure_date,
        "number_of_passengers": len(request.passengers),
        "message": f"Tatkal booking scheduled for {request.scheduled_time}",
        "retry_count": request.retry_count,
        "created_at": datetime.utcnow().isoformat()
    }


@app.get("/api/bookings/history/{user_id}")
async def get_booking_history(user_id: str):
    """Get user booking history"""
    user_bookings = [
        b for b in bookings_db.values()
        if b["user_id"] == user_id
    ]
    
    return {
        "user_id": user_id,
        "total_bookings": len(user_bookings),
        "bookings": user_bookings
    }


@app.post("/api/bookings/{booking_id}/cancel", response_model=CancellationResponse)
async def cancel_booking(booking_id: str, request: CancellationRequest):
    """Cancel a booking"""
    if booking_id not in bookings_db:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    booking = bookings_db[booking_id]
    
    cancellation_id = str(uuid.uuid4())
    refund_amount = 2000  # Example refund
    
    booking["status"] = "CANCELLED"
    
    return CancellationResponse(
        cancellation_id=cancellation_id,
        booking_id=booking_id,
        pnr=booking.get("pnr"),
        refund_amount=refund_amount,
        cancellation_charges=500,
        status="COMPLETED",
        refund_status=PaymentStatusEnum.COMPLETED,
        timestamp=datetime.utcnow()
    )


# ==================== PRAL AGENT ROUTES ====================

@app.post("/api/agents/orchestrate")
async def orchestrate_booking(
    user_id: str,
    train_id: str,
    from_station: str,
    to_station: str,
    departure_date: str
):
    """Use PRAL orchestrator for intelligent booking"""
    train = next((t for t in trains_data if t.get("_id") == train_id), None)
    if not train:
        raise HTTPException(status_code=404, detail="Train not found")
    
    search_params = {
        "from_station": from_station,
        "to_station": to_station,
        "departure_date": departure_date,
        "user_id": user_id
    }
    
    # Get agent recommendations
    orchestration_result = await pral_orchestrator.orchestrate_search_and_book(
        search_params,
        [train]
    )
    
    return orchestration_result


@app.get("/api/agents/logs/{orchestration_id}")
async def get_agent_logs(orchestration_id: str):
    """Get PRAL agent activity logs"""
    all_logs = pral_orchestrator.get_all_logs()
    
    return {
        "orchestration_id": orchestration_id,
        "perceive_logs": all_logs.get("perceive_agent", []),
        "reason_logs": all_logs.get("reason_agent", []),
        "act_logs": all_logs.get("act_agent", []),
        "learn_logs": all_logs.get("learn_agent", []),
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/api/agents/health")
async def agent_health():
    """Check PRAL agents health"""
    return {
        "perceive_agent": "healthy",
        "reason_agent": "healthy",
        "act_agent": "healthy",
        "learn_agent": "healthy",
        "orchestrator": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }


# ==================== HEALTH & SYSTEM ROUTES ====================

@app.get("/health")
async def health_check():
    """System health check"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "trains_loaded": len(trains_data),
        "users_registered": len(users_db),
        "active_bookings": len(bookings_db),
        "agents": "PRAL (Perceive, Act, Reason, Learn)"
    }


@app.get("/api/system/stats")
async def get_system_stats():
    """Get system statistics"""
    return {
        "total_trains": len(trains_data),
        "total_users": len(users_db),
        "total_bookings": len(bookings_db),
        "active_sessions": len(sessions_db),
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }


# ==================== ERROR HANDLERS ====================

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Custom HTTP exception handler"""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "timestamp": datetime.utcnow().isoformat()}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
