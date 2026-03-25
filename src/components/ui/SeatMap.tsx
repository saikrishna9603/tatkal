// Seat Map Component - Interactive seat selection for train bookings
'use client';

import React, { useState } from 'react';

interface Seat {
  number: string;
  status: 'available' | 'booked' | 'rac' | 'selected';
  price?: number;
}

interface SeatMapProps {
  trainID: string;
  seatClass: string;
  onSeatsSelect?: (seats: string[]) => void;
  maxPassengers?: number;
}

export default function SeatMap({ trainID, seatClass = 'AC2', onSeatsSelect, maxPassengers = 4 }: SeatMapProps) {
  const [seats, setSeats] = useState<Seat[]>(generateSeats(72));
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

  function generateSeats(total: number): Seat[] {
    const seatList: Seat[] = [];
    const bookedIndices = new Set([5, 8, 15, 22, 25, 30, 45, 55, 62, 68]);
    const racIndices = new Set([12, 35, 48, 60]);

    for (let i = 0; i < total; i++) {
      const row = Math.floor(i / 6);
      const col = i % 6;
      const seatNumber = `${String.fromCharCode(65 + row)}${col + 1}`;

      let status: 'available' | 'booked' | 'rac' = 'available';
      if (bookedIndices.has(i)) status = 'booked';
      else if (racIndices.has(i)) status = 'rac';

      seatList.push({
        number: seatNumber,
        status,
        price: 2500,
      });
    }

    return seatList;
  }

  const toggleSeat = (seatNumber: string) => {
    if (selectedSeats.includes(seatNumber)) {
      const updated = selectedSeats.filter((s) => s !== seatNumber);
      setSelectedSeats(updated);
      onSeatsSelect?.(updated);
    } else if (selectedSeats.length < maxPassengers) {
      const updated = [...selectedSeats, seatNumber];
      setSelectedSeats(updated);
      onSeatsSelect?.(updated);
    }
  };

  const rows = Math.ceil(seats.length / 6);
  const totalPrice = selectedSeats.length * (seats[0]?.price || 2500);

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-2xl font-bold text-gray-800 mb-6">Select Your Seats</h3>

      {/* Legend */}
      <div className="grid grid-cols-4 gap-4 mb-8 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-500 rounded border-2 border-green-600"></div>
          <span className="text-sm text-gray-700">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-500 rounded border-2 border-red-600"></div>
          <span className="text-sm text-gray-700">Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-yellow-500 rounded border-2 border-yellow-600"></div>
          <span className="text-sm text-gray-700">RAC</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded border-2 border-blue-600"></div>
          <span className="text-sm text-gray-700">Selected</span>
        </div>
      </div>

      {/* Seat Map */}
      <div className="overflow-x-auto mb-8 flex justify-center">
        <div className="inline-block">
          {/* Column Labels */}
          <div className="mb-2 flex gap-2">
            <div className="w-10"></div>
            {[1, 2, 3, 4, 5, 6].map((col) => (
              <div key={col} className="w-10 h-10 flex items-center justify-center text-xs font-bold text-gray-600">
                {col}
              </div>
            ))}
          </div>

          {/* Seats Grid */}
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <div key={rowIdx} className="flex gap-2 mb-2">
              {/* Row Label */}
              <div className="w-10 h-10 flex items-center justify-center text-xs font-bold text-gray-600">
                {String.fromCharCode(65 + rowIdx)}
              </div>

              {/* Seats in Row */}
              {seats.slice(rowIdx * 6, (rowIdx + 1) * 6).map((seat) => {
                const isSelected = selectedSeats.includes(seat.number);
                const isAvailable = seat.status === 'available';
                const isRAC = seat.status === 'rac';
                const isBooked = seat.status === 'booked';

                let bgColor = 'bg-gray-300 cursor-not-allowed';
                if (isBooked) bgColor = 'bg-red-500 cursor-not-allowed';
                else if (isRAC) bgColor = 'bg-yellow-500 cursor-pointer hover:bg-yellow-600';
                else if (isSelected) bgColor = 'bg-blue-500 cursor-pointer hover:bg-blue-600';
                else if (isAvailable) bgColor = 'bg-green-500 cursor-pointer hover:bg-green-600';

                return (
                  <button
                    key={seat.number}
                    onClick={() => (isAvailable || isRAC || isSelected) && toggleSeat(seat.number)}
                    disabled={!isAvailable && !isRAC && !isSelected}
                    className={`w-10 h-10 rounded border-2 border-gray-400 ${bgColor} text-white text-xs font-bold transition`}
                    title={`${seat.number} - ${seat.status}`}
                  >
                    {seat.number.substring(1)}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Selection Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h4 className="font-semibold text-gray-800 mb-2">Selection Summary</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Selected Seats</p>
            <p className="text-lg font-bold text-blue-600">
              {selectedSeats.length}/{maxPassengers}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {selectedSeats.join(', ') || 'No seats selected'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Price</p>
            <p className="text-lg font-bold text-green-600">₹{totalPrice.toLocaleString()}</p>
            <p className="text-xs text-gray-600 mt-1">
              ₹{(seats[0]?.price || 2500).toLocaleString()} per seat
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          className={`flex-1 py-2 rounded-lg font-semibold transition ${
            selectedSeats.length > 0
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          disabled={selectedSeats.length === 0}
        >
          Confirm Selection ({selectedSeats.length} seats)
        </button>
        <button
          onClick={() => {
            setSelectedSeats([]);
            onSeatsSelect?.([]);
          }}
          className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-semibold"
        >
          Clear
        </button>
      </div>

      {/* Info Section */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
        <p>
          <strong>Seat Class:</strong> {seatClass}
        </p>
        <p className="mt-2">
          <strong>Note:</strong> RAC seats will be converted to confirmed after chart preparation. Waitlist seats depend
          on cancellations.
        </p>
      </div>
    </div>
  );
}
