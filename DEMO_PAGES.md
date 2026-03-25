# 🚂 TATKAL System - Demo Pages Guide

## System Architecture
- **Frontend:** Next.js 15.5.14 + React 18 + TypeScript + Tailwind CSS
- **Backend:** FastAPI + Python 3.11 (running on port 8001)
- **Database:** In-memory storage (SQLite)
- **AI System:** PRAL Agents (Perceive, Act, Reason, Learn)

---

## 📖 DEMO PAGES (No Login Required for Overview)

### 1. 🏠 Dashboard - `/` (Root Page)

**Purpose:** Main hub showing user statistics and quick navigation

**Features:**
- Welcome message with user's full name
- Quick stats cards:
  - Total Bookings
  - Successful Bookings
  - Total Money Spent (₹)
  - Tatkal Success Rate (%)
- Quick action buttons:
  - "Book New Train" → Routes to /schedule
  - "Logout" → Clears session

**UI Components:**
- Gradient header with blue to indigo theme
- Responsive grid layout
- Hover effects on stat cards
- User info display (name + email)

---

### 2. 🔍 Train Search - `/schedule`

**Purpose:** Search and discover available trains

**Features:**
- Advanced search filters:
  - From Station (dropdown with 15+ Indian cities)
  - To Station (auto-exclude selected "from")
  - Departure Date (date picker)
  - Seat Class (AC1, AC2, AC3, Sleeper, General)
  
- Train listing with details:
  - Train number and name
  - From/To stations
  - Departure & Arrival times
  - Duration
  - Available seats count
  - Price per ticket
  
- Sorting & Filtering:
  - Filter by time
  - Sort by price/duration
  - Show all matching trains

**API Endpoint:** `GET /api/trains/search?from_station=X&to_station=Y&departure_date=2024-04-01`

---

### 3. 🎫 Normal Booking - `/booking/[id]`

**Purpose:** Complete booking flow for regular ticket purchase

**Features:**
- Train details display
- Interactive seat map:
  - Seat selection by position
  - Visual feedback (selected/unavailable)
  - Seat type (Lower/Middle/Upper)
  
- Passenger information form:
  - Full name
  - Gender (M/F/O)
  - Document type (Aadhar/PAN/Passport)
  - Document number
  - Phone number
  
- Booking summary:
  - Total fare calculation
  - Booking reference
  - Confirmation details
  
- Payment section:
  - Payment gateway integration placeholder
  - Order total display

**Features:**
- Seat selection with visual map
- Passenger details form
- Real-time price calculation
- Booking confirmation

---

### 4. ⚡ Tatkal Booking - `/booking/tatkal`

**Purpose:** 10am rapid booking system with countdown timer

**Features:**
- **Tatkal Timer:** Real-time countdown to 10:00 AM
  - Shows hours, minutes, seconds
  - Updates every second
  - Color changes based on urgency
  
- **Quick Train Selection:**
  - Popular routes (Delhi-Mumbai, Bangalore-Chennai, etc.)
  - One-click selection
  - Auto-filled from/to stations
  
- **Rapid Booking:**
  - Pre-select seat class
  - Quick passenger info
  - Instant confirmation
  
- **Status Tracking:**
  - Booking status updates
  - Success/failure notifications
  - Retry mechanism
  
**Tatkal Features:**
- Higher fares than normal booking
- Limited availability (50-100 seats)
- Instant confirmation
- Perfect for last-minute travel

---

### 5. 👤 User Profile - `/profile`

**Purpose:** Manage account information and preferences

**Features:**
- **Profile Information:**
  - Full name
  - Email address
  - Phone number
  - Gender
  - Date of birth
  
- **Preferences:**
  - Preferred booking class
  - Preferred departure time
  - Budget constraints
  - Berth preferences (upper/lower/side)
  
- **Tatkal Settings:**
  - Enable/disable Tatkal
  - Preferred Tatkal time
  - Max budget for Tatkal
  - Auto-booking option
  
- **Notification Preferences:**
  - Email notifications (ON/OFF)
  - SMS notifications (ON/OFF)
  - Push notifications (ON/OFF)
  
- **Saved Routes:**
  - Quick access to frequent routes
  - Route-specific preferences
  - One-click booking from saved routes
  
- **Saved Payment Methods:**
  - Card details (last 4 digits)
  - UPI IDs
  - Bank accounts
  - Set default payment method
  
- **Booking History:**
  - All past bookings
  - Cancellation status
  - Tickets & receipts
  - Refund history

---

### 6. 🤖 Live Agent Dashboard - `/live-agent`

**Purpose:** AI-powered recommendation and booking assistance

**Features:**
- **PRAL Agent System:**
  - Perceive Agent: Analyzes user requirements
  - Act Agent: Executes booking actions
  - Reason Agent: Optimizes decisions
  - Learn Agent: Improves from patterns
  
- **Agent Activity Panel:**
  - Real-time agent status
  - Current tasks
  - Success/failure rates
  - Response times
  
- **Intelligent Recommendations:**
  - Best trains by price
  - Best trains by comfort
  - Best trains by duration
  - Personalized suggestions based on history
  
- **Performance Metrics:**
  - Total bookings processed
  - Average response time
  - Success rate percentage
  - Failure analysis
  
- **AI Capabilities:**
  - Natural language processing
  - Booking optimization
  - Route alternatives
  - Price comparison
  - Waitlist management
  
- **Agent Descriptions:**
  - Perceive: "Analyzes passenger requirements and railway data..."
  - Act: "Executes booking strategies with lightning-fast response times..."
  - Reason: "Optimizes decisions using ML algorithms..."
  - Learn: "Records patterns for future improvement..."

---

## 🔐 Authentication System

### Demo Credentials:
```
Email: user@example.com
Password: Test@12345
```

### Features:
- JWT-based authentication
- Session management
- Token refresh capability
- Password hashing with bcrypt
- Email validation

---

## 🚀 System Statistics (Demo)

- **Total Trains:** 1000
- **Stations:** 15+ major Indian cities
- **Train Classes:** 6 types (General, Sleeper, AC3, AC2, AC1, Economy)
- **Routes:** 50+ popular routes
- **Booking Types:** Normal + Tatkal
- **Payment Methods:** Credit Card, Debit Card, UPI, NetBanking

---

## 📊 Available Routes

**Major Routes:**
- Delhi ↔ Mumbai
- Delhi ↔ Bangalore
- Mumbai ↔ Bangalore
- Chennai ↔ Kolkata
- Hyderabad ↔ Delhi
- Pune ↔ Mumbai
- Ahmedabad ↔ Delhi
- Jaipur ↔ Delhi
- Lucknow ↔ Delhi
- And 40+ more...

---

## 🎯 Key Features Summary

| Feature | Status | Details |
|---------|--------|---------|
| Train Search | ✅ Live | Real-time search with 1000 trains |
| Seat Selection | ✅ Live | Interactive visual seat map |
| Normal Booking | ✅ Live | Complete booking flow |
| Tatkal Booking | ✅ Live | 10am rapid booking with timer |
| User Profile | ✅ Live | Full account management |
| AI Agents | ✅ Live | PRAL system with recommendations |
| Payment Gateway | 🔄 Integration Ready | Placeholder for payment processing |
| Notifications | ✅ Configured | Email/SMS/Push ready |
| Session Management | ✅ Live | 24-hour session validity |
| Booking History | ✅ Live | Full booking records |

---

## 🔗 Quick Links

- **Frontend:** http://localhost:3000
- **Backend API Docs:** http://localhost:8001/docs
- **GitHub:** https://github.com/saikrishna9603/RAILWAY

---

## 💡 Demo Experience Path

### Best Demo Sequence:
1. **Start at Dashboard** (/) - See user welcome & stats
2. **Go to Train Search** (/schedule) - Search for trains
3. **View Train Details** - Click a train
4. **Proceed to Booking** (/booking/[train-id]) - See seat selection
5. **Check Profile** (/profile) - View saved preferences
6. **Visit Live Agent** (/live-agent) - See AI recommendations
7. **Try Tatkal** (/booking/tatkal) - Experience rapid booking

---

## 🎨 Design Features

- **Modern UI:** Gradient backgrounds, smooth transitions
- **Responsive Design:** Works on mobile, tablet, desktop
- **Dark Mode:** (Planned for future)
- **Accessibility:** WCAG compliant forms and navigation
- **Performance:** Optimized images, lazy loading

---

**Built with ❤️ for Indian Railways Automation**
