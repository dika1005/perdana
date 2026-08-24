/**
 * WhatsApp Helper Utilities
 * Mengelola pembersihan nomor WhatsApp dan pembuatan URL tautan pesan.
 */

export function formatWaNumber(phone?: string | null): string {
  if (!phone) return '';
  let clean = phone.replace(/[^0-9]/g, '');
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  }
  return clean;
}

export function createWaLink(phone?: string | null, message?: string): string {
  const cleanPhone = formatWaNumber(phone);
  if (!cleanPhone) return '#';
  return `https://wa.me/${cleanPhone}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
}
