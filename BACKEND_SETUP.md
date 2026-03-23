# Backend Setup Guide - Tatkal Booking System

## Overview

The backend is a FastAPI-based multi-agent AI system for train booking. It features 10 specialized agents that coordinate to provide intelligent train search, ranking, booking, and scheduling.

## Architecture

```
FRONTEND (React)
     ↓ HTTP REST
FastAPI Server (localhost:8000)
     ↓
Orchestrator
     ├→ IntentAgent (Parse search criteria)
     ├→ TrainSearchAgent (Query database)
     ├→ RankingAgent (Score and rank trains)
     ├→ FallbackAgent (Alternative strategies)
     ├→ SchedulerAgent (Tatkal timing)
     ├→ BookingExecutionAgent (Execute bookings)
     ├→ ExplanationAgent (Reasoning)
     ├→ WaitlistAgent (Track waitlist)
     ├→ PDFAgent (Generate tickets)
     └→ MLComparisonAgent (Baseline comparison)
     ↓
MongoDB Atlas
```

## Prerequisites

- Python 3.9+
- MongoDB Atlas account (free tier available)
- pip or conda

## Installation

### 1. Create Python Virtual Environment

```bash
# Navigate to project root
cd OURMINIPROJECT

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

### 2. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 3. Configure MongoDB Atlas

1. Go to mongodb.com/cloud and create free cluster
2. Add connection string to `.env` file:

```env
# .env in backend folder
MONGODB_URL=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
DB_NAME=tatkal_booking
```

### 4. Start Backend Server

```bash
# From backend folder with venv activated
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Expected output:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
✓ MongoDB connection established
✓ FastAPI application started successfully
✓ OpenAPI docs available at: http://localhost:8000/docs
```

## API Endpoints

### Search Endpoints

#### POST `/api/search`
Search for trains with multi-agent analysis
```json
{
  "from": "Delhi",
  "to": "Mumbai",
  "date": "2024-12-25",
  "class": "sleeper",
  "quota": "GENERAL",
  "berthPreference": "LOWER",
  "passengerCount": 1
}
```

Returns:
- Ranked train suggestions
- Agent reasoning and explanations
- ML model comparisons
- Execution timeline

#### GET `/api/trains`
Get all available trains

#### GET `/api/trains/{route}`
Get trains for specific route (e.g., `/api/trains/Delhi-Mumbai`)

### Booking Endpoints

#### POST `/api/book`
Create a new booking
```json
{
  "trainId": "12345",
  "passengers": [
    {
      "name": "John Doe",
      "age": 30,
      "gender": "M",
      "reservation": "CONFIRMED"
    }
  ],
  "selectedBerth": "LOWER",
  "class": "sleeper",
  "totalPrice": 450
}
```

Returns:
- PNR number
- Booking confirmation
- E-ticket download link
- Agent execution log

#### GET `/api/bookings/{pnr}`
Get booking details by PNR

#### GET `/api/bookings/user/{user_id}`
Get all bookings for a user

### Ticket Endpoints

#### GET `/api/tickets/{pnr}/download`
Download E-ticket PDF

### Agent Endpoints

#### GET `/api/agents/activities`
Get agent activity logs
- Filter by session: `?session_id=xxx`
- Limit results: `?limit=50`

#### POST `/api/agents/compare`
Compare AI recommendations with ML baselines
```json
{
  "from": "Delhi",
  "to": "Mumbai",
  "date": "2024-12-25",
  "class": "sleeper",
  "quota": "GENERAL"
}
```

Returns:
- AI recommendation score
- ML model predictions
- Comparison metrics
- Ensemble average

### Tatkal Endpoints

#### POST `/api/tatkal/schedule`
Get Tatkal booking schedule and countdown
```json
{
  "from": "Delhi",
  "to": "Mumbai",
  "date": "2024-12-25",
  "class": "sleeper",
  "quota": "TATKAL"
}
```

Returns:
- Booking window timing
- Countdown information
- Preparation steps
- Reminder schedule

### Waitlist Endpoints

#### POST `/api/waitlist/track/{pnr}`
Track waitlist status
- Query params: `?class_=sleeper&position=5`

Returns:
- Current waitlist status
- Conversion probability
- 7-day progression simulation
- Recommendations

### Health & Demo

#### GET `/health`
Health check endpoint
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-01-15T10:30:00"
}
```

#### GET `/api/demo/trains`
Get sample trains for testing

## Agent Descriptions

### 1. IntentAgent
**Purpose:** Parse and validate search criteria
- Validates input data
- Extracts search intent
- Generates preference codes
- Checks urgency (Tatkal eligibility)

### 2. TrainSearchAgent
**Purpose:** Query and filter trains from database
- Searches MongoDB for matching trains
- Applies class and quota filters
- Checks seat availability
- Sorts results by departure time

### 3. RankingAgent
**Purpose:** Score and rank trains using composite algorithm
- Availability score (seat availability & RAC/waitlist)
- Speed score (journey duration)
- Price score (competitiveness)
- Tatkal success probability
- Berth preference matching
- **Scoring:** Weighted combination = Total Score (0-100)

### 4. FallbackAgent
**Purpose:** Generate contingency strategies
- Waitlist options (with conversion probability)
- RAC (Reservation Against Cancellation) booking
- Alternative class upgrades
- Alternative date suggestions
- Alternative train recommendations
- Multi-segment booking strategies

### 5. TatkalSchedulerAgent
**Purpose:** Manage Tatkal booking timing and reminders
- Calculates booking window (4 AM, 4 days advance)
- Generates countdown information
- Creates preparation checklist
- Schedules reminders (1 day, 2 hours, 15 min, 5 min before)
- Risk assessment and optimization

### 6. BookingExecutionAgent
**Purpose:** Execute booking with step-by-step simulation
- Step 1: Validate passenger information
- Step 2: Check train availability
- Step 3: Select berth based on preference
- Step 4: Validate payment details
- Step 5: Generate PNR
- Step 6: Confirm booking in system
- Step 7: Send confirmation

### 7. ExplanationAgent
**Purpose:** Provide human-readable reasoning
- Explains ranking decisions
- Highlights train strengths (pros)
- Identifies limitations (cons)
- Recommends for specific traveler types
- Generates decision justifications

### 8. WaitlistProgressionAgent
**Purpose:** Track waitlist status and simulate conversion
- Conversion probability calculation (varies by class)
- 7-day progression simulation
- Historical pattern analysis
- Daily position improvement tracking
- Conversion timeline generation

### 9. PDFAgent
**Purpose:** Generate E-tickets and confirmations
- Creates E-ticket PDF with barcode/QR
- Generates booking receipts
- Creates cancellation memos
- Produces booking summaries
- Handles refund calculations

### 10. MLComparisonAgent
**Purpose:** Benchmark AI against ML baselines
- 5 ML models (Random Forest, Gradient Boost, Neural Network, SVM, Logistic Regression)
- Individual model predictions
- Ensemble average calculation
- Agreement/consensus analysis
- Booking success probability predictions

## Database Schema

### Collections

#### trains
```json
{
  "_id": ObjectId,
  "name": "Rajdhani Express",
  "number": "12345",
  "from_city": "Delhi",
  "to_city": "Mumbai",
  "departureTime": "08:00",
  "arrivalTime": "20:00",
  "duration": "12:00",
  "distance": 1456,
  "availableSeats": {
    "sleeper": 45,
    "ac2": 30,
    "ac3": 20
  },
  "berthAvailability": {
    "lower": 15,
    "middle": 10,
    "upper": 20,
    "sideLower": 5,
    "sideUpper": 5
  },
  "racSeats": 8,
  "waitlistNumber": 12,
  "price": {
    "sleeper": 500,
    "ac2": 1200,
    "ac3": 800
  },
  "tatkalPrice": {
    "sleeper": 650,
    "ac2": 1500,
    "ac3": 1000
  }
}
```

#### bookings
```json
{
  "_id": ObjectId,
  "pnrNumber": "1234567890",
  "trainId": ObjectId,
  "userId": "user123",
  "passengers": [...],
  "status": "CONFIRMED",
  "class": "sleeper",
  "berth": "LOWER",
  "totalPrice": 450,
  "bookingTime": ISODate,
  "confirmationTime": ISODate
}
```

#### agent_activities
```json
{
  "_id": ObjectId,
  "timestamp": 1234567890,
  "agent": "IntentAgent",
  "action": "parse_intent",
  "status": "completed",
  "sessionId": "abc-123",
  "details": {...}
}
```

#### search_logs
```json
{
  "_id": ObjectId,
  "userId": "user123",
  "criteria": {...},
  "resultsCount": 45,
  "timestamp": ISODate
}
```

## Running with Demo Data

To populate with demo trains, use the MongoDB Atlas UI or import a JSON file.

Sample train record:
```json
{
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
  "racSeats": 8,
  "waitlistNumber": 12,
  "price": {"sleeper": 500, "ac2": 1200, "ac3": 800},
  "tatkalPrice": {"sleeper": 650, "ac2": 1500, "ac3": 1000}
}
```

## Testing API Endpoints

### Using Swagger UI
1. Go to `http://localhost:8000/docs`
2. Try endpoints interactively
3. View request/response formats

### Using cURL

Search:
```bash
curl -X POST "http://localhost:8000/api/search" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "Delhi",
    "to": "Mumbai",
    "date": "2024-12-25",
    "class": "sleeper",
    "quota": "GENERAL"
  }'
```

### Using Python

```python
import requests

response = requests.post(
    "http://localhost:8000/api/search",
    json={
        "from": "Delhi",
        "to": "Mumbai",
        "date": "2024-12-25",
        "class": "sleeper",
        "quota": "GENERAL"
    }
)

print(response.json())
```

## Troubleshooting

### MongoDB Connection Error
- Check `.env` file has correct `MONGODB_URL`
- Verify cluster IP whitelist (add 0.0.0.0/0 for development)
- Test connection: `mongosh "mongodb+srv://..."`

### Port 8000 Already in Use
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <pid> /F

# macOS/Linux
lsof -i :8000
kill -9 <pid>
```

### Import Errors
Ensure you're running from project root with venv activated:
```bash
cd OURMINIPROJECT
venv\Scripts\activate  # Windows
python -m pip install -r backend/requirements.txt
cd backend
uvicorn main:app --reload
```

## Performance Optimization

- **Caching:** Add Redis for search result caching
- **Indexing:** Create MongoDB indexes on `from_city`, `to_city`, `date`
- **Async:** All database operations are async for concurrency
- **Pagination:** Add limit/offset for large result sets

## Next Steps

1. ✓ Install dependencies
2. ✓ Configure MongoDB Atlas
3. ✓ Start backend server
4. Start frontend: `cd frontend && npm run dev`
5. Navigate to `http://localhost:3000`
6. Test search and booking workflows

## Support

- OpenAPI Docs: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Health Check: `http://localhost:8000/health`
