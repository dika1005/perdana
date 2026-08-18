'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Search, UserPlus, Phone, MapPin, RefreshCw, X, Trash2 } from 'lucide-react';
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

  const handleDelete = async (id: number) => {
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
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-main mb-2">Master Pelanggan</h1>
          <p className="text-text-muted">Kelola data pelanggan yang tersimpan di database.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchCustomers} 
            className="flex items-center gap-2 px-4 py-3 font-bold skeuo-button text-text-main"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-3 font-bold skeuo-button text-brand-600"
          >
            <UserPlus className="w-5 h-5" />
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
            <div className="flex-1 flex items-center gap-3 px-4 py-3 skeuo-inset">
              <Search className="w-5 h-5 text-text-muted" />
              <input 
                type="text" 
                placeholder="Cari nama pelanggan..." 
                className="bg-transparent border-none outline-none w-full text-text-main placeholder:text-text-muted/70"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <button type="submit" className="px-6 py-3 font-bold skeuo-button text-text-main">
              Cari
            </button>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-text-muted/20">
                  <th className="pb-4 font-bold text-text-muted">Nama Pelanggan</th>
                  <th className="pb-4 font-bold text-text-muted">Nomor HP</th>
                  <th className="pb-4 font-bold text-text-muted">Alamat</th>
                  <th className="pb-4 font-bold text-text-muted">Terdaftar Pada</th>
                  <th className="pb-4 font-bold text-text-muted text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-text-muted">
                      Memuat data pelanggan dari database...
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-text-muted">
                      Belum ada data pelanggan di database.
                    </td>
                  </tr>
                ) : (
                  customers.map(customer => (
                    <tr key={customer.id} className="border-b border-text-muted/10 last:border-0 hover:bg-white/10 transition-colors">
                      <td className="py-4 font-bold text-text-main">
                        {customer.name}
                      </td>
                      <td className="py-4 text-text-muted">
                        {customer.phone ? (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {customer.phone}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="py-4 text-text-muted">
                        {customer.address ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {customer.address}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="py-4 text-text-muted text-xs">
                        {new Date(customer.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-4 text-right">
                        <button 
                          onClick={() => handleDelete(customer.id)}
                          className="w-8 h-8 flex items-center justify-center skeuo-button text-red-400 hover:text-red-500 rounded-lg ml-auto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

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
                <label className="block text-sm font-medium text-text-muted mb-1">Nama Pelanggan *</label>
                <div className="px-4 py-3 skeuo-inset">
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Contoh: PT. Maju Jaya" 
                    className="bg-transparent border-none outline-none w-full text-text-main"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Nomor WhatsApp / Telepon</label>
                <div className="px-4 py-3 skeuo-inset">
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="08123456789" 
                    className="bg-transparent border-none outline-none w-full text-text-main"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Alamat</label>
                <div className="px-4 py-3 skeuo-inset">
                  <textarea 
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Jl. Merdeka No. 123" 
                    className="bg-transparent border-none outline-none w-full text-text-main resize-none h-20"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button 
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 font-bold skeuo-button text-text-muted"
                disabled={submitting}
              >
                Batal
              </button>
              <button 
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 font-bold skeuo-button text-brand-600"
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
