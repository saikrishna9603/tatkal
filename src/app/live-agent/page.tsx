'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import API from '@/lib/api';

export default function LiveAgentPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([
    {
      id: 1,
      name: 'Perceive Agent 👁️',
      status: 'analyzing',
      message: 'Analyzing market conditions and train availability...',
      progress: 65,
    },
    {
      id: 2,
      name: 'Reason Agent 🧠',
      status: 'reasoning',
      message: 'Evaluating booking patterns and price trends...',
      progress: 45,
    },
    {
      id: 3,
      name: 'Act Agent 🤖',
      status: 'waiting',
      message: 'Ready to execute optimal booking strategy',
      progress: 0,
    },
    {
      id: 4,
      name: 'Learn Agent 📚',
      status: 'learning',
      message: 'Learning from past bookings to improve accuracy...',
      progress: 85,
    },
  ]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      // Auto-login with demo user
      const demoUser = {
        user_id: 'demo_user_001',
        full_name: 'John Doe',
        email: 'user@example.com',
        phone: '+919876543210'
      };
      localStorage.setItem('user', JSON.stringify(demoUser));
      localStorage.setItem('access_token', 'demo_token_12345');
      setUser(demoUser);
      return;
    }
    setUser(JSON.parse(userData));
  }, [router]);

  const startAgentOrchestration = async () => {
    setLoading(true);
    try {
      const response = await API.orchestrateBooking({
        scenario: 'find_best_tatkal_trains',
        parameters: {
          from: 'Delhi',
          to: 'Mumbai',
          date: new Date().toISOString().split('T')[0],
        },
      }) as any;

      setRecommendations(response.recommendations || mockRecommendations);

      // Simulate agent progression
      setAgents((prev) =>
        prev.map((agent, idx) => ({
          ...agent,
          progress: 100,
          status: 'completed',
          message: `${agent.name.split(' ')[0]} analysis complete`,
        }))
      );
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const mockRecommendations = [
    {
      id: 1,
      train_name: 'Rajdhani Express',
      departure: '14:30',
      arrival: '08:15',
      predicted_success: 92,
      price: 2500,
      reason: 'High historical success rate on this route',
    },
    {
      id: 2,
      train_name: 'Shatabdi Express',
      departure: '06:00',
      arrival: '08:00',
      predicted_success: 78,
      price: 1200,
      reason: 'Lower competition, good timing',
    },
    {
      id: 3,
      train_name: 'Duronto Express',
      departure: '16:00',
      arrival: '13:00',
      predicted_success: 85,
      price: 1800,
      reason: 'Recently opened seats, optimal availability',
    },
  ];

  if (!user) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-3xl font-bold">🤖 AI Agent Dashboard</h1>
          <Link
            href="/"
            className="bg-white text-purple-600 hover:bg-purple-50 px-4 py-2 rounded-lg font-semibold transition"
          >
            ← Back
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Controls */}
        <div className="mb-8">
          <button
            onClick={startAgentOrchestration}
            disabled={loading}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-8 py-3 rounded-lg font-bold transition text-lg"
          >
            {loading ? '⏳ Agents Thinking...' : '🚀 Start Agent Orchestration'}
          </button>
        </div>

        {/* Agent Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className={`rounded-lg shadow-lg p-6 ${
                agent.status === 'completed'
                  ? 'bg-green-100 border-2 border-green-500'
                  : agent.status === 'analyzing' || agent.status === 'reasoning' || agent.status === 'learning'
                  ? 'bg-yellow-100 border-2 border-yellow-500 animate-pulse'
                  : 'bg-gray-100 border-2 border-gray-300'
              }`}
            >
              <h3 className="font-bold text-lg mb-3">{agent.name}</h3>
              <p className="text-sm text-gray-700 mb-4">{agent.message}</p>

              {agent.progress > 0 && (
                <div className="mb-3">
                  <div className="w-full bg-gray-300 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        agent.status === 'completed'
                          ? 'bg-green-500'
                          : 'bg-yellow-500'
                      }`}
                      style={{ width: `${agent.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{agent.progress}%</p>
                </div>
              )}

              <div className="text-2xl">
                {agent.status === 'completed'
                  ? '✅'
                  : agent.status === 'analyzing' || agent.status === 'reasoning' || agent.status === 'learning'
                  ? '⏳'
                  : '⏹️'}
              </div>
            </div>
          ))}
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">🎯 AI Recommendations</h2>

          {recommendations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="border border-purple-200 rounded-lg p-6 hover:shadow-lg transition cursor-pointer hover:border-purple-500"
                >
                  <h3 className="font-bold text-lg text-gray-800 mb-2">{rec.train_name}</h3>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Departure:</span>
                      <span className="font-semibold">{rec.departure}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Arrival:</span>
                      <span className="font-semibold">{rec.arrival}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Price:</span>
                      <span className="font-semibold text-green-600">₹{rec.price}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-gray-700">Success Probability</span>
                      <span className="text-lg font-bold text-purple-600">{rec.predicted_success}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all"
                        style={{ width: `${rec.predicted_success}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">
                    💡 <strong>Why?</strong> {rec.reason}
                  </p>

                  <Link
                    href="/schedule"
                    className="block w-full text-center bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-semibold transition"
                  >
                    Book This Train
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Click "Start Agent Orchestration" to get AI-powered recommendations</p>
            </div>
          )}
        </div>

        {/* Agent Details */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">👁️ Perceive Agent</h3>
            <p className="text-gray-600 mb-3">
              Analyzes real-time market data, train availability, and booking patterns across Indian Railways.
            </p>
            <div className="text-sm space-y-2 text-gray-700">
              <p>✓ Monitors 1000+ trains</p>
              <p>✓ Tracks seat availability</p>
              <p>✓ Analyzes pricing trends</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">🧠 Reason Agent</h3>
            <p className="text-gray-600 mb-3">
              Makes intelligent decisions based on data analysis, historical patterns, and user preferences.
            </p>
            <div className="text-sm space-y-2 text-gray-700">
              <p>✓ Evaluates success probability</p>
              <p>✓ Compares price-to-value</p>
              <p>✓ Predicts booking outcomes</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">🤖 Act Agent</h3>
            <p className="text-gray-600 mb-3">
              Executes optimal booking strategies with lightning-fast response times during Tatkal bookings.
            </p>
            <div className="text-sm space-y-2 text-gray-700">
              <p>✓ Executes bookings instantly</p>
              <p>✓ Manages payment processing</p>
              <p>✓ Sends confirmations</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">📚 Learn Agent</h3>
            <p className="text-gray-600 mb-3">
              Continuously improves by learning from booking outcomes and user behavior patterns.
            </p>
            <div className="text-sm space-y-2 text-gray-700">
              <p>✓ Tracks booking success rates</p>
              <p>✓ Analyzes user preferences</p>
              <p>✓ Optimizes strategies</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
