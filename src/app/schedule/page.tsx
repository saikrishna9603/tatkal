'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import API from '@/lib/api';

export default function SchedulePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [trains, setTrains] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    date: '',
    seatClass: 'AC2',
    sortBy: 'departure_time',
    pageSize: '10',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'info'>('info');
  const [showFilters, setShowFilters] = useState(false);

  const indianCities = [
    "Delhi", "Mumbai", "Bangalore", "Hyderabad", "Chennai",
    "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Lucknow",
    "Chandigarh", "Indore", "Bhopal", "Visakhapatnam", "Kochi"
  ];

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

  const handleSearch = async (e: any, page: number = 1) => {
    e?.preventDefault();
    setLoading(true);
    setMessage('');
    setMessageType('info');
    setCurrentPage(page);
    try {
      const data = await API.searchTrains(
        filters.from,
        filters.to,
        filters.date,
        filters.seatClass,
        page,
        parseInt(filters.pageSize),
        filters.sortBy
      ) as any;

      setTrains(data.trains || []);
      setTotalPages(data.total_pages || 1);
      setTotalResults(data.total_results || 0);

      if (!data.trains || data.trains.length === 0) {
        setMessage('No trains found for this route/date. Try another city pair or date.');
        setMessageType('info');
      }
    } catch (error: any) {
      setMessage('❌ Error searching trains: ' + (error.message || ''));
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

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
          <form onSubmit={(e) => handleSearch(e, 1)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">From</label>
                <select
                  value={filters.from}
                  onChange={(e) => setFilters({ ...filters, from: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select</option>
                  {indianCities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">To</label>
                <select
                  value={filters.to}
                  onChange={(e) => setFilters({ ...filters, to: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select</option>
                  {indianCities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
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
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">Class</label>
                <select
                  value={filters.seatClass}
                  onChange={(e) => setFilters({ ...filters, seatClass: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="General">General</option>
                  <option value="Sleeper">Sleeper</option>
                  <option value="AC3">AC3</option>
                  <option value="AC2">AC2</option>
                  <option value="AC1">AC1</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 rounded-lg font-semibold transition"
                >
                  {loading ? 'Searching...' : '🔍 Search'}
                </button>
              </div>
            </div>

            {/* Filters Toggle */}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="text-sm text-blue-600 hover:text-blue-800 font-semibold"
            >
              {showFilters ? '▼ Hide Filters' : '▶ Show More Filters'}
            </button>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Sort By</label>
                    <select
                      value={filters.sortBy}
                      onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="departure_time">Departure Time</option>
                      <option value="price">Price (Low to High)</option>
                      <option value="duration">Duration</option>
                      <option value="rating">Rating (High to Low)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Results Per Page</label>
                    <select
                      value={filters.pageSize}
                      onChange={(e) => setFilters({ ...filters, pageSize: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="5">5 Trains</option>
                      <option value="10">10 Trains</option>
                      <option value="20">20 Trains</option>
                      <option value="50">50 Trains</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={(e) => handleSearch(e, 1)}
                      disabled={loading}
                      className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-2 rounded-lg font-semibold transition"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              </div>
            )}
          </form>

          {message && (
            <div
              className={`mt-4 p-4 rounded-lg ${
                messageType === 'error'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              {message}
            </div>
          )}
        </div>

        {/* Results Summary */}
        {trains.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-gray-700">
              Showing <strong>{trains.length}</strong> of <strong>{totalResults}</strong> trains • 
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
            </p>
          </div>
        )}

        {/* Train Results */}
        <div className="space-y-4">
          {trains.length > 0 ? (
            <>
              {trains.map((train: any) => (
                <div key={train._id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <p className="font-bold text-lg text-gray-800">{train.name}</p>
                      <p className="text-sm text-gray-600">#{train.number}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-yellow-500">⭐</span>
                        <span className="text-sm font-semibold">{train.rating}</span>
                        <span className="text-xs text-gray-500">({train.reviews} reviews)</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{train.departureTime}</p>
                      <p className="text-sm text-gray-600">{train.from}</p>
                    </div>
                    <div className="flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">{train.duration}</p>
                        <p className="text-lg">→</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{train.arrivalTime}</p>
                      <p className="text-sm text-gray-600">{train.to}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div>
                        <p className="text-lg font-bold text-green-600">₹{train.price[filters.seatClass] || train.price['AC2']}</p>
                        <p className="text-sm text-gray-600">✓ {train.availability.confirmed} seats</p>
                      </div>
                      <Link
                        href={{
                          pathname: `/booking/${train._id}`,
                          query: {
                            trainName: train.name || '',
                            trainNumber: train.number || '',
                            from: train.from || '',
                            to: train.to || '',
                            departureTime: train.departureTime || '',
                            arrivalTime: train.arrivalTime || '',
                            price: String(train.price[filters.seatClass] || train.price['AC2'] || 0),
                            availableSeats: String(train.availability?.confirmed || 0),
                            date: filters.date || '',
                            bookingType: 'normal',
                          },
                        }}
                        className="text-center bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition"
                      >
                        Book Now
                      </Link>
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2 flex-wrap">
                  <button
                    disabled={currentPage === 1 || loading}
                    onClick={(e) => handleSearch(e, currentPage - 1)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    ← Previous
                  </button>

                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      const page = currentPage > 3 ? currentPage - 2 + i : i + 1;
                      if (page > totalPages) return null;
                      return (
                        <button
                          key={page}
                          onClick={(e) => handleSearch(e as any, page)}
                          disabled={loading}
                          className={`px-3 py-2 rounded-lg transition ${
                            currentPage === page
                              ? "bg-indigo-600 text-white font-semibold"
                              : "bg-gray-200 hover:bg-gray-300"
                          } disabled:opacity-50`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    {totalPages > 5 && <span className="text-gray-600">...</span>}
                  </div>

                  <button
                    disabled={currentPage === totalPages || loading}
                    onClick={(e) => handleSearch(e, currentPage + 1)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-4xl mb-4">🚂</p>
              <p className="text-gray-600 text-lg">
                {loading ? "Searching for trains..." : "Select route, date and search for trains"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
