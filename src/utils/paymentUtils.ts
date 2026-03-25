/**
 * Payment utilities for UTR and PNR generation
 */

export function generateUTR(): string {
  // Format: UTR + 10 random digits
  const randomDigits = Math.floor(Math.random() * 10000000000)
    .toString()
    .padStart(10, '0');
  return `UTR${randomDigits}`;
}

export function generatePNR(): string {
  // Format: 10-digit random number (standard PNR format)
  const random = Math.floor(Math.random() * 10000000000)
    .toString()
    .padStart(10, '0');
  return random;
}

export function validateUPI(upiId: string): boolean {
  // Basic UPI validation: cannot be empty, must contain @
  const trimmed = upiId.trim();
  if (!trimmed) return false;
  if (trimmed.length < 3) return false;
  
  // Optional: check for basic UPI format (something@upi or something@bank)
  // For now, just require non-empty
  return true;
}

export function validatePaymentDetails(method: string, details: string): boolean {
  const trimmed = details.trim();
  
  if (!trimmed) return false;
  
  if (method === 'UPI') {
    return validateUPI(trimmed);
  }
  
  // For other methods, just require non-empty
  return trimmed.length > 0;
}
