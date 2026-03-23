'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_bookings: 0,
    successful_bookings: 0,
    total_money_spent: 0,
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🚂</div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {user?.full_name}! 👋</h1>
            <p className="text-blue-100 mt-1">{user?.email}</p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/schedule"
              className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg font-semibold transition"
            >
              Book New Train
            </Link>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-semibold transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
            <div className="text-4xl mb-2">🎫</div>
            <p className="text-gray-600 text-sm">Total Bookings</p>
            <p className="text-3xl font-bold text-blue-600">{stats.total_bookings}</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-gray-600 text-sm">Successful</p>
            <p className="text-3xl font-bold text-green-600">{stats.successful_bookings}</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
            <div className="text-4xl mb-2">💰</div>
            <p className="text-gray-600 text-sm">Total Spent</p>
            <p className="text-3xl font-bold text-indigo-600">₹{stats.total_money_spent}</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
            <div className="text-4xl mb-2">🚀</div>
            <p className="text-gray-600 text-sm">Tatkal Success</p>
            <p className="text-3xl font-bold text-orange-600">
              {stats.total_bookings ? Math.round((stats.successful_bookings / stats.total_bookings) * 100) : 0}%
            </p>
          </div>
        </div>

        {/* Main Features */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/schedule"
                  className="w-full block text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition font-semibold"
                >
                  🔍 Search Trains
                </Link>
                <Link
                  href="/profile"
                  className="w-full block text-center bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2 rounded-lg hover:from-green-700 hover:to-emerald-700 transition font-semibold"
                >
                  👤 My Profile
                </Link>
                <Link
                  href="/booking/tatkal"
                  className="w-full block text-center bg-gradient-to-r from-orange-600 to-red-600 text-white py-2 rounded-lg hover:from-orange-700 hover:to-red-700 transition font-semibold"
                >
                  ⚡ Tatkal Booking
                </Link>
              </div>
            </div>

            {/* Tatkal Feature */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
              <h3 className="text-lg font-bold mb-2">⚡ Tatkal Booking</h3>
              <p className="text-sm text-orange-100 mb-4">
                Get instant updates for Tatkal availability
              </p>
              <Link
                href="/booking/tatkal"
                className="w-full block text-center bg-white text-orange-600 py-2 rounded-lg hover:bg-orange-50 transition font-semibold"
              >
                Setup Tatkal Alert
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-6">Available Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/schedule"
                className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition text-center"
              >
                <div className="text-3xl mb-2">🚂</div>
                <h4 className="font-bold text-gray-800">Train Search</h4>
                <p className="text-sm text-gray-600">Browse 1000s of trains</p>
              </Link>

              <Link
                href="/booking/tatkal"
                className="p-4 border border-gray-200 rounded-lg hover:bg-orange-50 hover:border-orange-400 transition text-center"
              >
                <div className="text-3xl mb-2">⚡</div>
                <h4 className="font-bold text-gray-800">Tatkal Booking</h4>
                <p className="text-sm text-gray-600">Book at lightning speed</p>
              </Link>

              <Link
                href="/live-agent"
                className="p-4 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-400 transition text-center"
              >
                <div className="text-3xl mb-2">🤖</div>
                <h4 className="font-bold text-gray-800">AI Agent</h4>
                <p className="text-sm text-gray-600">Smart recommendations</p>
              </Link>

              <Link
                href="/profile"
                className="p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-400 transition text-center"
              >
                <div className="text-3xl mb-2">👤</div>
                <h4 className="font-bold text-gray-800">My Profile</h4>
                <p className="text-sm text-gray-600">Manage your account</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

