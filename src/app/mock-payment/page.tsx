'use client';

import Link from 'next/link';
import { useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type TicketSnapshot = {
  bookingId?: string;
  bookingType?: string;
  trainName?: string;
  trainNumber?: string;
  fromStation?: string;
  toStation?: string;
  departureDate?: string;
  seatClass?: string;
  seatInfo?: string;
  coachInfo?: string;
  passengers?: Array<{ name?: string; age?: number | string; gender?: string }>;
  totalAmount?: number;
};

function generateMockUtr(): string {
  let digits = '';
  for (let i = 0; i < 10; i++) {
    digits += Math.floor(Math.random() * 10).toString();
  }
  return `UTR${digits}`;
}

function MockPaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId') || '';

  const [upiId, setUpiId] = useState('');
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');

  const ticketSnapshot = useMemo(() => {
    if (!bookingId) return null;
    try {
      const raw = sessionStorage.getItem(`tatkal_ticket_${bookingId}`);
      return raw ? (JSON.parse(raw) as TicketSnapshot) : null;
    } catch {
      return null;
    }
  }, [bookingId]);

  const totalAmount = useMemo(() => {
    if (typeof ticketSnapshot?.totalAmount === 'number' && ticketSnapshot.totalAmount > 0) {
      return ticketSnapshot.totalAmount;
    }
    const count = Array.isArray(ticketSnapshot?.passengers) ? ticketSnapshot!.passengers!.length : 1;
    return Math.max(1000, count * 1000);
  }, [ticketSnapshot]);

  const handlePay = async () => {
    if (processing) return;

    if (!upiId.trim() || !upiId.includes('@')) {
      setMessage('Please enter a valid UPI ID (example@upi).');
      return;
    }

    if (!bookingId) {
      setMessage('Booking ID is missing. Please schedule Tatkal booking again.');
      return;
    }

    setMessage('');
    setProcessing(true);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const utr = generateMockUtr();
    const updatedSnapshot = {
      ...(ticketSnapshot || {}),
      bookingId,
      bookingType: 'TATKAL',
      totalAmount,
      paymentStatus: 'SUCCESS',
      paymentMethod: 'UPI',
      upiId: upiId.trim(),
      utr,
    };

    sessionStorage.setItem(`tatkal_ticket_${bookingId}`, JSON.stringify(updatedSnapshot));
    router.push(`/booking-success?bookingId=${encodeURIComponent(bookingId)}&utr=${encodeURIComponent(utr)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8 border border-orange-100">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">💳</div>
          <h1 className="text-3xl font-bold text-gray-800">Mock UPI Payment</h1>
          <p className="text-gray-600 mt-2">Complete payment for your Tatkal booking</p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-gray-600">Booking ID</p>
            <p className="font-mono text-lg font-bold text-blue-800 break-all">{bookingId || 'N/A'}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-sm text-gray-600">Amount Payable</p>
            <p className="text-2xl font-bold text-green-700">Rs {totalAmount}</p>
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-600 mb-2">UPI ID</label>
          <input
            type="text"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            placeholder="Enter UPI ID (example@upi)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            disabled={processing}
          />
        </div>

        {message && <p className="text-red-700 bg-red-100 border border-red-200 rounded-lg p-3 mb-4">{message}</p>}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handlePay}
            disabled={processing}
            className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition"
          >
            {processing ? 'Processing Payment...' : 'Pay Now'}
          </button>
          <Link
            href="/booking/tatkal"
            className="flex-1 text-center bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 rounded-lg transition"
          >
            Back
          </Link>
        </div>
      </div>
    </div>
  );
}

// Export with Suspense wrapper
export default function MockPaymentPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <MockPaymentContent />
    </Suspense>
  );
}
