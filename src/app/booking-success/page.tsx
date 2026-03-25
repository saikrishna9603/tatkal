'use client';

import Link from 'next/link';
import { useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

type TicketSnapshot = {
  fromStation?: string;
  toStation?: string;
  trainName?: string;
  trainNumber?: string;
  passengers?: Array<{ name?: string; age?: number | string; gender?: string }>;
};

function BookingSuccessContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId') || '';
  const utr = searchParams.get('utr') || '';

  const ticketSnapshot = useMemo(() => {
    if (!bookingId) return null;
    try {
      const raw = sessionStorage.getItem(`tatkal_ticket_${bookingId}`);
      return raw ? (JSON.parse(raw) as TicketSnapshot) : null;
    } catch {
      return null;
    }
  }, [bookingId]);

  const downloadUrl = useMemo(() => {
    if (!bookingId) return '#';
    const query = new URLSearchParams({ bookingId, utr });
    return `/api/download-ticket?${query.toString()}`;
  }, [bookingId, utr]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8 border border-orange-100">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">✅</div>
          <h1 className="text-3xl font-bold text-green-700">Payment Successful</h1>
          <p className="text-gray-600 mt-2">Tatkal Booking Confirmed</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-6">
          <div className="border rounded-lg p-3">
            <p className="text-gray-500">Booking ID</p>
            <p className="font-mono font-bold break-all">{bookingId || 'N/A'}</p>
          </div>
          <div className="border rounded-lg p-3">
            <p className="text-gray-500">UTR Number</p>
            <p className="font-mono font-bold break-all">{utr || 'N/A'}</p>
          </div>
          <div className="border rounded-lg p-3">
            <p className="text-gray-500">Train</p>
            <p className="font-semibold">{ticketSnapshot?.trainName || '-'} ({ticketSnapshot?.trainNumber || '-'})</p>
          </div>
          <div className="border rounded-lg p-3">
            <p className="text-gray-500">Route</p>
            <p className="font-semibold">{ticketSnapshot?.fromStation || '-'} to {ticketSnapshot?.toStation || '-'}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href={downloadUrl}
            className="flex-1 text-center bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition"
          >
            Download Ticket PDF
          </a>
          <Link
            href="/"
            className="flex-1 text-center bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-lg transition"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

// Export with Suspense wrapper
export default function BookingSuccessPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <BookingSuccessContent />
    </Suspense>
  );
}
