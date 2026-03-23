import { Train, BookingState } from '../types';

/**
 * Fallback Agent
 * Implements intelligent fallback strategies when booking fails
 * Dynamically switches decisions during booking
 */
export class FallbackAgent {
  static async handleBookingFailure(
    selectedTrain: Train,
    availableTrains: Train[],
    bookingState: BookingState,
    passengerCount: number,
    preferredBerth: string
  ): Promise<{
    recommendedTrain: Train | null;
    strategy: string;
    reasoning: string[];
  }> {
    const reasoning: string[] = [];

    // Analyze failure reason
    const availableSeats = selectedTrain.availableSeats[
      'ac3' as keyof typeof selectedTrain.availableSeats
    ] as unknown as number;

    // Strategy 1: Try RAC if no confirmed seats
    if (availableSeats === 0 && selectedTrain.racSeats > 0) {
      reasoning.push(`Fallback: No confirmed seats available. Attempting RAC.`);
      if (selectedTrain.racSeats >= passengerCount) {
        return {
          recommendedTrain: selectedTrain,
          strategy: 'RAC_BOOKING',
          reasoning,
        };
      }
    }

    // Strategy 2: Try next available train with same preferences
    if (preferredBerth !== 'NO_PREFERENCE') {
      const trainsWithBerth = availableTrains.filter((t) => {
        const berthKey = this.normalizeBerthPreference(preferredBerth);
        const berthAvailable = t.berthAvailability[
          berthKey as keyof typeof t.berthAvailability
        ] as unknown as number;
        return berthAvailable > 0;
      });

      if (trainsWithBerth.length > 0) {
        const nextTrain = trainsWithBerth[0];
        reasoning.push(`Fallback: Switching to ${nextTrain.name} with preferred berth.`);
        return {
          recommendedTrain: nextTrain,
          strategy: 'BERTH_PREFERENCE_SWITCH',
          reasoning,
        };
      }
    }

    // Strategy 3: Choose train with lowest waitlist
    if (selectedTrain.waitlistNumber > 0) {
      const alternativeTrains = availableTrains.filter(
        (t) => t.waitlistNumber > 0 && t.waitlistNumber < selectedTrain.waitlistNumber
      );

      if (alternativeTrains.length > 0) {
        const bestWLTrain = alternativeTrains[0];
        reasoning.push(
          `Fallback: Switching to train with lower waitlist (WL ${bestWLTrain.waitlistNumber})`
        );
        return {
          recommendedTrain: bestWLTrain,
          strategy: 'WAITLIST_OPTIMIZATION',
          reasoning,
        };
      }
    }

    // Strategy 4: Accept RAC from next best train
    const racTrains = availableTrains.filter((t) => t.racSeats >= passengerCount);
    if (racTrains.length > 0) {
      reasoning.push(`Fallback: Booking with RAC status on alternative train.`);
      return {
        recommendedTrain: racTrains[0],
        strategy: 'ACCEPT_RAC',
        reasoning,
      };
    }

    // Strategy 5: Accept waitlist from next best train
    const wlTrains = availableTrains.filter((t) => t.waitlistNumber < 50);
    if (wlTrains.length > 0) {
      reasoning.push(`Fallback: Booking with waitlist status.`);
      return {
        recommendedTrain: wlTrains[0],
        strategy: 'ACCEPT_WAITLIST',
        reasoning,
      };
    }

    reasoning.push(`No viable fallback options available.`);
    return {
      recommendedTrain: null,
      strategy: 'NONE',
      reasoning,
    };
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

  static simulateWaitlistProgression(
    initialWL: number,
    simulationSteps: number = 5
  ): Array<{ step: number; wlNumber: number; status: string }> {
    const progression: Array<{ step: number; wlNumber: number; status: string }> = [];

    let currentWL = initialWL;
    for (let i = 0; i < simulationSteps; i++) {
      const step = i + 1;

      // Simulate WL progression
      const reduction = Math.floor((initialWL * 0.3) * (step / simulationSteps));
      currentWL = Math.max(0, initialWL - reduction);

      let status = 'WAITLIST';
      if (currentWL < 5 && currentWL > 0) {
        status = 'RAC_IMMINENT';
      } else if (currentWL === 0) {
        status = 'CONFIRMED';
      }

      progression.push({
        step,
        wlNumber: currentWL,
        status,
      });
    }

    return progression;
  }
}
