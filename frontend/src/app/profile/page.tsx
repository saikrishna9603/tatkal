// User Profile Page
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface UserData {
  user_id: string;
  email: string;
  full_name: string;
  phone: string;
  profile_photo?: string;
}

interface UserPreferences {
  preferred_class: string;
  preferred_time: string;
  tatkal_alerts: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>({
    preferred_class: "AC2",
    preferred_time: "morning",
    tatkal_alerts: true,
    email_notifications: true,
    sms_notifications: false,
  });
  const [activeTab, setActiveTab] = useState<"profile" | "preferences" | "payments" | "routes">(
    "profile"
  );
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    setLoading(false);
  }, []);

  const handleSavePreferences = () => {
    // Save preferences to backend
    localStorage.setItem("preferences", JSON.stringify(preferences));
    alert("Preferences saved successfully!");
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <p className="text-gray-600">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl">
                👤
              </div>
              <div>
                <h1 className="text-3xl font-bold">{user?.full_name}</h1>
                <p className="text-blue-100">{user?.email}</p>
              </div>
            </div>
            <Link href="/" className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg font-semibold">
              ← Back
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-8 overflow-x-auto">
          {[
            { id: "profile", label: "👤 Profile" },
            { id: "preferences", label: "⚙️ Preferences" },
            { id: "payments", label: "💳 Payments" },
            { id: "routes", label: "🗺️ Saved Routes" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 rounded-lg font-semibold transition whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Profile Information</h2>
              <button
                onClick={() => setEditMode(!editMode)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
              >
                {editMode ? "Cancel" : "Edit"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                {editMode ? (
                  <input
                    type="text"
                    value={user?.full_name || ""}
                    onChange={(e) =>
                      setUser({ ...user!, full_name: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                ) : (
                  <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-800">
                    {user?.full_name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-800">
                  {user?.email}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                {editMode ? (
                  <input
                    type="tel"
                    value={user?.phone || ""}
                    onChange={(e) =>
                      setUser({ ...user!, phone: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                ) : (
                  <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-800">
                    {user?.phone}
                  </p>
                )}
              </div>
            </div>

            {editMode && (
              <div className="flex gap-4">
                <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition">
                  Save Changes
                </button>
                <button
                  onClick={() => setEditMode(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Verification Status */}
            <div className="mt-8 pt-8 border-t">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Verification Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-800">Email Verified</p>
                    <p className="text-sm text-gray-600">✅ Verified on Jan 15, 2024</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-800">Phone Verified</p>
                    <p className="text-sm text-gray-600">⏳ Pending verification</p>
                  </div>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm">
                    Verify Now
                  </button>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="mt-8 pt-8 border-t">
              <h3 className="text-lg font-bold text-red-700 mb-4">Danger Zone</h3>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition"
              >
                Logout
              </button>
            </div>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === "preferences" && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Travel Preferences</h2>

            <div className="space-y-6">
              {/* Preferred Class */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  💺 Preferred Seat Class
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {["General", "Sleeper", "AC3", "AC2", "AC1"].map((cls) => (
                    <button
                      key={cls}
                      onClick={() => setPreferences({ ...preferences, preferred_class: cls })}
                      className={`p-3 rounded-lg font-semibold transition border-2 ${
                        preferences.preferred_class === cls
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 bg-gray-50 text-gray-700 hover:border-blue-300"
                      }`}
                    >
                      {cls}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preferred Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  ⏰ Preferred Travel Time
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { id: "morning", label: "🌅 Morning (6AM-12PM)" },
                    { id: "afternoon", label: "☀️ Afternoon (12PM-6PM)" },
                    { id: "evening", label: "🌆 Evening (6PM-12AM)" },
                    { id: "night", label: "🌙 Night (12AM-6AM)" },
                  ].map((time) => (
                    <button
                      key={time.id}
                      onClick={() => setPreferences({ ...preferences, preferred_time: time.id })}
                      className={`p-3 rounded-lg font-semibold transition border-2 ${
                        preferences.preferred_time === time.id
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 bg-gray-50 text-gray-700 hover:border-blue-300"
                      }`}
                    >
                      {time.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notifications */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">🔔 Notifications</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-800">Tatkal Alerts</p>
                      <p className="text-sm text-gray-600">Get instant Tatkal booking notifications</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.tatkal_alerts}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          tatkal_alerts: e.target.checked,
                        })
                      }
                      className="w-5 h-5"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-800">Email Notifications</p>
                      <p className="text-sm text-gray-600">Booking confirmations and updates</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.email_notifications}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          email_notifications: e.target.checked,
                        })
                      }
                      className="w-5 h-5"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-800">SMS Notifications</p>
                      <p className="text-sm text-gray-600">Instant SMS alerts for bookings</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.sms_notifications}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          sms_notifications: e.target.checked,
                        })
                      }
                      className="w-5 h-5"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleSavePreferences}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-bold hover:from-blue-700 hover:to-indigo-700 transition mt-6"
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === "payments" && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Payment Methods</h2>

            <div className="space-y-4 mb-6">
              <div className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">💳</span>
                    <div>
                      <p className="font-semibold text-gray-800">Visa Debit Card</p>
                      <p className="text-sm text-gray-600">****4532</p>
                    </div>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 font-semibold">Edit</button>
                </div>
              </div>

              <div className="p-4 border-2 border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📱</span>
                    <div>
                      <p className="font-semibold text-gray-800">Google Pay UPI</p>
                      <p className="text-sm text-gray-600">your***@okhdfcbank</p>
                    </div>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 font-semibold">Edit</button>
                </div>
              </div>
            </div>

            <button className="w-full border-2 border-dashed border-gray-300 p-4 rounded-lg text-gray-600 hover:text-gray-800 hover:border-gray-400 transition font-semibold">
              + Add Payment Method
            </button>
          </div>
        )}

        {/* Saved Routes Tab */}
        {activeTab === "routes" && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Saved Routes</h2>

            <div className="space-y-4">
              {[
                { from: "Delhi", to: "Mumbai", frequency: "Monthly" },
                { from: "Bangalore", to: "Chennai", frequency: "Quarterly" },
              ].map((route, idx) => (
                <div key={idx} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-800">
                        {route.from} → {route.to}
                      </p>
                      <p className="text-sm text-gray-600">{route.frequency}</p>
                    </div>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                      Quick Book
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
