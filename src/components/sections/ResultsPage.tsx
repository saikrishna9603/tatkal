'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Zap, Award, TrendingDown } from 'lucide-react';
import { orchestrator } from '@/lib/agents/orchestrator';
import TrainCard from '@/components/ui/TrainCard';
import AgentActivityPanel from '@/components/ui/AgentActivityPanel';

interface ResultsPageProps {
  searchParams: any;
  onSelectTrain: (train: any) => void;
  onViewComparison: () => void;
  onBack: () => void;
}

export default function ResultsPage({
  searchParams,
  onSelectTrain,
  onViewComparison,
  onBack,
}: ResultsPageProps) {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'score' | 'price' | 'time'>('score');

  useEffect(() => {
    const loadResults = async () => {
      const searchResults = await orchestrator.orchestrateSearch(searchParams);
      setResults(searchResults);
      setLoading(false);
    };

    loadResults();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-700">
            Finding best trains for you...
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Analyzing availability, prices, and scheduling
          </p>
        </div>
      </div>
    );
  }

  const sortedTrains =
    sortBy === 'score'
      ? [...(results?.rankedTrains || [])].sort(
          (a, b) => b.score.totalScore - a.score.totalScore
        )
      : sortBy === 'price'
      ? [...(results?.rankedTrains || [])].sort(
          (a, b) => (a.price?.ac3 || 5000) - (b.price?.ac3 || 5000)
        )
      : [...(results?.rankedTrains || [])].sort((a, b) =>
          a.departureTime.localeCompare(b.departureTime)
        );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Results */}
      <motion.div
        className="lg:col-span-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
          >
            <ArrowLeft size={20} />
            Back to Search
          </button>
          <span className="text-sm text-gray-600">
            {results?.rankedTrains?.length || 0} trains found
          </span>
        </div>

        {/* Sorting Options */}
        <div className="flex gap-3 mb-6 flex-wrap">
          {[
            { key: 'score', label: '⭐ AI Recommended', icon: Zap },
            { key: 'price', label: '💰 Cheapest First', icon: TrendingDown },
            { key: 'time', label: '⏰ Earliest First', icon: null },
          ].map((option) => (
            <motion.button
              key={option.key}
              onClick={() => setSortBy(option.key as any)}
              whileHover={{ scale: 1.05 }}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                sortBy === option.key
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </motion.button>
          ))}
        </div>

        {/* Train Cards */}
        <div className="space-y-4">
          {sortedTrains.length > 0 ? (
            sortedTrains.map((train, index) => (
              <motion.div
                key={train.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <TrainCard
                  train={train}
                  score={train.score}
                  onSelect={() => onSelectTrain(train)}
                  isTop={index === 0 && sortBy === 'score'}
                />
              </motion.div>
            ))
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <p className="text-gray-700">No trains found for this route.</p>
              <p className="text-sm text-gray-600 mt-2">
                Try adjusting your search criteria
              </p>
            </div>
          )}
        </div>

        {/* Comparison Button */}
        <motion.button
          onClick={onViewComparison}
          whileHover={{ scale: 1.02 }}
          className="w-full mt-8 bg-purple-50 text-purple-600 border-2 border-purple-200 py-3 rounded-lg font-semibold hover:bg-purple-100 transition-all"
        >
          <Award size={18} className="inline mr-2" />
          Compare AI vs ML Systems
        </motion.button>
      </motion.div>

      {/* Agent Activity Panel */}
      <motion.div
        className="lg:col-span-1"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <AgentActivityPanel logs={results?.agentLogs || []} />
      </motion.div>
    </div>
  );
}
