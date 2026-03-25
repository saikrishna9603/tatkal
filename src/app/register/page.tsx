'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import API from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({
    has_uppercase: false,
    has_lowercase: false,
    has_digit: false,
    has_special: false,
    has_length: false,
  });

  const checkPasswordStrength = (password: string) => {
    setPasswordStrength({
      has_uppercase: /[A-Z]/.test(password),
      has_lowercase: /[a-z]/.test(password),
      has_digit: /\d/.test(password),
      has_special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      has_length: password.length >= 8,
    });
  };

  const normalizePhone = (phone: string) => {
    const compact = phone.replace(/\s|-/g, '');
    const digitsOnly = compact.replace(/\D/g, '');

    if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
      return `+${digitsOnly}`;
    }

    return digitsOnly;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'password') {
      checkPasswordStrength(value);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validation
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    const allStrengthChecks = Object.values(passwordStrength).every((v) => v);
    if (!allStrengthChecks) {
      setError('Password does not meet strength requirements');
      setLoading(false);
      return;
    }

    const normalizedPhone = normalizePhone(formData.phone);
    if (!/^(\+91)?[6-9]\d{9}$/.test(normalizedPhone)) {
      setError('Enter a valid Indian mobile number (e.g., 9876543210 or +919876543210)');
      setLoading(false);
      return;
    }

    try {
      const registrationUrl = '/api/auth/register';
      console.log('📍 DEBUGGING REGISTRATION:');
      console.log('API URL from ENV:', process.env.NEXT_PUBLIC_API_URL);
      console.log('Using Next.js proxy endpoint');
      console.log('Full Registration URL:', registrationUrl);
      console.log('Request payload:', {
        full_name: formData.full_name,
        email: formData.email,
        phone: normalizedPhone,
      });
      
      const response = await fetch(registrationUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          full_name: formData.full_name,
          email: formData.email,
          phone: normalizedPhone,
          password: formData.password,
          confirm_password: formData.confirm_password,
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse response:', jsonError);
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers));
        setError(`Server error (${response.status}): Invalid response format`);
        return;
      }

      console.log('✅ Response received:', { status: response.status, data });

      if (!response.ok) {
        const errorMsg = Array.isArray(data.detail) 
          ? data.detail.map((e: any) => e.msg).join('; ')
          : typeof data.detail === 'string'
          ? data.detail
          : JSON.stringify(data);
        console.error('Registration failed:', data);
        setError(errorMsg || 'Registration failed');
        return;
      }

      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Failed to connect to server. Make sure the backend is running and reachable.');
      } else {
        setError(err.message || 'An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const strengthCount = Object.values(passwordStrength).filter((v) => v).length;
  const strengthPercentage = (strengthCount / 5) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-lg shadow-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-2">
            🚂 TATKAL
          </div>
          <p className="text-gray-600 text-sm">Create Your Account</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              👤 Full Name
            </label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="John Doe"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📧 Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="you@example.com"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📱 Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="9876543210 or +919876543210"
            />
            <p className="text-xs text-gray-500 mt-1">10 digits (e.g., 9876543210) or with +91 prefix</p>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🔒 Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="••••••••"
            />

            {/* Password Strength Indicator */}
            <div className="mt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-600">
                  Password Strength
                </span>
                <span className="text-xs font-medium text-gray-600">
                  {strengthCount}/5
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    strengthPercentage < 40
                      ? 'bg-red-500'
                      : strengthPercentage < 80
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${strengthPercentage}%` }}
                ></div>
              </div>

              {/* Strength Checklist */}
              <div className="mt-2 space-y-1">
                <p className={`text-xs ${passwordStrength.has_uppercase ? 'text-green-600' : 'text-gray-500'}`}>
                  ✓ Uppercase letter
                </p>
                <p className={`text-xs ${passwordStrength.has_lowercase ? 'text-green-600' : 'text-gray-500'}`}>
                  ✓ Lowercase letter
                </p>
                <p className={`text-xs ${passwordStrength.has_digit ? 'text-green-600' : 'text-gray-500'}`}>
                  ✓ Number (0-9)
                </p>
                <p className={`text-xs ${passwordStrength.has_special ? 'text-green-600' : 'text-gray-500'}`}>
                  ✓ Special character
                </p>
                <p className={`text-xs ${passwordStrength.has_length ? 'text-green-600' : 'text-gray-500'}`}>
                  ✓ At least 8 characters
                </p>
              </div>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🔒 Confirm Password
            </label>
            <input
              type="password"
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="••••••••"
            />
          </div>

          {/* Terms Checkbox */}
          <div className="flex items-start">
            <input
              type="checkbox"
              id="terms"
              className="mt-1"
              required
            />
            <label htmlFor="terms" className="ml-2 text-xs text-gray-600">
              I agree to the Terms of Service and Privacy Policy
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-2.5 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        {/* Login Link */}
        <p className="text-center text-gray-600 text-sm mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
