'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Brain, Zap, TrendingUp } from 'lucide-react';
import { orchestrator } from '@/lib/agents/orchestrator';
import { TrainSearchAgent } from '@/lib/agents/trainSearchAgent';

interface ComparisonPanelProps {
  searchParams: any;
  onBack: () => void;
}

export default function ComparisonPanel({ searchParams, onBack }: ComparisonPanelProps) {
  const [comparison, setComparison] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadComparison = async () => {
      try {
        // Get search results
        const searchResults = await orchestrator.orchestrateSearch(searchParams);

        // Get ML comparison
        const mlComparison = orchestrator.getMLComparison(
          searchResults.rankedTrains,
          searchParams
        );

        setComparison({
          agenticTrains: searchResults.rankedTrains.slice(0, 5),
          mlTrains: mlComparison.slice(0, 5),
        });
      } catch (error) {
        console.error('Error loading comparison:', error);
      }
      setLoading(false);
    };

    loadComparison();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4" />
          <p className="text-lg font-semibold">Comparing AI systems...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
        >
          <ArrowLeft size={20} />
          Back to Results
        </button>
        <h1 className="text-2xl font-bold">AI System Comparison</h1>
      </div>

      {/* Explanation Section */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-2xl p-8"
      >
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Brain size={24} className="text-purple-600" />
          How These Systems Work
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Agentic AI */}
          <div className="bg-white rounded-lg p-4">
            <h3 className="font-bold text-blue-700 mb-3 flex items-center gap-2">
              <Zap size={18} />
              Agentic AI (Multi-Agent)
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>✓ <strong>Dynamic:</strong> Makes real-time decisions</li>
              <li>✓ <strong>Fallback Aware:</strong> Adapts when plans fail</li>
              <li>✓ <strong>Multi-Factor:</strong> Considers 10+ parameters</li>
              <li>✓ <strong>Context Aware:</strong> Learns from each step</li>
              <li>✓ <strong>Optimization:</strong> Finds best overall solution</li>
            </ul>
          </div>

          {/* ML System */}
          <div className="bg-white rounded-lg p-4">
            <h3 className="font-bold text-amber-700 mb-3 flex items-center gap-2">
              <TrendingUp size={18} />
              ML System (Baseline)
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• <strong>Static:</strong> Fixed decision rules</li>
              <li>• <strong>Deterministic:</strong> Same input = same output</li>
              <li>• <strong>Simple Factors:</strong> Price, time, availability</li>
              <li>• <strong>No Adaptation:</strong> Can't respond to failures</li>
              <li>• <strong>Fast:</strong> But less accurate for edge cases</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Comparison Table */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-lg overflow-hidden"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          {/* Agentic Side */}
          <div>
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Zap size={24} />
                Top Agentic Picks
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {comparison?.agenticTrains.map((train: any, index: number) => (
                <motion.div
                  key={train.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border-l-4 border-blue-500 pl-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-gray-900">{train.name}</p>
                      <p className="text-sm text-gray-600">
                        {train.departureTime} → {train.arrivalTime}
                      </p>
                    </div>
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
                      {train.score?.totalScore.toFixed(0) || 0}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    {train.score?.reasoning?.[0] || 'Optimized booking'}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ML Side */}
          <div>
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <TrendingUp size={24} />
                Top ML Picks
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {comparison?.mlTrains.map((train: any, index: number) => (
                <motion.div
                  key={train.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border-l-4 border-amber-500 pl-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-gray-900">{train.name}</p>
                      <p className="text-sm text-gray-600">
                        {train.departureTime} → {train.arrivalTime}
                      </p>
                    </div>
                    <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-bold">
                      {train.mlScore?.toFixed(0) || 0}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Sorted by price/time
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Key Differences */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
          <h3 className="font-bold text-base mb-4 text-blue-700">🏆 Agentic AI Advantages</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• <strong>Berth Optimization:</strong> Prioritizes your exact preferences</li>
            <li>• <strong>Fallback Strategy:</strong> Switches trains if booking fails</li>
            <li>• <strong>Waitlist Handling:</strong> Intelligently manages queue position</li>
            <li>• <strong>Tatkal Expert:</strong> Knows peak demand times</li>
            <li>• <strong>Personalized:</strong> Learns from your booking behavior</li>
          </ul>
        </div>

        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6">
          <h3 className="font-bold text-base mb-4 text-amber-700">⚡ ML System Strengths</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• <strong>Simplicity:</strong> Easy to understand ranking</li>
            <li>• <strong>Speed:</strong> Instant results, no waiting</li>
            <li>• <strong>Consistency:</strong> Always produces same output</li>
            <li>• <strong>Transparency:</strong> Clear scoring criteria</li>
            <li>• <strong>Efficiency:</strong> Low computational resources</li>
          </ul>
        </div>
      </motion.div>

      {/* Recommendation */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-8 text-center"
      >
        <h3 className="text-xl font-bold text-green-700 mb-3">✨ Recommendation</h3>
        <p className="text-gray-700 mb-4">
          Use <strong>Agentic AI</strong> for Tatkal bookings where every second counts and intelligent fallbacks matter.
        </p>
        <p className="text-sm text-gray-600">
          The multi-agent system ensures you get the best train considering all factors, and automatically adapts if your first choice fails.
        </p>
      </motion.div>
    </motion.div>
  );
}
