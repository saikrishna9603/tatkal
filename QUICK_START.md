# ⚡ Quick Start Guide - Get Running in 5 Minutes

## Prerequisites

- Python 3.9+ installed
- Node.js 18+ installed
- MongoDB Atlas free account (1 minute to create)
- VS Code or terminal

---

## 🚀 Step 1: MongoDB Setup (1 minute)

1. Go to **mongodb.com/cloud**
2. Sign up (free)
3. Create cluster → Choose "Shared" (free tier)
4. Wait for cluster to deploy (~3 minutes)
5. Click "Connect" → Choose "Python 3.6+"
6. Copy connection string: `mongodb+srv://...`

---

## 🚀 Step 2: Backend Setup (2 minutes)

```bash
# Open terminal in project root
cd OURMINIPROJECT

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate
# OR (macOS/Linux)
source venv/bin/activate

# Install backend dependencies
cd backend
pip install -r requirements.txt

# Create .env file with MongoDB connection
cat > .env << EOF
MONGODB_URL=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
DB_NAME=tatkal_booking
API_HOST=0.0.0.0
API_PORT=8000
EOF

# Start FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

✅ You should see:
```
✓ MongoDB connection established
✓ FastAPI application started successfully
INFO: Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
✓ OpenAPI docs available at: http://localhost:8000/docs
```

**Backend is now running!** Keep this terminal open.

---

## 🚀 Step 3: Frontend Setup (2 minutes)

Open **new terminal** (keep backend running):

```bash
# Navigate to frontend
cd OURMINIPROJECT/frontend

# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm run dev
```

✅ You should see:
```
  ➜  Local:        http://localhost:3000/
  ➜  press h to show help
```

---

## 🎯 Test It Out

### Option 1: Web Interface (Easiest)
1. Open http://localhost:3000
2. Enter search criteria:
   - **From:** Delhi
   - **To:** Mumbai  
   - **Date:** 2024-12-25
   - **Class:** Sleeper
3. Click **"Search Trains"**
4. See ranked results with AI explanations

### Option 2: API Documentation (Swagger)
1. Open http://localhost:8000/docs
2. Find `/api/search` endpoint
3. Click "Try it out"
4. Paste this JSON:
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
5. Click "Execute"
6. See full API response

### Option 3: Command Line (cURL)
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

---

## 📊 What You Get

### Backend Response Includes
✅ List of ranked trains (0-100 score)
✅ AI decision reasoning and explanations
✅ ML model comparison results
✅ Fallback booking strategies
✅ Complete agent activity log
✅ Execution time metrics

### Frontend Shows You
✅ Modern search interface
✅ Beautifully ranked results with animations
✅ Detailed train information cards
✅ Score breakdowns and explanations
✅ Real-time agent activity panel
✅ Responsive mobile design

---

## 🤖 Agent System in Action

When you perform a search, these 10 agents work together:

1. **IntentAgent** - Validates and parses your search
2. **TrainSearchAgent** - Queries MongoDB for matching trains
3. **RankingAgent** - Scores trains on 5 factors (0-100):
   - Availability (seats available)
   - Speed (journey duration)
   - Price (competitiveness)
   - Tatkal success (booking probability)
   - Berth preference (your preference match)
4. **FallbackAgent** - Creates backup booking options
5. **ExplanationAgent** - Explains why ranked that way
6. **MLComparisonAgent** - Compares with 5 ML baseline models

All agents work **in parallel** for sub-1-second response times!

---

## 📝 Common Commands

### Stop Services
```bash
# In backend terminal
Ctrl+C

# In frontend terminal
Ctrl+C

# Kill lingering processes (if needed)
# Windows:
netstat -ano | findstr :8000
taskkill /PID <pid> /F

# macOS/Linux:
lsof -i :8000
kill -9 <pid>
```

### Restart Backend
```bash
# Ensure venv is activated
cd backend
uvicorn main:app --reload --port 8000
```

### Check Status
```bash
# Backend health check
curl http://localhost:8000/health

# Get demo trains
curl http://localhost:8000/api/demo/trains

# Get API info
curl http://localhost:8000/
```

---

## 🔐 Important Files

| File | Purpose |
|------|---------|
| `backend/.env` | **MUST UPDATE** - MongoDB connection string |
| `backend/main.py` | FastAPI app with 20+ endpoints |
| `backend/orchestrator.py` | Coordinates all agents |
| `backend/agents/` | 10 individual agent implementations |
| `frontend/src/app/page.tsx` | Main React search component |
| `frontend/src/components/` | All UI components |

---

## ❌ Troubleshooting

### "MongoDB connection failed"
```
✗ Check .env file has correct MONGODB_URL
✗ Verify cluster is deployed and running
✗ Add 0.0.0.0/0 to IP whitelist in MongoDB Atlas
✗ Test connection with: mongosh "mongodb+srv://..."
```

### "Port 8000 already in use"
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <pid> /F

# macOS/Linux
lsof -i :8000
kill -9 <pid>
```

### "Port 3000 already in use"
```bash
# Kill process or use different port
npm run dev -- --port 3001
```

### "npm dependency error"
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm run dev
```

### "No trains returned"
- Database might be empty
- Use `/api/demo/trains` to get sample data
- Or add trains manually to MongoDB
- Check MongoDB connectivity

### "ModuleNotFoundError" in backend
```bash
# Ensure you're in venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux

# Reinstall requirements
pip install -r backend/requirements.txt
```

---

## 📚 Detailed Documentation

For complete information:
- **Backend Setup:** `BACKEND_SETUP.md`
- **Project Overview:** `PROJECT_COMPLETE.md`
- **Architecture:** `ARCHITECTURE.md`
- **API Docs:** http://localhost:8000/docs (interactive)

---

## 🎓 Understanding the Flow

### Search Flow
```
User Input (React)
    ↓
Frontend calls HTTP POST /api/search
    ↓
Backend creates Orchestrator
    ↓
10 Agents work in parallel:
  - IntentAgent (validate input)
  - TrainSearchAgent (query DB)
  - RankingAgent (score trains)
  - ExplanationAgent (explain)
  - MLComparisonAgent (compare)
  - + 5 more...
    ↓
JSON Response with rankings + agent logs
    ↓
Frontend displays beautiful results
```

### Booking Flow
```
"Book" Button (React)
    ↓
HTTP POST /api/book
    ↓
BookingExecutionAgent (7 steps):
  1. Validate passengers
  2. Check availability
  3. Select berth
  4. Validate payment
  5. Generate PNR
  6. Confirm booking
  7. Send confirmation
    ↓
PDFAgent generates E-ticket
    ↓
WaitlistAgent (if needed)
    ↓
MongoDB saves booking
    ↓
PNR + confirmation response
    ↓
Display in React UI
```

---

## ⭐ Key Features Demonstrated

✅ **Multi-Agent AI System** - 10 specialized agents
✅ **Async Operations** - Concurrent parallel execution
✅ **Database Integration** - MongoDB Atlas cloud database
✅ **REST API** - FastAPI with Swagger documentation
✅ **Modern Frontend** - React with Tailwind CSS
✅ **Responsive Design** - Works on mobile and desktop
✅ **Error Handling** - Comprehensive error management
✅ **Activity Logging** - Complete agent action tracking
✅ **Production Ready** - Scalable and maintainable

---

## 🎬 Demo Walkthrough

### Quick 2-Minute Demo
1. `npm run dev` (frontend)
2. `uvicorn main:app --reload` (backend - in new terminal)
3. Open http://localhost:3000
4. Search: Delhi → Mumbai, Dec 25, Sleeper
5. Click Search
6. Observe:
   - ⚡ Instant results (sub-1 second)
   - 🤖 Agent activity on right panel
   - ⭐ Train scores (0-100)
   - 📊 Score breakdown details
   - 💡 AI explanations
7. Click "Compare AI vs ML" button
8. See ML baseline comparisons

---

## 🔄 Update & Deploy

### Local Testing
```bash
# Keep both running during development
# Backend: uvicorn main:app --reload
# Frontend: npm run dev
```

### Build for Production
```bash
# Frontend build
cd frontend
npm run build

# Backend ready as-is (FastAPI handles it)
# Just change to production settings
```

### Deployment
- **Frontend:** Deploy to Vercel, Netlify, or AWS S3
- **Backend:** Deploy to AWS Lambda, GCP Cloud Run, or Azure
- **Database:** Already on MongoDB Atlas (cloud-hosted)

---

## 📞 Need Help?

1. **Check logs first** - Terminal output usually has the answer
2. **Check /health endpoint** - `http://localhost:8000/health`
3. **Read BACKEND_SETUP.md** - Detailed backend docs
4. **Use Swagger UI** - `http://localhost:8000/docs` for API testing
5. **Review agent code** - Well-commented in `backend/agents/`

---

## ✨ You're All Set!

Your production-ready multi-agent train booking system is now running! 🎉

**Next Steps:**
- ✅ Explore the UI at http://localhost:3000
- ✅ Test API at http://localhost:8000/docs  
- ✅ Modify agents in `backend/agents/` as needed
- ✅ Add real train data to MongoDB
- ✅ Deploy to production when ready

---

**Happy booking!** 🚂✨

For more detailed setup instructions, see BACKEND_SETUP.md

## 📊 Train Data

The system generates **1000+ trains** across 12 routes:
- **Routes:** Delhi-Mumbai, Delhi-Bangalore, Delhi-Kolkata, etc.
- **Classes:** Sleeper, AC 2-Tier, AC 3-Tier
- **Status:** Available, RAC, Waitlist
- **Berths:** Lower, Middle, Upper, Side

## 🧠 AI Algorithm Explained

### Ranking Score = 
- **Availability** (30 pts) - Confirmed > RAC > WL
- **Speed** (20 pts) - Shorter duration
- **Price** (20 pts) - Lower cost  
- **Tatkal Success** (20 pts) - High probability
- **Berth Match** (10 pts) - Your preference

**Example:** Delhi→Mumbai, Tatkal 8:00 AM
- Train A: 92/100 ✓ TOP PICK (confirmed, fast, berth match)
- Train B: 78/100 (RAC, slower, cheapest)
- Train C: 65/100 (waitlist, expensive)

## 🔄 Fallback Strategy

If your selected train fails:
1. **Try RAC** if no seats
2. **Switch train** if no berth match
3. **Choose lowest WL** as last resort
4. **Auto-adapt** during booking

## ⏰ Tatkal Features

- **Countdown Timer** to booking time
- **Auto-trigger** at exact moment
- **Real-time progress** logs
- **Waitlist simulation** (WL→RAC→Confirmed)
- **Live agent activity** panel

## 📱 Features to Explore

- ✓ Multi-agent AI system (10 agents)
- ✓ Premium UI with Framer Motion
- ✓ Real-time agent logs
- ✓ Score breakdown visualization
- ✓ AI vs ML comparison
- ✓ Waitlist progression
- ✓ PDF ticket generation
- ✓ Berth preference matching
- ✓ Demo mode (no real payments)

## 🐛 Troubleshooting

### Port 3000 in use?
```bash
npm run dev -- -p 3001
```

### Need to rebuild?
```bash
npm run build
npm start
```

### Clear cache?
```bash
rm -rf .next node_modules
npm install --legacy-peer-deps
```

## 📚 Key Files

**Agents:**
- `/src/lib/agents/intentAgent.ts` - Parse input
- `/src/lib/agents/trainSearchAgent.ts` - Find trains
- `/src/lib/agents/rankingAgent.ts` - Score & rank
- `/src/lib/agents/schedulerAgent.ts` - Tatkal timing
- `/src/lib/agents/bookingExecutionAgent.ts` - Book
- See `/src/lib/agents/` for all 10 agents

**UI Components:**
- `/src/components/sections/SearchPanel.tsx` - Search
- `/src/components/sections/ResultsPage.tsx` - Results
- `/src/components/sections/BookingPage.tsx` - Booking
- `/src/components/ui/TrainCard.tsx` - Train display
- `/src/components/ui/TatkalCountdown.tsx` - Timer

## 🎓 Learning Path

1. **Understand the Algorithm**
   - Read ranking logic in rankingAgent.ts
   - Try different search parameters
   - Observe score changes

2. **Explore Agent Logs**
   - Watch real-time agent activity
   - Understand multi-agent coordination
   - See decision reasoning

3. **Test Fallback Handling**
   - Notice fallback in logs
   - See train switching
   - Understand strategy adaptation

4. **Compare Systems**
   - See AI vs ML differences
   - Review comparison panel
   - Read detailed explanations

##📞 Next Steps

- Modify train data generation for your regions
- Customize ranking weights
- Add real IRCTC API integration
- Build mobile app version
- Add user authentication

---

**Happy Booking! 🚂**

For more details, see README.md
