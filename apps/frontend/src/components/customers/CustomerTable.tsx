'use client';

import React from 'react';
import { Search, Phone, MapPin, Trash2 } from 'lucide-react';
import { Customer } from '../../types/customer';

interface CustomerTableProps {
  customers: Customer[];
  loading: boolean;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onSelectCustomer: (cust: Customer) => void;
  onDeleteCustomer: (e: React.MouseEvent, id: number) => void;
}

export const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
  loading,
  searchTerm,
  onSearchChange,
  onSearchSubmit,
  onSelectCustomer,
  onDeleteCustomer,
}) => {
  return (
    <div className="skeuo p-6">
      <form onSubmit={onSearchSubmit} className="flex gap-4 mb-6">
        <div className="flex-1 max-w-md flex items-center gap-3 px-4 py-2.5 skeuo-inset rounded-xl">
          <Search className="w-4 h-4 text-text-muted" />
          <input 
            type="text" 
            placeholder="Cari nama atau no. HP pelanggan..." 
            className="bg-transparent border-none outline-none w-full text-xs text-text-main placeholder:text-text-muted/70"
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
          />
        </div>
        <button type="submit" className="px-5 py-2.5 font-bold skeuo-button text-text-main text-xs">
          Cari
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-text-muted/20 text-xs font-bold text-text-muted">
              <th className="pb-3">Nama Pelanggan</th>
              <th className="pb-3">Nomor WhatsApp / HP</th>
              <th className="pb-3">Alamat</th>
              <th className="pb-3">Terdaftar Pada</th>
              <th className="pb-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-text-muted text-xs">
                  Memuat data pelanggan...
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-text-muted text-xs">
                  Belum ada data pelanggan di database.
                </td>
              </tr>
            ) : (
              customers.map(customer => (
                <tr 
                  key={customer.id} 
                  onClick={() => onSelectCustomer(customer)}
                  className="border-b border-text-muted/10 last:border-0 hover:bg-white/10 transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 font-bold text-text-main text-xs flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg skeuo flex items-center justify-center text-brand-500 font-bold text-xs">
                      {customer.name.charAt(0)}
                    </div>
                    <div>
                      <span>{customer.name}</span>
                      <span className="block text-[10px] text-text-muted font-normal group-hover:text-brand-600">
                        Klik untuk riwayat repeat order &rarr;
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 text-text-muted text-xs">
                    {customer.phone ? (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {customer.phone}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="py-3.5 text-text-muted text-xs">
                    {customer.address ? (
                      <span className="flex items-center gap-1 truncate max-w-xs">
                        <MapPin className="w-3 h-3" /> {customer.address}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="py-3.5 text-text-muted text-xs">
                    {new Date(customer.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="py-3.5 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={(e) => onDeleteCustomer(e, customer.id)}
                        className="w-8 h-8 flex items-center justify-center skeuo-button text-red-400 hover:text-red-500 rounded-lg"
                        title="Hapus Pelanggan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
