import { SearchCriteria, Train, RankingScore, AgentActivity, BookingState } from '../types';
import { IntentAgent } from './intentAgent';
import { TrainSearchAgent } from './trainSearchAgent';
import { RankingAgent } from './rankingAgent';
import { FallbackAgent } from './fallbackAgent';
import { BookingExecutionAgent } from './bookingExecutionAgent';
import { SchedulerAgent } from './schedulerAgent';
import { ExplanationAgent } from './explanationAgent';
import { MLComparisonAgent } from './mlComparisonAgent';

/**
 * Agent Orchestrator
 * Coordinates all agents in a multi-step booking workflow
 */
export class AgentOrchestrator {
  private agentLogs: AgentActivity[] = [];

  async orchestrateSearch(input: any): Promise<{
    trains: Train[];
    rankedTrains: Array<Train & { score: RankingScore }>;
    agentLogs: AgentActivity[];
  }> {
    this.agentLogs = [];
    this.logActivity('intent', 'Processing user input');

    // Step 1: Intent Agent
    const criteria = await IntentAgent.processInput(input);
    this.logActivity('intent', 'Input processed successfully', 'completed');

    // Step 2: Train Search Agent
    this.logActivity('search', 'Fetching trains');
    await TrainSearchAgent.initialize();
    const trains = await TrainSearchAgent.searchTrains(criteria);
    this.logActivity('search', `Found ${trains.length} trains`, 'completed');

    // Step 3: Ranking Agent
    this.logActivity('ranking', 'Ranking trains with AI algorithm');
    const scores = await RankingAgent.rankTrains(trains, criteria);
    const rankedTrains = trains.map((train) => ({
      ...train,
      score: scores.find((s) => s.trainId === train.id)!,
    }));
    this.logActivity('ranking', 'Ranking complete', 'completed');

    return {
      trains,
      rankedTrains,
      agentLogs: this.agentLogs,
    };
  }

  async orchestrateBooking(
    selectedTrain: Train,
    criteria: SearchCriteria,
    tatkalTime: string,
    onProgress: (log: string) => void
  ): Promise<BookingState> {
    this.agentLogs = [];
    onProgress('[Orchestrator] Initializing booking workflow...');

    // Step 1: Scheduler Agent - Schedule the booking
    this.logActivity('scheduler', `Scheduling booking for ${tatkalTime}`);
    onProgress(`[Scheduler] Waiting for Tatkal time: ${tatkalTime}`);

    // In a real scenario, this would wait until the actual time
    // For demo, we'll proceed immediately
    this.logActivity('scheduler', 'Booking time triggered', 'completed');
    onProgress('[Scheduler] Tatkal time reached!');

    // Step 2: Booking Execution Agent
    this.logActivity('booking', 'Executing booking steps');
    onProgress('[Booking] Starting automated booking process...');

    const bookingState = await BookingExecutionAgent.executeBooking(
      selectedTrain,
      criteria,
      (step, status, details) => {
        const statusIcon = status === 'completed' ? '✓' : '⟳';
        onProgress(`[Booking] ${statusIcon} ${step}`);
      }
    );

    this.logActivity('booking', 'Booking executed', 'completed');

    // Step 3: If waitlist, simulate progression
    if (bookingState.status === 'waitlist') {
      this.logActivity('waitlist', 'Simulating waitlist progression');
      onProgress('[Waitlist] Monitoring cancellations...');

      await BookingExecutionAgent.simulateWaitlistProgression(
        selectedTrain.waitlistNumber,
        (currentWL, status) => {
          onProgress(`[Waitlist] Position: WL ${currentWL} (${status})`);
        }
      );
    }

    return bookingState;
  }

  getMLComparison(
    trains: Train[],
    criteria: SearchCriteria
  ): Array<Train & { mlScore: number }> {
    const mlRanked = MLComparisonAgent.rankTrainsSimple(trains, criteria, 'price');
    return mlRanked.map((train) => ({
      ...train,
      mlScore: MLComparisonAgent.calculateSimpleScore(train, criteria),
    }));
  }

  async handleBookingFailure(
    selectedTrain: Train,
    availableTrains: Train[],
    bookingState: BookingState,
    criteria: SearchCriteria
  ): Promise<any> {
    this.logActivity('fallback', 'Analyzing booking failure');

    const fallbackResult = await FallbackAgent.handleBookingFailure(
      selectedTrain,
      availableTrains,
      bookingState,
      criteria.passengerCount,
      criteria.berthPreference
    );

    if (fallbackResult.recommendedTrain) {
      this.logActivity(
        'fallback',
        `Switching to ${fallbackResult.recommendedTrain.name}`,
        'completed'
      );
    } else {
      this.logActivity('fallback', 'No fallback available', 'completed');
    }

    return fallbackResult;
  }

  explainDecision(train: Train, score: RankingScore): string {
    return ExplanationAgent.generateTrainExplanation(train, score);
  }

  private logActivity(
    agent: string,
    action: string,
    status: 'running' | 'completed' | 'failed' = 'running'
  ): void {
    this.agentLogs.push({
      timestamp: Date.now(),
      agent,
      action,
      status,
    });
  }

  getActivityLog(): AgentActivity[] {
    return this.agentLogs;
  }
}

// Export singleton instance
export const orchestrator = new AgentOrchestrator();
