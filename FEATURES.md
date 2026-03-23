# TatkalAI Pro — Complete Feature Inventory

> Generated: March 1, 2026 (Updated — Dual-Mode Booking Session)  
> Based on full static analysis of all source files in `backend/` and `frontend/`

---

## 1. Core Features

### 1.1 FastAPI Backend Server
- **File:** `backend/app/main.py`
- Async FastAPI application with `lifespan` context manager
- Startup sequence: MongoDB connect → Simulation seed → APScheduler start
- Shutdown sequence: APScheduler stop → MongoDB disconnect
- CORS middleware configured (allows all origins in dev)
- Rate limiting via `SlowAPI` middleware
- Health endpoint `GET /health` returns `{status, database, scheduler}`
- Admin endpoints: `POST /api/admin/train-model`, `POST /api/admin/reseed`

### 1.2 Configuration Management
- **File:** `backend/app/config.py`
- `pydantic_settings.BaseSettings` — reads from `.env` file automatically
- Configurable: `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`
- Configurable: `MONGODB_URL`, `MONGODB_DB`
- Configurable: `REDIS_URL`, `REDIS_TTL`
- Configurable: `MODEL_PATH`, `MODEL_THRESHOLD` (default 0.60)
- Configurable: `TATKAL_OPENING_HOUR` (default 10), `BOOKING_TRIGGER_SECONDS_BEFORE` (default 10)
- Configurable: `MAX_RETRY_ATTEMPTS` (default 5), `SCHEDULER_TIMEZONE` (default Asia/Kolkata)
- New email/verification settings: `AUTO_VERIFY_EMAIL` (bool, default True), `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`
- `env_file` path resolved absolute (`Path(__file__).parent.parent / ".env"`) — works from any CWD
### 1.3 Railway Simulation Engine
- **File:** `backend/app/simulation/railway_simulator.py`
- Generates **120 synthetic Indian trains** with real train numbers, names, source/destination codes
- Generates **30-day seat inventory** (per train × per class × per date)
- Generates **5200+ booking history records** used to train the ML model
- Festival date detection (Holi, Diwali, Independence Day, etc.)
- Gaussian noise applied to seat counts for realism
- Demand spikes on weekends and festival dates
- WL (Waitlist) movement simulation
- Guard against re-seeding: checks if `trains.count >= 120` before inserting
- Uses `ordered=False` on all `insert_many` to skip duplicates gracefully
- Seeds `retry_weights` (safe/balanced/aggressive initial values)
- Seeds `demand_patterns` for 50 trains × 7 days

### 1.4 Authentication System
- **File:** `backend/app/utils/auth.py`
- JWT token generation with `python-jose`
- Password hashing with `bcrypt` directly (no passlib dependency)
- `hash_password()` and `verify_password()` functions
- `create_access_token()` with configurable expiry
- `get_current_user()` FastAPI dependency — decodes JWT, fetches user from MongoDB
- Handles both `_id` (ObjectId) and `user_id` (UUID string) lookups
- `OAuth2PasswordBearer` scheme for Swagger UI support

### 1.5 API Routers

#### Auth Router — `backend/app/routers/auth.py`
| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/register` | POST | Register new user — sets `email_verified=AUTO_VERIFY_EMAIL` |
| `/api/auth/token` | POST | OAuth2 form login (for Swagger) |
| `/api/auth/login` | POST | JSON login, returns JWT |
| `/api/auth/me` | GET | Get current user profile (includes `email_verified`) |
| `/api/auth/verify-email` | GET | Verify email via `?token=` query param |
| `/api/auth/resend-verification` | POST | Re-generates and re-sends verification link |

#### Trains Router — `backend/app/routers/trains.py`
| Endpoint | Method | Description |
|---|---|---|
| `/api/trains/cities` | GET | Distinct sources, destinations, station codes |
| `/api/trains/search` | GET | Search by source/dest with `journey_date`, AI availability + predicted probability, smart sort |
| `/api/trains/all` | GET | Paginated list of all trains |
| `/api/trains/{id}` | GET | Get single train by `train_id` |
| `/api/trains/{id}/availability` | GET | Seat availability per class per date |
| `/api/trains/{id}/demand` | GET | Demand pattern (7 days of week) |

#### Bookings Router — `backend/app/routers/bookings.py`
| Endpoint | Method | Description |
|---|---|---|
| `/api/bookings/schedule` | POST | Required field `booking_type: "tatkal"\|"normal"` — branches to tatkal or normal flow |
| `/api/bookings/my` | GET | User's bookings with status filter + pagination |
| `/api/bookings/stats` | GET | Stats with tatkal/normal breakdown, WL count, payment_failed count (also `/history/stats`) |
| `/api/bookings/{id}` | GET | Single booking + all retry attempts |
| `/api/bookings/{id}` | DELETE | Cancel booking + cancel APScheduler job |
| `/api/bookings/{id}/ticket` | GET | Download PDF ticket (FileResponse) |

#### Agents Router — `backend/app/routers/agents.py`
| Endpoint | Method | Description |
|---|---|---|
| `/api/agents/orchestrate` | POST | Full 8-step agentic pipeline |
| `/api/agents/perceive/{id}` | GET | Invoke only Perceive agent |
| `/api/agents/predict` | POST | Perceive + Reason (prediction only) |
| `/api/agents/predict` | POST | Perceive + Reason + Explain |
| `/api/agents/train-model` | POST | Trigger XGBoost retraining (background) |
| `/api/agents/memory` | GET | Long-term agent memory (last 20) |
| `/api/agents/retry-weights` | GET | Current RL strategy weights |
| `/api/agents/strategy-performance` | GET | Per-strategy success rate |
| `/api/agents/scheduler/jobs` | GET | List active APScheduler jobs |
| `/api/agents/jobs` | GET | Alias for `/scheduler/jobs` (matches frontend call) |
| `/api/agents/demand-heatmap` | GET | Day-of-week demand aggregation |
| `/api/agents/confirmation-trend` | GET | Monthly confirmation rate trend |

---

## 2. Agentic AI Features

### 2.1 Perceive Agent
- **File:** `backend/app/agents/perceive_agent.py`
- Queries `live_availability` first, falls back to `seat_inventory`
- Fetches: WL position, Tatkal available seats, demand score, total/booked seats
- Computes occupancy % (`booked_seats / total_seats`)
- Computes historical confirmation rate from last 100 `booking_history` records
- Calculates exact `hours_to_departure` using train's departure time + journey date
- Detects if Tatkal window is open (`now.hour >= 10`)
- Returns typed `PerceiveResult` Pydantic model

### 2.2 Reason Agent
- **File:** `backend/app/agents/reason_agent.py`
- Builds 11-feature dict from `PerceiveResult`
- Calls `predict()` from ML pipeline for `success_probability`
- Falls back to heuristic formula if model file doesn't exist
- Computes `risk_score = (1 - probability) * 100`
- Computes `confidence_score` based on data richness
- Decision logic:
  - `book_now` → probability ≥ 0.60 AND tatkal_available > 0
  - `switch_train` → probability < 0.45 OR tatkal_available == 0
  - `delay_booking` → everything else
- Calls `_find_alternates()` MongoDB aggregation if action is switch/delay
- `_find_alternates()` uses `$lookup` + `$unwind` + `$match` + `$sort` pipeline
- Returns typed `ReasonResult` with `alternate_trains` list

### 2.3 Explain Agent
- **File:** `backend/app/agents/explain_agent.py`
- Uses `shap.TreeExplainer` on the trained XGBoost model
- Builds feature value array from `PerceiveResult`
- Falls back to `_heuristic_importance()` if SHAP fails
- Returns top 6 features sorted by `abs(shap_value)`
- Each feature includes: `feature`, `display_name`, `shap_value`, `actual_value`, `impact` (positive/negative)
- Generates natural language `explanation_text` from top features
- 11 human-readable display names mapped (e.g. `wl_at_booking` → "Waitlist Position")

### 2.4 Act Agent
- **File:** `backend/app/agents/act_agent.py`
- 3 strategy configs: `safe` (2 retries, 5s), `balanced` (4 retries, 2.5s), `aggressive` (6 retries, 1s)
- Loads `retry_weights` from MongoDB for adaptive weighting
- Stochastic booking simulation: success probability = `ML prob × base_weight × availability_factor`
- Jitter added to intervals to simulate real-world timing
- Records every attempt to `booking_attempts` collection
- Auto-escalates strategy: `safe→balanced` at attempt 2, `balanced→aggressive` at attempt 3
- Updates `scheduled_bookings` status to `CONFIRMED` on success
- Generates simulated PNR on success
- Returns typed `ActResult` with `attempts[]`, `status`, `pnr`, `retry_count`

### 2.5 Learn Agent
- **File:** `backend/app/agents/learn_agent.py`
- Records every outcome to `agent_memory` (long-term memory)
- Reinforcement Learning weight update:
  - Success: `reward = +1.0`, weight += 5%
  - Failure: `reward = -0.3`, weight -= 1.5%
  - Weights clamped to [0.1, 1.0]
- Updates running average `success_rate` using incremental formula
- Updates `demand_patterns` per train × day_of_week with rolling averages
- Updates `strategy_performance` collection (total/successful attempts per strategy)
- Stores 13 fields per memory record including: `train_id`, `strategy_used`, `success`, `wl_at_booking`, `predicted_probability`, `user_id`, `timestamp`

### 2.6 Central Orchestrator
- **File:** `backend/app/orchestrator/orchestrator.py`
- **8-Step Goal-Driven Pipeline:**
  1. Generate dynamic plan
  2. Perceive (fetch_availability tool)
  3. Reason (predict_success tool)
  4. Evaluate & Adapt (may switch train or upgrade strategy)
  5. Explain (explain_prediction tool)
  6. Schedule booking (schedule_booking tool)
  7. Execute booking (execute_booking tool)
  8. Learn (LearnAgent.learn())
- Short-term memory dict tracks: `train_id`, `strategy`, `wl_position`, `demand_spike`, `plan_step`, `booking_id`
- Dynamic plan injection: adds new steps when train switch or strategy upgrade occurs
- Strategy upgrade: `delay_booking` action → auto-upgrades to `aggressive`
- Train switch: re-perceives and re-reasons on the alternate train
- Execution time tracked and included in result
- Returns full `OrchestratorResult` with all agent outputs, including `booking_type`

### 2.7 Tool-Based Architecture
- **File:** `backend/app/tools/__init__.py` + 7 tool files
- **7 registered tools in `TOOL_REGISTRY`:**
  1. `fetch_availability` — wraps PerceiveAgent
  2. `predict_success` — wraps ReasonAgent
  3. `explain_prediction` — wraps ExplainAgent
  4. `schedule_booking` — creates `scheduled_bookings` DB record (or reuses existing for Normal mode via `booking_id` param)
  5. `execute_booking` — wraps ActAgent
  6. `retry_strategy` — strategy selector utility
  7. `alternate_train_selector` — MongoDB aggregation for best alternate trains
- Tools are invoked by name via `TOOL_REGISTRY["tool_name"](...)`

### 2.8 Email Service *(NEW)*
- **File:** `backend/app/services/email_service.py`
- `send_verification_email(email, username, token)` — logs verification URL to console (simulated SMTP)
- `send_ticket_email(email, username, booking_id, pnr, wl_number, ...)` — sends booking outcome notification
- `_persist_log()` — stores every email in `email_logs` MongoDB collection
- Graceful: no crash if SMTP not configured — console-only mode in dev

### 2.9 Ticket Service *(NEW)*
- **File:** `backend/app/services/ticket_service.py`
- Generates A4 PDF tickets via `reportlab`
- Ticket includes: PNR/WL number, train name+number, class, journey date, passenger list, booking status, QR placeholder
- Stored at `backend/tickets/{booking_id}.pdf`
- `generate_ticket_pdf()` — async, creates parent dir if missing
- `get_ticket_file_path()` — returns path if PDF exists, else None
- Returns `/api/bookings/{id}/ticket` URL on success
- Graceful `ImportError` fallback: returns `None` if reportlab not installed

---

## 3. ML Features

### 3.1 XGBoost Classifier
- **File:** `backend/app/ml/ml_pipeline.py`
- Model: `XGBClassifier` with `eval_metric='logloss'`, `use_label_encoder=False`
- 80/20 train/test split with `stratify=y`
- Training data: 5200+ records from `booking_history`
- **11 Features:**
  | Feature | Description |
  |---|---|
  | `wl_at_booking` | WL position at time of booking |
  | `tatkal_available_at_booking` | Tatkal quota remaining |
  | `demand_score` | Route demand (0–1) |
  | `occupancy_pct` | Coach fill % |
  | `is_tatkal` | Tatkal quota flag |
  | `is_festival_date` | Festival/holiday flag |
  | `is_weekend` | Fri/Sat travel flag |
  | `hours_to_departure` | Time pressure |
  | `retry_count` | Previous attempts |
  | `strategy_encoded` | safe=0, balanced=1, aggressive=2 |
  | `historical_confirmation_rate` | Past CNF rate for route/class |
- `LabelEncoder` for `strategy_used` → `strategy_encoded`
- Model saved to `app/ml/xgboost_model.pkl`
- Encoder saved to `app/ml/label_encoders.pkl`

### 3.2 SHAP Explainability
- **File:** `backend/app/agents/explain_agent.py`
- `shap.TreeExplainer` — uses tree-based SHAP for XGBoost
- Returns per-feature SHAP values for individual predictions
- Top 6 features by `abs(shap_value)` returned with direction (positive/negative)
- Heuristic fallback when SHAP/model unavailable

### 3.3 Model Evaluation
- Computes `roc_auc_score` on test set after training
- Prints full `classification_report`
- Returns `{"auc": float, "samples": int, "features": list}` from training endpoint

### 3.4 Heuristic Fallback
- **File:** `backend/app/agents/reason_agent.py` (lines 54–61)
- Used when `xgboost_model.pkl` not found (first run before training)
- Formula: `historical_rate + tatkal_bonus - wl_penalty + strategy_bonus`

### 3.5 Prediction Pipeline
- **File:** `backend/app/ml/ml_pipeline.py` → `predict()` function
- Loads model + encoder from disk (cached after first load)
- Encodes `strategy_used` via saved `LabelEncoder`
- Returns `{"probability": float, "prediction": 0|1}`

---

## 4. Scheduler Features

### 4.1 APScheduler Integration
- **File:** `backend/app/scheduler/tatkal_scheduler.py`
- `AsyncIOScheduler` with `timezone=Asia/Kolkata`
- Started in `main.py` lifespan on app startup

### 4.2 Tatkal Trigger Job
- `schedule_tatkal_booking(booking_id, tatkal_time)` — registers a `DateTrigger` job
- Fire time = `tatkal_time - BOOKING_TRIGGER_SECONDS_BEFORE` (default: 10s before 10 AM)
- If trigger time is in the past (same-day booking): fires in 2 seconds
- Job ID format: `tatkal_{booking_id}` — ensures uniqueness and deduplication
- `replace_existing=True` — safe to reschedule

### 4.3 Scheduled Booking Execution
- `_execute_scheduled_booking(booking_id)` — full orchestrator run triggered by scheduler
- Updates booking status to `IN_PROGRESS` before execution
- On completion: generates PDF ticket via `ticket_service`, sends email via `email_service`
- Outcomes handled: `CONFIRMED`, `WAITING_LIST` (generates ticket for both), `FAILED`, `ERROR`
- `AgentGoal` now carries `booking_type="tatkal"` and `booking_id` for context
- On error: updates status to `ERROR` with error message

### 4.4 Job Management
- `cancel_scheduled_booking(booking_id)` — removes job by ID, returns bool
- `get_scheduled_jobs()` — returns list of `{id, next_run_time, name}` for all pending jobs
- Jobs survive server restarts only if APScheduler persistent store is configured (not currently set — in-memory only)

---

## 5. Database Features

### 5.1 MongoDB Atlas Connection
- **File:** `backend/app/database.py`
- Motor async driver (`AsyncIOMotorClient`)
- Connection string: `mongodb+srv://...` (Atlas)
- Indexes created on startup via `create_indexes()`

### 5.2 Collections & Indexes
| Collection | Indexes |
|---|---|
| `payments` | `payment_id` (unique), `booking_id`, `user_id`, `status` |
| `email_logs` | `to`, `sent_at` |
| `users` | `email` (unique), `username` (unique) |
| `trains` | `train_number` (unique), `source+destination` (compound) |
| `seat_inventory` | `train_id+class_code+journey_date` (compound) |
| `live_availability` | `train_id+class_code+journey_date` (compound) |
| `booking_history` | `train_id`, `booked`, `journey_date` |
| `scheduled_bookings` | `user_id`, `status`, `train_id`, `journey_date` |
| `booking_attempts` | `booking_id`, `timestamp` |
| `agent_memory` | `user_id`, `timestamp` |
| `demand_patterns` | `train_id+day_of_week` |
| `strategy_performance` | `strategy` |
| `retry_weights` | `strategy` |

### 5.3 Data Volume
- 163 trains (120 new + 43 from prior partial seed)
- 30 days × 120 trains × avg 4 classes = ~14,400 inventory records
- 3,000 live availability records
- 5,200 booking history records for ML training
- 3 retry weight documents (safe/balanced/aggressive)
- Up to 350 demand pattern documents (50 trains × 7 days)

### 5.4 Schemas
- **File:** `backend/app/models/schemas.py`
- Pydantic v2 models: `UserCreate`, `UserResponse` (with `email_verified`), `LoginRequest`, `TokenResponse`
- `TrainResponse`, `SeatInventory`
- `ScheduleBookingRequest` — required `booking_type: Literal["tatkal", "normal"]`, no fallback default
- `PassengerInfo`
- `AgentGoal` — now includes `booking_type: str = "tatkal"`, `booking_id: Optional[str] = None`
- `PerceiveResult`, `ReasonResult`, `ExplainResult`
- `ActResult` — now includes `wl_number: Optional[str]`, `ticket_pdf_url: Optional[str]`
- `OrchestratorResult` — now includes `booking_type: str`
- `BookingResponse` — now includes `booking_type`, `wl_number`, `ticket_pdf_url`
- `PaymentInitiateRequest`, `PaymentConfirmRequest`, `PaymentResponse` — **NEW** payment Pydantic models

---

## 6. Frontend Features

### 6.1 Authentication Pages
- **File:** `frontend/src/app/login/page.tsx`
- Login / Register toggle with animated tab
- Register form: Full Name, Username, Email, Password
- Login form: Email, Password
- Eye/EyeOff password visibility toggle
- bcrypt hint displayed on register
- Blur blob animated background
- Zustand auth store with `localStorage` JWT persistence
- Auto-redirect to `/` on success, back to `/login` on 401

### 6.2 Dashboard Page
- **File:** `frontend/src/app/page.tsx`
- Stats row 1: Total Bookings, Confirmed (with % rate), Waiting List count, Payment Failed count
- Stats row 2: Tatkal breakdown card (total, confirmed, success rate) + Normal breakdown card
- Recent bookings list with extended status badges (CONFIRMED/FAILED/SCHEDULED/WAITING_LIST/PAYMENT_FAILED/PENDING_PAYMENT)
- Strategy performance bars (safe/balanced/aggressive success rates)
- Scheduled APScheduler jobs with pulsing status dots
- Auto-loads on mount via API calls

### 6.3 Schedule Booking Page
- **File:** `frontend/src/app/schedule/page.tsx`
- **Booking type selector:** two radio-style cards — Tatkal Booking (blue, Zap icon) / Normal Booking (violet, CreditCard icon)
- Train search/filter (by name, number, source code, destination code)
- Live prediction preview panel (auto-triggers on train/class/date change via PerceiveAgent + ReasonAgent)
- Class selector: SL, 3A, 2A, 1A, CC, EC
- Date picker (defaults to 2 days ahead)
- Strategy picker: safe / balanced / aggressive
- Auto-switch toggle
- Passenger form: up to 6 passengers with Name, Age, Gender, Berth Preference
- Add/remove passenger dynamically
- Displays `ProbabilityCard` with success %, risk score, confidence, action badge
- Shows alternate train suggestions (click to switch trains)
- **Tatkal flow:** submit → status=SCHEDULED → ticker shows scheduled time
- **Normal flow:** submit → `BookingResultCard` → "Proceed to Payment" button → `paymentsAPI.initiate()` + `paymentsAPI.confirm()` → shows payment result (SUCCESS/FAILED)
- Status badges: CONFIRMED (green), WAITING_LIST (amber), FAILED (red), PAYMENT_FAILED (slate), SCHEDULED (blue), PENDING_PAYMENT (violet)

### 6.4 Insights Page
- **File:** `frontend/src/app/insights/page.tsx`
- SHAP feature importance bar chart (`ShapChart` component)
- 14-day confirmation rate trend (`ConfirmationTrend` area chart)
- Retrain ML model button with AUC result display
- Agent memory table (last 20 entries)
- Strategy stats (success rate, sample count per strategy)

### 6.5 Live Agent Page
- **File:** `frontend/src/app/live-agent/page.tsx`
- Real-time orchestrator run visualization
- Train + class + date picker to trigger pipeline
- `AgentFlow` step-by-step animated progress (8 steps)
- Perceive data grid (WL, demand, occupancy, hours to dep)
- Explain reasoning text display
- Auto-polling to simulate live agent steps

### 6.6 UI Components
| Component | File | Description |
|---|---|---|
| `AppShell` | `components/layout/AppShell.tsx` | Auth guard — redirects to `/login` if unauthenticated |
| `Sidebar` | `components/layout/Sidebar.tsx` | Fixed left nav with active glow, user avatar, logout |
| `StatCard` | `components/ui/StatCard.tsx` | Gradient stat cards with optional trend indicator |
| `ProbabilityCard` | `components/ui/ProbabilityCard.tsx` | SVG circular progress, linear risk/confidence bars, action badge |
| `AgentFlow` | `components/agents/AgentFlow.tsx` | 8-step plan visualization with per-step badges and animations |
| `ShapChart` | `components/charts/ShapChart.tsx` | Recharts horizontal bar chart with green/red cells by impact |
| `ConfirmationTrend` | `components/charts/ConfirmationTrend.tsx` | Recharts area chart with gradient fill |

### 6.7 State Management
- **File:** `frontend/src/store/authStore.ts`
- Zustand store: `user`, `token`, `isAuthenticated`, `loading`
- `login()`, `register()`, `logout()`, `init()`
- `init()` called on app mount — restores session from localStorage

### 6.8 API Client
- **File:** `frontend/src/lib/api.ts`
- Axios instance with `baseURL = NEXT_PUBLIC_API_URL`
- JWT interceptor: injects `Authorization: Bearer <token>` on every request
- 401 interceptor: clears token and redirects to `/login`
- Exports: `authAPI` (register, login, me, verifyEmail, resendVerification), `trainsAPI` (search, all, get, availability, cities), `bookingsAPI` (schedule, list, get, cancel, stats, ticketUrl), `paymentsAPI` (initiate, confirm, get), `agentsAPI`

### 6.9 Styling
- **Files:** `frontend/src/app/globals.css`, `frontend/tailwind.config.js`
- TailwindCSS dark theme (`bg-[#0f172a]` base)
- `.glass-card` utility: `backdrop-blur`, transparent border, soft shadow
- `.animate-glow` keyframe
- `.pulse-dot` for live status indicators
- `.agent-step-*` for AgentFlow component states
- Gradient border animation

---

## 7. Security Features

### 7.1 JWT Authentication
- **File:** `backend/app/utils/auth.py`
- HS256 algorithm, configurable `SECRET_KEY`
- 24-hour token expiry (configurable via `ACCESS_TOKEN_EXPIRE_MINUTES`)
- All protected endpoints use `Depends(get_current_user)`
- Token decoded using `python-jose`

### 7.2 Password Security
- **File:** `backend/app/utils/auth.py`
- `bcrypt` hashing (cost factor ~12 via default gensalt)
- Plain passwords never stored
- `verify_password` uses `bcrypt.checkpw` — constant-time comparison

### 7.3 Input Validation
- **File:** `backend/app/models/schemas.py`
- Pydantic v2 validates all request bodies
- `EmailStr` validation on all email fields
- `Optional` fields with sane defaults

### 7.4 Rate Limiting
- **File:** `backend/app/main.py`
- `SlowAPI` middleware registered

### 7.5 CORS
- **File:** `backend/app/main.py`
- `CORSMiddleware` configured (open in dev, can be restricted to frontend origin)

### 7.6 Error Handling
- `HTTPException` with correct status codes (400, 401, 404, 500)
- Duplicate user registration returns `400 "Email or username already registered"`
- Train not found returns `404`
- Class not available on train returns `400` with detail

---

## 8. Known Limitations & Remaining Work

### 8.1 ❌ Redis Cache — Not Connected
- `redis` package installed, URL in `.env`, but zero usage in any code
- Impact: Live availability always read direct from MongoDB; no cache

### 8.2 ❌ APScheduler Persistent Store — In-Memory Only
- All scheduled Tatkal jobs are lost on server restart
- Fix: Add `MongoDBJobStore` when creating `AsyncIOScheduler`

### 8.3 ⚠️ ML Model AUC Near Random (~0.49)
- Simulated `booking_history` has weak feature-label correlation
- Fix: Make `booked` in simulator correlate with `wl_at_booking`, `tatkal_available`, `demand_score`

### 8.4 ❌ WebSocket Real-time Agent Streaming — Not Implemented
- Live Agent page still polls for final result; no step-by-step event stream

### 8.5 ⚠️ Integration Tests — Partial
- `backend/tests/test_integration.py` stub only; no tests for Normal-mode payment→booking pipeline

### 8.6 ❌ Pagination on Frontend — Not Implemented
- Dashboard/bookings list fetches first 20 items; no "load more"

### 8.7 ❌ User Profile / Settings Page — Not Implemented

### 8.8 ❌ Real SMTP — Simulated Only
- Emails are console-logged only (set `SMTP_USER` + `SMTP_PASS` in `.env` for real sending)

### 8.9 ✅ FIXED: `/api/trains/cities` — now implemented
### 8.10 ✅ FIXED: `/api/bookings/stats` — available at both `/stats` and `/history/stats`
### 8.11 ✅ FIXED: `/api/agents/jobs` — alias added
### 8.12 ✅ FIXED: Email/notification on booking — `email_service` now sends for all outcomes

---

## Summary Table

| Category | Implemented | Partial | Missing |
|---|---|---|---|
| Core Backend | 9 | 0 | 0 |
| Agentic AI | 9 | 0 | 1 (WebSocket streaming) |
| ML | 5 | 1 (AUC low) | 0 |
| Scheduler | 4 | 1 (no persistent store) | 0 |
| Database | 6 | 0 | 1 (Redis cache) |
| Frontend Pages | 5 | 1 (Live Agent polling) | 1 (Profile page) |
| UI Components | 7 | 0 | 0 |
| Security | 6 | 0 | 0 |
| API Endpoints | 33 | 0 | 1 (WS streaming) |
| Services (NEW) | 2 | 1 (real SMTP) | 0 |

**Total implemented features: ~82**  
**Partial/needs improvement: 4**  
**Missing: 4**
