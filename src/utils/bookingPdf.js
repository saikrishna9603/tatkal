import jsPDF from 'jspdf';

function safe(value, fallback = 'N/A') {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
}

export function generateBookingPDF(data) {
  const doc = new jsPDF();

  const bookingId = safe(data.booking_id || data.bookingId);
  const pnr = safe(data.pnr);
  const trainName = safe(data.train_name || data.trainName);
  const trainNumber = safe(data.train_number || data.trainNumber);
  const from = safe(data.from_station || data.from);
  const to = safe(data.to_station || data.to);
  const date = safe(data.departure_date || data.date);
  const departureTime = safe(data.departure_time || data.departureTime, '--:--');
  const arrivalTime = safe(data.arrival_time || data.arrivalTime, '--:--');
  const seatClass = safe(data.seat_class || data.class);
  const amount = Number(data.total_amount || data.total_fare || 0);
  const bookingTime = safe(data.created_at || new Date().toISOString());

  doc.setFontSize(18);
  doc.text('Indian Railways E-Ticket', 20, 18);

  doc.setFontSize(11);
  doc.text(`PNR: ${pnr}`, 20, 30);
  doc.text(`Booking ID: ${bookingId}`, 120, 30);

  doc.setFontSize(12);
  doc.text(`${trainName} (${trainNumber})`, 20, 42);
  doc.text(`${from} -> ${to}`, 20, 50);
  doc.text(`Date: ${date}`, 20, 58);
  doc.text(`Departure: ${departureTime}`, 75, 58);
  doc.text(`Arrival: ${arrivalTime}`, 130, 58);

  doc.text(`Class: ${seatClass}`, 20, 68);
  doc.text(`Status: CONFIRMED`, 75, 68);
  doc.text(`Fare Paid: Rs ${amount.toLocaleString('en-IN')}`, 130, 68);

  const passengers = Array.isArray(data.passengers) ? data.passengers : [];
  let y = 82;
  doc.setFontSize(12);
  doc.text('Passenger Details', 20, y);
  y += 8;

  doc.setFontSize(10);
  passengers.forEach((p, idx) => {
    const name = safe(p?.name, `Passenger ${idx + 1}`);
    const age = safe(p?.age, '-');
    const gender = safe(p?.gender, '-');
    const seat = safe(p?.seat, `S${idx + 1}`);
    doc.text(`${idx + 1}. ${name} | Age: ${age} | Gender: ${gender} | Seat: ${seat}`, 20, y);
    y += 7;
  });

  y += 4;
  doc.text(`Generated At: ${bookingTime}`, 20, y);
  y += 7;
  doc.text('Please carry a valid ID proof during journey.', 20, y);

  doc.save(`ticket_${pnr}.pdf`);
}

export default generateBookingPDF;