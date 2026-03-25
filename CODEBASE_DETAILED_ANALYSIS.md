# Train Booking Web Application - Detailed Codebase Analysis

## 1. CURRENT TATKAL BOOKING IMPLEMENTATION

### 1.1 Tatkal Booking Page Location
**File Path:** [src/app/booking/tatkal/page.tsx](src/app/booking/tatkal/page.tsx)

### 1.2 Tatkal Booking Flow

The tatkal booking flow is a **scheduled async execution model**:

```
USER INPUT FORM → SCHEDULE REQUEST → BACKEND POLLING → PAYMENT → SUCCESS
```

#### Step-by-step Flow:

**Frontend - User Input Phase (Lines 28-150)**
```typescript
// 1. User collects form data:
- From/To Stations (Select dropdown)
- Departure Date
- Seat Class (AC2 default)
- Number of Passengers (1-6)
- Passenger Details (name, age, gender)
- Booking Time (HH:MM format)

// 2. Form State Structure:
const [formData, setFormData] = useState({
  from: '',
  to: '',
  date: '',
  trainPreference: '',
  seatClass: 'AC2',
  passengers: 1,
  bookingTime: '',
});

const [passengers, setPassengers] = useState<PassengerInput[]>([
  { name: '', age: '', gender: 'Male' },
]);
```

**Frontend - Schedule Phase (Lines 180-260)**
```typescript
// User clicks "Schedule Tatkal" button
const handleSchedule = async (e: React.FormEvent) => {
  // Validates form data
  // POST to /api/bookings/tatkal with payload:
  
  const payload = {
    user_id: userId,
    train_id: formData.trainPreference || 'train_0001',
    from_station: formData.from,
    to_station: formData.to,
    departure_date: formData.date,
    passengers: normalizedPassengers,  // with full details
    seat_class: formData.seatClass,
    scheduled_time: formData.bookingTime,  // HH:MM format
    retry_count: 3,
    retry_interval: 2,
  };
  
  const response = await API.scheduleTatkal(payload);
  setTatkalBookingId(response.tatkal_booking_id);
  setStatus(response.status); // Initial: "SCHEDULED"
};
```

**Frontend - Polling Phase (Lines 104-150)**
```typescript
// After scheduling, continuously poll status every 1000ms
useEffect(() => {
  if (!tatkalBookingId) return;
  
  const interval = setInterval(async () => {
    const data = await API.getTatkalStatus(tatkalBookingId);
    setStatus(data.status); // Polls: SCHEDULED → PROCESSING → CONFIRMED
    setCountdownSeconds(data.countdown_seconds || 0);
    
    if (data.status === 'CONFIRMED') {
      // Store ticket snapshot in sessionStorage
      sessionStorage.setItem(`tatkal_ticket_${tatkalBookingId}`, 
        JSON.stringify(latestTicketSnapshot));
      
      // Auto-redirect to mock payment after 1.5 seconds
      router.push(`/mock-payment?bookingId=${tatkalBookingId}`);
    }
  }, 1000); // Poll every second
  
  return () => clearInterval(interval);
}, [tatkalBookingId]);
```

**Backend - Tatkal Scheduling Endpoint (main_api.py: lines ~1043-1150)**
```python
@app.post("/api/bookings/tatkal")
async def create_tatkal_booking(request: TatkalBookingRequest):
    """Schedule Tatkal booking for automatic execution"""
    
    # Time Logic:
    # If user's selected time has passed today: schedule for tomorrow
    # If user's selected time == current minute: execute immediately
    
    tatkal_id = str(uuid.uuid4())
    pnr = f"AB{datetime.now().strftime('%y%m%d')}{tatkal_id[-4:]}"
    
    tatkal_booking_data = {
        "booking_id": tatkal_id,
        "pnr": pnr,
        "status": "SCHEDULED",
        "booking_type": "TATKAL",
        "priority": "HIGH",
        "scheduled_time": request.scheduled_time,
        "execution_time": execution_time.isoformat(),
        "passengers": [...],
        "retry_count": 0,
        "retry_attempts": 3,
    }
    
    bookings_db[tatkal_id] = tatkal_booking_data
    
    # Spawn async task to process at execution_time
    async def process_scheduled_tatkal(booking_id: str):
        booking = bookings_db.get(booking_id)
        exec_at = datetime.fromisoformat(booking["execution_time"])
        delay = max((exec_at - datetime.now()).total_seconds(), 0)
        
        await asyncio.sleep(delay)
        booking["status"] = "PROCESSING"
        
        await asyncio.sleep(2)  # Simulate processing
        
        booking["status"] = "CONFIRMED"
        booking["confirmation_time"] = datetime.now().isoformat()
```

**Backend - Status Check Endpoint**
```python
@app.get("/api/bookings/tatkal/{tatkal_booking_id}/status")
async def get_tatkal_status(tatkal_booking_id: str):
    """Return current status for polling"""
    booking = bookings_db.get(tatkal_booking_id)
    
    return {
        "tatkal_booking_id": tatkal_booking_id,
        "status": booking.get("status"),  # SCHEDULED/PROCESSING/CONFIRMED
        "pnr": booking.get("pnr"),
        "countdown_seconds": calculate_countdown(booking["execution_time"]),
        "execution_time": booking.get("execution_time"),
        ...
    }
```

### 1.3 Data Collected During Tatkal Booking

**Passenger Information** (normalized format):
```typescript
interface PassengerInput {
  name: string;        // e.g., "John Doe"
  age: string;         // e.g., "25"
  gender: 'Male' | 'Female' | 'Other';
  document_type?: string;      // Aadhaar, Passport, etc.
  document_number?: string;    // 12341234
  phone?: string;              // 9876543210
  email?: string;              // user@example.com
}
```

**Journey & Booking Details**:
```typescript
{
  from: string;              // e.g., 'CSMT' (Mumbai)
  to: string;                // e.g., 'PUNE'
  date: string;              // YYYY-MM-DD
  trainPreference: string;   // Optional train ID
  seatClass: string;         // 'AC2', 'AC3', 'Sleeper', etc.
  passengers: number;        // 1-6
  bookingTime: string;       // HH:MM (when to execute)
}
```

**Backend Storage** for Tatkal:
```python
{
    "booking_id": "uuid",
    "pnr": "AB240325xxxx",
    "tatkal_booking_id": "uuid",
    "status": "SCHEDULED|PROCESSING|CONFIRMED",
    "booking_type": "TATKAL",
    "priority": "HIGH",
    
    # Journey details
    "from_station": "CSMT",
    "to_station": "PUNE",
    "departure_date": "2026-03-25",
    "departure_time": "08:00",
    "train_name": "Train Name",
    "train_number": "12345",
    
    # Passengers (stored as list)
    "passengers": [
        {
            "name": "John Doe",
            "age": 25,
            "gender": "M",
            "document_type": "Aadhaar",
            "document_number": "123412341234"
        }
    ],
    
    # Scheduling
    "scheduled_time": "14:30",
    "execution_time": "2026-03-25T14:30:00",
    "expected_confirmation_time": "2026-03-25T14:30:02",
    
    # Seat allocation
    "seat_class": "AC2",
    "seat_info": "Auto-assigned",
    "coach_info": "To be allocated",
    "number_of_passengers": 1,
    
    # Retry mechanism
    "retry_count": 0,
    "retry_attempts": 3,
    "retry_interval": 2,
    
    # Timestamps
    "created_at": "2026-03-25T14:20:00",
    "processing_started_at": "2026-03-25T14:30:00",
    "confirmation_time": "2026-03-25T14:30:02"
}
```

---

## 2. CURRENT NORMAL BOOKING PAYMENT FLOW

### 2.1 Payment Page Location
**File Path:** [src/app/payment/page.tsx](src/app/payment/page.tsx)

### 2.2 Payment Flow Architecture

The payment flow follows this sequence:

```
BOOKING DRAFT (sessionStorage) → PAYMENT PAGE → UPI/CARD INPUT → PAYMENT PROCESSING → PDF GENERATION → SUCCESS PAGE
```

#### Payment Flow Steps:

**Step 1: Booking Draft Retrieval (Lines 25-40)**
```typescript
// On component mount, retrieve booking draft from sessionStorage
useEffect(() => {
  const raw = sessionStorage.getItem('bookingDraft');
  if (!raw) {
    setMessage('No booking draft found. Please select a train and continue again.');
    return;
  }
  
  const parsed = JSON.parse(raw);
  setDraft(parsed);
}, []);

// Draft structure contains:
type BookingDraft = {
  trainId: string;
  trainName: string;
  trainNumber: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  date: string;
  class: string;
  seatPreference: string;
  passengers: Array<{ name: string; age: number; gender?: string }>;
  price: number;
  bookingType: 'normal' | 'tatkal';
  userId: string;
};
```

**Step 2: Fare Breakdown Calculation (Lines 41-60)**
```typescript
// Uses dynamic pricing engine
const breakdown = useMemo(() => {
  const priceData = calculateFareBreakdown({
    from: draft.from,
    to: draft.to,
    travelClass: draft.class,
    bookingMode: draft.bookingType || 'normal',
    passengerCount: draft.passengers.length,
  });

  return {
    base: priceData.total.baseFare,        // e.g., 2500
    gst: priceData.total.gst,              // 5% of base
    fee: priceData.total.bookingFee,       // 50
    tatkalCharge: priceData.total.tatkalCharge, // if tatkal
    total: priceData.total.grandTotal,     // final amount
    perPassenger: priceData.perPassenger,
  };
}, [draft]);
```

**Step 3: Payment Method Selection (Lines ~150-180)**
```typescript
// User selects payment method from dropdown
<select
  value={paymentMethod}
  onChange={(e) => setPaymentMethod(e.target.value)}
>
  <option value="UPI">UPI</option>
  <option value="CARD">Card</option>
  <option value="NETBANKING">Net Banking</option>
</select>

// Then enters payment details (UPI ID, Card number, etc.)
<input
  type="text"
  value={paymentDetail}
  onChange={(e) => setPaymentDetail(e.target.value)}
  placeholder={paymentMethod === 'UPI' ? 'Enter UPI ID (example@upi)' : 'Enter reference details'}
/>
```

**Step 4: Payment Validation & Submission (Lines 60-145)**
```typescript
const submitPayment = async () => {
  if (!draft || processing) return;

  // Validate payment details
  if (!validatePaymentDetails(paymentMethod, paymentDetail)) {
    setValidationError(`Please enter a valid ${paymentMethod} ID to continue.`);
    return;
  }

  setProcessing(true);
  
  try {
    // Simulate payment processing (2 seconds delay)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Generate mock UTR and PNR
    const utr = generateUTR();   // UTRxxxxxxxxxx (12 chars)
    const pnr = generatePNR();   // 10-digit number

    // Prepare booking payload
    const payload = {
      user_id: draft.userId || 'demo_user_001',
      train_id: draft.trainId,
      train_name: draft.trainName,
      train_number: draft.trainNumber,
      from_station: draft.from,
      to_station: draft.to,
      departure_date: draft.date,
      departure_time: draft.departureTime,
      arrival_time: draft.arrivalTime,
      seat_class: draft.class,
      seat_preference: draft.seatPreference,
      booking_type: draft.bookingType || 'normal',
      passengers: draft.passengers,
      total_amount: breakdown.total,
      payment_method: paymentMethod,      // UPI, CARD, NETBANKING
      payment_reference: paymentDetail.trim(), // User's UPI ID or card ref
      utr: utr,                           // Generated UTR
      pnr: pnr,                           // Generated PNR
    };

    // Submit booking
    const response = await API.createBooking(payload);
    
    if (!response?.success) {
      throw new Error(response?.message || 'Booking save failed');
    }

    // Prepare data for success page
    const bookingData = {
      bookingId: response.booking_id || pnr,
      pnr: pnr,
      utr: utr,
      trainName: draft.trainName,
      // ... other details
    };

    // Store for success page
    sessionStorage.setItem('lastBookingData', JSON.stringify(bookingData));
    sessionStorage.removeItem('bookingDraft');

    // Generate PDF immediately
    generateProfessionalPDF({...});

    // Redirect
    router.push(`/payment-success?bookingId=${encodeURIComponent(pnr)}&utr=${encodeURIComponent(utr)}`);
  } catch (error: any) {
    setMessage('❌ ' + (error?.message || 'Payment failed. Please retry.'));
  } finally {
    setProcessing(false);
  }
};
```

### 2.3 Payment Information Display

**What is shown on payment page:**
1. **Booking Summary** (read-only box):
   - Train name and number
   - Route (From → To)
   - Date and seat class

2. **Fare Breakdown Table**:
   ```
   Base Fare         ₹2500
   Tatkal Charge     ₹500  (if applicable)
   GST (5%)          ₹150
   Booking Fee       ₹50
   ─────────────────────
   TOTAL             ₹3200
   ```

3. **Payment Method & Details Input**:
   - Dropdown: UPI / CARD / NET BANKING
   - Text input: UPI ID, card number, or bank reference

4. **Dynamic Message Display**:
   - Loading status
   - Validation errors
   - Success/failure messages

### 2.4 UTR and PNR Generation

**PNR Generation** (8 lines of code):
```typescript
// src/utils/paymentUtils.ts

export function generatePNR(): string {
  // Format: 10-digit random number (standard railway PNR format)
  const random = Math.floor(Math.random() * 10000000000)
    .toString()
    .padStart(10, '0');
  return random;
  // Example Output: "1234567890"
}
```

**UTR Generation**:
```typescript
export function generateUTR(): string {
  // Format: UTR + 10 random digits
  const randomDigits = Math.floor(Math.random() * 10000000000)
    .toString()
    .padStart(10, '0');
  return `UTR${randomDigits}`;
  // Example Output: "UTR1234567890"
}
```

**Backend Payment Record Creation** ([backend/main_api.py](backend/main_api.py), lines ~794-943):
```python
@app.post("/api/booking/create")
async def create_booking_record(request: Dict[str, Any]):
    """Create and persist booking record from payment"""
    
    # Extract payment info
    booking_id = str(uuid.uuid4())
    pnr = f"AB{datetime.now().strftime('%y%m%d')}{booking_id[-4:]}"
    # Example PNR: "AB2603251a2b3c4d"
    
    # Create booking record
    booking_data = {
        "booking_id": booking_id,
        "pnr": pnr,  # Will be overwritten by frontend-generated PNR
        "user_id": request.get("user_id"),
        "train_id": request.get("train_id"),
        "train_name": request.get("train_name"),
        "train_number": request.get("train_number"),
        "from_station": request.get("from_station"),
        "to_station": request.get("to_station"),
        "departure_date": request.get("departure_date"),
        "departure_time": request.get("departure_time"),
        "arrival_time": request.get("arrival_time"),
        "seat_class": request.get("seat_class"),
        "seat_preference": request.get("seat_preference"),
        "passengers": normalized_passengers,
        "total_amount": request.get("total_amount"),
        "total_fare": request.get("total_amount"),
        "payment_method": request.get("payment_method"),  # UPI, CARD, NETBANKING
        "payment_reference": request.get("payment_reference"),  # User's UPI ID
        "payment_status": "COMPLETED",
        "booking_type": request.get("booking_type"),  # normal | tatkal
        "status": "CONFIRMED",
        "created_at": datetime.utcnow().isoformat(),
    }
    
    # Save to MongoDB + in-memory fallback
    bookings_db[booking_id] = booking_data
    if bookings_collection is not None:
        await bookings_collection.insert_one(booking_data)
    
    return { "success": True, "booking_id": booking_id, **booking_data }
```

### 2.5 Mock vs. Real Payment

**Current Implementation: MOCK (Simulated)**
```typescript
// No real payment gateway integration
// Instead: 2-second delay to simulate processing
await new Promise((resolve) => setTimeout(resolve, 2000));

// Then immediately generate success response
const utr = generateUTR();
const pnr = generatePNR();

// No actual debit/credit of funds
// No integration with: Stripe, PayPal, Razorpay, etc.
```

---

## 3. CURRENT SUCCESS PAGE IMPLEMENTATION

### 3.1 Success Page Location
**File Path:** [src/app/booking-success/page.tsx](src/app/booking-success/page.tsx)

### 3.2 Success Page Display

The success page shows:

```
✅ Payment Successful
   Tatkal Booking Confirmed

┌─────────────────────────────┐
│ Booking ID: AB2603271a2b3c │
│ UTR Number: UTR1234567890  │
│ Train: Rajdhani Express (#12001) │
│ Route: CSMT to PUNE         │
└─────────────────────────────┘

[Download Ticket PDF] [Go to Dashboard]
```

**Page Code Structure** (lines 1-80):
```typescript
'use client';

import Link from 'next/link';
import { useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function BookingSuccessContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId') || '';
  const utr = searchParams.get('utr') || '';

  const ticketSnapshot = useMemo(() => {
    if (!bookingId) return null;
    try {
      // Try to retrieve ticket details from sessionStorage
      const raw = sessionStorage.getItem(`tatkal_ticket_${bookingId}`);
      return raw ? (JSON.parse(raw) as TicketSnapshot) : null;
    } catch {
      return null;
    }
  }, [bookingId]);

  const downloadUrl = useMemo(() => {
    if (!bookingId) return '#';
    // PDF download endpoint with query params
    const query = new URLSearchParams({ bookingId, utr });
    return `/api/download-ticket?${query.toString()}`;
  }, [bookingId, utr]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8 border border-orange-100">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">✅</div>
          <h1 className="text-3xl font-bold text-green-700">Payment Successful</h1>
          <p className="text-gray-600 mt-2">Tatkal Booking Confirmed</p>
        </div>

        {/* Booking Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-6">
          <div className="border rounded-lg p-3">
            <p className="text-gray-500">Booking ID</p>
            <p className="font-mono font-bold break-all">{bookingId || 'N/A'}</p>
          </div>
          <div className="border rounded-lg p-3">
            <p className="text-gray-500">UTR Number</p>
            <p className="font-mono font-bold break-all">{utr || 'N/A'}</p>
          </div>
          <div className="border rounded-lg p-3">
            <p className="text-gray-500">Train</p>
            <p className="font-semibold">{ticketSnapshot?.trainName || '-'} ({ticketSnapshot?.trainNumber || '-'})</p>
          </div>
          <div className="border rounded-lg p-3">
            <p className="text-gray-500">Route</p>
            <p className="font-semibold">{ticketSnapshot?.fromStation || '-'} to {ticketSnapshot?.toStation || '-'}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href={downloadUrl}
            className="flex-1 text-center bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition"
          >
            Download Ticket PDF
          </a>
          <Link
            href="/"
            className="flex-1 text-center bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-lg transition"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <BookingSuccessContent />
    </Suspense>
  );
}
```

### 3.3 Data Retrieval Method

**Data Flow to Success Page:**

1. **URL Query Parameters** (Primary):
   ```
   /booking-success?bookingId=AB2603271a2b3c&utr=UTR1234567890
   ```
   Extracted via `useSearchParams()` hook

2. **SessionStorage** (Secondary - for rich data):
   ```typescript
   const ticketSnapshot = useMemo(() => {
     // Retrieve from sessionStorage key: `tatkal_ticket_${bookingId}`
     const raw = sessionStorage.getItem(`tatkal_ticket_${bookingId}`);
     return raw ? JSON.parse(raw) : null;
   }, [bookingId]);
   
   // Structure of stored data:
   {
     bookingId: "AB2603271a2b3c",
     bookingType: "TATKAL",
     pnr: "1234567890",
     trainId: "train_0001",
     trainName: "Rajdhani Express",
     trainNumber: "12001",
     fromStation: "CSMT",
     toStation: "PUNE",
     departureDate: "2026-03-25",
     seatClass: "AC2",
     seatInfo: "Auto-assigned",
     coachInfo: "To be allocated",
     passengers: [
       { name: "John Doe", age: 25, gender: "Male" }
     ],
     totalAmount: 3200,
     status: "CONFIRMED",
   }
   ```

### 3.4 State vs. SessionStorage vs. URL

| Data Type | Method | Used For | Persistence |
|-----------|--------|----------|------------|
| Booking ID, UTR | URL Query Params | Shareable link, browser navigation | URL-based |
| Train details, Passengers | sessionStorage | PDF generation, display on success page | Session only |
| User data | localStorage | Auth tokens, user profile | Across sessions |
| Booking history | Backend DB | History page, receipts | Permanent |

---

## 4. PDF TICKET GENERATION

### 4.1 PDF Generation Code Location

**Primary PDF Generator:** [src/utils/professionalPdf.ts](src/utils/professionalPdf.ts)

**Alternative (Legacy):** [src/utils/bookingPdf.js](src/utils/bookingPdf.js)

**Tatkal Specific:** [src/utils/tatkalPdf.js](src/utils/tatkalPdf.js)

### 4.2 PDF Libraries Used

**jsPDF** - Main library for PDF creation
```typescript
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';  // For tables
```

**Library Features:**
- `jsPDF`: Core PDF creation
- `jspdf-autotable`: Table rendering (passenger, fare details)
- No external APIs required (client-side generation)

### 4.3 PDF Structure and Layout

**Professional PDF Header** (lines 35-70):
```typescript
const doc = new jsPDF('p', 'mm', 'a4');
const pageWidth = doc.internal.pageSize.getWidth();
const pageHeight = doc.internal.pageSize.getHeight();
let yPosition = 15;

// Define color palette
const primaryColor: [number, number, number] = [15, 23, 42];  // Dark blue
const successColor: [number, number, number] = [34, 197, 94]; // Green
const accentColor: [number, number, number] = [59, 130, 246]; // Light blue

// Header Section - Indian Railways branding
doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
doc.rect(0, 0, pageWidth, 35, 'F');

doc.setFont('Helvetica', 'bold');
doc.setFontSize(20);
doc.setTextColor(255, 255, 255);
doc.text('INDIAN RAILWAYS', 15, 15);
doc.text('E-TICKET', 15, 24);

// Right-aligned PNR, UTR, Booking Date
doc.setFontSize(10);
doc.text(`PNR: ${data.pnr}`, pageWidth - 15, 15, { align: 'right' });
doc.text(`UTR: ${data.utr}`, pageWidth - 15, 21, { align: 'right' });
doc.text(`Booking Date: ${formatDate(data.bookingDate)}`, pageWidth - 15, 27, { align: 'right' });
```

**Journey Details Section** (lines 70-120):
```typescript
// Boxed section for journey info
doc.setDrawColor(59, 130, 246);
doc.rect(10, yPosition, pageWidth - 20, 40);

doc.text('JOURNEY DETAILS', 12, yPosition + 5);

// Train info
doc.text(`Train: ${data.trainName} (${data.trainNumber})`, 12, yPosition + 10);

// From → To with formatting
doc.setFont('Helvetica', 'bold');
doc.setFontSize(11);
doc.text(data.fromStation, 12, yPosition + 15);
doc.text('→', 60, yPosition + 15);
doc.text(data.toStation, 70, yPosition + 15);

// Date, Departure, Arrival, Class
doc.text(`Date of Journey: ${formatDate(data.journeyDate)}`, 120, yPosition + 15);
doc.text(`Departure: ${data.departureTime}`, 12, yPosition + 20);
doc.text(`Arrival: ${data.arrivalTime}`, 70, yPosition + 20);
doc.text(`Class: ${data.seatClass}`, 130, yPosition + 20);
```

**Passenger Details Table** (lines 135-180):
```typescript
// Using autoTable for structured passenger list
const passengerRows = data.passengers.map((p, idx) => [
  `${idx + 1}`,                      // Sr. Number
  p.name || `Passenger ${idx + 1}`,  // Name
  `${p.age || '-'}`,                 // Age
  p.gender || '-',                   // Gender
  p.seat || 'To be assigned',        // Seat
  'CONFIRMED',                       // Status
]);

autoTable(doc, {
  head: [['Sr.', 'Name', 'Age', 'Gender', 'Seat', 'Status']],
  body: passengerRows,
  startY: yPosition,
  margin: { left: 10, right: 10 },
  theme: 'grid',
  headStyles: {
    fillColor: accentColor,
    textColor: [255, 255, 255],
    fontStyle: 'bold',
    fontSize: 9,
  },
  bodyStyles: {
    fontSize: 9,
    textColor: textColor,
  },
  alternateRowStyles: {
    fillColor: [241, 245, 249],  // Light gray alternates
  },
});
```

**Payment Breakdown Table** (lines 180-220):
```typescript
// Fare details
const paymentRows = [
  ['Base Fare', '', `₹${data.basefare.toLocaleString('en-IN')}`],
  ...(data.tatkalCharge ? [['Tatkal Charge', '', `₹${data.tatkalCharge.toLocaleString('en-IN')}`]] : []),
  ['GST', data.gst > 0 ? '5%' : '0%', `₹${data.gst.toLocaleString('en-IN')}`],
  ['Booking Fee', '', `₹${data.bookingFee.toLocaleString('en-IN')}`],
];

autoTable(doc, {
  head: [['Description', 'Rate', 'Amount']],
  body: paymentRows,
  startY: yPosition,
  headStyles: {
    fillColor: accentColor,
    textColor: [255, 255, 255],
    fontStyle: 'bold',
  },
  bodyStyles: {
    fontSize: 9,
  },
  alternateRowStyles: {
    fillColor: [241, 245, 249],
  },
});

// Grand Total highlighted
doc.setFontSize(12);
doc.setFont('Helvetica', 'bold');
doc.text(`TOTAL: ₹${data.totalAmount.toLocaleString('en-IN')}`, 12, finalY + 5);
```

**Footer with Terms** (lines 220-260):
```typescript
doc.setFont('Helvetica', 'normal');
doc.setFontSize(9);
doc.text('Important Information:', 12, finalY + 15);
doc.text('- This e-ticket is valid only with a government-issued ID proof', 12, finalY + 20);
doc.text('- Tatkal bookings cannot be cancelled or refunded', 12, finalY + 25);
doc.text('- Report any discrepancies immediately to station master', 12, finalY + 30);
```

### 4.4 PDF Generation Entry Point

**Called from Payment Page** (src/app/payment/page.tsx, lines ~140-165):
```typescript
import { generateProfessionalPDF } from '@/utils/professionalPdf';

// After successful payment (before redirect):
try {
  generateProfessionalPDF({
    pnr: pnr,
    utr: utr,
    bookingDate: new Date().toISOString(),
    trainName: draft.trainName,
    trainNumber: draft.trainNumber,
    fromStation: draft.from,
    toStation: draft.to,
    journeyDate: draft.date,
    departureTime: draft.departureTime,
    arrivalTime: draft.arrivalTime,
    seatClass: draft.class,
    passengers: draft.passengers,
    basefare: breakdown.base,
    gst: breakdown.gst,
    bookingFee: breakdown.fee,
    tatkalCharge: breakdown.tatkalCharge || 0,
    totalAmount: breakdown.total,
    bookingType: draft.bookingType || 'normal',
  });
} catch (pdfError) {
  console.error('PDF generation error:', pdfError);
  // Continue even if PDF generation fails
}
```

**Called from Success Page** (via API endpoint):
```typescript
// Download endpoint: /api/download-ticket?bookingId=xxx&utr=xxx
const downloadUrl = `/api/download-ticket?${query.toString()}`;

// User clicks "Download Ticket PDF" button
<a href={downloadUrl}>Download Ticket PDF</a>
```

### 4.5 Reusability for Tatkal Bookings

**YES - Fully Reusable** ✅

The `generateProfessionalPDF()` function accepts a `bookingType` parameter:
```typescript
interface PDFTicketData {
  pnr: string;
  utr: string;
  bookingDate: string;
  trainName: string;
  // ... other fields
  bookingType: 'normal' | 'tatkal';  // ← Distinguishes type
}
```

**Tatkal-specific rendering:**
```typescript
// In PDF generation:
if (data.bookingType === 'tatkal') {
  doc.text('TATKAL BOOKING', 15, 30);
  // Show tatkal-specific badge
} else {
  doc.text('NORMAL BOOKING', 15, 30);
}

// Tatkal charge is included in breakdown if tatkal:
...(data.tatkalCharge ? [['Tatkal Charge', '', `₹${data.tatkalCharge}`]] : []),
```

**Dedicated Tatkal PDF** (Alternative):
- File: [src/utils/tatkalPdf.js](src/utils/tatkalPdf.js)
- For Tatkal-specific layouts and branding if needed

---

## 5. DATA FLOW ARCHITECTURE

### 5.1 Data Passing Between Pages

**Three Primary Mechanisms:**

#### 1. URL Query Parameters
```
/payment-success?bookingId=AB2603&utr=UTR123
                 ^^^^^^^^^^^^^^^^  ^^^^^^^^^^
                 useSearchParams() to retrieve
```

**Usage for:**
- Shareable links
- Lightweight identifiers
- Stateless navigation

#### 2. SessionStorage (Browser Session-Level)
```typescript
// Set during tatkal booking
sessionStorage.setItem(`tatkal_ticket_${tatkalBookingId}`, 
  JSON.stringify(latestTicketSnapshot));

// Retrieved on success page
const raw = sessionStorage.getItem(`tatkal_ticket_${bookingId}`);
```

**Advantages:**
- Survives page refreshes (within same session/tab)
- Larger data capacity than URL
- No server round-trip needed

**Cleared when:**
- Browser tab closed
- Session expires
- `sessionStorage.removeItem()` called

#### 3. LocalStorage (Persistent)
```typescript
// User data persists across sessions
const userData = localStorage.getItem('user');
// {user_id, email, full_name, phone}

// Auth tokens
const token = localStorage.getItem('access_token');
```

**Used for:**
- User session persistence
- Auth credentials
- User preferences

#### 4. Backend API/Database
```typescript
// Permanent booking records
POST /api/booking/create
// Stored in MongoDB + in-memory fallback

// Retrieved later for history
GET /api/bookings/history/{userId}
```

### 5.2 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          DATA FLOW ARCHITECTURE                          │
└─────────────────────────────────────────────────────────────────────────┘

[NORMAL BOOKING FLOW]

Frontend Search Page
    ↓
    └─→ Store bookingDraft in sessionStorage
        ├─ trainId, price, passengers, class, etc.
    ↓
Frontend Booking Details Page
    ↓
    └─→ Retrieve bookingDraft from sessionStorage
    ↓
Frontend Payment Page
    ├─→ Retrieve bookingDraft from sessionStorage
    ├─→ Calculate fare using pricing.ts
    ├─→ User enters payment details
    ├─→ Generate UTR, PNR (client-side)
    └─→ POST /api/booking/create
        └─→ Backend:
            ├─→ Save to MongoDB (primary)
            ├─→ Save to in-memory bookings_db (fallback)
            ├─→ Update user booking_stats
            └─→ Return { success: true, booking_id, pnr }
    ↓
    ├─→ Store lastBookingData in sessionStorage
    ├─→ Generate PDF (generateProfessionalPDF)
    └─→ Redirect: /payment-success?bookingId=XXX&utr=YYY
        └─→ Query params in URL
    ↓
Frontend Success Page
    ├─→ Extract bookingId, utr from useSearchParams()
    ├─→ Retrieve ticketSnapshot from sessionStorage
    └─→ Display confirmation & download link


[TATKAL BOOKING FLOW]

Frontend Tatkal Page
    ├─→ User fills: from, to, date, passengers, bookingTime
    ├─→ POST /api/bookings/tatkal
    │   └─→ Backend:
    │       ├─→ Parse scheduled_time (HH:MM)
    │       ├─→ Create tatkal_booking_data
    │       ├─→ Save to bookings_db + MongoDB
    │       ├─→ Spawn async task for execution_time
    │       └─→ Return { tatkal_booking_id, status: SCHEDULED }
    ↓
    ├─→ Store latestTicketSnapshot in sessionStorage (key: tatkal_ticket_${id})
    ├─→ Start polling every 1 second
    │   └─→ GET /api/bookings/tatkal/{id}/status
    │       └─→ Backend returns: { status, countdown_seconds, pnr, ... }
    ├─→ Update status: SCHEDULED → PROCESSING → CONFIRMED
    └─→ When CONFIRMED:
        └─→ Redirect: /mock-payment?bookingId=XXX
    ↓
Frontend Mock Payment (Tatkal-specific)
    ├─→ Retrieve tatkal_ticket_${bookingId} from sessionStorage
    ├─→ User enters UPI ID
    ├─→ Simulate payment (1.5 second delay)
    ├─→ Generate mock UTR
    ├─→ Update sessionStorage[tatkal_ticket_${bookingId}]
    └─→ Redirect: /booking-success?bookingId=XXX&utr=YYY
    ↓
Frontend Success Page
    └─→ (Same as normal booking success)

```

### 5.3 API Endpoints for Booking

#### Search & Availability
```typescript
// Search trains
GET /api/trains/search
  ?from_station=CSMT
  &to_station=PUNE
  &departure_date=2026-03-25
  &seat_class=AC2
  &page=1
  &limit=20
  &sort_by=price | departure_time | rating

// Get single train details
GET /api/trains/{train_id}

// Check seat availability
POST /api/trains/availability
  { train_id, departure_date, seat_class, number_of_passengers }

// Get seat map
GET /api/trains/{train_id}/seat-map?seat_class=AC2
```

#### Normal Bookings
```typescript
// Create booking
POST /api/booking/create
  {
    user_id, train_id, train_name, train_number,
    from_station, to_station, departure_date, departure_time,
    seat_class, seat_preference,
    passengers: [{ name, age, gender }],
    total_amount, payment_method, payment_reference,
    utr, pnr, booking_type: 'normal'
  }
  → { success: true, booking_id, pnr, ... }

// Alternative endpoints
POST /api/bookings/normal    (Model-based)
POST /api/bookings/execute   (Simplified)

// Get booking history
GET /api/bookings/history/{user_id}

// Cancel booking
POST /api/bookings/{booking_id}/cancel
  { booking_id, pnr, reason, user_id }
```

#### Tatkal Bookings
```typescript
// Schedule tatkal booking
POST /api/bookings/tatkal
  {
    user_id, train_id, train_number,
    from_station, to_station, departure_date, departure_time,
    seat_class, passengers: [{ name, age, gender }],
    scheduled_time: "14:30",     // HH:MM format
    retry_count: 3, retry_interval: 2
  }
  → { tatkal_booking_id, pnr, status: 'SCHEDULED', execution_time, ... }

// Get tatkal status (for polling)
GET /api/bookings/tatkal/{tatkal_booking_id}/status
  → { status: SCHEDULED|PROCESSING|CONFIRMED, countdown_seconds, pnr, ... }
```

### 5.4 Passenger Storage During Booking

**During Form Filling:**
```typescript
// Component state only (in-memory)
const [passengers, setPassengers] = useState<PassengerInput[]>([
  { name: '', age: '', gender: 'Male' },
]);
```

**Before Payment:**
```typescript
// Stored in sessionStorage as part of bookingDraft
sessionStorage.setItem('bookingDraft', JSON.stringify({
  passengers: [
    { name: 'John Doe', age: '25', gender: 'Male' },
    { name: 'Jane Doe', age: '23', gender: 'Female' }
  ],
  // ... other fields
}));
```

**After Payment (Permanent):**
```typescript
// Stored in backend database
{
  "booking_id": "uuid",
  "passengers": [
    {
      "name": "John Doe",
      "age": 25,             // Converted to number
      "gender": "M",         // Normalized
      "seat": "23A",         // Added by system
      "document_type": "Aadhaar",
      "document_number": "123412341234",
      "phone": "9876543210",
      "email": "john@example.com"
    }
  ]
}
```

**Passenger Data Normalization** (backend):
```python
normalized_passengers = []
for idx, p in enumerate(passengers):
    age_val = p.get("age", 0)
    try:
        age = int(age_val)  # Convert string to int
    except (TypeError, ValueError):
        age = 0

    normalized_passengers.append({
        "name": p.get("name", f"Passenger {idx + 1}"),
        "age": age,
        "gender": p.get("gender", "N/A"),
        "seat": p.get("seat", f"S{idx + 1}"),  # Default seat assignment
    })
```

---

## Summary Table

| Component | Location | Technology | Purpose |
|-----------|----------|-----------|---------|
| **Tatkal Page** | src/app/booking/tatkal/page.tsx | React, Next.js | Schedule tatkal bookings |
| **Booking Details** | src/app/booking/[id]/page.tsx | React, SearchParams | Display train & collect passengers |
| **Payment Page** | src/app/payment/page.tsx | React, jsPDF | Handle payment & PDF generation |
| **Success Page** | src/app/booking-success/page.tsx | React, useSearchParams | Confirm booking & download ticket |
| **Mock Payment** | src/app/mock-payment/page.tsx | React | Tatkal UPI payment simulation |
| **API Client** | src/lib/api.ts | Fetch API | Backend communication |
| **Pricing Engine** | src/lib/pricing.ts | TypeScript | Dynamic fare calculation |
| **PDF Generation** | src/utils/professionalPdf.ts | jsPDF, jspdf-autotable | Professional ticket generation |
| **Payment Utilities** | src/utils/paymentUtils.ts | TypeScript | UTR/PNR generation |
| **Backend API** | backend/main_api.py | FastAPI, Python | REST endpoints for all operations |
| **Booking Models** | backend/booking_models.py | Pydantic | Data validation schemas |
| **Database** | MongoDB + in-memory | MongoDB, Python dict | Persistent storage |

