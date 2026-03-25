/**
 * AI vs ML Comparison Engine
 * Dynamic prediction logic and explanation generation
 */

export type TrainData = {
  _id?: string;
  id?: string;
  name: string;
  number: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: Record<string, number>;
  availability: { confirmed?: number };
  rating?: number;
  delay?: number;
  reliability?: number;
};

export type PredictionResult = {
  trainId: string;
  trainName: string;
  trainNumber: string;
  score: number;
  delay: number;
  travelTime: number;
  reliability: string;
  explanation: string;
};

/**
 * Extract numeric hours from duration string (e.g., "9h 30m" -> 9.5)
 */
function parseDuration(durationStr: string): number {
  if (!durationStr) return 12;
  const match = durationStr.match(/(\d+)h\s*(\d+)?m?/);
  if (!match) return 12;
  const hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  return hours + minutes / 60;
}

/**
 * ML Model Prediction
 * Simple rule-based: considers delay and travel time only
 * Score = 100 - delay - travelTime
 */
export function mlPrediction(trains: TrainData[]): PredictionResult {
  if (trains.length === 0) {
    return {
      trainId: '',
      trainName: 'No trains found',
      trainNumber: '',
      score: 0,
      delay: 0,
      travelTime: 0,
      reliability: 'Low',
      explanation: 'No trains available for this route.',
    };
  }

  // Score each train using simple ML logic
  const scores = trains.map((train) => {
    const travelTime = parseDuration(train.duration);
    const delay = train.delay ?? 0;
    const availability = train.availability?.confirmed ?? 0;

    // Simple ML formula: emphasize on time performance
    const score = Math.max(0, 100 - delay * 2 - travelTime * 0.8);

    return {
      train,
      score,
      delay,
      travelTime,
      availability,
    };
  });

  // Find best train
  const best = scores.reduce((prev, current) =>
    current.score > prev.score ? current : prev
  );

  const explanation = generateMLExplanation(
    best.train.name,
    best.train.number,
    best.delay,
    best.travelTime,
    best.availability
  );

  return {
    trainId: best.train._id || best.train.id || '',
    trainName: best.train.name,
    trainNumber: best.train.number,
    score: Math.round(best.score),
    delay: best.delay,
    travelTime: Math.round(best.travelTime * 10) / 10,
    reliability: best.delay < 10 ? 'High' : 'Medium',
    explanation,
  };
}

/**
 * Agentic AI Model Prediction
 * Advanced multi-factor: delay (weighted), travel time, reliability bonus
 * Score = 100 - (delay * 1.5) - (travelTime * 0.8) + reliability_bonus
 */
export function agenticAIPrediction(trains: TrainData[]): PredictionResult {
  if (trains.length === 0) {
    return {
      trainId: '',
      trainName: 'No trains found',
      trainNumber: '',
      score: 0,
      delay: 0,
      travelTime: 0,
      reliability: 'Low',
      explanation: 'No trains available for this route.',
    };
  }

  // Score each train using advanced Agentic AI logic
  const scores = trains.map((train) => {
    const travelTime = parseDuration(train.duration);
    const delay = train.delay ?? 0;
    const availability = train.availability?.confirmed ?? 0;
    const rating = train.rating ?? 3;

    // Reliability: rating-based, with bonus if delay is low
    let reliabilityBonus = 0;
    if (delay < 5) reliabilityBonus = 15;
    else if (delay < 15) reliabilityBonus = 10;
    else if (delay < 25) reliabilityBonus = 5;

    // Multi-factor Agentic AI scoring
    const baseScore = Math.max(
      0,
      100 - delay * 1.5 - travelTime * 0.8 + reliabilityBonus
    );

    // Availability factor (higher confidence if more seats)
    const availabilityFactor = Math.min(20, availability / 5);
    const score = baseScore + availabilityFactor;

    return {
      train,
      score,
      delay,
      travelTime,
      availability,
      reliability:
        delay < 10 ? 'High' : delay < 20 ? 'Medium' : 'Low',
    };
  });

  // Find best train
  const best = scores.reduce((prev, current) =>
    current.score > prev.score ? current : prev
  );

  const explanation = generateAgenticAIExplanation(
    best.train.name,
    best.train.number,
    best.delay,
    best.travelTime,
    best.reliability,
    best.availability
  );

  return {
    trainId: best.train._id || best.train.id || '',
    trainName: best.train.name,
    trainNumber: best.train.number,
    score: Math.round(best.score),
    delay: best.delay,
    travelTime: Math.round(best.travelTime * 10) / 10,
    reliability: best.reliability,
    explanation,
  };
}

/**
 * Generate ML explanation - simple rule-based reasoning
 */
function generateMLExplanation(
  trainName: string,
  trainNumber: string,
  delay: number,
  travelTime: number,
  availability: number
): string {
  const timeHours = Math.round(travelTime);
  const delayStr = delay > 0 ? `${delay} mins` : 'No';

  return `Selected because it has ${delayStr} delay and ${timeHours} hour(s) journey time. This train offers a balanced profile with acceptable performance metrics.`;
}

/**
 * Generate Agentic AI explanation - advanced multi-factor reasoning
 */
function generateAgenticAIExplanation(
  trainName: string,
  trainNumber: string,
  delay: number,
  travelTime: number,
  reliability: string,
  availability: number
): string {
  const timeHours = Math.round(travelTime * 10) / 10;
  const reliabilityDesc =
    reliability === 'High'
      ? 'exceptionally reliable'
      : reliability === 'Medium'
        ? 'reasonably reliable'
        : 'less reliable';

  const availabilityDesc =
    availability > 30
      ? 'excellent seat availability'
      : availability > 15
        ? 'good seat availability'
        : 'limited seat availability';

  return `${trainName} (${trainNumber}) is the best choice because it has low delay (${delay} mins), optimized travel time (${timeHours} hrs), ${reliabilityDesc} performance, and ${availabilityDesc}. This multi-factor analysis ensures maximum journey quality and passenger satisfaction.`;
}

/**
 * Compare ML and Agentic predictions
 * Returns both predictions with improvement metrics
 */
export function compareModels(trains: TrainData[]) {
  const mlResult = mlPrediction(trains);
  const aiResult = agenticAIPrediction(trains);

  const scoreImprovement =
    aiResult.score >
    mlResult.score
      ? aiResult.score - mlResult.score
      : 0;
  const accuracyImprovement =
    aiResult.score >
    mlResult.score
      ? ((aiResult.score - mlResult.score) /
          mlResult.score) *
        100
      : 0;

  return {
    ml: mlResult,
    ai: aiResult,
    improvement: {
      score: scoreImprovement,
      accuracy: Math.round(accuracyImprovement),
    },
    recommendation: aiResult,
  };
}

/**
 * Calculate dynamic metrics based on comparison results
 */
export function calculateDynamicMetrics(
  trains: TrainData[],
  comparisonCount: number = 1
) {
  const { ml, ai } = compareModels(trains);

  // Simulate metrics based on comparison
  const baseMLAccuracy = 70;
  const baseAIAccuracy = 90;

  return {
    mlAccuracy: Math.min(
      85,
      baseMLAccuracy + comparisonCount * 0.5
    ),
    aiAccuracy: Math.min(
      98,
      baseAIAccuracy + comparisonCount * 0.3
    ),
    aiImprovement: Math.round(
      (baseAIAccuracy - baseMLAccuracy) * 1.2
    ),
    mlConfidence:
      ml.score > 70
        ? 'High'
        : ml.score > 50
          ? 'Medium'
          : 'Low',
    aiConfidence:
      ai.score > 80 ? 'High' : 'Medium',
  };
}
