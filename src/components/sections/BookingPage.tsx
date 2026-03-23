'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Clock, AlertCircle, Download } from 'lucide-react';
import { orchestrator } from '@/lib/agents/orchestrator';
import { SchedulerAgent } from '@/lib/agents/schedulerAgent';
import { PDFAgent } from '@/lib/agents/pdfAgent';
import TatkalCountdown from '@/components/ui/TatkalCountdown';
import BookingProgressAnimation from '@/components/ui/BookingProgressAnimation';
import WaitlistProgressionSimulator from '@/components/ui/WaitlistProgressionSimulator';

interface BookingPageProps {
  train: any;
  searchParams: any;
  onBack: () => void;
}

export default function BookingPage({ train, searchParams, onBack }: BookingPageProps) {
  const [bookingState, setBookingState] = useState('waiting'); // waiting, booking, completed, failed
  const [bookingLogs, setBookingLogs] = useState<string[]>([]);
  const [currentBooking, setCurrentBooking] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [bookingStarted, setBookingStarted] = useState(false);

  const tatkalTime = searchParams.tatkalTime || '08:00';

  useEffect(() => {
    // Set up countdown
    const updateCountdown = () => {
      const time = SchedulerAgent.getTimeUntilBooking(tatkalTime);
      setTimeLeft(time);

      if (time.totalSeconds <= 0 && !bookingStarted) {
        // Auto-start booking when time is reached
        setBookingStarted(true);
        executeBooking();
      }
    };

    const interval = setInterval(updateCountdown, 1000);
    updateCountdown(); // Initial call

    return () => clearInterval(interval);
  }, [tatkalTime, bookingStarted]);

  const addLog = (message: string) => {
    setBookingLogs((prev) => [...prev, message]);
  };

  const executeBooking = async () => {
    setBookingState('booking');
    addLog('[System] Starting booking execution...');

    try {
      const booking = await orchestrator.orchestrateBooking(
        train,
        searchParams,
        tatkalTime,
        addLog
      );

      setCurrentBooking(booking);

      if (booking.status === 'confirmed') {
        setBookingState('completed');
        addLog('[System] ✓ Booking confirmed successfully!');
      } else if (booking.status === 'waitlist') {
        addLog('[System] Added to waitlist - monitoring for cancellations...');
        // Booking stays in progress while waitlist is being monitored
      } else {
        setBookingState('failed');
        addLog('[System] ✗ Booking failed');
      }
    } catch (error) {
      setBookingState('failed');
      addLog(`[System] Error: ${error}`);
    }
  };

  const generatePDF = async () => {
    if (!currentBooking) return;

    addLog('[PDF Agent] Generating ticket PDF...');
    try {
      const pdf = await PDFAgent.generateTicketPDF(
        train,
        currentBooking.passengers,
        currentBooking.selectedBerth,
        currentBooking.status,
        `BK${Date.now()}`
      );

      await PDFAgent.downloadTicket(pdf, `ticket-${train.number}.pdf`);
      addLog('[PDF Agent] ✓ Ticket PDF downloaded');
    } catch (error) {
      addLog(`[PDF Agent] ✗ Error generating PDF: ${error}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
        >
          <ArrowLeft size={20} />
          Back to Results
        </button>
        <h1 className="text-2xl font-bold">Tatkal Booking</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Booking Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Train Info Card */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <h2 className="text-xl font-bold mb-4">{train.name}</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-gray-600 text-sm">Departure</p>
                <p className="text-2xl font-bold">{train.departureTime}</p>
                <p className="text-gray-700">{train.from}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Duration</p>
                <p className="text-2xl font-bold">{train.duration}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Arrival</p>
                <p className="text-2xl font-bold">{train.arrivalTime}</p>
                <p className="text-gray-700">{train.to}</p>
              </div>
            </div>
          </motion.div>

          {/* Tatkal Countdown */}
          {bookingState === 'waiting' && (
            <TatkalCountdown
              timeLeft={timeLeft}
              onManualStart={executeBooking}
            />
          )}

          {/* Booking Progress */}
          {bookingState === 'booking' && (
            <BookingProgressAnimation
              logs={bookingLogs}
              train={train}
            />
          )}

          {/* Completed State */}
          {bookingState === 'completed' && currentBooking && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-8 text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5 }}
              >
                <CheckCircle2
                  size={64}
                  className="text-green-600 mx-auto mb-4"
                />
              </motion.div>
              <h3 className="text-2xl font-bold text-green-700 mb-2">
                Booking Confirmed!
              </h3>
              <p className="text-green-600 mb-6">
                Your reservation has been successfully booked
              </p>

              {/* Passenger Info */}
              <div className="bg-white rounded-lg p-4 mb-6 text-left">
                <h4 className="font-bold mb-3">Passenger Details:</h4>
                {currentBooking.passengers.map((p: any) => (
                  <div key={p.id} className="flex justify-between text-sm py-1">
                    <span>{p.name}</span>
                    <span className="font-semibold">PNR: {p.reservation}</span>
                  </div>
                ))}
              </div>

              <motion.button
                onClick={generatePDF}
                whileHover={{ scale: 1.05 }}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-all flex items-center justify-center mx-auto"
              >
                <Download size={20} className="mr-2" />
                Download E-Ticket
              </motion.button>
            </motion.div>
          )}

          {/* Waitlist State */}
          {bookingState === 'booking' && currentBooking?.status === 'waitlist' && (
            <WaitlistProgressionSimulator
              initialPosition={train.waitlistNumber}
              trainName={train.name}
            />
          )}

          {/* Failed State */}
          {bookingState === 'failed' && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-red-50 border-2 border-red-300 rounded-2xl p-8 text-center"
            >
              <AlertCircle size={64} className="text-red-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-red-700 mb-2">
                Booking Failed
              </h3>
              <p className="text-red-600 mb-6">
                Unable to complete your booking. Please try again.
              </p>
              <motion.button
                onClick={onBack}
                whileHover={{ scale: 1.05 }}
                className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold"
              >
                Try Different Train
              </motion.button>
            </motion.div>
          )}
        </div>

        {/* Booking Logs Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-900 text-white rounded-xl p-6 h-fit"
        >
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Clock size={20} />
            Live Logs
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto text-sm font-mono">
            {bookingLogs.map((log, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-gray-300 border-l-2 border-blue-500 pl-2"
              >
                {log}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
