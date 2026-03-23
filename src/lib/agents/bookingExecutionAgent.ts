import { Train, BookingState } from '../types';

/**
 * Booking Execution Agent
 * Simulates real booking steps with delays and status updates
 */
export class BookingExecutionAgent {
  static async executeBooking(
    train: Train,
    criteria: any,
    onStepUpdate: (step: string, status: string, details?: any) => void
  ): Promise<BookingState> {
    const bookingState: BookingState = {
      trainId: train.id,
      passengers: [],
      selectedBerth: criteria.berthPreference,
      status: 'processing',
      timestamp: Date.now(),
      agentLogs: [],
    };

    try {
      // Step 1: Select train
      onStepUpdate('Selecting train', 'running');
      await this.delay(800);
      onStepUpdate('Selecting train', 'completed', `Selected ${train.name}`);
      bookingState.agentLogs.push(`✓ Train ${train.number} selected`);

      // Step 2: Check availability
      onStepUpdate('Checking availability', 'running');
      await this.delay(1200);
      const availableSeats = train.availableSeats['ac3' as keyof typeof train.availableSeats];
      const availabilityStatus =
        availableSeats > 0 ? 'AVAILABLE' : train.racSeats > 0 ? 'RAC' : 'WL';
      onStepUpdate('Checking availability', 'completed', {
        status: availabilityStatus,
        available: availableSeats,
      });
      bookingState.agentLogs.push(
        `✓ Availability: ${availabilityStatus} (${availableSeats} seats)`
      );

      // Step 3: Allocate berth
      onStepUpdate('Allocating berth', 'running');
      await this.delay(1000);
      const allocatedBerth =
        criteria.berthPreference !== 'NO_PREFERENCE'
          ? criteria.berthPreference.toLowerCase()
          : 'lower';
      onStepUpdate('Allocating berth', 'completed', { berth: allocatedBerth });
      bookingState.agentLogs.push(`✓ Berth allocated: ${allocatedBerth}`);
      bookingState.selectedBerth = allocatedBerth;

      // Step 4: Fill passenger details
      onStepUpdate('Filling passenger details', 'running');
      await this.delay(1500);
      const passengers = this.generatePassengers(criteria.passengerCount);
      bookingState.passengers = passengers;
      onStepUpdate('Filling passenger details', 'completed', {
        count: passengers.length,
      });
      bookingState.agentLogs.push(
        `✓ Passenger details filled for ${passengers.length} passengers`
      );

      // Step 5: Simulate payment
      onStepUpdate('Processing payment', 'running');
      await this.delay(2000);
      const totalPrice = this.calculateTotalPrice(train, criteria, availabilityStatus);
      onStepUpdate('Processing payment', 'completed', { amount: totalPrice });
      bookingState.agentLogs.push(`✓ Payment processed: ₹${totalPrice}`);

      // Step 6: Confirm booking
      onStepUpdate('Confirming booking', 'running');
      await this.delay(1000);

      // Determine final status
      if (availableSeats > 0) {
        bookingState.status = 'confirmed';
        onStepUpdate('Confirming booking', 'completed', { status: 'CONFIRMED' });
        bookingState.agentLogs.push(`✓ Booking CONFIRMED`);
      } else if (train.racSeats > 0) {
        bookingState.status = 'confirmed';
        onStepUpdate('Confirming booking', 'completed', { status: 'RAC' });
        bookingState.agentLogs.push(`✓ Booking confirmed with RAC status`);
      } else {
        bookingState.status = 'waitlist';
        onStepUpdate('Confirming booking', 'completed', {
          status: 'WAITLIST',
          position: train.waitlistNumber,
        });
        bookingState.agentLogs.push(
          `✓ Added to waitlist at position ${train.waitlistNumber}`
        );
      }

      return bookingState;
    } catch (error) {
      bookingState.status = 'failed';
      bookingState.agentLogs.push(`✗ Booking failed: ${error}`);
      throw error;
    }
  }

  static async simulateWaitlistProgression(
    initialWL: number,
    onUpdate: (currentWL: number, status: string) => void
  ): Promise<void> {
    let currentWL = initialWL;

    for (let i = 0; i < 5; i++) {
      await this.delay(2000);

      const reduction = Math.floor((initialWL * 0.25) * (i / 5));
      currentWL = Math.max(0, initialWL - reduction);

      let status = 'WAITLIST';
      if (currentWL < 5 && currentWL > 0) {
        status = 'RAC_IMMINENT';
      } else if (currentWL === 0) {
        status = 'CONFIRMED';
      }

      onUpdate(currentWL, status);
    }
  }

  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private static generatePassengers(count: number): any[] {
    const passengers = [];
    const firstNames = ['Rajesh', 'Priya', 'Amit', 'Shalini', 'Vikram', 'Ananya'];
    const lastNames = ['Singh', 'Sharma', 'Patel', 'Kumar', 'Verma', 'Gupta'];

    for (let i = 0; i < count; i++) {
      passengers.push({
        id: i + 1,
        name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
        age: Math.floor(Math.random() * 60) + 18,
        gender: Math.random() > 0.5 ? 'M' : 'F',
        reservation: `1${String(i + 1).padStart(3, '0')}`,
      });
    }

    return passengers;
  }

  private static calculateTotalPrice(
    train: Train,
    criteria: any,
    status: string
  ): number {
    const classKey = criteria.class || 'ac3';
    const basePrice = train.tatkalPrice[classKey as keyof typeof train.tatkalPrice] || 5000;
    const taxAmount = Math.floor(basePrice * 0.05); // 5% GST
    return basePrice + taxAmount;
  }
}
