import { Train, SearchCriteria } from '../types';
import { generateTrainDataset } from './trainData';

/**
 * Train Search Agent
 * Fetches all possible trains matching search criteria
 */
export class TrainSearchAgent {
  private static trainDataset: Train[] = [];

  static async initialize() {
    // Generate or fetch train dataset
    if (this.trainDataset.length === 0) {
      this.trainDataset = generateTrainDataset();
    }
  }

  static async searchTrains(criteria: SearchCriteria): Promise<Train[]> {
    await this.initialize();

    console.log('[Train Search Agent] Searching for trains:', {
      from: criteria.from,
      to: criteria.to,
      date: criteria.date,
    });

    // Filter trains based on criteria
    const results = this.trainDataset.filter((train) => {
      return (
        train.from === criteria.from &&
        train.to === criteria.to &&
        train.distance > 0 // Basic validation
      );
    });

    // Sort by departure time
    results.sort(
      (a, b) =>
        new Date(`2024-01-01 ${a.departureTime}`).getTime() -
        new Date(`2024-01-01 ${b.departureTime}`).getTime()
    );

    console.log(`[Train Search Agent] Found ${results.length} trains`);

    return results;
  }

  static getFullDataset(): Train[] {
    if (this.trainDataset.length === 0) {
      this.trainDataset = generateTrainDataset();
    }
    return this.trainDataset;
  }

  static getTrainById(trainId: string): Train | undefined {
    if (this.trainDataset.length === 0) {
      this.trainDataset = generateTrainDataset();
    }
    return this.trainDataset.find((t) => t.id === trainId);
  }
}
