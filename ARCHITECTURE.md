# 🏗️ System Architecture Guide

## Overview

This is a **multi-agent autonomous booking system** where 10 specialized AI agents work together in a coordinated workflow to search, rank, and book trains.

```
User Input
    ↓
┌─────────────────────────────────────────┐
│    AGENT ORCHESTRATOR (Coordinator)     │
│  Manages workflow & agent communication │
└─────────────────────────────────────────┘
    ↓         ↓         ↓         ↓
┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐
│Intent│→ │Search│→ │Rank  │→ │Book  │
│Agent │  │Agent │  │Agent │  │Agent │
└──────┘  └──────┘  └──────┘  └──────┘
    ↓         ↓         ↓         ↓
    └─ Fallback Agent (handles failures)
    └─ Scheduler Agent (timing)
    └─ Explanation Agent (reasoning)
    └─ ML Agent (comparison)
```

## 10 Agents Explained

### 1. Intent Agent
**Purpose:** Parse and validate user input

**Input:** Form data or natural language query  
**Output:** Structured SearchCriteria

**Process:**
```typescript
Input: {from: "delhi", to: "mumbai", date: "2024-01-15"}
         ↓
    Normalize: {from: "DELHI", to: "MUMBAI", date: "2024-01-15"}
         ↓
    Validate: passengerCount ∈ [1,6], class ∈ [sleeper, ac2, ac3]
         ↓
Output: SearchCriteria {validated & ready for search}
```

### 2. Train Search Agent
**Purpose:** Query available trains for route

**Input:** SearchCriteria  
**Output:** Array of Trains

**Process:**
- Loads or generates 1000+ train dataset
- Filters by from/to/date
- Sorts by departure time
- Returns all matching trains

### 3. Ranking Agent (★ CORE INTELLIGENCE ★)
**Purpose:** Score and rank trains intelligently

**Input:** Trains [], SearchCriteria  
**Output:** RankingScore []

**Scoring Formula:**
```
Score = 
  Availability(0-30) +
  Speed(0-20) +
  Price(0-20) +
  TatkalSuccess(0-20) +
  BerthMatch(0-10)
  ─────────────────
  TOTAL: 0-100
```

**Availability Breakdown:**
```
- AVAILABLE seats ≥ passengers → 30 pts
- RAC seats ≥ passengers → 15 pts  
- Waitlist → 10 - (WL#/10) pts
```

**Tatkal Success:**
- Base availability score
- Tatkal hour bonus (8:00-12:00 peak)
- Low waitlist bonus
- Max 20 pts

**Example Ranking:**
```
Train 1: Rajdhani Express
├─ Availability: 30/30 (6 seats available)
├─ Speed: 18/20 (12 hours)
├─ Price: 14/20 (₹3500)
├─ Tatkal: 18/20 (prime time, high chance)
├─ Berth: 10/10 (lower preferred, available)
└─ TOTAL: 90/100 ✓ TOP CHOICE

Train 2: Shatabdi Express  
├─ Availability: 15/30 (RAC only)
├─ Speed: 20/20 (10 hours, fastest)
├─ Price: 16/20 (₹3200, cheapest)
├─ Tatkal: 12/20 (off-peak time)
├─ Berth: 5/10 (upper only, not preferred)
└─ TOTAL: 68/100

Train 3: Express Train
├─ Availability: 8/30 (WL 12)
├─ Speed: 12/20 (18 hours)
├─ Price: 18/20 (₹2800, budget)
├─ Tatkal: 8/20 (late time)
├─ Berth: 0/10 (no preferred berth)
└─ TOTAL: 46/100
```

### 4. Fallback Agent
**Purpose:** Handle booking failures with intelligent alternatives

**Strategies (in order):**

1. **RAC Strategy**
   ```
   If: No confirmed seats but RAC available
   Then: Accept RAC booking
   ```

2. **Berth Preference Switch**
   ```
   If: Selected train has no preferred berth
   Then: Switch to next train with preferred berth available
   ```

3. **Waitlist Optimization**
   ```
   If: Waitlist, but alternative with lower WL exists
   Then: Switch to train with WL # lower
   ```

4. **Accept RAC from Alternative**
   ```
   If: No preferred trains available
   Then: Accept RAC from next alternative
   ```

5. **Accept Waitlist**
   ```
   Final: Accept waitlist from next best train
   ```

### 5. Scheduler Agent  
**Purpose:** Manage Tatkal booking time and countdown

**Features:**
- Parse tatkal time (e.g., "08:00")
- Calculate time remaining
- Trigger booking at exact moment
- Update countdown every second

**Implementation:**
```typescript
Schedule: 08:00 AM
Current: 07:59:45 AM
Remaining: 00:00:15

→ At 08:00:00 exactly: AUTO_BOOK_TRIGGERED
```

### 6. Booking Execution Agent
**Purpose:** Execute booking steps with simulation

**Steps:**
1. **Select Train** (800ms) - Confirm selection
2. **Check Availability** (1200ms) - Verify seats/RAC/WL
3. **Allocate Berth** (1000ms) - Reserve berth
4. **Fill Passengers** (1500ms) - Add passenger details
5. **Process Payment** (2000ms) - Simulate payment
6. **Confirm Booking** (1000ms) - Final confirmation

**Output:**
```
Status: CONFIRMED | RAC | WAITLIST | FAILED
Passengers: [{name, age, gender, PNR#}]
SelectedBerth: "lower" | "middle" | "upper"
Timestamp: 1708590125000
AgentLogs: ["✓ Train selected", "✓ Payment processed", ...]
```

### 7. Waitlist Handling Agent
**Purpose:** Simulate waitlist progression

**Simulation:**
```
Update every 2-3 seconds:

Day 1: WL 25 → Update after cancellations
Day 2: WL 15 → Getting closer
Day 3: WL 8  → Very close
Day 4: RAC 2 → Nearly confirmed
Day 5: CONFIRMED → Success!
```

**Progression Logic:**
```
newPosition = max(0, initialWL - (initialWL * 0.3 * dayNumber))
```

### 8. Explanation Agent
**Purpose:** Generate human-readable reasoning

**Generates for:**
- Individual train selections
- Fallback decisions
- Tatkal success predictions  
- System comparisons

**Example Output:**
```
🚂 Rajdhani Express (Train #12001)

Why this train?
✓ Confirmed seats available (6 seats)
⚡ Fast journey: 12h 30m
💰 Economical price: ₹3500
✓ Preferred berth available  
🎯 High Tatkal success probability

Decision Timeline:
1. Ranked 127 trains using multi-factor AI
2. Applied 5 scoring dimensions
3. Rajdhani scored 92/100 (Highest)
```

### 9. ML Comparison Agent
**Purpose:** Provide baseline for comparison

**Simple Algorithm:**
```
If sort_by = "price":
  → Return trains sorted by price (cheapest first)

Else sort_by = "time":
  → Return trains sorted by departure time
  
Score = (Availability * 0.4) + 
        (Price * 0.3) + 
        (Duration * 0.2) +
        (Berth * 0.1)
```

**Max Score:** 100  
**Ranking:** Deterministic (same input → same output)

### 10. PDF/Ticket Agent
**Purpose:** Generate E-tickets

**Ticket Includes:**
- Train details (name, number, route)
- Passenger information
- Berth/Seat assignment
- Booking status
- QR code
- Terms & conditions

## Data Flow

```
User Input
    ↓
IntentAgent: Parse & normalize
    ↓
TrainSearchAgent: Fetch 1000+ trains
    ↓
RankingAgent: Score & sort
    ↓
[User selects train]
    ↓
SchedulerAgent: Wait for Tatkal time
    ↓
BookingExecutionAgent: Execute booking steps
    ↓
[If booking fails]
    ↓
FallbackAgent: Find alternative
    ↓
[If waitlist]
    ↓
WaitlistAgent: Simulate progression
    ↓
PDFAgent: Generate ticket
    ↓
ExplanationAgent: Provide reasoning
    ↓
✓ Booking Complete
```

## State Management

### Search State
```typescript
interface SearchState {
  criteria: SearchCriteria
  results: Train[]
  scores: RankingScore[]
  agentLogs: AgentActivity[]
  selectedTrain?: Train
}
```

### Booking State
```typescript
interface BookingState {
  trainId: string
  passengers: Passenger[]
  selectedBerth: string
  status: 'pending' | 'processing' | 'confirmed' | 'waitlist' | 'failed'
  timestamp: number
  agentLogs: string[]
}
```

## Component Hierarchy

```
App (page.tsx)
├── Header (navigation & branding)
├── SearchPanel (form inputs)
├── ResultsPage (train cards)
│   ├── TrainCard × N (individual trains)
│   ├── AgentActivityPanel (logs)
│   └── ComparisonPanel (AI vs ML)
└── BookingPage (checkout flow)
    ├── TatkalCountdown (timer)
    ├── BookingProgressAnimation (steps)
    ├── WaitlistProgressionSimulator
    └── AgentActivityPanel (logs)
```

## Key Algorithms

### 1. Normal Distribution for Pricing
```
price = base_price × (0.8 + random(0-0.4))
```

### 2. Duration Calculation
```
distance = route_distance_km
time = 8_hours_base + (distance / 60_kmh) 
```

### 3. Score Normalization
```
score = (value / max_value) × max_points
```

### 4. Waitlist Prediction
```
daily_reduction = initial_wl × 0.25
confirmed_days = initial_wl / daily_reduction
```

## Performance Metrics

- **Search:** 50-100ms
- **Ranking:** 100-200ms (1000 trains)
- **Booking Simulation:** 5-8 seconds
- **UI Render:** 16ms (60 FPS)

## Extensibility Points

1. **Add New Agent:** Extend `src/lib/agents/`
2. **Custom Ranking:** Modify RankingAgent scoring
3. **New Routes:** Update trainData.ts
4. **Real API:** Create API wrapper in `/api`
5. **Database:** Connect to real train data

---

**System designed for clarity, extensibility, and production-grade AI orchestration.**
