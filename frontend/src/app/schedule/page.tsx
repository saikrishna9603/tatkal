// Train Search and Booking Page
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface Train {
  _id: string;
  number: string;
  name: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  classes: string[];
  price: { [key: string]: number };
  availability: { confirmed: number; rac: number; waitlist: number };
  amenities: string[];
  rating: number;
  reviews: number;
}

export default function TrainSearchPage() {
  const [fromStation, setFromStation] = useState("");
  const [toStation, setToStation] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [seatClass, setSeatClass] = useState("AC2");
  const [trains, setTrains] = useState<Train[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const indianCities = [
    "Delhi", "Mumbai", "Bangalore", "Hyderabad", "Chennai",
    "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Lucknow",
    "Chandigarh", "Indore", "Bhopal", "Visakhapatnam", "Kochi"
  ];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `http://localhost:8001/api/trains/search?from_station=${fromStation}&to_station=${toStation}&departure_date=${departureDate}&seat_class=${seatClass}`
      );

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = Array.isArray(data.detail) 
          ? data.detail.map((e: any) => e.msg).join("; ")
          : data.detail;
        setError(errorMsg || "Error searching trains");
        return;
      }

      setTrains(data.trains || []);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const swapStations = () => {
    [fromStation, toStation] = [toStation, fromStation];
    setFromStation(toStation);
    setToStation(fromStation);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="text-3xl font-bold flex items-center gap-2">
              🚂 TATKAL Train Booking
            </div>
            <Link href="/profile" className="hover:bg-white/20 px-4 py-2 rounded-lg transition">
              👤 Profile
            </Link>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="bg-white rounded-lg shadow-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
              {/* From Station */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📍 From
                </label>
                <select
                  value={fromStation}
                  onChange={(e) => setFromStation(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select</option>
                  {indianCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              {/* Swap Button */}
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={swapStations}
                  className="w-full h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition font-semibold flex items-center justify-center gap-2"
                >
                  🔄 Swap
                </button>
              </div>

              {/* To Station */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📍 To
                </label>
                <select
                  value={toStation}
                  onChange={(e) => setToStation(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select</option>
                  {indianCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              {/* Departure Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📅 Date
                </label>
                <input
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Seat Class */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  💺 Class
                </label>
                <select
                  value={seatClass}
                  onChange={(e) => setSeatClass(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="General">General</option>
                  <option value="Sleeper">Sleeper</option>
                  <option value="AC3">AC3</option>
                  <option value="AC2">AC2</option>
                  <option value="AC1">AC1</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-2.5 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50"
              >
                {loading ? "Searching..." : "🔍 Search Trains"}
              </button>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="px-6 bg-gray-200 hover:bg-gray-300 rounded-lg transition font-semibold"
              >
                ⚙️ Filters
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto mt-6">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        </div>
      )}

      {/* Train Results */}
      <div className="max-w-7xl mx-auto mt-8 px-4 pb-12">
        {trains.length > 0 ? (
          <div className="grid gap-4">
            {trains.map((train) => (
              <div key={train._id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Train Info */}
                  <div>
                    <div className="text-lg font-bold text-gray-800">{train.name}</div>
                    <div className="text-sm text-gray-600">#{train.number}</div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-yellow-500">⭐</span>
                      <span className="text-sm font-semibold">{train.rating}</span>
                      <span className="text-xs text-gray-500">({train.reviews} reviews)</span>
                    </div>
                  </div>

                  {/* Timing */}
                  <div>
                    <div className="text-2xl font-bold text-gray-800">{train.departureTime}</div>
                    <div className="text-xs text-gray-600">Departure</div>
                    <div className="mt-4 text-2xl font-bold text-gray-800">{train.arrivalTime}</div>
                    <div className="text-xs text-gray-600">Arrival</div>
                    <div className="mt-2 text-sm text-blue-600 font-semibold">{train.duration}</div>
                  </div>

                  {/* Route */}
                  <div>
                    <div className="text-sm text-gray-600">Route</div>
                    <div className="font-bold text-gray-800">{train.from}</div>
                    <div className="text-center text-gray-400 py-2">↓</div>
                    <div className="font-bold text-gray-800">{train.to}</div>
                  </div>

                  {/* Availability & Price */}
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Seats Available</div>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-xs">
                        <span>✓ Confirmed</span>
                        <span className="font-bold text-green-600">{train.availability.confirmed}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span>◐ RAC</span>
                        <span className="font-bold text-yellow-600">{train.availability.rac}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span>✗ Waitlist</span>
                        <span className="font-bold text-red-600">{train.availability.waitlist}</span>
                      </div>
                    </div>

                    {/* Price & Book Button */}
                    <div className="border-t pt-3">
                      <div className="text-xs text-gray-600">Price per seat</div>
                      <div className="text-2xl font-bold text-gray-800">
                        ₹{train.price[seatClass] || train.price["AC2"]}
                      </div>
                      <Link
                        href={`/booking/${train._id}`}
                        className="w-full mt-3 block text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition"
                      >
                        Book Now
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Amenities */}
                <div className="mt-4 pt-4 border-t">
                  <div className="text-xs text-gray-600 mb-2">Amenities</div>
                  <div className="flex flex-wrap gap-2">
                    {train.amenities.map((amenity) => (
                      <span key={amenity} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🚂</div>
            <p className="text-gray-600 text-lg">
              {loading ? "Searching for trains..." : "Select route and date to search for trains"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
