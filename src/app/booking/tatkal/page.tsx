'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Select from 'react-select';
import API from '@/lib/api';

type TatkalStatus = 'SCHEDULED' | 'PROCESSING' | 'CONFIRMED';

const stations = [
  { label: 'Mumbai (CSMT)', value: 'CSMT' },
  { label: 'Pune (PUNE)', value: 'PUNE' },
  { label: 'Hyderabad (HYD)', value: 'HYD' },
  { label: 'Bangalore (SBC)', value: 'SBC' },
  { label: 'Chennai (MAS)', value: 'MAS' },
];

type PassengerInput = {
  name: string;
  age: string;
  gender: 'Male' | 'Female' | 'Other';
};

export default function TatkalBookingPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [tatkalBookingId, setTatkalBookingId] = useState('');
  const [executionTime, setExecutionTime] = useState('');
  const [status, setStatus] = useState<TatkalStatus | ''>('');
  const [countdownSeconds, setCountdownSeconds] = useState(0);
  const redirectStartedBookingRef = useRef('');

  const [formData, setFormData] = useState({
    from: '',
    to: '',
    date: '',
    trainPreference: '',
    seatClass: 'AC2',
    passengers: 1,
    bookingTime: '',
  });

  const [latestTicketSnapshot, setLatestTicketSnapshot] = useState<any>(null);

  const [passengers, setPassengers] = useState<PassengerInput[]>([
    { name: '', age: '', gender: 'Male' },
  ]);

  const addPassenger = () => {
    if (passengers.length >= 6) return;
    setPassengers([...passengers, { name: '', age: '', gender: 'Male' }]);
    setFormData((prev) => ({ ...prev, passengers: Math.min(prev.passengers + 1, 6) }));
  };

  const updatePassenger = (index: number, field: keyof PassengerInput, value: string) => {
    setPassengers((prev) =>
      prev.map((passenger, i) => (i === index ? { ...passenger, [field]: value } : passenger))
    );
  };

  const adjustPassengerRows = (count: number) => {
    setPassengers((prev) => {
      if (prev.length === count) return prev;
      if (prev.length > count) return prev.slice(0, count);

      const next = [...prev];
      while (next.length < count) {
        next.push({ name: '', age: '', gender: 'Male' });
      }
      return next;
    });
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(userData));
  }, [router]);

  useEffect(() => {
    if (!tatkalBookingId) return;

    const interval = setInterval(async () => {
      try {
        const data = await API.getTatkalStatus(tatkalBookingId) as any;
        setStatus(data.status);
        setCountdownSeconds(data.countdown_seconds || 0);

        if (data.execution_time) {
          setExecutionTime(data.execution_time);
        }

        if (data.status === 'CONFIRMED') {
          setMessage('✅ Tatkal booking confirmed successfully.');
          setLatestTicketSnapshot({
            bookingId: tatkalBookingId,
            bookingType: 'TATKAL',
            pnr: data?.pnr || '',
            trainId: data?.train_id || '',
            trainName: data?.train_name || '',
            trainNumber: data?.train_number || '',
            fromStation: data?.from_station || formData.from,
            toStation: data?.to_station || formData.to,
            departureDate: data?.departure_date || formData.date,
            seatClass: data?.seat_class || formData.seatClass,
            seatInfo: data?.seat_info || 'Auto-assigned',
            coachInfo: data?.coach_info || 'To be allocated',
            passengers,
            status: 'CONFIRMED',
          });
          clearInterval(interval);
        }
      } catch {
        // Keep UI stable even if one poll fails.
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [tatkalBookingId]);

  useEffect(() => {
    if (status !== 'CONFIRMED' || !tatkalBookingId) return;
    if (redirectStartedBookingRef.current === tatkalBookingId) return;

    redirectStartedBookingRef.current = tatkalBookingId;

    if (latestTicketSnapshot) {
      sessionStorage.setItem(`tatkal_ticket_${tatkalBookingId}`, JSON.stringify(latestTicketSnapshot));
    }

    const timer = setTimeout(() => {
      router.push(`/tatkal-payment?bookingId=${tatkalBookingId}`);
    }, 1500);

    return () => clearTimeout(timer);
  }, [status, tatkalBookingId, latestTicketSnapshot, router]);

  const formattedCountdown = useMemo(() => {
    const hrs = Math.floor(countdownSeconds / 3600);
    const mins = Math.floor((countdownSeconds % 3600) / 60);
    const secs = countdownSeconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [countdownSeconds]);

  const validate = () => {
    if (!formData.from || !formData.to || !formData.date || !formData.seatClass || !formData.bookingTime) {
      return 'Please fill all required fields.';
    }
    if (formData.from.toLowerCase() === formData.to.toLowerCase()) {
      return 'From and To stations must be different.';
    }
    if (!Number.isFinite(formData.passengers) || formData.passengers < 1 || formData.passengers > 6) {
      return 'Passengers must be between 1 and 6.';
    }

    if (passengers.length !== formData.passengers) {
      return 'Passenger details count must match number of passengers.';
    }

    for (let i = 0; i < passengers.length; i++) {
      const passenger = passengers[i];
      const age = Number(passenger.age);
      if (!passenger.name.trim()) {
        return `Passenger ${i + 1} name is required.`;
      }
      if (!Number.isFinite(age) || age <= 0) {
        return `Passenger ${i + 1} age must be valid.`;
      }
    }

    return '';
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    const validationError = validate();
    if (validationError) {
      setMessage(`❌ ${validationError}`);
      return;
    }

    setLoading(true);
    try {
      const userId = user?.user_id || 'demo_user';

      const passengerTemplate = {
        name: user?.full_name || 'Tatkal Passenger',
        age: 30,
        gender: 'M',
        document_type: 'Aadhaar',
        document_number: '123412341234',
        phone: user?.phone || '9876543210',
        email: user?.email || 'user@example.com',
      };

      const normalizedPassengers = passengers.map((passenger, index) => ({
        ...passengerTemplate,
        name: passenger.name || passengerTemplate.name,
        age: Number(passenger.age) || passengerTemplate.age,
        gender:
          passenger.gender === 'Female'
            ? 'F'
            : passenger.gender === 'Other'
              ? 'O'
              : 'M',
        document_number: `12341234${String(1000 + index).padStart(4, '0')}`,
      }));

      const payload = {
        user_id: userId,
        train_id: formData.trainPreference || 'train_0001',
        train_number: '',
        from_station: formData.from,
        to_station: formData.to,
        departure_date: formData.date,
        departure_time: '08:00',
        passengers: normalizedPassengers,
        seat_class: formData.seatClass,
        payment: {
          payment_method: 'UPI',
          amount: 1000,
          currency: 'INR',
          upi_id: 'tatkal@upi',
        },
        mobile_number: user?.phone || '9876543210',
        email: user?.email || 'user@example.com',
        scheduled_time: formData.bookingTime,
        retry_count: 3,
        retry_interval: 2,
      };

      const response = await API.scheduleTatkal(payload) as any;

      const newTatkalBookingId = response.tatkal_booking_id || response.booking_id;
      if (!newTatkalBookingId) {
        throw new Error('Tatkal booking ID not received from backend.');
      }

      const executionAt = response.execution_time || '';
      const scheduleNote = response.adjusted_to_immediate
        ? ' (same-minute auto-adjusted to immediate execution)'
        : response.scheduled_for_next_day
          ? ' (selected time had already passed today, so scheduled for next day)'
          : '';

      setTatkalBookingId(newTatkalBookingId);
      setStatus(response.status || 'SCHEDULED');
      setExecutionTime(executionAt);
      setLatestTicketSnapshot({
        bookingId: newTatkalBookingId,
        bookingType: 'TATKAL',
        pnr: response?.pnr || '',
        trainId: response?.train_id || formData.trainPreference,
        trainName: response?.train_name || '',
        trainNumber: response?.train_number || '',
        fromStation: response?.from_station || formData.from,
        toStation: response?.to_station || formData.to,
        departureDate: response?.departure_date || formData.date,
        seatClass: response?.seat_class || formData.seatClass,
        seatInfo: 'Auto-assigned',
        coachInfo: 'To be allocated',
        passengers,
        totalAmount: (Number(formData.passengers) || 1) * 1000,
        status: response?.status || 'SCHEDULED',
      });
      setMessage(
        `✅ Tatkal booking scheduled for ${executionAt ? new Date(executionAt).toLocaleString() : formData.bookingTime}${scheduleNote}.`
      );
    } catch (error: any) {
      setMessage(`❌ Failed to schedule Tatkal booking: ${error?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-3xl font-bold">⚡ Tatkal Auto Booking</h1>
          <Link
            href="/"
            className="bg-white text-orange-600 hover:bg-orange-50 px-4 py-2 rounded-lg font-semibold transition"
          >
            ← Back
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Schedule Tatkal Booking</h2>

          <form onSubmit={handleSchedule} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">From</label>
                <Select
                  options={stations}
                  value={stations.find((station) => station.value === formData.from) || null}
                  onChange={(selectedOption) => setFormData({ ...formData, from: selectedOption?.value || '' })}
                  placeholder="Departure station"
                  classNamePrefix="tatkal-select"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">To</label>
                <Select
                  options={stations}
                  value={stations.find((station) => station.value === formData.to) || null}
                  onChange={(selectedOption) => setFormData({ ...formData, to: selectedOption?.value || '' })}
                  placeholder="Destination station"
                  classNamePrefix="tatkal-select"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">Train Preference (Optional)</label>
                <input
                  type="text"
                  value={formData.trainPreference}
                  onChange={(e) => setFormData({ ...formData, trainPreference: e.target.value })}
                  placeholder="Train ID (e.g., train_0001)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">Class</label>
                <select
                  value={formData.seatClass}
                  onChange={(e) => setFormData({ ...formData, seatClass: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="AC1">AC1</option>
                  <option value="AC2">AC2</option>
                  <option value="AC3">AC3</option>
                  <option value="Sleeper">Sleeper</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">Number of Passengers</label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={formData.passengers}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    const passengerCount = Number.isFinite(n) && n > 0 ? Math.min(n, 6) : 1;
                    setFormData({ ...formData, passengers: passengerCount });
                    adjustPassengerRows(passengerCount);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">Booking Time</label>
                <input
                  type="time"
                  value={formData.bookingTime}
                  onChange={(e) => setFormData({ ...formData, bookingTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-gray-600">Passenger Details</label>
                <button
                  type="button"
                  onClick={addPassenger}
                  disabled={passengers.length >= 6}
                  className="px-3 py-1.5 rounded-lg border border-orange-300 text-orange-700 hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
                >
                  + Add Passenger
                </button>
              </div>

              {passengers.map((passenger, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Name</label>
                    <input
                      type="text"
                      value={passenger.name}
                      onChange={(e) => updatePassenger(index, 'name', e.target.value)}
                      placeholder={`Passenger ${index + 1} name`}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Age</label>
                    <input
                      type="number"
                      min="1"
                      value={passenger.age}
                      onChange={(e) => updatePassenger(index, 'age', e.target.value)}
                      placeholder="Age"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Gender</label>
                    <select
                      value={passenger.gender}
                      onChange={(e) => updatePassenger(index, 'gender', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>

            {message && (
              <div className={`p-4 rounded-lg ${message.startsWith('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-bold transition text-lg"
            >
              {loading ? 'Scheduling...' : 'Schedule Tatkal Booking'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 h-fit">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Tatkal Status</h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between border rounded-lg p-3">
              <span>Scheduled</span>
              <span className={status === 'SCHEDULED' ? 'font-bold text-amber-600' : 'text-gray-500'}>
                {status === 'SCHEDULED' ? 'Active' : 'Pending'}
              </span>
            </div>
            <div className="flex justify-between border rounded-lg p-3">
              <span>Processing</span>
              <span className={status === 'PROCESSING' ? 'font-bold text-blue-600' : 'text-gray-500'}>
                {status === 'PROCESSING' ? 'Active' : 'Pending'}
              </span>
            </div>
            <div className="flex justify-between border rounded-lg p-3">
              <span>Confirmed</span>
              <span className={status === 'CONFIRMED' ? 'font-bold text-green-600' : 'text-gray-500'}>
                {status === 'CONFIRMED' ? 'Done' : 'Pending'}
              </span>
            </div>
            <div className="flex justify-between border rounded-lg p-3">
              <span>Payment</span>
              <span className={status === 'CONFIRMED' ? 'font-bold text-green-600' : 'text-gray-500'}>
                {status === 'CONFIRMED' ? 'Success ✅' : 'Pending'}
              </span>
            </div>
          </div>

          {tatkalBookingId && (
            <div className="mt-5 space-y-2 text-sm">
              <p><span className="font-semibold">Booking ID:</span> {tatkalBookingId}</p>
              {executionTime && <p><span className="font-semibold">Execution Time:</span> {new Date(executionTime).toLocaleString()}</p>}
              {status === 'SCHEDULED' && (
                <p className="text-orange-700 font-semibold">⏰ Countdown: {formattedCountdown}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
