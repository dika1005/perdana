'use client';

import React from 'react';
import { User } from 'lucide-react';
import { Customer } from '../../types/customer';

interface CartCustomerSelectorProps {
  customers: Customer[];
  selectedCustomer: Customer | null;
  onSelectCustomer: (cust: Customer | null) => void;
  customCustomerName: string;
  onCustomCustomerNameChange: (val: string) => void;
}

export const CartCustomerSelector: React.FC<CartCustomerSelectorProps> = ({
  customers,
  selectedCustomer,
  onSelectCustomer,
  customCustomerName,
  onCustomCustomerNameChange,
}) => {
  return (
    <div className="my-3 p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 shrink-0">
      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
        <User className="w-3.5 h-3.5 text-blue-500" />
        <span>Informasi Pelanggan:</span>
      </label>
      <select 
        value={selectedCustomer ? selectedCustomer.id : ''} 
        onChange={e => {
          const id = Number(e.target.value);
          const found = customers.find(c => c.id === id);
          onSelectCustomer(found || null);
        }}
        className="w-full px-3 py-2 text-xs font-medium text-text-main outline-none bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-950 transition-all [&>option]:bg-white [&>option]:text-slate-900 dark:[&>option]:bg-slate-900 dark:[&>option]:text-slate-100"
      >
        <option value="">👤 Pelanggan Umum (Walk-in)</option>
        {customers.map(c => (
          <option key={c.id} value={c.id}>{c.name} {c.phone ? `• ${c.phone}` : ''}</option>
        ))}
      </select>
      {!selectedCustomer && (
        <input 
          type="text" 
          placeholder="Ketik nama pelanggan / instansi..." 
          value={customCustomerName}
          onChange={e => onCustomCustomerNameChange(e.target.value)}
          className="w-full mt-2 px-3 py-1.5 text-xs text-text-main outline-none bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 focus:border-blue-400"
        />
      )}
    </div>
  );
};
