'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import API from '@/lib/api';
import { generateUTR, generatePNR, validatePaymentDetails } from '@/utils/paymentUtils';
import { generateProfessionalPDF } from '@/utils/professionalPdf';

type PassengerDetails = {
  name: string;
  age: number | string;
  gender?: string;
};

type TatkalTicketSnapshot = {
  bookingId: string;
  bookingType: string;
  pnr: string;
  trainId: string;
  trainName: string;
  trainNumber: string;
  fromStation: string;
  toStation: string;
  departureDate: string;
  seatClass: string;
  seatInfo: string;
  coachInfo: string;
  passengers: PassengerDetails[];
  status: string;
};

function TatkalPaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId') || '';

  const [tatkalSnapshot, setTatkalSnapshot] = useState<TatkalTicketSnapshot | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentDetail, setPaymentDetail] = useState('');
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [validationError, setValidationError] = useState('');
  const [loading, setLoading] = useState(true);

  // Get base fare for tatkal (mock calculation)
  const getBasefare = (fromStation: string, toStation: string, seatClass: string): number => {
    const stationPairs: { [key: string]: number } = {
      'CSMT-PUNE': 800, 'CSMT-HYD': 1500, 'CSMT-SBC': 2000, 'CSMT-MAS': 2500,
      'PUNE-CSMT': 800, 'PUNE-HYD': 900, 'PUNE-SBC': 1300, 'PUNE-MAS': 1800,
      'HYD-CSMT': 1500, 'HYD-PUNE': 900, 'HYD-SBC': 1200, 'HYD-MAS': 1000,
      'SBC-CSMT': 2000, 'SBC-PUNE': 1300, 'SBC-HYD': 1200, 'SBC-MAS': 800,
      'MAS-CSMT': 2500, 'MAS-PUNE': 1800, 'MAS-HYD': 1000, 'MAS-SBC': 800,
    };

    const pair = `${fromStation}-${toStation}`;
    let baseFare = stationPairs[pair] || 1000;

    // Class multiplier
    const classMultiplier: { [key: string]: number } = {
      'AC1': 2.5, 'AC2': 2.0, 'AC3': 1.5, 'SL': 1.0, '2A': 2.0, '3A': 1.5
    };
    baseFare *= classMultiplier[seatClass] || 1;

    return Math.round(baseFare);
  };

  useEffect(() => {
    if (!bookingId) {
      setMessage('Missing booking ID. Please book a tatkal ticket first.');
      setLoading(false);
      return;
    }

    try {
      const snapshot = sessionStorage.getItem(`tatkal_ticket_${bookingId}`);
      if (snapshot) {
        setTatkalSnapshot(JSON.parse(snapshot));
      } else {
        setMessage('Could not find tatkal booking. Please try again.');
      }
    } catch (error) {
      console.error('Error loading tatkal snapshot:', error);
      setMessage('Error loading your booking. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  const baseFare = tatkalSnapshot
    ? getBasefare(tatkalSnapshot.fromStation, tatkalSnapshot.toStation, tatkalSnapshot.seatClass)
    : 0;

  const gst = Math.round(baseFare * 0.05); // 5% GST
  const bookingFee = 50;
  const tatkalCharge = Math.round(baseFare * 0.35); // 35% premium for tatkal
  const totalAmount = baseFare + gst + bookingFee + tatkalCharge;

  const submitPayment = async () => {
    if (!tatkalSnapshot || processing) return;

    // Validate payment details
    if (!validatePaymentDetails(paymentMethod, paymentDetail)) {
      setValidationError(`Please enter a valid ${paymentMethod} ID to continue.`);
      return;
    }
    setValidationError('');

    setMessage('');
    setProcessing(true);

    try {
      // Show loading spinner for 2 seconds
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Generate UTR and PNR
      const utr = generateUTR();
      const pnr = generatePNR();

      // Prepare booking payload
      const payload = {
        user_id: 'demo_user_001',
        train_id: tatkalSnapshot.trainId,
        train_name: tatkalSnapshot.trainName,
        train_number: tatkalSnapshot.trainNumber,
        from_station: tatkalSnapshot.fromStation,
        to_station: tatkalSnapshot.toStation,
        departure_date: tatkalSnapshot.departureDate,
        seat_class: tatkalSnapshot.seatClass,
        booking_type: 'tatkal',
        passengers: tatkalSnapshot.passengers,
        total_amount: totalAmount,
        payment_method: paymentMethod,
        payment_reference: paymentDetail.trim(),
        utr: utr,
        pnr: pnr,
      };

      // Call API to create booking
      const response = (await API.createBooking(payload)) as any;

      if (!response?.success) {
        throw new Error(response?.message || 'Booking save failed');
      }

      // Prepare booking data for success page
      const bookingData = {
        bookingId: response.booking_id || pnr,
        pnr: pnr,
        utr: utr,
        trainName: tatkalSnapshot.trainName,
        trainNumber: tatkalSnapshot.trainNumber,
        fromStation: tatkalSnapshot.fromStation,
        toStation: tatkalSnapshot.toStation,
        journeyDate: tatkalSnapshot.departureDate,
        departureTime: '08:00', // Mock departure time
        arrivalTime: '22:00', // Mock arrival time
        seatClass: tatkalSnapshot.seatClass,
        passengers: tatkalSnapshot.passengers,
        basefare: baseFare,
        gst: gst,
        bookingFee: bookingFee,
        tatkalCharge: tatkalCharge,
        totalAmount: totalAmount,
        bookingDate: new Date().toISOString(),
        bookingType: 'tatkal',
        paymentMethod: paymentMethod,
        paymentReference: paymentDetail.trim(),
      };

      // Store booking data for success page
      sessionStorage.setItem('lastBookingData', JSON.stringify(bookingData));

      // Generate PDF
      try {
        generateProfessionalPDF({
          pnr: pnr,
          utr: utr,
          bookingDate: new Date().toISOString(),
          trainName: tatkalSnapshot.trainName,
          trainNumber: tatkalSnapshot.trainNumber,
          fromStation: tatkalSnapshot.fromStation,
          toStation: tatkalSnapshot.toStation,
          journeyDate: tatkalSnapshot.departureDate,
          departureTime: '08:00',
          arrivalTime: '22:00',
          seatClass: tatkalSnapshot.seatClass,
          passengers: tatkalSnapshot.passengers,
          basefare: baseFare,
          gst: gst,
          bookingFee: bookingFee,
          tatkalCharge: tatkalCharge,
          totalAmount: totalAmount,
          bookingType: 'tatkal',
        });
      } catch (pdfError) {
        console.error('PDF generation error:', pdfError);
        // Continue even if PDF generation fails
      }

      // Redirect to tatkal success page
      router.push(`/tatkal-payment-success?bookingId=${encodeURIComponent(pnr)}&utr=${encodeURIComponent(utr)}`);
    } catch (error: any) {
      setMessage('❌ ' + (error?.message || 'Payment failed. Please retry.'));
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading tatkal booking...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Tatkal Payment</h1>
            <p className="text-blue-100 mt-1">Complete your tatkal booking</p>
          </div>
          <Link href="/schedule" className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg font-semibold transition">
            Back to Search
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Form */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-5">Complete Payment</h2>

          {message && <p className="text-red-700 bg-red-100 border border-red-200 rounded-lg p-4 mb-5">{message}</p>}

          {!tatkalSnapshot && !message && (
            <p className="text-gray-600 bg-yellow-100 border border-yellow-200 rounded-lg p-4">Loading your tatkal booking...</p>
          )}

          {tatkalSnapshot && (
            <>
              {/* Booking Summary */}
              <div className="mb-6 p-4 border border-blue-200 bg-blue-50 rounded-lg">
                <p className="font-bold text-gray-800"> {tatkalSnapshot.trainName} ({tatkalSnapshot.trainNumber})</p>
                <p className="text-sm text-gray-700 mt-1">
                  {tatkalSnapshot.fromStation} ({tatkalSnapshot.departureDate})  <span className="text-gray-500">→</span> {tatkalSnapshot.toStation}
                </p>
                <p className="text-sm text-gray-700 mt-1">Class: {tatkalSnapshot.seatClass} | Passengers: {tatkalSnapshot.passengers.length}</p>
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <p className="text-xs text-gray-700">
                    <strong>Passenger(s):</strong> {tatkalSnapshot.passengers.map((p) => p.name).join(', ')}
                  </p>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    disabled={processing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    <option value="UPI">UPI</option>
                    <option value="CARD">Credit/Debit Card</option>
                    <option value="NETBANKING">Net Banking</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">
                    {paymentMethod === 'UPI' ? 'UPI ID' : paymentMethod === 'CARD' ? 'Card Number' : 'Bank Account (Nets)'}{' '}
                    <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={paymentDetail}
                    onChange={(e) => {
                      setPaymentDetail(e.target.value);
                      setValidationError('');
                    }}
                    placeholder={
                      paymentMethod === 'UPI'
                        ? 'example@upi'
                        : paymentMethod === 'CARD'
                          ? '1234 5678 9012 3456'
                          : 'Account details'
                    }
                    disabled={processing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                  {validationError && (
                    <p className="text-red-700 text-sm mt-2 bg-red-50 p-2 rounded border border-red-200">{validationError}</p>
                  )}
                </div>
              </div>

              {/* Pay Now Button */}
              <button
                onClick={submitPayment}
                disabled={processing}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-3 px-4 rounded-lg transition disabled:cursor-not-allowed flex items-center justify-center"
              >
                {processing ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Processing...
                  </>
                ) : (
                  `Pay Now ₹${totalAmount}`
                )}
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                Your payment is secure and encrypted. We use industry-standard SSL technology.
              </p>
            </>
          )}
        </div>

        {/* Fare Summary Sidebar */}
        {tatkalSnapshot && (
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Fare Summary</h3>

              <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
                <div className="flex justify-between text-gray-700">
                  <span>Base Fare</span>
                  <span className="font-semibold">₹{baseFare}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>GST (5%)</span>
                  <span className="font-semibold">₹{gst}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Booking Fee</span>
                  <span className="font-semibold">₹{bookingFee}</span>
                </div>
                <div className="flex justify-between text-orange-700 bg-orange-50 p-2 rounded">
                  <span className="font-semibold">Tatkal Charges (35%)</span>
                  <span className="font-bold">₹{tatkalCharge}</span>
                </div>
              </div>

              <div className="flex justify-between text-lg font-bold bg-blue-50 p-3 rounded-lg border border-blue-200">
                <span>Total Amount</span>
                <span className="text-blue-600">₹{totalAmount}</span>
              </div>

              <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-xs text-orange-800">
                  <strong>ℹ️ Tatkal Information:</strong> Fast-track booking with premium charges. Available only on same-day bookings.
                </p>
              </div>

              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs text-green-800">
                  <strong>✓ Booking Type:</strong> Tatkal (Fast-track)
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TatkalPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 font-semibold">Loading tatkal payment...</p>
          </div>
        </div>
      }
    >
      <TatkalPaymentContent />
    </Suspense>
  );
}
