/**
 * Scheduler Agent (CRITICAL)
 * Manages Tatkal booking time scheduling and countdown timer
 */
export class SchedulerAgent {
  private static timers: Map<string, NodeJS.Timeout> = new Map();
  private static callbacks: Map<string, Function> = new Map();

  static scheduleBooking(
    bookingId: string,
    tatkalTime: string, // Format: "HH:MM"
    onTimeReached: () => void,
    onTick?: (timeLeft: {
      hours: number;
      minutes: number;
      seconds: number;
      totalSeconds: number;
    }) => void
  ): void {
    console.log(`[Scheduler Agent] Scheduling booking for ${tatkalTime}`);

    // Parse tatkal time
    const [hour, minute] = tatkalTime.split(':').map(Number);
    const bookingDateTime = new Date();
    bookingDateTime.setHours(hour, minute, 0, 0);

    // If time has passed today, schedule for next day
    if (bookingDateTime <= new Date()) {
      bookingDateTime.setDate(bookingDateTime.getDate() + 1);
    }

    // Store callback
    this.callbacks.set(bookingId, onTimeReached);

    // Start countdown timer
    this.startCountdown(bookingId, bookingDateTime, onTimeReached, onTick);
  }

  private static startCountdown(
    bookingId: string,
    targetTime: Date,
    onTimeReached: () => void,
    onTick?: (timeLeft: any) => void
  ): void {
    // Clear existing timer if any
    if (this.timers.has(bookingId)) {
      clearInterval(this.timers.get(bookingId) as NodeJS.Timeout);
    }

    // Tick every second
    const intervalId = setInterval(() => {
      const now = new Date();
      const timeLeft = targetTime.getTime() - now.getTime();

      if (timeLeft <= 0) {
        // Time reached!
        clearInterval(intervalId);
        this.timers.delete(bookingId);

        console.log(`[Scheduler Agent] Booking time reached for ${bookingId}`);
        onTimeReached();
        return;
      }

      // Calculate remaining time
      const totalSeconds = Math.floor(timeLeft / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      if (onTick) {
        onTick({
          hours,
          minutes,
          seconds,
          totalSeconds,
        });
      }
    }, 1000);

    this.timers.set(bookingId, intervalId);
  }

  static cancelSchedule(bookingId: string): void {
    const timerId = this.timers.get(bookingId);
    if (timerId) {
      clearInterval(timerId);
      this.timers.delete(bookingId);
      this.callbacks.delete(bookingId);
      console.log(`[Scheduler Agent] Cancelled booking schedule for ${bookingId}`);
    }
  }

  static getTimeUntilBooking(tatkalTime: string): {
    hours: number;
    minutes: number;
    seconds: number;
    totalSeconds: number;
  } {
    const [hour, minute] = tatkalTime.split(':').map(Number);
    const bookingDateTime = new Date();
    bookingDateTime.setHours(hour, minute, 0, 0);

    if (bookingDateTime <= new Date()) {
      bookingDateTime.setDate(bookingDateTime.getDate() + 1);
    }

    const now = new Date();
    const timeLeft = bookingDateTime.getTime() - now.getTime();
    const totalSeconds = Math.floor(timeLeft / 1000);

    return {
      hours: Math.floor(totalSeconds / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60,
      totalSeconds,
    };
  }

  static formatCountdown(
    hours: number,
    minutes: number,
    seconds: number
  ): string {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
}
