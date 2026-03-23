'use client';

import { motion } from 'framer-motion';
import { Clock, Play } from 'lucide-react';

interface TatkalCountdownProps {
  timeLeft: {
    hours: number;
    minutes: number;
    seconds: number;
    totalSeconds: number;
  };
  onManualStart: () => void;
}

export default function TatkalCountdown({ timeLeft, onManualStart }: TatkalCountdownProps) {
  const isImminT = timeLeft.totalSeconds < 300; // Less than 5 minutes

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`rounded-2xl p-8 text-center ${
        isImminT
          ? 'bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-400'
          : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300'
      }`}
    >
      <Clock size={32} className={`mx-auto mb-4 ${isImminT ? 'text-red-600' : 'text-blue-600'}`} />

      <h2 className={`text-2xl font-bold mb-6 ${isImminT ? 'text-red-700' : 'text-blue-700'}`}>
        {isImminT ? '🚨 Tatkal Booking Time Approaching!' : '⏳ Waiting for Tatkal Time'}
      </h2>

      {/* Countdown Display */}
      <div className="mb-8">
        <motion.div
          animate={isImminT ? { scale: [1, 1.05, 1], color: ['#dc2626', '#ea580c', '#dc2626'] } : {}}
          transition={{ duration: 1, repeat: Infinity }}
          className={`text-5xl font-bold font-mono mb-2 ${isImminT ? 'text-red-600' : 'text-blue-600'}`}
        >
          {String(timeLeft.hours).padStart(2, '0')}:
          {String(timeLeft.minutes).padStart(2, '0')}:
          {String(timeLeft.seconds).padStart(2, '0')}
        </motion.div>
        <p className="text-gray-600">Time remaining</p>
      </div>

      {/* Status Message */}
      {timeLeft.totalSeconds > 0 ? (
        <div className={`text-sm mb-8 ${isImminT ? 'text-red-700' : 'text-blue-700'}`}>
          <p>
            System will auto-book at your scheduled Tatkal time.
            {isImminT && (
              <span className="block mt-2 font-bold animate-pulse">
                Get ready! Bookings starting in moments...
              </span>
            )}
          </p>
        </div>
      ) : (
        <div className="text-sm mb-8 text-green-700">
          <p className="font-bold">Tatkal time reached! Processing your booking...</p>
        </div>
      )}

      {/* Manual Start Button */}
      {timeLeft.totalSeconds > 0 && (
        <motion.button
          onClick={onManualStart}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center mx-auto"
        >
          <Play size={18} className="mr-2" />
          Start Booking Now
        </motion.button>
      )}

      {/* Pro Tips */}
      <div className={`mt-6 p-4 rounded-lg text-sm ${isImminT ? 'bg-red-100' : 'bg-blue-100'}`}>
        <p className="font-semibold mb-2">💡 Pro Tips:</p>
        <ul className="text-left space-y-1 text-gray-700">
          <li>• Ensure stable internet connection</li>
          <li>• Don't close this tab before booking completes</li>
          <li>• Have passenger details ready</li>
          <li>• Check your network connection status</li>
        </ul>
      </div>
    </motion.div>
  );
}
