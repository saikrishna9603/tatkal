'use client';

import { motion } from 'framer-motion';
import { Clock, MapPin, Users, TrendingUp, Badge } from 'lucide-react';
import { Train, RankingScore } from '@/lib/types';

interface TrainCardProps {
  train: Train;
  score: RankingScore;
  onSelect: () => void;
  isTop?: boolean;
}

export default function TrainCard({ train, score, onSelect, isTop }: TrainCardProps) {
  const getAvailabilityBadge = () => {
    const available = train.availableSeats.ac3 || 0;
    if (available > 0) {
      return {
        label: `${available} Available`,
        color: 'bg-green-100 text-green-800 border-green-300',
      };
    }
    if (train.racSeats > 0) {
      return {
        label: `RAC ${train.racSeats}`,
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      };
    }
    return {
      label: `WL ${train.waitlistNumber}`,
      color: 'bg-red-100 text-red-800 border-red-300',
    };
  };

  const availabilityBadge = getAvailabilityBadge();
  const price = train.tatkalPrice.ac3 || train.price.ac3 || 5000;

  return (
    <motion.div
      whileHover={{ y: -4, shadow: '0 20px 40px rgba(0,0,0,0.15)' }}
      className={`border-2 rounded-2xl p-6 transition-all cursor-pointer ${
        isTop
          ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-300 shadow-lg'
          : 'bg-white border-gray-200'
      }`}
      onClick={onSelect}
    >
      {isTop && (
        <div className="absolute -top-3 left-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-bold">
          🏆 AI Top Pick
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Train Info */}
        <div className="md:col-span-3">
          <h3 className="font-bold text-lg text-gray-900">{train.name}</h3>
          <p className="text-sm text-gray-600">Train #{train.number}</p>
          <div className="mt-3 space-y-1">
            <span className={`inline-block px-2 py-1 rounded-lg text-sm font-semibold border ${availabilityBadge.color}`}>
              {availabilityBadge.label}
            </span>
          </div>
        </div>

        {/* Journey */}
        <div className="md:col-span-3">
          <div className="flex items-center justify-between">
            <div className="text-center">
              <Clock size={16} className="text-gray-400 mx-auto mb-1" />
              <p className="font-bold text-lg text-gray-900">{train.departureTime}</p>
              <p className="text-xs text-gray-600">{train.from}</p>
            </div>
            <div className="flex-1 mx-3">
              <div className="h-0.5 bg-gradient-to-r from-blue-300 to-purple-300" />
              <p className="text-xs text-gray-600 text-center mt-1">{train.duration}</p>
            </div>
            <div className="text-center">
              <Clock size={16} className="text-gray-400 mx-auto mb-1" />
              <p className="font-bold text-lg text-gray-900">{train.arrivalTime}</p>
              <p className="text-xs text-gray-600">{train.to}</p>
            </div>
          </div>
        </div>

        {/* Score & Price */}
        <div className="md:col-span-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-600 mb-1">AI Score</p>
              <div className="relative w-16 h-16">
                <svg className="transform -rotate-90" width="64" height="64">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="3"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="3"
                    strokeDasharray={`${score.totalScore * 1.76} 176`}
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="gradient">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="absolute inset-0 flex items-center justify-center font-bold text-lg">
                  {score.totalScore.toFixed(0)}
                </span>
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-xs text-gray-600 mb-1">Price/Seat</p>
              <p className="text-2xl font-bold text-blue-600">₹{price}</p>
              <p className="text-xs text-gray-600">+ GST</p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="md:col-span-3 flex items-end">
          <motion.button
            onClick={onSelect}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:shadow-lg transition-all"
          >
            <span className="flex items-center justify-center">
              Book Now
              <TrendingUp size={18} className="ml-2" />
            </span>
          </motion.button>
        </div>
      </div>

      {/* Score Breakdown */}
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        whileHover={{ opacity: 1, height: 'auto' }}
        className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-5 gap-2 text-center text-xs opacity-0"
      >
        <div>
          <p className="text-gray-600">Avail</p>
          <p className="font-bold text-gray-900">{score.availabilityScore.toFixed(0)}</p>
        </div>
        <div>
          <p className="text-gray-600">Speed</p>
          <p className="font-bold text-gray-900">{score.speedScore.toFixed(0)}</p>
        </div>
        <div>
          <p className="text-gray-600">Price</p>
          <p className="font-bold text-gray-900">{score.priceScore.toFixed(0)}</p>
        </div>
        <div>
          <p className="text-gray-600">Tatkal</p>
          <p className="font-bold text-gray-900">{score.tatkalSuccessProbability.toFixed(0)}</p>
        </div>
        <div>
          <p className="text-gray-600">Berth</p>
          <p className="font-bold text-gray-900">{score.berthMatchScore.toFixed(0)}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
