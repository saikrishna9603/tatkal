import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PassengerDetails {
  name: string;
  age: number | string;
  gender?: string;
  seat?: string;
}

interface PDFTicketData {
  pnr: string;
  utr: string;
  bookingDate: string;
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
  bookingType: 'normal' | 'tatkal';
}

export function generateProfessionalPDF(data: PDFTicketData): void {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 15;

  // Set colors
  const primaryColor: [number, number, number] = [15, 23, 42]; // Dark blue
  const successColor: [number, number, number] = [34, 197, 94]; // Green
  const accentColor: [number, number, number] = [59, 130, 246]; // Light blue
  const textColor: [number, number, number] = [30, 41, 59]; // Dark gray

  // Header Section
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 35, 'F');

  // Title
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text('INDIAN RAILWAYS', 15, 15);
  doc.text('E-TICKET', 15, 24);

  // Header info on right
  doc.setFontSize(10);
  doc.setFont('Helvetica', 'normal');
  doc.text(`PNR: ${data.pnr}`, pageWidth - 15, 15, { align: 'right' });
  doc.text(`UTR: ${data.utr}`, pageWidth - 15, 21, { align: 'right' });
  doc.text(`Booking Date: ${formatDate(data.bookingDate)}`, pageWidth - 15, 27, { align: 'right' });

  yPosition = 42;

  // Journey Details Section (Boxed)
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.5);
  doc.rect(10, yPosition, pageWidth - 20, 40);

  doc.setFontSize(12);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text('JOURNEY DETAILS', 12, yPosition + 5);

  doc.setFontSize(10);
  doc.setFont('Helvetica', 'normal');
  yPosition += 10;

  // Train info
  doc.text(`Train: ${data.trainName} (${data.trainNumber})`, 12, yPosition);
  yPosition += 5;

  // From - To
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(data.fromStation, 12, yPosition);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('(From)', 45, yPosition);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('→', 60, yPosition);
  doc.text(data.toStation, 70, yPosition);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('(To)', 100, yPosition);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Date of Journey: ${formatDate(data.journeyDate)}`, 120, yPosition);

  yPosition += 8;

  // Timing and class
  doc.text(`Departure: ${data.departureTime}`, 12, yPosition);
  doc.text(`Arrival: ${data.arrivalTime}`, 70, yPosition);
  doc.text(`Class: ${data.seatClass}`, 130, yPosition);

  yPosition += 8;

  // Status
  doc.setFillColor(successColor[0], successColor[1], successColor[2]);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(`Status: CONFIRMED`, 12, yPosition);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);

  yPosition += 15;

  // Passenger Details Section
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('PASSENGER DETAILS', 12, yPosition);

  yPosition += 6;

  // Passenger table using autotable
  const passengerRows = data.passengers.map((p, idx) => [
    `${idx + 1}`,
    p.name || `Passenger ${idx + 1}`,
    `${p.age || '-'}`,
    p.gender || '-',
    p.seat || 'To be assigned',
    'CONFIRMED',
  ]);

  autoTable(doc, {
    head: [['Sr.', 'Name', 'Age', 'Gender', 'Seat', 'Status']],
    body: passengerRows,
    startY: yPosition,
    margin: { left: 10, right: 10 },
    theme: 'grid',
    headStyles: {
      fillColor: accentColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: textColor,
    },
    alternateRowStyles: {
      fillColor: [241, 245, 249],
    },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 8;

  // Payment Section
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('PAYMENT BREAKDOWN', 12, yPosition);

  yPosition += 6;

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);

  // Payment table
  const paymentRows = [
    ['Base Fare', '', `₹${data.basefare.toLocaleString('en-IN')}`],
    ...(data.tatkalCharge ? [['Tatkal Charge', '', `₹${data.tatkalCharge.toLocaleString('en-IN')}`]] : []),
    ['GST', data.gst > 0 ? '5%' : '0%', `₹${data.gst.toLocaleString('en-IN')}`],
    ['Booking Fee', '', `₹${data.bookingFee.toLocaleString('en-IN')}`],
  ];

  autoTable(doc, {
    head: [['Description', 'Rate', 'Amount']],
    body: paymentRows,
    startY: yPosition,
    margin: { left: 10, right: 10 },
    theme: 'grid',
    headStyles: {
      fillColor: accentColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: textColor,
    },
    alternateRowStyles: {
      fillColor: [241, 245, 249],
    },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 6;

  // Total Amount (Highlighted)
  doc.setFillColor(successColor[0], successColor[1], successColor[2]);
  doc.rect(10, yPosition, pageWidth - 20, 12, 'F');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL AMOUNT PAID:', 12, yPosition + 7);
  doc.text(`₹${data.totalAmount.toLocaleString('en-IN')}`, pageWidth - 12, yPosition + 7, { align: 'right' });

  yPosition += 18;

  // Footer Section
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 120, 150);

  doc.text('This is a computer-generated e-ticket and is valid without signature.', 12, yPosition);
  yPosition += 5;
  doc.text('Please carry a valid ID proof during journey as per railway norms.', 12, yPosition);
  yPosition += 5;
  doc.text('For cancellations and changes, visit www.irctc.co.in within the stipulated time.', 12, yPosition);

  yPosition += 8;

  // Booking type note
  const bookingTypeText = data.bookingType === 'tatkal' 
    ? 'This is a TATKAL booking. Tatkal tickets are not refundable and are valid only for the booked date.'
    : 'This is a NORMAL booking. Please refer to our cancellation policy for refund details.';

  doc.text(bookingTypeText, 12, yPosition, { maxWidth: pageWidth - 24 });

  yPosition += 10;

  // Separator
  doc.setDrawColor(200, 200, 200);
  doc.line(12, yPosition, pageWidth - 12, yPosition);

  yPosition += 4;

  // Final note
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text(
    'Ticket displayed is an authentic e-ticket issued by Indian Railways. Any queries? Contact IRCTC Customer Care: 9212112121',
    pageWidth / 2,
    yPosition,
    { align: 'center', maxWidth: pageWidth - 20 }
  );

  // Save PDF
  const filename = `Railway_Ticket_${data.pnr}.pdf`;
  doc.save(filename);
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}
