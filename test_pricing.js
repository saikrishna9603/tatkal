// Simple test of pricing logic
// This mimics the calculateFareBreakdown function

function normalizeTravelClass(c) {
  const cls = (c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (cls === '1A' || cls === 'AC1') return '1A';
  if (cls === '2A' || cls === 'AC2') return '2A';
  if (cls === '3A' || cls === 'AC3') return '3A';
  if (cls === 'SL' || cls === 'SLEEPER') return 'SL';
  return 'GEN';
}

function isAcClass(c) {
  const n = normalizeTravelClass(c);
  return n === '1A' || n === '2A' || n === '3A';
}

function classRateRange(c) {
  switch (c) {
    case '1A': return { min: 3.0, max: 4.0 };
    case '2A': return { min: 2.0, max: 2.5 };
    case '3A': return { min: 1.5, max: 2.0 };
    case 'SL': return { min: 0.5, max: 0.8 };
    default: return { min: 0.3, max: 0.5 };
  }
}

function hashSeed(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

// Test cases
const testCases = [
  { from: 'Thiruvananthapuram', to: 'Mumbai', class: '2A', passengers: 1, bookingType: 'normal' },
  { from: 'Thiruvananthapuram', to: 'Mumbai', class: '1A', passengers: 1, bookingType: 'normal' },
  { from: 'Thiruvananthapuram', to: 'Mumbai', class: '2A', passengers: 2, bookingType: 'normal' },
  { from: 'Thiruvananthapuram', to: 'Mumbai', class: 'SL', passengers: 2, bookingType: 'normal' },
  { from: 'Thiruvananthapuram', to: 'Mumbai', class: '2A', passengers: 1, bookingType: 'tatkal' },
];

testCases.forEach((test, i) => {
  const travelClass = normalizeTravelClass(test.class);
  const distance = 200 + hashSeed(test.from + test.to) % 1521;
  const rateRange = classRateRange(travelClass);
  const ratio = (hashSeed(test.from + test.to + travelClass) % 1000) / 1000;
  const rate = rateRange.min + (rateRange.max - rateRange.min) * ratio;
  
  const baseFare = Math.round(distance * rate);
  const gstRate = isAcClass(travelClass) ? 0.05 : 0;
  const bookingFee = 50;
  const gst = Math.round(baseFare * gstRate);
  
  let tatkalCharge = 0;
  if (test.bookingType === 'tatkal') {
    const tatkalRatio = Math.min(1, Math.max(0, (distance - 100) / 1500));
    tatkalCharge = Math.round(150 + (400 - 150) * tatkalRatio);
  }
  
  const totalPerPassenger = baseFare + tatkalCharge + gst + bookingFee;
  const grandTotal = totalPerPassenger * test.passengers;
  
  console.log(`\nTest ${i + 1}: ${test.from} → ${test.to}, ${test.class}, ${test.passengers} pax, ${test.bookingType}`);
  console.log(`  Distance: ${distance}km`);
  console.log(`  Rate/km: ₹${rate.toFixed(2)}`);
  console.log(`  Base Fare: ₹${baseFare} × ${test.passengers} = ₹${baseFare * test.passengers}`);
  if (gst > 0) console.log(`  GST (5%): ₹${gst} × ${test.passengers} = ₹${gst * test.passengers}`);
  if (tatkalCharge > 0) console.log(`  Tatkal: ₹${tatkalCharge} × ${test.passengers} = ₹${tatkalCharge * test.passengers}`);
  console.log(`  Booking Fee: ₹${bookingFee}`);
  console.log(`  TOTAL: ₹${grandTotal}`);
});
