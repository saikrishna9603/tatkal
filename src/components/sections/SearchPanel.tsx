'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Calendar, Users, Clock, MessageCircle } from 'lucide-react';

interface SearchPanelProps {
  onSearch: (params: any) => void;
}

export default function SearchPanel({ onSearch }: SearchPanelProps) {
  const [formData, setFormData] = useState({
    from: 'DELHI',
    to: 'MUMBAI',
    date: new Date().toISOString().split('T')[0],
    class: 'ac3',
    quota: 'GENERAL',
    berthPreference: 'NO_PREFERENCE',
    tatkalTime: '08:00',
    passengerCount: 1,
    aiPrompt: '',
  });

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'ai'>('form');

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    onSearch(formData);
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-2xl shadow-lg p-8"
    >
      {/* Tab Navigation */}
      <div className="flex gap-4 mb-8 border-b">
        <button
          onClick={() => setActiveTab('form')}
          className={`pb-3 px-4 font-semibold transition-all ${
            activeTab === 'form'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600'
          }`}
        >
          <Search size={18} className="inline mr-2" />
          Search Trains
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`pb-3 px-4 font-semibold transition-all ${
            activeTab === 'ai'
              ? 'border-b-2 border-purple-600 text-purple-600'
              : 'text-gray-600'
          }`}
        >
          <MessageCircle size={18} className="inline mr-2" />
          Ask AI
        </button>
      </div>

      <form onSubmit={handleSearch}>
        {activeTab === 'form' ? (
          <div className="space-y-6">
            {/* Location Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <MapPin size={16} className="inline mr-2" />
                  From
                </label>
                <input
                  type="text"
                  name="from"
                  value={formData.from}
                  onChange={handleInputChange}
                  placeholder="Departure city"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <MapPin size={16} className="inline mr-2" />
                  To
                </label>
                <input
                  type="text"
                  name="to"
                  value={formData.to}
                  onChange={handleInputChange}
                  placeholder="Destination city"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Date and Passengers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Calendar size={16} className="inline mr-2" />
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Users size={16} className="inline mr-2" />
                  Passengers
                </label>
                <select
                  name="passengerCount"
                  value={formData.passengerCount}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'Passenger' : 'Passengers'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Clock size={16} className="inline mr-2" />
                  Tatkal Time
                </label>
                <input
                  type="time"
                  name="tatkalTime"
                  value={formData.tatkalTime}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Class and Preferences */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Class
                </label>
                <select
                  name="class"
                  value={formData.class}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="sleeper">Sleeper</option>
                  <option value="ac2">AC 2-Tier</option>
                  <option value="ac3">AC 3-Tier</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Quota
                </label>
                <select
                  name="quota"
                  value={formData.quota}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="GENERAL">General</option>
                  <option value="TATKAL">Tatkal Only</option>
                  <option value="PREMIUM">Premium</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Berth Preference
                </label>
                <select
                  name="berthPreference"
                  value={formData.berthPreference}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="NO_PREFERENCE">No Preference</option>
                  <option value="LOWER">Lower</option>
                  <option value="MIDDLE">Middle</option>
                  <option value="UPPER">Upper</option>
                  <option value="SIDE_LOWER">Side Lower</option>
                  <option value="SIDE_UPPER">Side Upper</option>
                </select>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Describe your travel plans in natural language:
            </label>
            <textarea
              name="aiPrompt"
              value={formData.aiPrompt}
              onChange={handleInputChange}
              placeholder="e.g., 'I need to book 2 seats to Mumbai tomorrow evening, preferably lower berth in AC 3-tier'"
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        )}

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full mt-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl disabled:opacity-50 transition-all"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
              Searching Trains...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <Search size={20} className="mr-2" />
              Search Trains
            </span>
          )}
        </motion.button>
      </form>
    </motion.div>
  );
}
