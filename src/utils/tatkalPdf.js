import jsPDF from 'jspdf';

export const generateTatkalPDF = (data) => {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text('Tatkal Ticket', 20, 20);

  doc.setFontSize(12);
  doc.text(`Booking ID: ${data.bookingId}`, 20, 40);
  doc.text(`From: ${data.from}`, 20, 50);
  doc.text(`To: ${data.to}`, 20, 60);
  doc.text(`Date: ${data.date}`, 20, 70);
  doc.text(`Class: ${data.class}`, 20, 80);

  let y = 100;
  data.passengers.forEach((p, i) => {
    doc.text(`${i + 1}. ${p.name}, ${p.age}, ${p.gender}`, 20, y);
    y += 10;
  });

  doc.text('Status: CONFIRMED', 20, y + 10);

  doc.save(`tatkal_ticket_${data.bookingId}.pdf`);
};
