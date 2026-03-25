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

function TatkalPaymentSuccessContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId') || '';
  const utr = searchParams.get('utr') || '';
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('lastBookingData');
      if (raw) {
        const parsed = JSON.parse(raw);
        setBookingData(parsed);
      } else {
        // Fallback data if session storage is empty
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
          tatkalCharge: 0,
          totalAmount: 0,
          bookingDate: new Date().toISOString(),
          bookingType: 'tatkal',
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
        tatkalCharge: 0,
        totalAmount: 0,
        bookingDate: new Date().toISOString(),
        bookingType: 'tatkal',
        paymentMethod: 'UPI',
        paymentReference: '---',
      });
    } finally {
      setLoading(false);
    }
  }, [bookingId, utr]);

  const handleDownloadPDF = async () => {
    if (!bookingData) return;

    setDownloadingPDF(true);
    try {
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
    } catch (error) {
      console.error('PDF download error:', error);
    } finally {
      setDownloadingPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading your booking details...</p>
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
            <p className="text-gray-600 mt-2">Unable to load your tatkal booking details.</p>
          </div>
          <Link
            href="/schedule"
            className="block w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg text-center transition"
          >
            Back to Search
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 shadow-lg">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <span>✓</span> Tatkal Booking Confirmed!
            </h1>
            <p className="text-green-100 mt-1">Your fast-track train ticket is ready</p>
          </div>
          <Link href="/schedule" className="bg-white text-green-600 hover:bg-green-50 px-4 py-2 rounded-lg font-semibold transition">
            New Search
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6">
        {/* Success Message Banner */}
        <div className="mb-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="text-5xl">🎉</div>
            <div>
              <p className="text-lg font-bold">Your Tatkal Booking is Confirmed!</p>
              <p className="text-green-100">Payment received. Your e-ticket has been generated.</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Confirmation Details Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-green-600">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-green-600">📄</span> Confirmation Details
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between pb-3 border-b border-gray-200">
                <span className="text-gray-600">PNR Number:</span>
                <span className="font-bold text-gray-800">{bookingData.pnr}</span>
              </div>
              <div className="flex justify-between pb-3 border-b border-gray-200">
                <span className="text-gray-600">Transaction ID (UTR):</span>
                <span className="font-bold text-gray-800">{bookingData.utr}</span>
              </div>
              <div className="flex justify-between pb-3 border-b border-gray-200">
                <span className="text-gray-600">Booking Type:</span>
                <span className="font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded">TATKAL (Fast-Track)</span>
              </div>
              <div className="flex justify-between pb-3 border-b border-gray-200">
                <span className="text-gray-600">Booking Date:</span>
                <span className="text-gray-800">{new Date(bookingData.bookingDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method:</span>
                <span className="text-gray-800">{bookingData.paymentMethod}</span>
              </div>
            </div>
          </div>

          {/* Train & Journey Details Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-blue-600">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-blue-600">🚆</span> Train Details
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between pb-3 border-b border-gray-200">
                <span className="text-gray-600">Train:</span>
                <div className="text-right">
                  <p className="font-bold text-gray-800">{bookingData.trainName}</p>
                  <p className="text-sm text-gray-500">#{bookingData.trainNumber}</p>
                </div>
              </div>
              <div className="flex justify-between pb-3 border-b border-gray-200">
                <span className="text-gray-600">Route:</span>
                <span className="font-bold text-gray-800">
                  {bookingData.fromStation} → {bookingData.toStation}
                </span>
              </div>
              <div className="flex justify-between pb-3 border-b border-gray-200">
                <span className="text-gray-600">Journey Date:</span>
                <span className="text-gray-800">{bookingData.journeyDate}</span>
              </div>
              <div className="flex justify-between pb-3 border-b border-gray-200">
                <span className="text-gray-600">Departure:</span>
                <span className="text-gray-800">{bookingData.departureTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Class:</span>
                <span className="font-bold text-gray-800">{bookingData.seatClass}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Passengers */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-purple-600">👥</span> Passenger(s) ({bookingData.passengers.length})
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 py-3 font-semibold text-gray-700">Name</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Age</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Gender</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Seat Number</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookingData.passengers.map((passenger, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-800">{passenger.name}</td>
                    <td className="px-4 py-3 text-gray-800">{passenger.age}</td>
                    <td className="px-4 py-3 text-gray-800">{passenger.gender || 'Not specified'}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">S{index + 1}-{bookingData.seatClass}</td>
                    <td className="px-4 py-3">
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">CONFIRMED</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fare Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">💰 Fare Summary</h2>

            <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
              <div className="flex justify-between text-gray-700">
                <span>Base Fare ({bookingData.passengers.length} × 1 way)</span>
                <span className="font-semibold">₹{bookingData.basefare}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>GST (5%)</span>
                <span className="font-semibold">₹{bookingData.gst}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Booking Fee</span>
                <span className="font-semibold">₹{bookingData.bookingFee}</span>
              </div>
              <div className="flex justify-between text-orange-700 bg-orange-50 p-2 rounded font-semibold">
                <span>Tatkal Premium (35%)</span>
                <span>₹{bookingData.tatkalCharge || 0}</span>
              </div>
            </div>

            <div className="flex justify-between text-lg font-bold bg-gradient-to-r from-green-100 to-emerald-100 p-4 rounded-lg border-2 border-green-300">
              <span>Total Paid:</span>
              <span className="text-green-600">₹{bookingData.totalAmount}</span>
            </div>
          </div>

          {/* Important Information */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📋 Important Information</h2>

            <div className="space-y-3">
              <div className="flex gap-3 items-start p-3 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-xl">ℹ️</span>
                <p className="text-sm text-blue-800">
                  <strong>E-Ticket Ready:</strong> Your e-ticket is attached to this confirmation. Download and carry it during travel.
                </p>
              </div>

              <div className="flex gap-3 items-start p-3 bg-orange-50 rounded-lg border border-orange-200">
                <span className="text-xl">⚡</span>
                <p className="text-sm text-orange-800">
                  <strong>Tatkal Fast-Track:</strong> Premium charges applied for same-day booking convenience.
                </p>
              </div>

              <div className="flex gap-3 items-start p-3 bg-purple-50 rounded-lg border border-purple-200">
                <span className="text-xl">🆔</span>
                <p className="text-sm text-purple-800">
                  <strong>Valid ID Required:</strong> Carry a valid government ID proof along with your e-ticket.
                </p>
              </div>

              <div className="flex gap-3 items-start p-3 bg-green-50 rounded-lg border border-green-200">
                <span className="text-xl">🚪</span>
                <p className="text-sm text-green-800">
                  <strong>Report Early:</strong> Arrive at the station at least 30 minutes before scheduled departure.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Download PDF Button */}
        <div className="text-center mb-8">
          <button
            onClick={handleDownloadPDF}
            disabled={downloadingPDF}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-4 px-8 rounded-lg transition disabled:cursor-not-allowed inline-flex items-center gap-2 text-lg shadow-lg"
          >
            {downloadingPDF ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                Generating PDF...
              </>
            ) : (
              <>
                <span>📥</span> Download E-Ticket (PDF)
              </>
            )}
          </button>
        </div>

        {/* Navigation Links */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/schedule"
            className="bg-white hover:bg-blue-50 border-2 border-blue-300 text-blue-600 font-bold py-3 px-4 rounded-lg text-center transition"
          >
            🔍 New Search
          </Link>
          <Link
            href="/bookings"
            className="bg-white hover:bg-purple-50 border-2 border-purple-300 text-purple-600 font-bold py-3 px-4 rounded-lg text-center transition"
          >
            📕 My Bookings
          </Link>
          <Link
            href="/dashboard"
            className="bg-white hover:bg-green-50 border-2 border-green-300 text-green-600 font-bold py-3 px-4 rounded-lg text-center transition"
          >
            🏠 Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function TatkalPaymentSuccess() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 font-semibold">Loading...</p>
          </div>
        </div>
      }
    >
      <TatkalPaymentSuccessContent />
    </Suspense>
  );
}
