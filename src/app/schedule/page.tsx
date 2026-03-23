'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SchedulePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [trains, setTrains] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    date: '',
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(userData));
  }, [router]);

  const handleSearch = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `http://localhost:8001/api/trains/search?from_station=${filters.from}&to_station=${filters.to}&departure_date=${filters.date}`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      const data = await response.json();
      if (response.ok) {
        setTrains(data.trains || []);
      } else {
        setMessage('❌ No trains found');
      }
    } catch (error) {
      setMessage('❌ Error searching trains');
    } finally {
      setLoading(false);
    }
  };

  const mockTrains = [
    { id: 1, name: 'Rajdhani Express', from: 'Delhi', to: 'Mumbai', departure: '14:30', arrival: '08:15', price: 2500, seats: 45 },
    { id: 2, name: 'Shatabdi Express', from: 'Delhi', to: 'Agra', departure: '06:00', arrival: '08:00', price: 600, seats: 120 },
    { id: 3, name: 'Duronto Express', from: 'Delhi', to: 'Kolkata', departure: '16:00', arrival: '13:00', price: 1800, seats: 80 },
  ];

  if (!user) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-3xl font-bold">🚂 Search Trains</h1>
          <Link
            href="/"
            className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg font-semibold transition"
          >
            ← Back
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Find Your Train</h2>
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">From</label>
              <input
                type="text"
                value={filters.from}
                onChange={(e) => setFilters({ ...filters, from: e.target.value })}
                placeholder="Departure station"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">To</label>
              <input
                type="text"
                value={filters.to}
                onChange={(e) => setFilters({ ...filters, to: e.target.value })}
                placeholder="Destination station"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">Date</label>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 rounded-lg font-semibold transition"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>

          {message && (
            <div className="mt-4 p-4 bg-red-100 text-red-800 rounded-lg">{message}</div>
          )}
        </div>

        {/* Results */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">Available Trains</h2>
          {(trains.length > 0 ? trains : mockTrains).map((train) => (
            <div key={train.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                <div>
                  <p className="font-bold text-gray-800">{train.name}</p>
                  <p className="text-sm text-gray-600">✅ Running</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-blue-600">{train.departure}</p>
                  <p className="text-sm text-gray-600">{train.from}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600">→</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-blue-600">{train.arrival}</p>
                  <p className="text-sm text-gray-600">{train.to}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <div>
                    <p className="text-lg font-bold text-green-600">₹{train.price}</p>
                    <p className="text-sm text-gray-600">{train.seats} seats</p>
                  </div>
                  <Link
                    href={`/booking/${train.id}`}
                    className="text-center bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition"
                  >
                    Book Now
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
