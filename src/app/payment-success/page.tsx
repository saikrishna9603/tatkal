'use client';

import Link from 'next/link';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { generateProfessionalPDF } from '@/utils/professionalPdf';

type PassengerDetails = {
  name: string;
  age: number | string;
  gender?: string;
};

type BookingData = {
  bookingId: string;
  pnr: string;
  utr: string;
  trainName: string;
  trainNumber: string;
  fromStation: string;
  toStation: string;
  journeyDate: string;
  departureTime: string;
  arrivalTime: string;
  seatClass: string;
  passengers: PassengerDetails[];
  basefare: number;
  gst: number;
  bookingFee: number;
  tatkalCharge?: number;
  totalAmount: number;
  bookingDate: string;
  bookingType: 'normal' | 'tatkal';
  paymentMethod: string;
  paymentReference: string;
};

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId') || '';
  const utr = searchParams.get('utr') || '';
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('lastBookingData');
      if (raw) {
        const parsed = JSON.parse(raw);
        setBookingData(parsed);
      } else {
        // Create booking data from URL params if not in session
        setBookingData({
          bookingId: bookingId || 'BOOKING001',
          pnr: bookingId || 'UNKNOWN',
          utr: utr || 'UTR' + Math.floor(Math.random() * 10000000000).toString().padStart(10, '0'),
          trainName: 'Train',
          trainNumber: '---',
          fromStation: 'Station A',
          toStation: 'Station B',
          journeyDate: new Date().toISOString().split('T')[0],
          departureTime: '--:--',
          arrivalTime: '--:--',
          seatClass: '---',
          passengers: [],
          basefare: 0,
          gst: 0,
          bookingFee: 50,
          totalAmount: 0,
          bookingDate: new Date().toISOString(),
          bookingType: 'normal',
          paymentMethod: 'UPI',
          paymentReference: '---',
        });
      }
    } catch (error) {
      console.error('Error loading booking data:', error);
      setBookingData({
        bookingId: bookingId || 'BOOKING001',
        pnr: bookingId || 'UNKNOWN',
        utr: utr || 'UTR' + Math.floor(Math.random() * 10000000000).toString().padStart(10, '0'),
        trainName: 'Train',
        trainNumber: '---',
        fromStation: 'Station A',
        toStation: 'Station B',
        journeyDate: new Date().toISOString().split('T')[0],
        departureTime: '--:--',
        arrivalTime: '--:--',
        seatClass: '---',
        passengers: [],
        basefare: 0,
        gst: 0,
        bookingFee: 50,
        totalAmount: 0,
        bookingDate: new Date().toISOString(),
        bookingType: 'normal',
        paymentMethod: 'UPI',
        paymentReference: '---',
      });
    } finally {
      setLoading(false);
    }
  }, [bookingId, utr]);

  const handleDownloadPDF = () => {
    if (!bookingData) return;

    generateProfessionalPDF({
      pnr: bookingData.pnr,
      utr: bookingData.utr,
      bookingDate: bookingData.bookingDate,
      trainName: bookingData.trainName,
      trainNumber: bookingData.trainNumber,
      fromStation: bookingData.fromStation,
      toStation: bookingData.toStation,
      journeyDate: bookingData.journeyDate,
      departureTime: bookingData.departureTime,
      arrivalTime: bookingData.arrivalTime,
      seatClass: bookingData.seatClass,
      passengers: bookingData.passengers,
      basefare: bookingData.basefare,
      gst: bookingData.gst,
      bookingFee: bookingData.bookingFee,
      tatkalCharge: bookingData.tatkalCharge || 0,
      totalAmount: bookingData.totalAmount,
      bookingType: bookingData.bookingType,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center px-4">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8 border border-red-100">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">❌</div>
            <h1 className="text-3xl font-bold text-red-700">Error Loading Booking</h1>
            <p className="text-gray-600 mt-2">Unable to load your booking details.</p>
          </div>
          <Link
            href="/"
            className="block text-center bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold">✅ Payment Successful</h1>
          <p className="text-green-50 mt-1">Your booking has been confirmed</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6">
        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-green-200 mb-6">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">✨</div>
            <h2 className="text-3xl font-bold text-gray-800">Payment Successful!</h2>
            <p className="text-gray-600 mt-2">
              {bookingData.bookingType === 'tatkal' ? 'Tatkal Booking Confirmed' : 'Normal Booking Confirmed'}
            </p>
          </div>

          {/* Booking Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* PNR & UTR */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
              <p className="text-sm text-gray-600 font-semibold">PNR Number</p>
              <p className="font-mono text-2xl font-bold text-green-700 mt-1 break-all">{bookingData.pnr}</p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-gray-600 font-semibold">UTR Number</p>
              <p className="font-mono text-2xl font-bold text-blue-700 mt-1 break-all">{bookingData.utr}</p>
            </div>
          </div>

          {/* Journey Details */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Journey Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Train Name & Number</p>
                <p className="font-semibold text-gray-800 mt-1">
                  {bookingData.trainName} ({bookingData.trainNumber})
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Class</p>
                <p className="font-semibold text-gray-800 mt-1">{bookingData.seatClass}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">From → To</p>
                <p className="font-semibold text-gray-800 mt-1">
                  {bookingData.fromStation} → {bookingData.toStation}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Journey Date</p>
                <p className="font-semibold text-gray-800 mt-1">{bookingData.journeyDate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Departure Time</p>
                <p className="font-semibold text-gray-800 mt-1">{bookingData.departureTime}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Arrival Time</p>
                <p className="font-semibold text-gray-800 mt-1">{bookingData.arrivalTime}</p>
              </div>
            </div>
          </div>

          {/* Passenger Details */}
          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Passenger Details ({bookingData.passengers.length})</h3>
            <div className="space-y-3">
              {bookingData.passengers.length > 0 ? (
                bookingData.passengers.map((passenger, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-gray-800">
                        {idx + 1}. {passenger.name}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Age: {passenger.age} {passenger.gender && `| Gender: ${passenger.gender}`}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                        CONFIRMED
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-600">No passenger details available</p>
              )}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Payment Summary</h3>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Base Fare</span>
                <span className="font-semibold">₹{bookingData.basefare.toLocaleString('en-IN')}</span>
              </div>
              {(bookingData.tatkalCharge || 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tatkal Charge</span>
                  <span className="font-semibold">₹{(bookingData.tatkalCharge || 0).toLocaleString('en-IN')}</span>
                </div>
              )}
              {bookingData.gst > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">GST (5%)</span>
                  <span className="font-semibold">₹{bookingData.gst.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Booking Fee</span>
                <span className="font-semibold">₹{bookingData.bookingFee.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Total */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg p-4 text-white flex justify-between items-center">
              <span className="font-bold text-lg">Total Amount Paid</span>
              <span className="font-bold text-2xl">₹{bookingData.totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="border-t pt-6 mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Payment Method</p>
              <p className="font-semibold text-gray-800 mt-1">{bookingData.paymentMethod}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Payment Reference</p>
              <p className="font-semibold text-gray-800 mt-1 break-all">{bookingData.paymentReference}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <button
            onClick={handleDownloadPDF}
            className="flex-1 text-center bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            📥 Download E-Ticket (PDF)
          </button>
          <Link
            href="/"
            className="flex-1 text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
          >
            🏠 Go to Dashboard
          </Link>
        </div>

        {/* Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6 text-sm">
          <p className="text-blue-900">
            <strong>Important:</strong> Please keep your PNR and UTR number safe. You'll need them to check booking status,
            make changes, or for cancellation. A confirmation email has been sent to your registered email address.
          </p>
        </div>
      </div>
    </div>
  );
}

// Export component wrapped in Suspense
export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-12 w-12 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600 font-semibold">Loading payment details...</p>
      </div>
    </div>
  );
}
