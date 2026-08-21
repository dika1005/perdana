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
      showToast('Pelanggan berhasil ditambahkan!', 'success');
      await fetchCustomers();
    } catch (err: any) {
      await showAlert({
        title: 'Gagal Menambahkan Pelanggan',
        message: err?.response?.data?.message || 'Terjadi kesalahan saat menambahkan pelanggan.',
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

      {/* Customer Table */}
      <CustomerTable
        customers={customers}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearchSubmit={handleSearch}
        onSelectCustomer={handleOpenCustomerOrders}
        onDeleteCustomer={handleDelete}
      />

      {/* Drawer Riwayat Repeat Order */}
      <CustomerOrderDrawer
        customer={selectedCustomer}
        orders={customerOrders}
        loading={loadingOrders}
        onClose={() => setSelectedCustomer(null)}
      />

      {/* Modal Tambah Pelanggan */}
      <CustomerFormModal
        isOpen={showModal}
        name={name}
        onChangeName={setName}
        phone={phone}
        onChangePhone={setPhone}
        address={address}
        onChangeAddress={setAddress}
        submitting={submitting}
        onClose={() => setShowModal(false)}
        onSubmit={handleCreateCustomer}
      />
    </DashboardLayout>
  );
}
