import { Train } from '../types';

// Indian train routes
const routes = [
  { from: 'DELHI', to: 'MUMBAI', distance: 1438 },
  { from: 'DELHI', to: 'BANGALORE', distance: 2156 },
  { from: 'DELHI', to: 'KOLKATA', distance: 1450 },
  { from: 'MUMBAI', to: 'BANGALORE', distance: 981 },
  { from: 'MUMBAI', to: 'DELHI', distance: 1438 },
  { from: 'BANGALORE', to: 'DELHI', distance: 2156 },
  { from: 'BANGALORE', to: 'MUMBAI', distance: 981 },
  { from: 'KOLKATA', to: 'DELHI', distance: 1450 },
  { from: 'DELHI', to: 'HYDERABAD', distance: 1576 },
  { from: 'MUMBAI', to: 'HYDERABAD', distance: 725 },
  { from: 'DELHI', to: 'JAIPUR', distance: 308 },
  { from: 'MUMBAI', to: 'PUNE', distance: 173 },
];

const trainNames = [
  'Rajdhani Express',
  'Shatabdi Express',
  'Duronto Express',
  'Garib Rath',
  'Janta Express',
  'Express Train',
  'Superfast Express',
  'Mail Express',
  'AC Express',
  'Premium Express',
];

// Generate random time (HH:MM format)
function randomTime(): string {
  const hour = Math.floor(Math.random() * 24);
  const minute = Math.floor(Math.random() * 4) * 15;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

// Calculate arrival time given departure time and duration
function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  let totalMinutes = h * 60 + m + minutes;
  const hours = Math.floor(totalMinutes / 60) % 24;
  const mins = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

// Calculate duration string
function calculateDuration(from: string, to: string): { durationStr: string; minutes: number } {
  const baseTime = 480; // 8 hours base
  const distancePerHour = 60; // km/h average

  const routeData = routes.find((r) => r.from === from && r.to === to);
  const distance = routeData?.distance || 1000;
  const minutes = baseTime + Math.floor(distance / distancePerHour) * 60;

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return {
    durationStr: `${hours}h ${mins}m`,
    minutes,
  };
}

export function generateTrainDataset(): Train[] {
  const trains: Train[] = [];
  let trainId = 1;

  for (const route of routes) {
    // Generate 10-15 trains per route
    const trainsPerRoute = 10 + Math.floor(Math.random() * 6);

    for (let i = 0; i < trainsPerRoute; i++) {
      const departureTime = randomTime();
      const { durationStr, minutes } = calculateDuration(route.from, route.to);
      const arrivalTime = addMinutes(departureTime, minutes);

      const availableSeats = {
        sleeper: Math.floor(Math.random() * 50) + 10,
        ac2: Math.floor(Math.random() * 30) + 5,
        ac3: Math.floor(Math.random() * 40) + 15,
      };

      const berthAvailability = {
        lower: Math.floor(Math.random() * 20) + 2,
        middle: Math.floor(Math.random() * 20) + 2,
        upper: Math.floor(Math.random() * 20) + 2,
        sideLower: Math.floor(Math.random() * 10) + 1,
        sideUpper: Math.floor(Math.random() * 10) + 1,
      };

      const basePrice = Math.max(500, route.distance * 0.8);
      const racSeats = Math.floor(Math.random() * 20) + 2;
      const waitlist = Math.floor(Math.random() * 50);

      trains.push({
        id: `TRAIN_${trainId}`,
        name: trainNames[Math.floor(Math.random() * trainNames.length)],
        number: String(10000 + trainId),
        from: route.from,
        to: route.to,
        departureTime,
        arrivalTime,
        duration: durationStr,
        distance: route.distance,
        availableSeats,
        berthAvailability,
        racSeats,
        waitlistNumber: waitlist,
        price: {
          sleeper: Math.floor(basePrice * 0.8),
          ac2: Math.floor(basePrice * 1.5),
          ac3: Math.floor(basePrice * 2.0),
        },
        tatkalPrice: {
          sleeper: Math.floor(basePrice * 0.8 * 1.3),
          ac2: Math.floor(basePrice * 1.5 * 1.3),
          ac3: Math.floor(basePrice * 2.0 * 1.3),
        },
      });

      trainId++;
    }
  }

  return trains;
}
