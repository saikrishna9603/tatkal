import { Train, PDFTicket } from '../types';

/**
 * PDF Agent
 * Generates visually appealing train booking tickets as PDF
 */
export class PDFAgent {
  static async generateTicketPDF(
    train: Train,
    passengers: any[],
    berth: string,
    status: string,
    bookingId: string
  ): Promise<Blob> {
    // This is a placeholder for PDF generation
    // In production, you would use jsPDF or similar library

    const ticketHTML = this.generateTicketHTML(
      train,
      passengers,
      berth,
      status,
      bookingId
    );

    // Convert HTML to PDF (would use jsPDF in practice)
    return new Blob([ticketHTML], { type: 'text/html' });
  }

  private static generateTicketHTML(
    train: Train,
    passengers: any[],
    berth: string,
    status: string,
    bookingId: string
  ): string {
    const bookingDate = new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const passengerRows = passengers
      .map(
        (p) =>
          `<tr>
        <td>${p.reservation}</td>
        <td>${p.name}</td>
        <td>${p.gender}</td>
        <td>${p.age}</td>
        <td>${berth}</td>
        <td>${status}</td>
      </tr>`
      )
      .join('');

    return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .ticket { border: 2px solid #1e40af; padding: 20px; border-radius: 8px; }
    .header { text-align: center; margin-bottom: 20px; }
    .header h1 { color: #1e40af; margin: 0; }
    .section { margin: 15px 0; }
    .section-title { color: #1e40af; font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f3f4f6; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
    .info-item { padding: 10px; background: #f9fafb; border-radius: 4px; }
    .label { color: #6b7280; font-size: 12px; }
    .value { font-weight: bold; color: #1e40af; }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="header">
      <h1>E-TICKET</h1>
      <p>Indian Railways - Computerized Reservation</p>
    </div>

    <div class="section">
      <div class="section-title">BOOKING INFORMATION</div>
      <div class="info-grid">
        <div class="info-item">
          <div class="label">Booking ID</div>
          <div class="value">${bookingId}</div>
        </div>
        <div class="info-item">
          <div class="label">Booking Date</div>
          <div class="value">${bookingDate}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">TRAIN DETAILS</div>
      <div class="info-grid">
        <div class="info-item">
          <div class="label">Train Name</div>
          <div class="value">${train.name}</div>
        </div>
        <div class="info-item">
          <div class="label">Train Number</div>
          <div class="value">${train.number}</div>
        </div>
        <div class="info-item">
          <div class="label">From</div>
          <div class="value">${train.from}</div>
        </div>
        <div class="info-item">
          <div class="label">To</div>
          <div class="value">${train.to}</div>
        </div>
        <div class="info-item">
          <div class="label">Departure</div>
          <div class="value">${train.departureTime}</div>
        </div>
        <div class="info-item">
          <div class="label">Arrival</div>
          <div class="value">${train.arrivalTime}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">PASSENGER DETAILS</div>
      <table>
        <thead>
          <tr>
            <th>PNR</th>
            <th>Name</th>
            <th>Gender</th>
            <th>Age</th>
            <th>Berth</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${passengerRows}
        </tbody>
      </table>
    </div>

    <div class="section">
      <p style="font-size: 12px; color: #6b7280;">
        This is a computer-generated ticket. No signature required.
      </p>
    </div>
  </div>
</body>
</html>`;
  }

  static async downloadTicket(ticketBlob: Blob, filename: string): Promise<void> {
    const url = URL.createObjectURL(ticketBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
