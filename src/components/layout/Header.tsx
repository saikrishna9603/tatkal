'use client';

import { motion } from 'framer-motion';
import { Train } from 'lucide-react';

export default function Header({ onReset }: { onReset: () => void }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
    >
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <motion.div
            className="flex items-center gap-3 cursor-pointer"
            onClick={onReset}
            whileHover={{ scale: 1.05 }}
          >
            <Train size={32} />
            <div>
              <h1 className="text-3xl font-bold">Tatkal</h1>
              <p className="text-sm text-blue-100">AI-Powered Train Booking</p>
            </div>
          </motion.div>

          <div className="hidden md:flex items-center gap-4 text-sm">
            <span className="px-3 py-1 bg-green-400/20 rounded-full">
              🟢 Live Tatkal Enabled
            </span>
            <span className="px-3 py-1 bg-purple-300/20 rounded-full">
              🤖 Multi-Agent AI
            </span>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
