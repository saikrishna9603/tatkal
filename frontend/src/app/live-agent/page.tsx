// AI Live Agent Dashboard
"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface AgentLog {
  timestamp: string;
  action: string;
  details: string;
  status: string;
}

export default function LiveAgentPage() {
  const [searchParams, setSearchParams] = useState({
    from: "Delhi",
    to: "Mumbai",
    date: new Date().toISOString().split("T")[0],
  });

  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [activePhase, setActivePhase] = useState<string>("perceive");
  const logsEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [agentLogs]);

  const handleOrchestrate = async () => {
    setLoading(true);
    setAgentLogs([]);
    setActivePhase("perceive");

    try {
      // Simulate agent phases
      const phases = [
        { phase: "perceive", label: "🔍 Perceiving Search Parameters...", delay: 1000 },
        { phase: "reason", label: "🧠 Analyzing Train Options...", delay: 2000 },
        { phase: "act", label: "⚡ Preparing Booking Actions...", delay: 1500 },
        { phase: "learn", label: "📚 Learning from Preferences...", delay: 1000 },
      ];

      for (const { phase, label, delay } of phases) {
        setActivePhase(phase);
        setAgentLogs((prev) => [
          ...prev,
          {
            timestamp: new Date().toLocaleTimeString(),
            action: label,
            details: `${phase.charAt(0).toUpperCase() + phase.slice(1)} Agent activated`,
            status: "processing",
          },
        ]);

        await new Promise((resolve) => setTimeout(resolve, delay));

        setAgentLogs((prev) => [
          ...prev.slice(0, -1),
          {
            ...prev[prev.length - 1],
            status: "completed",
          },
        ]);
      }

      // Generate recommendations
      const mockRecommendations = [
        {
          train_id: "train_001",
          train_number: "12345",
          name: "Rajdhani Express",
          score: 0.95,
          reason: "Best balance of comfort and price",
          availability: 45,
          price: 1625,
          duration: "12h 30m",
        },
        {
          train_id: "train_002",
          train_number: "22222",
          name: "Shatabdi Express",
          score: 0.88,
          reason: "Faster journey, good amenities",
          availability: 12,
          price: 2275,
          duration: "9h 15m",
        },
        {
          train_id: "train_003",
          train_number: "33333",
          name: "Express (Budget)",
          score: 0.72,
          reason: "Most economical option",
          availability: 78,
          price: 845,
          duration: "18h 20m",
        },
      ];

      setRecommendations(mockRecommendations);

      setAgentLogs((prev) => [
        ...prev,
        {
          timestamp: new Date().toLocaleTimeString(),
          action: "✅ Orchestration Complete",
          details: "3 trains analyzed and ranked",
          status: "completed",
        },
      ]);
    } catch (err) {
      setAgentLogs((prev) => [
        ...prev,
        {
          timestamp: new Date().toLocaleTimeString(),
          action: "❌ Error",
          details: String(err),
          status: "failed",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-8 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">🤖 PRAL AI Agent</h1>
          <p className="text-purple-100">
            Perceive → Reason → Act → Learn - Intelligent Train Booking
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Agent Status */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">🤖 Agent Status</h3>
            <div className="space-y-3">
              {[
                { name: "Perceive Agent", status: activePhase === "perceive" ? "active" : "ready" },
                { name: "Reason Agent", status: activePhase === "reason" ? "active" : "ready" },
                { name: "Act Agent", status: activePhase === "act" ? "active" : "ready" },
                { name: "Learn Agent", status: activePhase === "learn" ? "active" : "ready" },
              ].map((agent) => (
                <div
                  key={agent.name}
                  className={`p-3 rounded-lg flex items-center gap-3 ${
                    agent.status === "active"
                      ? "bg-green-100 border-2 border-green-500"
                      : "bg-gray-100 border-2 border-gray-300"
                  }`}
                >
                  <div
                    className={`w-3 h-3 rounded-full ${
                      agent.status === "active" ? "bg-green-600 animate-pulse" : "bg-gray-400"
                    }`}
                  ></div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-800">{agent.name}</p>
                    <p className="text-xs text-gray-600 capitalize">{agent.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Search Parameters */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">🔍 Search Parameters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
                <input
                  type="text"
                  value={searchParams.from}
                  onChange={(e) =>
                    setSearchParams({ ...searchParams, from: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
                <input
                  type="text"
                  value={searchParams.to}
                  onChange={(e) =>
                    setSearchParams({ ...searchParams, to: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                <input
                  type="date"
                  value={searchParams.date}
                  onChange={(e) =>
                    setSearchParams({ ...searchParams, date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <button
              onClick={handleOrchestrate}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-2.5 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "🔄 Processing..." : "⚡ Start Agent Orchestration"}
            </button>
          </div>
        </div>

        {/* Agent Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 font-bold">
              📊 Agent Activity Log
            </div>
            <div className="h-96 overflow-y-auto p-4 bg-gray-50">
              {agentLogs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-4xl mb-3">🤖</p>
                  <p>Click the button to start agent orchestration</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {agentLogs.map((log, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border-l-4 ${
                        log.status === "completed"
                          ? "bg-green-50 border-green-500 text-green-900"
                          : log.status === "failed"
                          ? "bg-red-50 border-red-500 text-red-900"
                          : "bg-blue-50 border-blue-500 text-blue-900"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-lg">{log.action}</span>
                        <span className="text-xs font-mono text-gray-600 ml-auto">
                          {log.timestamp}
                        </span>
                      </div>
                      <p className="text-sm mt-1 opacity-75">{log.details}</p>
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              )}
            </div>
          </div>

          {/* Metrics */}
          <div className="bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">📈 Performance Metrics</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-700">Processing Speed</span>
                  <span className="text-sm font-bold text-purple-600">98%</span>
                </div>
                <div className="w-full h-2 bg-gray-300 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-600 rounded-full" style={{ width: "98%" }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-700">Accuracy</span>
                  <span className="text-sm font-bold text-indigo-600">94%</span>
                </div>
                <div className="w-full h-2 bg-gray-300 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full" style={{ width: "94%" }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-700">Success Rate</span>
                  <span className="text-sm font-bold text-green-600">87%</span>
                </div>
                <div className="w-full h-2 bg-gray-300 rounded-full overflow-hidden">
                  <div className="h-full bg-green-600 rounded-full" style={{ width: "87%" }}></div>
                </div>
              </div>

              <div className="pt-4 border-t-2 border-white">
                <p className="text-xs text-gray-700 mb-2">Latest Recommendations: {recommendations.length}</p>
                <p className="text-xs text-gray-700">Avg Response Time: 5.2s</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 font-bold">
              ✅ AI Recommendations ({recommendations.length} trains analyzed)
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recommendations.map((rec) => (
                  <div
                    key={rec.train_id}
                    className="border-2 border-purple-200 rounded-lg p-4 hover:shadow-lg transition"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-bold text-gray-800">{rec.name}</p>
                        <p className="text-xs text-gray-600">#{rec.train_number}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-purple-600">
                          {(rec.score * 100).toFixed(0)}%
                        </p>
                        <p className="text-xs text-gray-600">Score</p>
                      </div>
                    </div>

                    <p className="text-sm text-gray-700 mb-3">💡 {rec.reason}</p>

                    <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                      <div className="bg-green-50 p-2 rounded">
                        <p className="text-xs text-gray-600">Seats</p>
                        <p className="font-bold text-green-700">{rec.availability}</p>
                      </div>
                      <div className="bg-blue-50 p-2 rounded">
                        <p className="text-xs text-gray-600">Duration</p>
                        <p className="font-bold text-blue-700">{rec.duration}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-bold text-indigo-600">₹{rec.price}</span>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        Recommended
                      </span>
                    </div>

                    <Link
                      href={`/booking/${rec.train_id}`}
                      className="w-full block text-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-2 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition"
                    >
                      Book Now
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="max-w-7xl mx-auto p-6 flex gap-4">
        <Link href="/" className="flex-1 text-center bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 rounded-lg transition">
          ← Back to Dashboard
        </Link>
        <Link href="/schedule" className="flex-1 text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition">
          All Trains →
        </Link>
      </div>
    </div>
  );
}
