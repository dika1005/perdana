'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { 
  Search, 
  UserPlus, 
  Phone, 
  MapPin, 
  RefreshCw, 
  X, 
  Trash2, 
  History, 
  ShoppingBag, 
  ChevronRight, 
  CreditCard 
} from 'lucide-react';
import { customerService } from '../../services/customerService';
import { Customer } from '../../types/customer';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Modal
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Repeat Order History Drawer
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await customerService.getCustomers({ search: searchTerm || undefined });
      setCustomers(res.data);
    } catch (err: any) {
      console.error('Failed to load customers:', err);
      setError(err?.response?.data?.message || 'Gagal memuat data pelanggan dari database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers();
  };

  const handleOpenCustomerOrders = async (cust: Customer) => {
    setSelectedCustomer(cust);
    setLoadingOrders(true);
    try {
      const res = await customerService.getCustomerTransactions(cust.id);
      setCustomerOrders(res.data);
    } catch (err: any) {
      console.error('Failed to fetch customer transactions:', err);
      setCustomerOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await customerService.createCustomer({
        name: name.trim(),
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
      });
      setShowModal(false);
      setName('');
      setPhone('');
      setAddress('');
      await fetchCustomers();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal membuat pelanggan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm('Apakah Anda yakin ingin menghapus pelanggan ini?')) return;
    try {
      await customerService.deleteCustomer(id);
      await fetchCustomers();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal menghapus pelanggan');
    }
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold text-text-main mb-1">Master Pelanggan</h1>
          <p className="text-text-muted text-sm">Kelola data pelanggan dan pantau riwayat repeat order.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchCustomers} 
            className="flex items-center gap-2 px-4 py-2.5 font-bold skeuo-button text-text-main text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Segarkan
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 font-bold skeuo-button text-brand-600 text-sm"
          >
            <UserPlus className="w-4 h-4" />
            Pelanggan Baru
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl skeuo-inset bg-red-50 text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-6">
        <div className="skeuo p-6">
          <form onSubmit={handleSearch} className="flex gap-4 mb-6">
            <div className="flex-1 max-w-md flex items-center gap-3 px-4 py-2.5 skeuo-inset rounded-xl">
              <Search className="w-4 h-4 text-text-muted" />
              <input 
                type="text" 
                placeholder="Cari nama atau no. HP pelanggan..." 
                className="bg-transparent border-none outline-none w-full text-xs text-text-main placeholder:text-text-muted/70"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
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
                      onClick={() => handleOpenCustomerOrders(customer)}
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
                            onClick={(e) => handleDelete(e, customer.id)}
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
      </div>

      {/* Drawer Riwayat Repeat Order */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-end z-50">
          <div className="w-full max-w-md bg-bg-skeuo h-full p-6 shadow-2xl flex flex-col overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-black/10">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                  Profil Pelanggan
                </span>
                <h2 className="text-xl font-bold text-text-main mt-1">{selectedCustomer.name}</h2>
                <p className="text-xs text-text-muted">{selectedCustomer.phone || 'Tanpa No. HP'}</p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="text-text-muted hover:text-text-main p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-text-main flex items-center gap-2">
                  <History className="w-4 h-4 text-brand-500" />
                  Riwayat Nota Belanja ({customerOrders.length})
                </h3>
              </div>

              {loadingOrders ? (
                <div className="py-12 text-center text-xs text-text-muted">
                  Memuat riwayat nota pelanggan...
                </div>
              ) : customerOrders.length === 0 ? (
                <div className="py-12 text-center text-xs text-text-muted">
                  Belum ada riwayat transaksi untuk pelanggan ini.
                </div>
              ) : (
                <div className="space-y-3">
                  {customerOrders.map(ord => (
                    <div key={ord.id} className="p-4 rounded-xl skeuo-inset text-xs space-y-2">
                      <div className="flex justify-between items-center font-bold">
                        <span className="text-text-main font-mono">{ord.invoice_number}</span>
                        <span className="text-brand-600">Rp {Number(ord.total_amount).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between text-text-muted text-[11px]">
                        <span>{new Date(ord.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="font-semibold text-slate-700">{ord.order_status}</span>
                      </div>
                      <div className="pt-1 border-t border-black/5 flex justify-between items-center text-[10px]">
                        <span className={`font-bold ${ord.payment_status === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>
                          Status: {ord.payment_status}
                        </span>
                        {Number(ord.total_amount) > Number(ord.pay_amount) && (
                          <span className="text-red-500 font-bold">
                            Sisa DP: Rp {(Number(ord.total_amount) - Number(ord.pay_amount)).toLocaleString('id-ID')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-black/10 mt-auto">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="w-full py-2.5 font-bold skeuo-button text-text-main text-xs"
              >
                Tutup Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Pelanggan */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCreateCustomer} className="skeuo p-8 w-full max-w-md">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-text-main">Tambah Pelanggan Baru</h2>
              <button type="button" onClick={() => setShowModal(false)} className="text-text-muted hover:text-text-main">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Nama Pelanggan *</label>
                <div className="px-4 py-2.5 skeuo-inset rounded-xl">
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Contoh: PT. Maju Jaya" 
                    className="bg-transparent border-none outline-none w-full text-xs text-text-main"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Nomor WhatsApp / Telepon</label>
                <div className="px-4 py-2.5 skeuo-inset rounded-xl">
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="08123456789" 
                    className="bg-transparent border-none outline-none w-full text-xs text-text-main"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Alamat</label>
                <div className="px-4 py-2.5 skeuo-inset rounded-xl">
                  <textarea 
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Jl. Merdeka No. 123" 
                    className="bg-transparent border-none outline-none w-full text-xs text-text-main resize-none h-20"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 font-bold skeuo-button text-text-muted text-xs"
                disabled={submitting}
              >
                Batal
              </button>
              <button 
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 font-bold skeuo-button text-brand-600 text-xs"
              >
                {submitting ? 'Menyimpan...' : 'Simpan Pelanggan'}
              </button>
            </div>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
}
