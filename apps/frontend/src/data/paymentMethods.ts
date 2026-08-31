import { Banknote, Landmark, QrCode } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { PaymentMethod } from '../types/transaction';

export interface PaymentMethodOption {
  id: PaymentMethod;
  label: string;
  icon: LucideIcon;
  activeClass: string;
}

export const PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    id: 'CASH',
    label: 'Tunai',
    icon: Banknote,
    activeClass:
      'border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20',
  },
  {
    id: 'QRIS',
    label: 'QRIS',
    icon: QrCode,
    activeClass:
      'border-blue-500 bg-blue-50/90 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20',
  },
  {
    id: 'TRANSFER',
    label: 'Transfer Bank',
    icon: Landmark,
    activeClass:
      'border-purple-500 bg-purple-50/90 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/20',
  },
];

export const getPaymentMethod = (id?: string | null): PaymentMethodOption =>
  PAYMENT_METHODS.find(m => m.id === id) ?? PAYMENT_METHODS[0];
