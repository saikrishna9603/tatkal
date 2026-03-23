// Agent types and interfaces

export interface Train {
  id: string;
  name: string;
  number: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  distance: number;
  availableSeats: {
    sleeper: number;
    ac2: number;
    ac3: number;
  };
  berthAvailability: {
    lower: number;
    middle: number;
    upper: number;
    sideLower: number;
    sideUpper: number;
  };
  racSeats: number;
  waitlistNumber: number;
  price: {
    sleeper: number;
    ac2: number;
    ac3: number;
  };
  tatkalPrice: {
    sleeper: number;
    ac2: number;
    ac3: number;
  };
}

export interface SearchCriteria {
  from: string;
  to: string;
  date: string;
  class: string;
  quota: string;
  berthPreference: string;
  tatkalTime?: string;
  passengerCount: number;
}

export interface RankingScore {
  trainId: string;
  availabilityScore: number;
  speedScore: number;
  priceScore: number;
  tatkalSuccessProbability: number;
  berthMatchScore: number;
  totalScore: number;
  reasoning: string[];
}

export interface BookingState {
  trainId: string;
  passengers: any[];
  selectedBerth: string;
  status: 'pending' | 'processing' | 'confirmed' | 'failed' | 'waitlist';
  timestamp: number;
  agentLogs: string[];
}

export interface AgentActivity {
  timestamp: number;
  agent: string;
  action: string;
  status: 'running' | 'completed' | 'failed';
  details?: any;
}

export interface PDFTicket {
  bookingId: string;
  trainDetails: Train;
  passengers: any[];
  berthInfo: string;
  status: string;
  bookingTime: string;
}
