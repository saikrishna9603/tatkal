"""
FastAPI application main module with all endpoints and multi-agent orchestration
"""

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi import Request
from datetime import datetime
import asyncio
import os
from dotenv import load_dotenv

from backend.config import app, ALLOWED_ORIGINS
from backend.database import MongoDBClient, TrainRepository, BookingRepository, AgentActivityRepository
from backend.models import SearchCriteria, BookingCreate
from backend.orchestrator import Orchestrator

load_dotenv()

# ============================================================================
# Startup and Shutdown Events
# ============================================================================

@app.on_event("startup")
async def startup():
    """Initialize MongoDB connection on startup (optional)"""
    try:
        await MongoDBClient.connect_db()
        print("✓ MongoDB connection established")
    except Exception as e:
        print(f"⚠ MongoDB connection failed: {str(e)}")
        print("⚠ Running in demo mode - some features may be limited")
    
    print("✓ FastAPI application started successfully")
    print(f"✓ OpenAPI docs available at: http://localhost:8000/docs")
    print(f"✓ Backend running on: http://localhost:8000")
    print(f"✓ Frontend running on: http://localhost:3000")

@app.on_event("shutdown")
async def shutdown():
    """Close MongoDB connection on shutdown"""
    await MongoDBClient.close_db()
    print("✓ MongoDB connection closed")

# ============================================================================
# API Endpoints - Search
# ============================================================================

@app.post("/api/search")
async def search_trains(criteria: SearchCriteria):
    """
    Search for trains matching criteria
    
    Orchestrates: IntentAgent -> TrainSearchAgent -> RankingAgent -> ExplanationAgent -> MLComparisonAgent
    """
    try:
        # Initialize orchestrator
        orchestrator = Orchestrator()
        
        # Get train repository
        train_repo = TrainRepository(MongoDBClient.get_collection("trains"))
        
        # Orchestrate search workflow
        result = await orchestrator.orchestrate_search(
            criteria.dict(by_alias=True),
            train_repo
        )
        
        if not result.get("success"):
            raise HTTPException(
                status_code=404,
                detail=result.get("error", "Search failed")
            )
        
        # Log search activity
        search_log_repo = AgentActivityRepository(
            MongoDBClient.get_collection("search_logs")
        )
        await search_log_repo.log_search(
            user_id="anonymous",
            criteria=criteria.dict(by_alias=True),
            results_count=result.get("totalResults", 0)
        )
        
        return {
            "success": True,
            "workflowId": result.get("workflowId"),
            "trains": result.get("stages", {}).get("search", {}).get("trains", []),
            "rankedTrains": result.get("stages", {}).get("ranking", {}).get("rankedTrains", []),
            "topRecommendation": result.get("topRecommendation"),
            "explanation": result.get("stages", {}).get("explanation", {}),
            "mlComparison": result.get("stages", {}).get("mlComparison", {}),
            "totalResults": result.get("totalResults"),
            "executionTime": result.get("executionTime"),
            "agentLog": [
                {"agent": a.get("agent"), "action": a.get("action"), "status": a.get("status")}
                for a in result.get("agentActivities", [])
            ]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Search error: {str(e)}"
        )

@app.get("/api/trains")
async def get_all_trains():
    """Get all available trains"""
    try:
        train_repo = TrainRepository(MongoDBClient.get_collection("trains"))
        trains = await train_repo.get_all_trains()
        
        return {
            "success": True,
            "trains": trains,
            "count": len(trains)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/trains/{route}")
async def get_trains_by_route(route: str):
    """Get trains for a specific route"""
    try:
        route_parts = route.split("-")
        if len(route_parts) != 2:
            raise ValueError("Invalid route format. Use: from-to")
        
        from_city, to_city = route_parts
        train_repo = TrainRepository(MongoDBClient.get_collection("trains"))
        trains = await train_repo.find_by_route(from_city, to_city)
        
        return {
            "success": True,
            "route": route,
            "trains": trains,
            "count": len(trains)
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ============================================================================
# API Endpoints - Booking
# ============================================================================

@app.post("/api/book")
async def create_booking(booking: BookingCreate):
    """
    Create a new booking
    
    Orchestrates: TatkalScheduler -> BookingExecutionAgent -> PDFAgent -> WaitlistAgent
    """
    try:
        orchestrator = Orchestrator()
        
        booking_request = {
            "train": booking.dict(by_alias=True).get("train"),
            "passengers": booking.passengers,
            "berthPreference": booking.selectedBerth,
            "class": booking.selectedClass,
            "isTatkal": booking.searchCriteria.quota == "TATKAL",
            "intent": booking.searchCriteria.dict(by_alias=True)
        }
        
        # Orchestrate booking workflow
        result = await orchestrator.orchestrate_booking(
            booking_request,
            BookingRepository(MongoDBClient.get_collection("bookings"))
        )
        
        if not result.get("success"):
            raise HTTPException(
                status_code=400,
                detail=result.get("error", "Booking failed")
            )
        
        # Save booking to database
        booking_repo = BookingRepository(MongoDBClient.get_collection("bookings"))
        booking_data = result.get("stages", {}).get("booking", {}).get("bookingData", {})
        await booking_repo.create_booking(booking_data)
        
        # Log activity
        activity_repo = AgentActivityRepository(
            MongoDBClient.get_collection("agent_activities")
        )
        await activity_repo.log_activity(
            agent="Orchestrator",
            action="booking_completed",
            session_id=orchestrator.session_id,
            details={"pnr": result.get("pnr")}
        )
        
        return {
            "success": True,
            "pnr": result.get("pnr"),
            "bookingStatus": result.get("bookingStatus"),
            "ticketDownload": f"/api/tickets/{result.get('pnr')}/download",
            "executionTime": result.get("executionTime"),
            "agentLog": [
                {"agent": a.get("agent"), "action": a.get("action"), "status": a.get("status")}
                for a in result.get("agentActivities", [])
            ]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Booking error: {str(e)}"
        )

@app.get("/api/bookings/{pnr}")
async def get_booking(pnr: str):
    """Get booking details by PNR"""
    try:
        booking_repo = BookingRepository(MongoDBClient.get_collection("bookings"))
        booking = await booking_repo.find_booking(pnr)
        
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        return {
            "success": True,
            "booking": booking
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/bookings/user/{user_id}")
async def get_user_bookings(user_id: str):
    """Get all bookings for a user"""
    try:
        booking_repo = BookingRepository(MongoDBClient.get_collection("bookings"))
        bookings = await booking_repo.find_user_bookings(user_id)
        
        return {
            "success": True,
            "userId": user_id,
            "bookings": bookings,
            "count": len(bookings)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# API Endpoints - Tickets and PDFs
# ============================================================================

@app.get("/api/tickets/{pnr}/download")
async def download_ticket(pnr: str):
    """Download E-ticket PDF"""
    try:
        booking_repo = BookingRepository(MongoDBClient.get_collection("bookings"))
        booking = await booking_repo.find_booking(pnr)
        
        if not booking:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        # In production, generate actual PDF
        return {
            "success": True,
            "pnr": pnr,
            "filename": f"E-TICKET_{pnr}.pdf",
            "size": "~450KB",
            "format": "application/pdf",
            "downloadUrl": f"/api/static/tickets/{pnr}.pdf"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# API Endpoints - Agents and Activities
# ============================================================================

@app.get("/api/agents/activities")
async def get_agent_activities(session_id: str = None, limit: int = 100):
    """Get agent activity logs"""
    try:
        activity_repo = AgentActivityRepository(
            MongoDBClient.get_collection("agent_activities")
        )
        
        if session_id:
            activities = await activity_repo.get_session_activities(session_id, limit)
        else:
            activities = await activity_repo.get_activities(limit)
        
        return {
            "success": True,
            "activities": activities,
            "count": len(activities)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/agents/compare")
async def compare_with_ml(criteria: SearchCriteria):
    """
    Compare AI agent decisions with ML baselines
    
    Uses: MLComparisonAgent
    """
    try:
        orchestrator = Orchestrator()
        train_repo = TrainRepository(MongoDBClient.get_collection("trains"))
        
        # First run search
        search_result = await orchestrator.orchestrate_search(
            criteria.dict(by_alias=True),
            train_repo
        )
        
        ml_comparison = search_result.get("stages", {}).get("mlComparison", {})
        
        return {
            "success": True,
            "comparison": ml_comparison,
            "topAiRecommendation": search_result.get("topRecommendation"),
            "executionTime": search_result.get("executionTime")
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# API Endpoints - Tatkal and Scheduling
# ============================================================================

@app.post("/api/tatkal/schedule")
async def get_tatkal_schedule(criteria: SearchCriteria):
    """Get Tatkal booking schedule and countdown"""
    try:
        from backend.agents.scheduler_agent import TatkalSchedulerAgent
        
        scheduler = TatkalSchedulerAgent()
        schedule_result = await scheduler.calculate_tatkal_schedule(
            {
                "date": criteria.date,
                "isTatkal": criteria.quota == "TATKAL"
            }
        )
        
        return {
            "success": True,
            "schedule": schedule_result.get("schedule"),
            "preparationSteps": schedule_result.get("preparationSteps"),
            "isTatkalEligible": schedule_result.get("isTatkalEligible")
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# API Endpoints - Waitlist Tracking
# ============================================================================

@app.post("/api/waitlist/track/{pnr}")
async def track_waitlist(pnr: str, class_: str = "sleeper", position: int = 1):
    """Track waitlist status and simulate progression"""
    try:
        from backend.agents.waitlist_agent import WaitlistProgressionAgent
        
        waitlist_agent = WaitlistProgressionAgent()
        
        # Track current status
        tracking = await waitlist_agent.track_waitlist(pnr, class_, position)
        
        # Simulate progression
        progression = await waitlist_agent.simulate_waitlist_progression(
            pnr, position, class_, days=7
        )
        
        return {
            "success": True,
            "pnr": pnr,
            "tracking": tracking.get("waitlistStatus"),
            "timeline": tracking.get("timeline"),
            "progression": progression.get("progression"),
            "recommendation": tracking.get("recommendation")
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# API Endpoints - Health and Info
# ============================================================================

@app.get("/")
async def root():
    """Root endpoint - API info"""
    return {
        "name": "Tatkal Booking API",
        "version": "1.0.0",
        "description": "Multi-agent AI train booking system",
        "status": "operational",
        "endpoints": {
            "search": "POST /api/search",
            "getAllTrains": "GET /api/trains",
            "trainsByRoute": "GET /api/trains/{route}",
            "booking": "POST /api/book",
            "getBooking": "GET /api/bookings/{pnr}",
            "userBookings": "GET /api/bookings/user/{user_id}",
            "downloadTicket": "GET /api/tickets/{pnr}/download",
            "agentActivities": "GET /api/agents/activities",
            "mlComparison": "POST /api/agents/compare",
            "tatkalSchedule": "POST /api/tatkal/schedule",
            "waitlistTracking": "POST /api/waitlist/track/{pnr}",
            "health": "GET /health",
            "demo": "GET /api/demo/trains"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Ping database
        await MongoDBClient.db.command('ping')
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.utcnow().isoformat()
        }
    except:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "timestamp": datetime.utcnow().isoformat()
        }

# ============================================================================
# Demo/Development Endpoints
# ============================================================================

@app.get("/api/demo/trains")
async def get_demo_trains():
    """Get sample trains for demo/testing"""
    try:
        train_repo = TrainRepository(MongoDBClient.get_collection("trains"))
        trains = await train_repo.get_all_trains()
        
        if trains:
            return {
                "success": True,
                "trains": trains[:10],
                "total": len(trains)
            }
        
        # Return mock data if database empty
        return {
            "success": True,
            "trains": [
                {
                    "_id": "1",
                    "name": "Rajdhani Express",
                    "number": "12345",
                    "from_city": "Delhi",
                    "to_city": "Mumbai",
                    "departureTime": "08:00",
                    "arrivalTime": "20:00",
                    "duration": "12:00",
                    "distance": 1456,
                    "availableSeats": {"sleeper": 45, "ac2": 30, "ac3": 20},
                    "berthAvailability": {"lower": 15, "middle": 10, "upper": 20, "sideLower": 5, "sideUpper": 5},
                    "price": {"sleeper": 500, "ac2": 1200, "ac3": 800},
                    "tatkalPrice": {"sleeper": 650, "ac2": 1500, "ac3": 1000}
                }
            ],
            "message": "Demo data returned - database currently empty"
        }
    except:
        # Return mock data if database connection fails
        return {
            "success": False,
            "trains": [],
            "message": "Database connection error - returning no data"
        }

# ============================================================================
# Error Handlers
# ============================================================================

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.detail,
            "timestamp": datetime.utcnow().isoformat()
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "details": str(exc),
            "timestamp": datetime.utcnow().isoformat()
        }
    )

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "database": "connected"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
