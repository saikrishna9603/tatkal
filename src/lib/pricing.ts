export type NormalizedTravelClass = '1A' | '2A' | '3A' | 'SL' | 'GEN';
export type BookingMode = 'normal' | 'tatkal';

export type FareBreakdown = {
  from: string;
  to: string;
  distanceKm: number;
  travelClass: NormalizedTravelClass;
  bookingMode: BookingMode;
  passengerCount: number;
  perPassenger: {
    baseFare: number;
    tatkalCharge: number;
    gst: number;
    bookingFee: number;
    total: number;
    gstRate: number;
  };
  total: {
    baseFare: number;
    tatkalCharge: number;
    gst: number;
    bookingFee: number;
    grandTotal: number;
  };
};

const KNOWN_DISTANCES_KM: Record<string, number> = {
  'DELHI|MUMBAI': 1380,
  'DELHI|KOLKATA': 1530,
  'DELHI|CHENNAI': 2180,
  'DELHI|BANGALORE': 2160,
  'MUMBAI|PUNE': 150,
  'MUMBAI|HYDERABAD': 710,
  'MUMBAI|CHENNAI': 1330,
  'MUMBAI|BANGALORE': 980,
  'BANGALORE|CHENNAI': 350,
  'BANGALORE|HYDERABAD': 570,
  'CHENNAI|HYDERABAD': 630,
  'KOLKATA|CHENNAI': 1660,
  'PUNE|HYDERABAD': 560,
};

function normalizeStation(raw: string): string {
  return (raw || '')
    .toUpperCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^A-Z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cityKey(from: string, to: string): string {
  const left = normalizeStation(from).split(' ')[0] || 'CITYA';
  const right = normalizeStation(to).split(' ')[0] || 'CITYB';
  return [left, right].sort().join('|');
}

function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function normalizeTravelClass(travelClass: string): NormalizedTravelClass {
  const cls = (travelClass || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (cls === '1A' || cls === 'AC1') return '1A';
  if (cls === '2A' || cls === 'AC2') return '2A';
  if (cls === '3A' || cls === 'AC3') return '3A';
  if (cls === 'SL' || cls === 'SLEEPER') return 'SL';
  return 'GEN';
}

export function isAcClass(travelClass: string): boolean {
  const normalized = normalizeTravelClass(travelClass);
  return normalized === '1A' || normalized === '2A' || normalized === '3A';
}

export function getDistanceKm(from: string, to: string): number {
  const key = cityKey(from, to);
  const known = KNOWN_DISTANCES_KM[key];
  if (known) return known;

  const seed = hashSeed(`${normalizeStation(from)}|${normalizeStation(to)}`);
  return 180 + (seed % 1521);
}

function classRateRange(travelClass: NormalizedTravelClass): { min: number; max: number } {
  switch (travelClass) {
    case '1A':
      return { min: 3.0, max: 4.0 };
    case '2A':
      return { min: 2.0, max: 2.5 };
    case '3A':
      return { min: 1.5, max: 2.0 };
    case 'SL':
      return { min: 0.5, max: 0.8 };
    default:
      return { min: 0.3, max: 0.5 };
  }
}

function classTatkalRange(travelClass: NormalizedTravelClass): { min: number; max: number } {
  if (travelClass === 'SL') return { min: 100, max: 200 };
  if (travelClass === 'GEN') return { min: 100, max: 150 };
  return { min: 200, max: 400 };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function calculateFareBreakdown(params: {
  from: string;
  to: string;
  travelClass: string;
  bookingMode?: BookingMode;
  passengerCount?: number;
}): FareBreakdown {
  const from = params.from || 'Unknown';
  const to = params.to || 'Unknown';
  const bookingMode: BookingMode = params.bookingMode || 'normal';
  const passengerCount = clamp(Math.round(params.passengerCount || 1), 1, 6);
  const travelClass = normalizeTravelClass(params.travelClass);

  const distanceKm = getDistanceKm(from, to);
  const rateRange = classRateRange(travelClass);
  const seed = hashSeed(`${normalizeStation(from)}|${normalizeStation(to)}|${travelClass}`);
  const ratio = (seed % 1000) / 1000;
  const perKmRate = rateRange.min + (rateRange.max - rateRange.min) * ratio;

  const baseFare = Math.round(distanceKm * perKmRate);

  let tatkalCharge = 0;
  if (bookingMode === 'tatkal') {
    const tatkalRange = classTatkalRange(travelClass);
    const tatkalRatio = clamp((distanceKm - 100) / 1500, 0, 1);
    tatkalCharge = Math.round(tatkalRange.min + (tatkalRange.max - tatkalRange.min) * tatkalRatio);
  }

  const gstRate = isAcClass(travelClass) ? 0.05 : 0;
  const bookingFee = 50;
  const gst = Math.round((baseFare + tatkalCharge) * gstRate);

  const rawPerPassengerTotal = baseFare + tatkalCharge + gst + bookingFee;
  const cappedPerPassengerTotal = clamp(rawPerPassengerTotal, 200, 3000);

  // Keep breakup consistent with capped total by adjusting base fare if needed.
  const delta = rawPerPassengerTotal - cappedPerPassengerTotal;
  const adjustedBaseFare = Math.max(0, baseFare - delta);
  const adjustedGst = Math.round((adjustedBaseFare + tatkalCharge) * gstRate);
  const perPassengerTotal = adjustedBaseFare + tatkalCharge + adjustedGst + bookingFee;

  return {
    from,
    to,
    distanceKm,
    travelClass,
    bookingMode,
    passengerCount,
    perPassenger: {
      baseFare: adjustedBaseFare,
      tatkalCharge,
      gst: adjustedGst,
      bookingFee,
      total: perPassengerTotal,
      gstRate,
    },
    total: {
      baseFare: adjustedBaseFare * passengerCount,
      tatkalCharge: tatkalCharge * passengerCount,
      gst: adjustedGst * passengerCount,
      bookingFee,
      grandTotal: perPassengerTotal * passengerCount,
    },
  };
}
