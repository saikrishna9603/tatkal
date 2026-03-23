'use client';

import { motion } from 'framer-motion';
import { Activity, CheckCircle2, Clock, Zap } from 'lucide-react';
import { AgentActivity } from '@/lib/types';
import { useState, useEffect } from 'react';

interface AgentActivityPanelProps {
  logs: AgentActivity[];
  live?: boolean;
}

export default function AgentActivityPanel({ logs, live = true }: AgentActivityPanelProps) {
  const [displayLogs, setDisplayLogs] = useState<AgentActivity[]>([]);

  useEffect(() => {
    setDisplayLogs(logs);
  }, [logs]);

  const getAgentIcon = (agent: string) => {
    const icons: { [key: string]: string } = {
      intent: '🎯',
      search: '🔍',
      ranking: '⭐',
      fallback: '🔄',
      booking: '🎫',
      scheduler: '⏰',
      waitlist: '⏳',
      payment: '💳',
      pdf: '📄',
      explanation: '💡',
    };
    return icons[agent] || '🤖';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 size={16} className="text-green-600" />;
      case 'running':
        return <Zap size={16} className="text-yellow-600 animate-pulse" />;
      case 'failed':
        return <div className="w-4 h-4 rounded-full bg-red-600" />;
      default:
        return <Clock size={16} className="text-gray-600" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-gradient-to-b from-slate-900 to-slate-800 rounded-xl p-6 text-white"
    >
      <div className="flex items-center gap-2 mb-4">
        <Activity size={20} />
        <h3 className="font-bold text-lg">Agent Activity</h3>
        {live && <span className="ml-auto text-xs bg-green-600 px-2 py-1 rounded-full">LIVE</span>}
      </div>

      {/* Activity List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {displayLogs.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <Clock size={24} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Waiting for agent activity...</p>
          </div>
        ) : (
          displayLogs.map((log, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex gap-3 items-start text-sm"
            >
              <span className="text-lg mt-0.5">{getAgentIcon(log.agent)}</span>
              <div className="flex-1">
                <div className="font-semibold text-blue-200">
                  {log.agent.toUpperCase()}
                </div>
                <p className="text-gray-300 text-xs leading-relaxed">
                  {log.action}
                </p>
                {log.details && (
                  <div className="text-xs text-gray-400 mt-1 bg-slate-700/50 px-2 py-1 rounded">
                    {typeof log.details === 'string'
                      ? log.details
                      : JSON.stringify(log.details).substring(0, 50)}
                  </div>
                )}
              </div>
              <div className="text-right">
                {getStatusIcon(log.status)}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-slate-700 text-xs text-gray-400 space-y-1">
        <div>🎯 Intent - Parse user input</div>
        <div>🔍 Search - Find trains</div>
        <div>⭐ Ranking - AI scoring</div>
        <div>🎫 Booking - Execute booking</div>
      </div>
    </motion.div>
  );
}
