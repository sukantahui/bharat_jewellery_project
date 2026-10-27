/**
 * Indian Income Tax Rule 114B PAN Validation Utility
 *
 * Law: PAN is mandatory for any purchase of jewellery if cash payment exceeds ₹2,00,000.
 * PAN format: 5 letters, 4 digits, 1 letter (e.g., ABCDE1234F).
 */

export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

export const isValidPan = (pan: string | null | undefined): boolean => {
  if (!pan) return false;
  return PAN_REGEX.test(pan.trim().toUpperCase());
};

export const isPanRequired = (paymentMode: string, cashAmount: number): boolean => {
  if (paymentMode.toLowerCase() === 'cash' && cashAmount >= 200000) {
    return true;
  }
  return false;
};
