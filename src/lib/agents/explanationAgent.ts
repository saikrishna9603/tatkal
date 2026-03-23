import { Train, RankingScore } from '../types';

/**
 * Explanation Agent
 * Generates detailed reasoning for AI decisions
 */
export class ExplanationAgent {
  static generateTrainExplanation(train: Train, score: RankingScore): string {
    const parts: string[] = [];

    parts.push(`🚂 ${train.name} (Train #${train.number})`);
    parts.push(`\nDeparture: ${train.departureTime} → Arrival: ${train.arrivalTime}`);
    parts.push(`Duration: ${train.duration}`);

    parts.push(`\n─── Why this train? ───`);
    parts.push(...score.reasoning);

    parts.push(`\n─── Score Breakdown ───`);
    parts.push(
      `• Availability: ${score.availabilityScore.toFixed(1)}/30 points`
    );
    parts.push(`• Speed: ${score.speedScore.toFixed(1)}/20 points`);
    parts.push(`• Price: ${score.priceScore.toFixed(1)}/20 points`);
    parts.push(
      `• Tatkal Success: ${score.tatkalSuccessProbability.toFixed(1)}/20 points`
    );
    parts.push(`• Berth Match: ${score.berthMatchScore.toFixed(1)}/10 points`);
    parts.push(`\n🎯 Total Score: ${score.totalScore.toFixed(1)}/100`);

    return parts.join('\n');
  }

  static generateBookingDecision(
    selectedTrain: Train,
    alternativeTrains: Train[],
    selectedScore: RankingScore
  ): string {
    const parts: string[] = [];

    parts.push(`📋 AI BOOKING DECISION\n`);
    parts.push(`Selected: ${selectedTrain.name}\n`);
    parts.push(`─ Decision Timeline:`);
    parts.push(
      `1. Ranked ${alternativeTrains.length + 1} available trains using multi-factor algorithm`
    );
    parts.push(
      `2. Evaluated: Availability, Speed, Price, Tatkal Success, Berth Preferences`
    );
    parts.push(
      `3. ${selectedTrain.name} scored highest with ${selectedScore.totalScore.toFixed(1)}/100`
    );

    parts.push(`\n─ Key Reasoning:`);
    parts.push(...selectedScore.reasoning);

    if (alternativeTrains.length > 0) {
      parts.push(`\n─ Alternatives (if booking fails):`);
      for (let i = 0; i < Math.min(2, alternativeTrains.length); i++) {
        parts.push(`${i + 1}. ${alternativeTrains[i].name}`);
      }
    }

    return parts.join('\n');
  }

  static generateWaitlistExplanation(
    initialPosition: number,
    estimatedConfirmation: string
  ): string {
    return (
      `⏳ WAITLIST ANALYSIS\n\n` +
      `Current Position: WL #${initialPosition}\n` +
      `Expected Confirmation Time: ${estimatedConfirmation}\n\n` +
      `Progression Simulation:\n` +
      `WL 25 → WL 15 → WL 8 → RAC 2 → CONFIRMED\n\n` +
      `💡 Tip: Check back every 2-3 hours for status updates.`
    );
  }

  static generateFallbackExplanation(fallbackTrain: Train, reason: string): string {
    return (
      `🔄 FALLBACK STRATEGY APPLIED\n\n` +
      `Reason: ${reason}\n` +
      `New Selection: ${fallbackTrain.name}\n\n` +
      `This train offers better availability for your preferred date and route.`
    );
  }

  static generateComparisonExplanation(
    agenticScore: number,
    mlScore: number
  ): string {
    const parts: string[] = [];

    parts.push(`🤖 vs 🧠 AI SYSTEM COMPARISON\n`);

    if (agenticScore > mlScore) {
      parts.push(
        `✓ Agentic AI: More dynamic, considers fallbacks and live market conditions`
      );
      parts.push(
        `• Multi-agent system actively optimizes your booking chances`
      );
      parts.push(`• Adapts in real-time based on availability changes`);
    } else {
      parts.push(
        `✓ Both systems recommend the same train (ML and Agentic align)`
      );
    }

    parts.push(
      `\nKey Differences:\n• Agentic: Reactive, fallback-aware, per-passenger\n• ML: Static ranking, deterministic`
    );

    return parts.join('\n');
  }

  static generateTatkalInsight(tatkalTime: string, successProbability: number): string {
    const parts: string[] = [];

    parts.push(`🎯 TATKAL BOOKING INSIGHT\n`);
    parts.push(`Booking Time: ${tatkalTime}\n`);

    if (successProbability > 0.8) {
      parts.push(
        `✓ High success probability (${(successProbability * 100).toFixed(0)}%)`
      );
      parts.push(`Track: Very busy time, but train has good availability`);
    } else if (successProbability > 0.5) {
      parts.push(
        `⚠ Moderate success probability (${(successProbability * 100).toFixed(0)}%)`
      );
      parts.push(`Recommendation: Have backup trains ready`);
    } else {
      parts.push(
        `✗ Low success probability (${(successProbability * 100).toFixed(0)}%)`
      );
      parts.push(`Recommendation: Consider different time slots`);
    }

    return parts.join('\n');
  }
}
