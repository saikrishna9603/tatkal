import { NextRequest } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

export const runtime = 'nodejs';

type Passenger = {
  name?: string;
  age?: number | string;
  gender?: string;
};

type TicketData = {
  bookingId: string;
  utr: string;
  bookingType: string;
  trainName: string;
  trainNumber: string;
  fromStation: string;
  toStation: string;
  journeyDate: string;
  seatClass: string;
  seatInfo: string;
  coachInfo: string;
  status: string;
  passengers: Passenger[];
};

const getBackendUrl = () => process.env.BACKEND_URL || 'http://127.0.0.1:8000';

function normalizePassengers(passengers: any): Passenger[] {
  if (!Array.isArray(passengers)) return [];
  return passengers.map((passenger: any, index: number) => ({
    name: passenger?.name || `Passenger ${index + 1}`,
    age: passenger?.age ?? '-',
    gender: passenger?.gender || '-',
  }));
}

async function loadTatkalBooking(bookingId: string, utr: string): Promise<TicketData> {
  const endpoint = `${getBackendUrl()}/api/bookings/tatkal/${encodeURIComponent(bookingId)}/status`;

  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`Booking lookup failed (${response.status})`);
    }

    const data: any = await response.json();
    return {
      bookingId,
      utr,
      bookingType: 'Tatkal',
      trainName: data?.train_name || 'Tatkal Train',
      trainNumber: data?.train_number || '-',
      fromStation: data?.from_station || '-',
      toStation: data?.to_station || '-',
      journeyDate: data?.departure_date || '-',
      seatClass: data?.seat_class || '-',
      seatInfo: data?.seat_info || 'Auto-assigned',
      coachInfo: data?.coach_info || 'To be allocated',
      status: data?.status || 'CONFIRMED',
      passengers: normalizePassengers(data?.passengers),
    };
  } catch {
    return {
      bookingId,
      utr,
      bookingType: 'Tatkal',
      trainName: 'Tatkal Train',
      trainNumber: '-',
      fromStation: '-',
      toStation: '-',
      journeyDate: '-',
      seatClass: '-',
      seatInfo: 'Auto-assigned',
      coachInfo: 'To be allocated',
      status: 'CONFIRMED',
      passengers: [],
    };
  }
}

function renderPdf(doc: any, booking: TicketData) {
  doc.fontSize(20).fillColor('#0f172a').text('Tatkal E-Ticket', { align: 'center' });
  doc.moveDown(0.4);
  doc.fontSize(11).fillColor('#16a34a').text('Payment Successful • Booking Confirmed', { align: 'center' });
  doc.moveDown();

  doc.fontSize(12).fillColor('#111827');
  doc.text(`Booking ID: ${booking.bookingId}`);
  doc.text(`UTR Number: ${booking.utr || 'N/A'}`);
  doc.text(`Booking Type: ${booking.bookingType}`);
  doc.text('Status: CONFIRMED');
  doc.moveDown(0.8);

  doc.text(`Train: ${booking.trainName} (${booking.trainNumber})`);
  doc.text(`From: ${booking.fromStation}`);
  doc.text(`To: ${booking.toStation}`);
  doc.text(`Date of Journey: ${booking.journeyDate}`);
  doc.text(`Class: ${booking.seatClass}`);
  doc.text(`Coach: ${booking.coachInfo}`);
  doc.text(`Seat: ${booking.seatInfo}`);
  doc.moveDown();

  doc.fontSize(13).fillColor('#0f172a').text('Passengers', { underline: true });
  doc.moveDown(0.3);

  if (booking.passengers.length === 0) {
    doc.fontSize(11).fillColor('#374151').text('No passenger records available.');
    return;
  }

  booking.passengers.forEach((passenger, index) => {
    doc
      .fontSize(11)
      .fillColor('#111827')
      .text(`${index + 1}. Name: ${passenger.name}   Age: ${passenger.age}   Gender: ${passenger.gender}`);
  });
}

export async function GET(request: NextRequest) {
  try {
    const bookingId = request.nextUrl.searchParams.get('bookingId')?.trim();
    const utr = request.nextUrl.searchParams.get('utr')?.trim() || '';

    if (!bookingId) {
      return new Response(JSON.stringify({ error: 'bookingId is required' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }

    const booking = await loadTatkalBooking(bookingId, utr);
    const pdfkitModule = await import('pdfkit');
    const PDFDocument = (pdfkitModule as any).default || (pdfkitModule as any);

    const chunks: Buffer[] = [];
    const windir = process.env.WINDIR || 'C:\\Windows';
    const candidateFonts = [
      path.join(windir, 'Fonts', 'arial.ttf'),
      path.join(windir, 'Fonts', 'calibri.ttf'),
    ];
    const defaultFont = candidateFonts.find((fontPath) => fs.existsSync(fontPath));
    const doc = new PDFDocument(
      defaultFont
        ? { margin: 40, size: 'A4', font: defaultFont }
        : { margin: 40, size: 'A4' }
    );

    doc.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));

    const done = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    renderPdf(doc, booking);
    doc.end();

    const pdfBuffer = await done;

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': `attachment; filename=ticket-${bookingId}.pdf`,
        'cache-control': 'no-store',
      },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        error: 'Failed to generate ticket PDF',
        detail: error?.message || 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'content-type': 'application/json' },
      }
    );
  }
}
