'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function BookingPage() {
  const router = useRouter();
  const params = useParams();
  const trainId = params.id;
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    passengers: 1,
    class: '2A',
    seat_preference: 'any',
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(userData));
  }, [router]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8001/api/bookings/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          train_id: trainId,
          ...formData,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage('✅ Booking successful! Confirmation sent to your email.');
        setTimeout(() => router.push('/'), 2000);
      } else {
        setMessage('❌ Booking failed. Please try again.');
      }
    } catch (error) {
      setMessage('❌ Error processing booking');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-3xl font-bold">🎫 Book Your Ticket</h1>
          <Link
            href="/schedule"
            className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg font-semibold transition"
          >
            ← Back
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Booking Form */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Booking Details</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  Number of Passengers
                </label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={formData.passengers}
                  onChange={(e) => setFormData({ ...formData, passengers: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  Coach Class
                </label>
                <select
                  value={formData.class}
                  onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="1A">1A (First AC)</option>
                  <option value="2A">2A (AC 2-Tier)</option>
                  <option value="3A">3A (AC 3-Tier)</option>
                  <option value="SL">SL (Sleeper)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  Seat Preference
                </label>
                <select
                  value={formData.seat_preference}
                  onChange={(e) => setFormData({ ...formData, seat_preference: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="any">Any Available</option>
                  <option value="window">Window</option>
                  <option value="middle">Middle</option>
                  <option value="aisle">Aisle</option>
                </select>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-bold text-gray-800 mb-4">Passenger Details</h3>
                <div className="space-y-4">
                  {Array.from({ length: formData.passengers }).map((_, i) => (
                    <div key={i} className="p-4 border border-gray-200 rounded-lg">
                      <p className="font-semibold text-gray-800">Passenger {i + 1}</p>
                      <input
                        type="text"
                        placeholder="Full name"
                        className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <select className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option>Age: Adult</option>
                        <option>Age: Child (5-11)</option>
                        <option>Age: Senior (60+)</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {message && (
                <div className="p-4 bg-blue-100 text-blue-800 rounded-lg">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-bold transition text-lg"
              >
                {loading ? 'Processing...' : '✅ Confirm Booking'}
              </button>
            </form>
          </div>

          {/* Price Summary */}
          <div className="bg-white rounded-lg shadow-lg p-6 h-fit">
            <h3 className="text-xl font-bold text-gray-800 mb-4">💰 Price Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Base Fare (x {formData.passengers})</span>
                <span className="font-semibold">₹{2500 * formData.passengers}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (5%)</span>
                <span className="font-semibold">₹{Math.round(2500 * formData.passengers * 0.05)}</span>
              </div>
              <div className="flex justify-between">
                <span>Booking Fee</span>
                <span className="font-semibold">₹50</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="font-bold">Total</span>
                <span className="font-bold text-lg text-green-600">
                  ₹{Math.round(2500 * formData.passengers * 1.05 + 50)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
