import { Train, SearchCriteria } from '../types';

/**
 * ML Comparison Agent
 * Simple baseline ML filtering system for comparison
 * Uses deterministic ranking without reasoning
 */
export class MLComparisonAgent {
  static rankTrainsSimple(trains: Train[], criteria: SearchCriteria, sortBy: 'price' | 'time' = 'price'): Train[] {
    console.log('[ML Comparison Agent] Applying simple ML filtering');

    let ranked = [...trains];

    if (sortBy === 'price') {
      // Sort by price (cheapest first)
      ranked.sort((a, b) => {
        const priceA = a.price[criteria.class as keyof typeof a.price] || 5000;
        const priceB = b.price[criteria.class as keyof typeof b.price] || 5000;
        return priceA - priceB;
      });
    } else if (sortBy === 'time') {
      // Sort by departure time
      ranked.sort((a, b) => {
        return a.departureTime.localeCompare(b.departureTime);
      });
    }

    return ranked.slice(0, 10); // Return top 10
  }

  static calculateSimpleScore(train: Train, criteria: SearchCriteria): number {
    // Basic score without complex reasoning
    let score = 0;

    // Availability (40%)
    const availableSeats = train.availableSeats[criteria.class as keyof typeof train.availableSeats] || 0;
    if (availableSeats > 0) score += 40;
    else if (train.racSeats > 0) score += 20;

    // Price (30%)
    const price = train.price[criteria.class as keyof typeof train.price] || 5000;
    const priceScore = Math.max(0, 30 * (1 - Math.min(price, 5000) / 5000));
    score += priceScore;

    // Duration (20%)
    const durationMinutes = this.parseDuration(train.duration);
    const durationScore = Math.max(0, 20 * (1 - Math.min(durationMinutes, 1440) / 1440));
    score += durationScore;

    // Berth matching (10%)
    if (criteria.berthPreference !== 'NO_PREFERENCE') {
      const berthKey = this.normalizeBerthPreference(criteria.berthPreference);
      const berthCount = train.berthAvailability[berthKey as keyof typeof train.berthAvailability] || 0;
      if (berthCount > 0) score += 10;
    } else {
      score += 5;
    }

    return Math.min(100, score);
  }

  private static parseDuration(durationStr: string): number {
    const match = durationStr.match(/(\d+)h\s*(\d+)?m/);
    if (!match) return 480;

    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2] || '0', 10);
    return hours * 60 + minutes;
  }

  private static normalizeBerthPreference(preference: string): string {
    const mapping: { [key: string]: string } = {
      LOWER: 'lower',
      L: 'lower',
      MIDDLE: 'middle',
      M: 'middle',
      UPPER: 'upper',
      U: 'upper',
      SIDE_LOWER: 'sideLower',
      SL: 'sideLower',
      SIDE_UPPER: 'sideUpper',
      SU: 'sideUpper',
    };

    const key = preference.toUpperCase();
    return mapping[key] || 'lower';
  }
}
