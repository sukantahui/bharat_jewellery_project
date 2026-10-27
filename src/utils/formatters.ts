/**
 * Bharat Jewellery ERP & POS — Formatting Utilities
 */

export const formatCurrency = (amount: number | string | null | undefined): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
  if (isNaN(num)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

export const formatWeight = (grams: number | string | null | undefined, unit = 'g'): string => {
  const num = typeof grams === 'string' ? parseFloat(grams) : (grams ?? 0);
  if (isNaN(num)) return `0.000 ${unit}`;
  return `${num.toFixed(3)} ${unit}`;
};

export const formatDate = (dateStr: string | Date | null | undefined): string => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return String(dateStr);
  }
};

export const formatDateTime = (dateStr: string | Date | null | undefined): string => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return String(dateStr);
  }
};

/**
 * Convert numeric amount into Indian Currency Words for GST invoices
 * e.g., 1185400 -> "Eleven Lakh Eighty Five Thousand Four Hundred Rupees Only"
 */
export const numberToWords = (num: number): string => {
  if (num === 0) return 'Zero Rupees Only';
  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ',
    'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ',
    'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n: number): string => {
    let str = '';
    if (n > 19) {
      str += b[Math.floor(n / 10)] + ' ' + a[n % 10];
    } else {
      str += a[n];
    }
    return str.trim();
  };

  const whole = Math.floor(Math.abs(num));
  const paise = Math.round((Math.abs(num) - whole) * 100);

  let output = '';
  const crore = Math.floor(whole / 10000000);
  const lakh = Math.floor((whole % 10000000) / 100000);
  const thousand = Math.floor((whole % 100000) / 1000);
  const hundred = Math.floor((whole % 1000) / 100);
  const rest = whole % 100;

  if (crore > 0) output += inWords(crore) + ' Crore ';
  if (lakh > 0) output += inWords(lakh) + ' Lakh ';
  if (thousand > 0) output += inWords(thousand) + ' Thousand ';
  if (hundred > 0) output += inWords(hundred) + ' Hundred ';
  if (rest > 0) output += inWords(rest) + ' ';

  output = output.trim() + ' Rupees';
  if (paise > 0) {
    output += ' and ' + inWords(paise) + ' Paise';
  }
  return output + ' Only';
};
