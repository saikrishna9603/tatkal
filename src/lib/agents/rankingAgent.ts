import { Train, SearchCriteria, RankingScore } from '../types';

/**
 * Ranking Agent (CORE INTELLIGENCE)
 * Calculates comprehensive scores for each train considering:
 * - Availability
 * - Speed
 * - Price
 * - Tatkal Success Probability
 * - Berth Match
 */
export class RankingAgent {
  static async rankTrains(trains: Train[], criteria: SearchCriteria): Promise<RankingScore[]> {
    const scores: RankingScore[] = trains.map((train) => {
      // 1. Availability Score (0-30 points)
      // AVAILABLE > RAC > WL
      const totalAvailable = train.availableSeats[criteria.class as keyof typeof train.availableSeats] || 0;
      let availabilityScore = 0;

      if (totalAvailable >= criteria.passengerCount) {
        availabilityScore = 30;
      } else if (train.racSeats >= criteria.passengerCount) {
        availabilityScore = 15;
      } else if (train.waitlistNumber > 0) {
        // Waitlist score based on queue position
        availabilityScore = Math.max(0, 10 - train.waitlistNumber / 10);
      }

      // 2. Speed Score (0-20 points)
      // Shorter duration = higher score
      const durationMinutes = this.parseDuration(train.duration);
      const maxDurationMinutes = 24 * 60; // 24 hours
      const speedScore = 20 * (1 - Math.min(durationMinutes, maxDurationMinutes) / maxDurationMinutes);

      // 3. Price Score (0-20 points)
      // Lower price = higher score
      const price = train.tatkalPrice[criteria.class as keyof typeof train.tatkalPrice] || train.price[criteria.class as keyof typeof train.price];
      const avgPrice = 5000; // Average price benchmark
      const priceScore = Math.max(0, 20 * (1 - Math.min(price, avgPrice * 2) / (avgPrice * 2)));

      // 4. Tatkal Success Probability (0-20 points)
      // Based on availability and demand simulation
      const tatkalSuccessProbability = this.calculateTatkalSuccess(train, criteria);

      // 5. Berth Match Score (0-10 points)
      // If preferred berth available
      let berthMatchScore = 0;
      if (criteria.berthPreference !== 'NO_PREFERENCE') {
        const berthKey = this.normalizeBerthPreference(criteria.berthPreference);
        const berthAvailable = train.berthAvailability[berthKey as keyof typeof train.berthAvailability] || 0;
        berthMatchScore = berthAvailable > 0 ? 10 : 2;
      } else {
        berthMatchScore = 5; // Neutral score for no preference
      }

      // Calculate total score
      const totalScore =
        availabilityScore +
        speedScore +
        priceScore +
        tatkalSuccessProbability +
        berthMatchScore;

      // Generate reasoning
      const reasoning = this.generateReasoning(train, criteria, {
        availabilityScore,
        speedScore,
        priceScore,
        tatkalSuccessProbability,
        berthMatchScore,
      });

      return {
        trainId: train.id,
        availabilityScore,
        speedScore,
        priceScore,
        tatkalSuccessProbability,
        berthMatchScore,
        totalScore,
        reasoning,
      };
    });

    // Sort by total score (descending)
    scores.sort((a, b) => b.totalScore - a.totalScore);

    console.log('[Ranking Agent] Applied ranking algorithm');
    console.log('Top 3 trains:', scores.slice(0, 3));

    return scores;
  }

  private static parseDuration(durationStr: string): number {
    const match = durationStr.match(/(\d+)h\s*(\d+)?m/);
    if (!match) return 480; // Default 8 hours

    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2] || '0', 10);
    return hours * 60 + minutes;
  }

  private static calculateTatkalSuccess(train: Train, criteria: SearchCriteria): number {
    // Tatkal success probability (0-20 points)
    // Factors: availability, demand simulation, time of day

    let probability = 0;

    // Base on availability status
    const totalAvailable = train.availableSeats[criteria.class as keyof typeof train.availableSeats] || 0;
    if (totalAvailable > 0) {
      probability += 12;
    } else if (train.racSeats > 0) {
      probability += 6;
    }

    // Tatkal hour advantage (08:00 is prime time)
    const hour = parseInt(criteria.tatkalTime?.split(':')[0] || '08', 10);
    if (hour >= 8 && hour <= 12) {
      probability += 5;
    } else if (hour >= 12 && hour <= 18) {
      probability += 3;
    }

    // Lower waitlist is better
    if (train.waitlistNumber < 10) {
      probability += 3;
    }

    return Math.min(20, probability);
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

  private static generateReasoning(
    train: Train,
    criteria: SearchCriteria,
    scores: any
  ): string[] {
    const reasoning: string[] = [];

    // Availability reasoning
    const totalAvailable = train.availableSeats[criteria.class as keyof typeof train.availableSeats] || 0;
    if (totalAvailable >= criteria.passengerCount) {
      reasoning.push(`✓ Confirmed seats available (${totalAvailable} available)`);
    } else if (train.racSeats >= criteria.passengerCount) {
      reasoning.push(`⚠ Only RAC (Reservation Against Cancellation) available`);
    } else {
      reasoning.push(`✗ Waitlist with ${train.waitlistNumber} passengers ahead`);
    }

    // Speed reasoning
    if (scores.speedScore > 15) {
      reasoning.push(`⚡ Fast journey: ${train.duration}`);
    } else if (scores.speedScore > 10) {
      reasoning.push(`╱ Moderate duration: ${train.duration}`);
    }

    // Price reasoning
    const price = train.tatkalPrice[criteria.class as keyof typeof train.tatkalPrice] || train.price[criteria.class as keyof typeof train.price];
    if (scores.priceScore > 15) {
      reasoning.push(`💰 Economical price: ₹${price}`);
    }

    // Berth reasoning
    if (scores.berthMatchScore === 10) {
      reasoning.push(`✓ Preferred berth available`);
    }

    // Tatkal reasoning
    if (scores.tatkalSuccessProbability > 15) {
      reasoning.push(`🎯 High Tatkal success probability`);
    }

    return reasoning;
  }
}
