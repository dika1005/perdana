'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { UserPlus, RefreshCw } from 'lucide-react';
import { customerService } from '../../services/customerService';
import { Customer } from '../../types/customer';
import { useAlert } from '../../context/AlertContext';

// Modular Customer Components
import { CustomerTable } from '../../components/customers/CustomerTable';
import { CustomerFormModal } from '../../components/customers/CustomerFormModal';
import { CustomerOrderDrawer } from '../../components/customers/CustomerOrderDrawer';

export default function CustomersPage() {
  const { showAlert, showConfirm, showToast } = useAlert();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create / Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
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

  const handleOpenCreateModal = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setAddress('');
    setShowModal(true);
  };

  const handleOpenEditModal = (e: React.MouseEvent, cust: Customer) => {
    e.stopPropagation();
    setEditingCustomer(cust);
    setName(cust.name);
    setPhone(cust.phone || '');
    setAddress(cust.address || '');
    setShowModal(true);
  };

  const handleSubmitCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      if (editingCustomer) {
        await customerService.updateCustomer(editingCustomer.id, {
          name: name.trim(),
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
        });
        showToast('Data pelanggan berhasil diperbarui!', 'success');
      } else {
        await customerService.createCustomer({
          name: name.trim(),
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
        });
        showToast('Pelanggan berhasil ditambahkan!', 'success');
      }
      setShowModal(false);
      setName('');
      setPhone('');
      setAddress('');
      setEditingCustomer(null);
      await fetchCustomers();
    } catch (err: any) {
      await showAlert({
        title: editingCustomer ? 'Gagal Memperbarui Pelanggan' : 'Gagal Menambahkan Pelanggan',
        message: err?.response?.data?.message || 'Terjadi kesalahan saat menyimpan data pelanggan.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    const confirmed = await showConfirm({
      title: 'Hapus Pelanggan?',
      message: 'Apakah Anda yakin ingin menghapus data pelanggan ini?',
      type: 'danger',
      confirmText: 'Ya, Hapus',
    });
    if (!confirmed) return;

    try {
      await customerService.deleteCustomer(id);
      showToast('Pelanggan berhasil dihapus', 'info');
      await fetchCustomers();
    } catch (err: any) {
      await showAlert({
        title: 'Gagal Menghapus Pelanggan',
        message: err?.response?.data?.message || 'Terjadi kesalahan saat menghapus pelanggan.',
        type: 'error',
      });
    }
  };

  const handleExportCsv = () => {
    if (customers.length === 0) return;
    const headers = ['ID', 'Nama Pelanggan', 'Nomor HP / WhatsApp', 'Alamat', 'Tanggal Terdaftar'];
    const rows = customers.map(c => [
      c.id,
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${(c.phone || '').replace(/"/g, '""')}"`,
      `"${(c.address || '').replace(/"/g, '""')}"`,
      `"${new Date(c.created_at).toISOString().slice(0, 10)}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pelanggan_perdana_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast('Data pelanggan berhasil diekspor ke CSV!', 'success');
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-main mb-1">Master Pelanggan</h1>
          <p className="text-text-muted text-xs sm:text-sm">Kelola data pelanggan, kontak WhatsApp, dan pantau riwayat repeat order.</p>
        </div>
        <div className="flex gap-2.5">
          <button 
            onClick={fetchCustomers} 
            className="flex items-center gap-2 px-3.5 py-2.5 font-bold skeuo-button text-text-main text-xs sm:text-sm rounded-xl cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Segarkan</span>
          </button>
          <button 
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 font-bold bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs sm:text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-white" />
            <span>Pelanggan Baru</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl skeuo-inset bg-red-50 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Customer Table */}
      <CustomerTable
        customers={customers}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearchSubmit={handleSearch}
        onSelectCustomer={handleOpenCustomerOrders}
        onEditCustomer={handleOpenEditModal}
        onDeleteCustomer={handleDelete}
        onExportCsv={handleExportCsv}
      />

      {/* Drawer Riwayat Repeat Order */}
      <CustomerOrderDrawer
        customer={selectedCustomer}
        orders={customerOrders}
        loading={loadingOrders}
        onClose={() => setSelectedCustomer(null)}
      />

      {/* Modal Tambah / Edit Pelanggan */}
      <CustomerFormModal
        isOpen={showModal}
        editingCustomer={editingCustomer}
        name={name}
        onChangeName={setName}
        phone={phone}
        onChangePhone={setPhone}
        address={address}
        onChangeAddress={setAddress}
        submitting={submitting}
        onClose={() => {
          setShowModal(false);
          setEditingCustomer(null);
        }}
        onSubmit={handleSubmitCustomer}
      />
    </DashboardLayout>
  );
}
