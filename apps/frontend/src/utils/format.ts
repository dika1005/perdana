/**
 * Helper formatting utilities for currency and numbers in Indonesian Locale (id-ID)
 */

export function formatRupiah(value: number | string | null | undefined, withPrefix: boolean = true): string {
  if (value === null || value === undefined || value === '') {
    return withPrefix ? 'Rp 0' : '0';
  }
  
  const num = typeof value === 'number' ? value : Number(value);
  if (isNaN(num)) {
    return withPrefix ? 'Rp 0' : '0';
  }
  
  // Format with Indonesian locale: 70000 -> "70.000"
  const formatted = num.toLocaleString('id-ID');
  return withPrefix ? `Rp ${formatted}` : formatted;
}

export function formatNumber(value: number | string | null | undefined): string {
  return formatRupiah(value, false);
}
