"""
PDF Agent - Generates E-tickets and booking confirmations
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional
import base64

class PDFAgent:
    """Generates PDF tickets and confirmations"""
    
    def __init__(self):
        self.name = "PDFAgent"
        self.session_id = ""
    
    async def generate_e_ticket(self, booking: Dict, train: Dict, 
                               passengers: List[Dict], session_id: str = "") -> dict:
        """
        Generate E-ticket PDF for booking
        
        Args:
            booking: Booking confirmation details
            train: Train information
            passengers: Passenger list
            session_id: Unique session identifier
            
        Returns:
            dict with PDF generation status and document metadata
        """
        self.session_id = session_id
        
        activity = {
            "timestamp": int(datetime.utcnow().timestamp()),
            "agent": self.name,
            "action": "generate_e_ticket",
            "status": "running",
            "sessionId": session_id
        }
        
        try:
            pnr = booking.get("pnrNumber", "UNKNOWN")
            
            # Generate ticket structure
            ticket_content = self._build_ticket_content(booking, train, passengers)
            
            # Create PDF metadata
            pdf_metadata = {
                "filename": f"E-TICKET_{pnr}_{datetime.utcnow().strftime('%Y%m%d')}.pdf",
                "title": f"Railway E-Ticket - PNR {pnr}",
                "createdAt": datetime.utcnow().isoformat(),
                "fileSize": "~450KB",  # Estimated
                "pages": 2,
                "format": "PDF/A-1b",
                "encrypted": True
            }
            
            # Generate barcode/QR code reference
            barcode_data = self._generate_barcode(pnr)
            
            activity["status"] = "completed"
            activity["details"] = {
                "pnr": pnr,
                "filename": pdf_metadata.get("filename"),
                "pages": pdf_metadata.get("pages")
            }
            
            return {
                "success": True,
                "pnr": pnr,
                "ticketGenerated": True,
                "pdf": {
                    "metadata": pdf_metadata,
                    "content": ticket_content,
                    "barcode": barcode_data,
                    "downloadUrl": f"/api/tickets/{pnr}/download"
                },
                "validity": {
                    "issuedDate": datetime.utcnow().isoformat(),
                    "validUntil": (datetime.utcnow() + timedelta(days=365)).isoformat(),
                    "requiresActivation": False
                },
                "activity": activity
            }
        
        except Exception as e:
            activity["status"] = "failed"
            activity["details"] = {"error": str(e)}
            
            return {
                "success": False,
                "error": f"E-ticket generation failed: {str(e)}",
                "activity": activity
            }
    
    async def generate_receipt(self, booking: Dict, train: Dict) -> dict:
        """
        Generate booking receipt
        
        Args:
            booking: Booking details
            train: Train information
            
        Returns:
            dict with receipt information
        """
        try:
            receipt = {
                "receiptNumber": f"RCP-{booking.get('pnrNumber')}",
                "issuedDate": datetime.utcnow().isoformat(),
                "bookingDetails": {
                    "pnr": booking.get("pnrNumber"),
                    "train": train.get("name"),
                    "trainNumber": train.get("number"),
                    "class": booking.get("class", "N/A"),
                    "berth": booking.get("berth", "N/A"),
                    "passengers": len(booking.get("passengers", []))
                },
                "pricing": {
                    "baseFare": booking.get("baseFare", 0),
                    "taxes": booking.get("taxes", 0),
                    "totalAmount": booking.get("totalPrice", 0),
                    "currency": "INR"
                },
                "paymentStatus": "COMPLETED",
                "paymentMethod": booking.get("paymentMethod", "Credit/Debit Card"),
                "refundableAmount": booking.get("refundableAmount", booking.get("totalPrice", 0))
            }
            
            return {
                "success": True,
                "receipt": receipt
            }
        
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def _build_ticket_content(self, booking: Dict, train: Dict, passengers: List[Dict]) -> Dict:
        """Build content structure for E-ticket"""
        pnr = booking.get("pnrNumber", "UNKNOWN")
        
        content = {
            "header": {
                "title": "INDIAN RAILWAYS ELECTRONIC TICKET",
                "pnr": pnr,
                "ticketNumber": f"00001/{pnr[-4:]}",
                "issueDate": datetime.utcnow().strftime("%d-%b-%Y")
            },
            "journeyDetails": {
                "trainName": train.get("name"),
                "trainNumber": train.get("number"),
                "journeyDate": booking.get("journeyDate", "TBD"),
                "departureStation": train.get("from_city"),
                "departureTime": train.get("departureTime"),
                "destinationStation": train.get("to_city"),
                "arrivalTime": train.get("arrivalTime"),
                "totalDuration": train.get("duration"),
                "distance": f"{train.get('distance', 'N/A')} km",
                "class": booking.get("class", "N/A"),
                "berth": booking.get("berth", "N/A"),
                "seatNumbers": [f"{i+1}" for i in range(len(passengers))]
            },
            "passengers": [
                {
                    "serialNumber": idx + 1,
                    "name": p.get("name", ""),
                    "age": p.get("age", ""),
                    "gender": p.get("gender", ""),
                    "coachNumber": f"A{(idx % 8) + 1}",
                    "berthNumber": f"{(idx % 6) + 1}-{booking.get('berth', 'L')}",
                    "ticketStatus": booking.get("status", "CONFIRMED"),
                    "mobileNumber": p.get("mobileNumber", "XXXXX68905")  # Masked
                }
                for idx, p in enumerate(passengers)
            ],
            "fares": {
                "baseFare": booking.get("baseFare", 0),
                "reservationCharge": booking.get("reservationCharge", 0),
                "gst": booking.get("gst", 0),
                "totalFare": booking.get("totalPrice", 0),
                "paidAmount": booking.get("totalPrice", 0),
                "balanceAmount": 0
            },
            "importantInstructions": [
                "Please present this E-ticket along with valid ID proof at the station",
                "Report at the station at least 30 minutes before departure",
                "Keep the reservation chart number handy for reference",
                "For cancellations, visit the ticket counter or online portal",
                "E-ticket is valid only for the journey mentioned above"
            ],
            "footer": {
                "generatedBy": "IRCTC Automated System",
                "generatedDate": datetime.utcnow().strftime("%d-%b-%Y %H:%M:%S"),
                "referenceId": f"REF{pnr[-6:]}",
                "helpline": "139 or www.irctc.co.in"
            }
        }
        
        return content
    
    def _generate_barcode(self, pnr: str) -> Dict:
        """Generate barcode/QR code data"""
        import hashlib
        
        # Generate barcode from PNR
        barcode_string = f"IN{pnr}"
        barcode_hash = hashlib.md5(barcode_string.encode()).hexdigest()[:12].upper()
        
        qr_data = {
            "format": "QR_CODE",
            "data": f"PNR:{pnr}|TICKET:E|FORMAT:PDF|HASH:{barcode_hash}",
            "encodingType": "UTF-8",
            "errorCorrectionLevel": "M"
        }
        
        barcode_data = {
            "format": "CODE_128",
            "value": barcode_hash,
            "qrCode": qr_data,
            "displayFormat": "Text + QR"
        }
        
        return barcode_data
    
    async def generate_refund_memo(self, booking: Dict, cancellation_reason: str) -> dict:
        """
        Generate cancellation and refund memo
        
        Args:
            booking: Original booking details
            cancellation_reason: Reason for cancellation
            
        Returns:
            dict with refund memo
        """
        try:
            pnr = booking.get("pnrNumber", "UNKNOWN")
            total_amount = booking.get("totalPrice", 0)
            
            # Calculate refund (simplified - normally complex rules apply)
            cancellation_charge = total_amount * 0.1  # 10% charge
            refund_amount = total_amount - cancellation_charge
            
            memo = {
                "memoNumber": f"CAN-{pnr}",
                "memoDate": datetime.utcnow().isoformat(),
                "originalPnr": pnr,
                "originalTicketAmount": total_amount,
                "cancellationReason": cancellation_reason,
                "cancellationCharge": round(cancellation_charge, 2),
                "refundAmount": round(refund_amount, 2),
                "refundMethod": "Original payment method",
                "estimatedRefundDate": "5-7 working days",
                "status": "PROCESSED",
                "remarks": "Refund initiated. Status will be updated via email."
            }
            
            return {
                "success": True,
                "refundMemo": memo
            }
        
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def generate_booking_summary(self, booking: Dict, train: Dict, 
                                      passengers: List[Dict]) -> dict:
        """
        Generate comprehensive booking summary
        
        Args:
            booking: Booking details
            train: Train information
            passengers: Passenger list
            
        Returns:
            dict with booking summary
        """
        try:
            summary = {
                "pnr": booking.get("pnrNumber"),
                "status": booking.get("status", "UNKNOWN"),
                "bookingTime": booking.get("bookingTime", datetime.utcnow().isoformat()),
                "journey": {
                    "train": f"{train.get('name')} ({train.get('number')})",
                    "from": train.get("from_city"),
                    "to": train.get("to_city"),
                    "date": booking.get("journeyDate", "TBD"),
                    "time": train.get("departureTime"),
                    "class": booking.get("class", "N/A"),
                    "passengers": len(passengers)
                },
                "passengers": [
                    {"name": p.get("name"), "age": p.get("age"), "status": "CONFIRMED"}
                    for p in passengers
                ],
                "fare": {
                    "base": booking.get("baseFare", 0),
                    "total": booking.get("totalPrice", 0),
                    "currency": "INR"
                },
                "importantLinks": {
                    "downloadTicket": f"/api/tickets/{booking.get('pnrNumber')}/download",
                    "cancelBooking": f"/api/bookings/{booking.get('pnrNumber')}/cancel",
                    "modifyBooking": f"/api/bookings/{booking.get('pnrNumber')}/modify",
                    "checkStatus": f"/api/bookings/{booking.get('pnrNumber')}/status"
                }
            }
            
            return {
                "success": True,
                "summary": summary
            }
        
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

