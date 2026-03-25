'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, CheckCircle2 } from 'lucide-react';

interface Stage {
  position: number;
  status: string;
  label: string;
}

interface WaitlistProgressionSimulatorProps {
  initialPosition: number;
  trainName: string;
}

export default function WaitlistProgressionSimulator({
  initialPosition,
  trainName,
}: WaitlistProgressionSimulatorProps) {
  const [progression, setProgression] = useState<Stage[]>([]);
  const [currentStage, setCurrentStage] = useState(0);

  useEffect(() => {
    // Simulate waitlist progression
    const stages: Stage[] = [
      { position: initialPosition, status: 'WAITLIST', label: `WL ${initialPosition}` },
      {
        position: Math.floor(initialPosition * 0.7),
        status: 'WAITLIST',
        label: `WL ${Math.floor(initialPosition * 0.7)}`,
      },
      {
        position: Math.floor(initialPosition * 0.4),
        status: 'WAITLIST',
        label: `WL ${Math.floor(initialPosition * 0.4)}`,
      },
      { position: 2, status: 'RAC_IMMINENT', label: 'RAC 2' },
      { position: 0, status: 'CONFIRMED', label: 'CONFIRMED ✓' },
    ];

    setProgression(stages);

    // Auto-advance stages
    let stageIndex = 0;
    const interval = setInterval(() => {
      stageIndex++;
      if (stageIndex < stages.length) {
        setCurrentStage(stageIndex);
      } else {
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [initialPosition]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-8"
    >
      <div className="flex items-center gap-3 mb-6">
        <TrendingDown size={24} className="text-amber-600" />
        <div>
          <h3 className="font-bold text-xl text-amber-700">Waitlist Progression</h3>
          <p className="text-sm text-amber-600">{trainName}</p>
        </div>
      </div>

      {/* Progression Timeline */}
      <div className="grid grid-cols-5 gap-2 mb-8">
        {progression.map((stage, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2 }}
            className="text-center"
          >
            <motion.div
              animate={index === currentStage ? { scale: 1.1 } : {}}
              className={`p-3 rounded-lg mb-2 transition-all ${
                index <= currentStage
                  ? stage.status === 'CONFIRMED'
                    ? 'bg-green-500'
                    : stage.status === 'RAC_IMMINENT'
                    ? 'bg-yellow-500'
                    : 'bg-blue-500'
                  : 'bg-gray-200'
              }`}
            >
              <div className={`font-bold text-sm ${index <= currentStage ? 'text-white' : 'text-gray-600'}`}>
                {stage.label}
              </div>
              {index <= currentStage && stage.status === 'CONFIRMED' && (
                <CheckCircle2 size={16} className="mx-auto mt-1 text-white" />
              )}
            </motion.div>
            <p
              className={`text-xs font-semibold ${
                index <= currentStage ? 'text-gray-900' : 'text-gray-500'
              }`}
            >
              Day {index + 1}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Current Status */}
      {currentStage < progression.length && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-lg p-4 text-center"
        >
          <p className="text-gray-700 mb-2">Current Status</p>
          {progression[currentStage].status === 'CONFIRMED' ? (
            <div>
              <p className="text-2xl font-bold text-green-600">✓ CONFIRMED</p>
              <p className="text-sm text-gray-600 mt-2">Your booking has been confirmed!</p>
            </div>
          ) : progression[currentStage].status === 'RAC_IMMINENT' ? (
            <div>
              <p className="text-xl font-bold text-yellow-600">RAC {progression[currentStage].position}</p>
              <p className="text-sm text-gray-600 mt-2">
                Reservation Against Cancellation - Likely to confirm soon
              </p>
            </div>
          ) : (
            <div>
              <p className="text-xl font-bold text-blue-600">WL {progression[currentStage].position}</p>
              <p className="text-sm text-gray-600 mt-2">
                Monitoring for cancellations - Estimated confirmation in {progression.length - currentStage - 1} days
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Completion Message */}
      {currentStage >= progression.length - 1 && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-green-50 border-2 border-green-300 rounded-lg p-4 text-center mt-4"
        >
          <CheckCircle2 size={32} className="text-green-600 mx-auto mb-2" />
          <p className="font-bold text-green-700">Your booking is now CONFIRMED!</p>
          <p className="text-sm text-green-600 mt-2">
            Check your email for the e-ticket and booking confirmation.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
