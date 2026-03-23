'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';

const steps = [
  { id: 'select', label: 'Selecting Train', icon: '🚂' },
  { id: 'check', label: 'Checking Availability', icon: '🔍' },
  { id: 'berth', label: 'Allocating Berth', icon: '🛏️' },
  { id: 'passengers', label: 'Filling Passenger Details', icon: '👥' },
  { id: 'payment', label: 'Processing Payment', icon: '💳' },
  { id: 'confirm', label: 'Confirming Booking', icon: '✓' },
];

interface BookingProgressAnimationProps {
  logs: string[];
  train: any;
}

export default function BookingProgressAnimation({
  logs,
  train,
}: BookingProgressAnimationProps) {
  const getStepStatus = (stepId: string) => {
    const relevantLog = logs.find((log) => log.toLowerCase().includes(stepId));
    if (!relevantLog) return 'pending';
    if (relevantLog.includes('✓') || relevantLog.includes('completed'))
      return 'completed';
    if (relevantLog.includes('running') || relevantLog.includes('⟳'))
      return 'running';
    return 'pending';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Progress Steps */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h3 className="font-bold text-lg mb-6">Booking Progress</h3>

        <div className="space-y-4">
          {steps.map((step, index) => {
            const status = getStepStatus(step.id);
            const isCompleted = status === 'completed';
            const isRunning = status === 'running';

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4"
              >
                {/* Step Number */}
                <div className="relative w-10 h-10 flex-shrink-0">
                  <motion.div
                    animate={isRunning ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 1, repeat: Infinity }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      isCompleted
                        ? 'bg-green-600 text-white'
                        : isRunning
                        ? 'bg-yellow-400 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={24} />
                    ) : (
                      <span>{step.icon}</span>
                    )}
                  </motion.div>
                </div>

                {/* Step Info */}
                <div className="flex-1">
                  <p
                    className={`font-semibold ${
                      isCompleted
                        ? 'text-green-700'
                        : isRunning
                        ? 'text-yellow-700'
                        : 'text-gray-600'
                    }`}
                  >
                    {step.label}
                  </p>

                  {/* Status Badge */}
                  {status !== 'pending' && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`text-sm ${
                        isCompleted ? 'text-green-600' : 'text-yellow-600'
                      }`}
                    >
                      {isCompleted && '✓ Completed'}
                      {isRunning && 'Processing...'}
                    </motion.p>
                  )}
                </div>

                {/* Status Icon */}
                <motion.div
                  animate={isRunning ? { rotate: 360 } : {}}
                  transition={{ duration: 2, repeat: Infinity, repeatType: 'loop' }}
                >
                  {isCompleted ? (
                    <CheckCircle2 size={20} className="text-green-600" />
                  ) : isRunning ? (
                    <motion.div
                      className="w-5 h-5 rounded-full border-2 border-yellow-400 border-t-transparent"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, repeatType: 'loop' }}
                    />
                  ) : (
                    <Circle size={20} className="text-gray-300" />
                  )}
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Live Logs */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-800 rounded-2xl text-white p-6">
        <h3 className="font-bold text-lg mb-4">System Logs</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto font-mono text-sm">
          {logs.map((log, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-blue-300"
            >
              $ {log}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
