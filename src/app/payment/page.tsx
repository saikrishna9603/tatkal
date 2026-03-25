'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import API from '@/lib/api';
import { calculateFareBreakdown } from '@/lib/pricing';
import { generateUTR, generatePNR, validatePaymentDetails } from '@/utils/paymentUtils';
import { generateProfessionalPDF } from '@/utils/professionalPdf';

type DraftPassenger = {
  name: string;
  age: number;
  gender?: string;
};

type BookingDraft = {
  trainId: string;
  trainName: string;
  trainNumber: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  date: string;
  class: string;
  seatPreference: string;
  passengers: DraftPassenger[];
  price: number;
  bookingType: 'normal' | 'tatkal';
  userId: string;
};

export default function PaymentPage() {
  const router = useRouter();
  const [draft, setDraft] = useState<BookingDraft | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentDetail, setPaymentDetail] = useState('');
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    const raw = sessionStorage.getItem('bookingDraft');
    if (!raw) {
      setMessage('No booking draft found. Please select a train and continue again.');
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      setDraft(parsed);
    } catch {
      setMessage('Booking draft is invalid. Please start booking again.');
    }
  }, []);

  const breakdown = useMemo(() => {
    if (!draft) return { base: 0, gst: 0, fee: 50, tatkalCharge: 0, total: 0 };
    
    // Use the dynamic pricing engine
    const priceData = calculateFareBreakdown({
      from: draft.from,
      to: draft.to,
      travelClass: draft.class,
      bookingMode: draft.bookingType || 'normal',
      passengerCount: draft.passengers.length,
    });

    return {
      base: priceData.total.baseFare,
      gst: priceData.total.gst,
      fee: priceData.total.bookingFee,
      tatkalCharge: priceData.total.tatkalCharge,
      total: priceData.total.grandTotal,
      perPassenger: priceData.perPassenger,
    };
  }, [draft]);

  const submitPayment = async () => {
    if (!draft || processing) return;

    // Validate payment details
    if (!validatePaymentDetails(paymentMethod, paymentDetail)) {
      setValidationError(`Please enter a valid ${paymentMethod} ID to continue.`);
      return;
    }
    setValidationError('');

    setMessage('');
    setProcessing(true);

    try {
      // Show loading for 2 seconds
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Generate mock UTR and PNR
      const utr = generateUTR();
      const pnr = generatePNR();

      const payload = {
        user_id: draft.userId || 'demo_user_001',
        train_id: draft.trainId,
        train_name: draft.trainName,
        train_number: draft.trainNumber,
        from_station: draft.from,
        to_station: draft.to,
        departure_date: draft.date,
        departure_time: draft.departureTime,
        arrival_time: draft.arrivalTime,
        seat_class: draft.class,
        seat_preference: draft.seatPreference,
        booking_type: draft.bookingType || 'normal',
        passengers: draft.passengers,
        total_amount: breakdown.total,
        payment_method: paymentMethod,
        payment_reference: paymentDetail.trim(),
        utr: utr,
        pnr: pnr,
      };

      const response = (await API.createBooking(payload)) as any;

      if (!response?.success) {
        throw new Error(response?.message || 'Booking save failed');
      }

      // Prepare booking data for success page
      const bookingData = {
        bookingId: response.booking_id || pnr,
        pnr: pnr,
        utr: utr,
        trainName: draft.trainName,
        trainNumber: draft.trainNumber,
        fromStation: draft.from,
        toStation: draft.to,
        journeyDate: draft.date,
        departureTime: draft.departureTime,
        arrivalTime: draft.arrivalTime,
        seatClass: draft.class,
        passengers: draft.passengers,
        basefare: breakdown.base,
        gst: breakdown.gst,
        bookingFee: breakdown.fee,
        tatkalCharge: breakdown.tatkalCharge || 0,
        totalAmount: breakdown.total,
        bookingDate: new Date().toISOString(),
        bookingType: draft.bookingType || 'normal',
        paymentMethod: paymentMethod,
        paymentReference: paymentDetail.trim(),
      };

      // Store booking data for success page and PDF generation
      sessionStorage.setItem('lastBookingData', JSON.stringify(bookingData));
      sessionStorage.removeItem('bookingDraft');

      // Generate PDF immediately
      try {
        generateProfessionalPDF({
          pnr: pnr,
          utr: utr,
          bookingDate: new Date().toISOString(),
          trainName: draft.trainName,
          trainNumber: draft.trainNumber,
          fromStation: draft.from,
          toStation: draft.to,
          journeyDate: draft.date,
          departureTime: draft.departureTime,
          arrivalTime: draft.arrivalTime,
          seatClass: draft.class,
          passengers: draft.passengers,
          basefare: breakdown.base,
          gst: breakdown.gst,
          bookingFee: breakdown.fee,
          tatkalCharge: breakdown.tatkalCharge || 0,
          totalAmount: breakdown.total,
          bookingType: draft.bookingType || 'normal',
        });
      } catch (pdfError) {
        console.error('PDF generation error:', pdfError);
        // Continue even if PDF generation fails
      }

      // Redirect to success page
      router.push(`/payment-success?bookingId=${encodeURIComponent(pnr)}&utr=${encodeURIComponent(utr)}`);
    } catch (error: any) {
      setMessage('❌ ' + (error?.message || 'Payment failed. Please retry.'));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-3xl font-bold">Payment</h1>
          <Link href="/schedule" className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg font-semibold transition">
            Back to Search
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-5">Complete Payment</h2>

          {!draft && (
            <p className="text-red-700 bg-red-100 border border-red-200 rounded-lg p-4">{message || 'Loading booking draft...'}</p>
          )}

          {draft && (
            <>
              <div className="mb-5 p-4 border border-blue-200 bg-blue-50 rounded-lg">
                <p className="font-bold text-gray-800">{draft.trainName} ({draft.trainNumber})</p>
                <p className="text-sm text-gray-700 mt-1">{draft.from} ({draft.departureTime}) {'->'} {draft.to} ({draft.arrivalTime})</p>
                <p className="text-sm text-gray-700 mt-1">Date: {draft.date} | Class: {draft.class}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    disabled={processing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    <option value="UPI">UPI</option>
                    <option value="CARD">Card</option>
                    <option value="NETBANKING">Net Banking</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">
                    Payment Details {paymentMethod === 'UPI' && <span className="text-red-600">*</span>}
                  </label>
                  <input
                    type="text"
                    value={paymentDetail}
                    onChange={(e) => {
                      setPaymentDetail(e.target.value);
                      setValidationError('');
                    }}
                    placeholder={paymentMethod === 'UPI' ? 'Enter UPI ID (example@upi)' : 'Enter reference details'}
                    disabled={processing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                  {validationError && (
                    <p className="mt-2 text-sm text-red-600 font-semibold">{validationError}</p>
                  )}
                </div>
              </div>

              {message && <p className="mt-4 text-red-700 bg-red-100 border border-red-200 rounded-lg p-3 font-semibold">{message}</p>}

              <button
                type="button"
                onClick={submitPayment}
                disabled={processing || !paymentDetail.trim()}
                className="mt-6 w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-bold transition flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    Processing Payment...
                  </>
                ) : (
                  'Pay Now'
                )}
              </button>
            </>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 h-fit sticky top-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">💰 Amount Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Base Fare ({draft?.passengers.length} × {draft?.class})</span>
              <span className="font-semibold">₹{breakdown.base.toLocaleString('en-IN')}</span>
            </div>
            {breakdown.tatkalCharge > 0 && (
              <div className="flex justify-between text-sm">
                <span>Tatkal Charge</span>
                <span className="font-semibold">₹{breakdown.tatkalCharge.toLocaleString('en-IN')}</span>
              </div>
            )}
            {breakdown.gst > 0 && (
              <div className="flex justify-between text-sm">
                <span>GST (5%)</span>
                <span className="font-semibold">₹{breakdown.gst.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span>Booking Fee</span>
              <span className="font-semibold">₹{breakdown.fee.toLocaleString('en-IN')}</span>
            </div>
            <div className="border-t pt-3 flex justify-between text-lg">
              <span className="font-bold">Total Amount</span>
              <span className="font-bold text-green-600">₹{breakdown.total.toLocaleString('en-IN')}</span>
            </div>
            <p className="text-xs text-gray-500 mt-3 italic">Pricing calculated based on IRCTC-style dynamic rate system</p>
          </div>
        </div>
      </div>
    </div>
  );
}
