# Dynamic Pricing System - Verification Checklist

## 1. Pricing Engine (`src/lib/pricing.ts`)
- ✅ `calculateFareBreakdown()` function exists
- ✅ Takes from, to, travelClass, bookingMode, passengerCount as inputs
- ✅ Returns fareData.total with baseFare, gst, bookingFee, tatkalCharge, grandTotal
- ✅ Different rates for different classes: 1A (3-4), 2A (2-2.5), 3A (1.5-2), SL (0.5-0.8)
- ✅ GST applied only for AC classes (5%)
- ✅ Tatkal charges applied when bookingType === 'tatkal'

## 2. Booking Page (`src/app/booking/[id]/page.tsx`)
- ✅ trainDetails state initialized with from: '', to: ''
- ✅ useEffect extracts from/to from searchParams
- ✅ useMemo calculates priceBreakdown based on:
  - trainDetails.from (from searchParams)
  - trainDetails.to (from searchParams)
  - formData.class (from dropdown select)
  - formData.passengers (from number input)
  - trainDetails.bookingType (from searchParams, default 'normal')
- ✅ Dependencies array includes all these variables
- ✅ Price summary displays:
  - Base Fare: priceBreakdown.base
  - GST (if > 0): priceBreakdown.gst
  - Tatkal (if > 0): priceBreakdown.tatkalCharge
  - Booking Fee: priceBreakdown.fee
  - Total: priceBreakdown.total
- ✅ handleSubmit uses `priceBreakdown.total` for the final price

## 3. Payment Page (`src/app/payment/page.tsx`)
- ✅ Loads bookingDraft from sessionStorage
- ✅ Recalculates pricing using calculateFareBreakdown (consistency check)
- ✅ Displays breakdown (base, gst, fee, tatkalCharge, total)

## 4. Success Page (`src/app/payment-success/page.tsx`)
- ✅ Loads booking data from sessionStorage.lastBookingData
- ✅ Displays PNR, UTR, and pricing information

## Expected Behavior:
1. User clicks "Book Now" from schedule page
2. Arrives at `/booking/[id]?from=X&to=Y&class=2A&...`
3. Navbar shows train details extracted from searchParams
4. Price summary shows DYNAMIC price calculated from from/to/class/passengers
5. User changes class (e.g., 2A → 1A) → Price updates immediately
6. User changes passengers (e.g., 1 → 2) → Price updates immediately
7. User fills passenger details and clicks "Continue to Payment"
8. Booking draft is saved with `price: priceBreakdown.total` (dynamic price)
9. Payment page shows same price (recalculated for consistency)
10. Success page shows final booking with all prices

## Known Issues & Fixes Applied:
1. ❌ React Hooks violation (early return before useMemo) → ✅ FIXED
   - Moved useMemo BEFORE the `if (!user)` early return
   
2. ✅ API port mismatch (8000 vs 8001) → ✅ FIXED
   - Updated `/src/app/api/[...path]/route.ts` to use port 8001
   
3. ⚠️ Initial render has empty from/to → Expected behavior
   - First render shows 0 prices
   - After searchParams load, prices recalculate to correct values
   - Added console.log for debugging

## Testing Instructions:
1. Navigate to /schedule
2. Search for trains (e.g., Mumbai → Delhi)
3. Click "Book Now" on any train
4. **Test 1**: Check if price is displayed (should be dynamic, not static ₹3958)
5. **Test 2**: Change class to 1A → Price should increase
6. **Test 3**: Change class to SL → Price should decrease  
7. **Test 4**: Increase passengers from 1 to 2 → Price should roughly double
8. **Test 5**: Fill passenger details and submit → Should navigate to /payment
9. **Test 6**: Check payment page shows same price
10. **Test 7**: Complete payment → Check success page
11. **Test 8**: Download PDF → Verify all pricing details are correct
