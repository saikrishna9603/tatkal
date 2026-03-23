'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TatkalBookingPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [countdown, setCountdown] = useState(120);
  const [loading, setLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    train_preference: '',
    from: '',
    to: '',
    date: '',
    class: '2A',
    passengers: 1,
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(userData));
  }, [router]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setIsRunning(false);
      setMessage('✅ Tatkal booking window closed!');
    }
    return () => clearInterval(interval);
  }, [isRunning, countdown]);

  const handleStartTatkal = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setIsRunning(true);
    setCountdown(120);
    setMessage('⚡ Tatkal booking window activated! Ready to book...');
    
    try {
      const token = localStorage.getItem('access_token');
      await fetch('http://localhost:8001/api/tatkal/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
    } catch (error) {
      setMessage('❌ Error scheduling Tatkal');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickBook = async () => {
    if (!isRunning || countdown <= 0) {
      setMessage('❌ Tatkal window not active. Please start the booking first.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8001/api/tatkal/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setMessage('🎉 Tatkal booking successful!');
        setIsRunning(false);
        setTimeout(() => router.push('/'), 2000);
      } else {
        setMessage('❌ Booking failed. Seats might be unavailable.');
      }
    } catch (error) {
      setMessage('❌ Error completing booking');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div>Loading...</div>;

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-3xl font-bold">⚡ Tatkal Booking</h1>
          <Link
            href="/"
            className="bg-white text-orange-600 hover:bg-orange-50 px-4 py-2 rounded-lg font-semibold transition"
          >
            ← Back
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Booking Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Countdown Timer */}
            <div className={`rounded-lg shadow-lg p-6 text-center ${isRunning ? 'bg-red-500 text-white' : 'bg-white text-gray-800'}`}>
              <p className="text-sm font-semibold mb-2">Tatkal Window Timer</p>
              <p className={`text-6xl font-bold font-mono ${isRunning ? 'animate-pulse' : ''}`}>
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </p>
              <p className="text-sm mt-2">{isRunning ? '⏱️ Window Active' : '⏹️ Not Active'}</p>
            </div>

            {/* Form */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Configure Tatkal Booking</h2>
              <form onSubmit={handleStartTatkal} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">From</label>
                    <input
                      type="text"
                      value={formData.from}
                      onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                      placeholder="Departure station"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">To</label>
                    <input
                      type="text"
                      value={formData.to}
                      onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                      placeholder="Destination station"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Train Preference</label>
                    <input
                      type="text"
                      value={formData.train_preference}
                      onChange={(e) => setFormData({ ...formData, train_preference: e.target.value })}
                      placeholder="e.g., Rajdhani Express"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Class</label>
                    <select
                      value={formData.class}
                      onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="1A">1A (First AC)</option>
                      <option value="2A">2A (AC 2-Tier)</option>
                      <option value="3A">3A (AC 3-Tier)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Passengers</label>
                    <input
                      type="number"
                      min="1"
                      max="4"
                      value={formData.passengers}
                      onChange={(e) => setFormData({ ...formData, passengers: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                {message && (
                  <div className="p-4 bg-blue-100 text-blue-800 rounded-lg">
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || isRunning}
                  className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-bold transition text-lg"
                >
                  {loading ? 'Setting up...' : isRunning ? '✅ Window Active' : '🚀 Start Tatkal Window'}
                </button>
              </form>
            </div>
          </div>

          {/* Quick Book Panel */}
          <div className="bg-gradient-to-br from-orange-600 to-red-600 rounded-lg shadow-lg p-6 text-white h-fit">
            <h3 className="text-2xl font-bold mb-4">⚡ Lightning Fast</h3>
            <div className="space-y-4 mb-6">
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <p className="text-sm opacity-90">Window Status</p>
                <p className="text-lg font-bold">{isRunning ? '🟢 ACTIVE' : '🔴 INACTIVE'}</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <p className="text-sm opacity-90">Time Remaining</p>
                <p className="text-2xl font-bold font-mono">
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </p>
              </div>
            </div>

            <button
              onClick={handleQuickBook}
              disabled={!isRunning || loading || countdown <= 0}
              className="w-full bg-white text-orange-600 hover:bg-orange-50 disabled:bg-gray-300 disabled:text-gray-600 font-bold py-3 rounded-lg transition text-lg"
            >
              {loading ? 'Booking...' : '🎯 Quick Book Now'}
            </button>

            <div className="mt-6 space-y-3">
              <h4 className="font-bold mb-3">How Tatkal Works:</h4>
              <ol className="text-sm space-y-2 opacity-90">
                <li>1. Fill the form with your preferences</li>
                <li>2. Click "Start Tatkal Window"</li>
                <li>3. Click "Quick Book Now" when ready</li>
                <li>4. Get instant confirmation</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
