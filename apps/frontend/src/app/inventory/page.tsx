'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Plus, Search, AlertTriangle, ArrowUpRight, Package, RefreshCw, X } from 'lucide-react';
import { rawMaterialService } from '../../services/rawMaterialService';
import { categoryService } from '../../services/categoryService';
import { RawMaterial } from '../../types/rawMaterial';
import { Category } from '../../types/category';

export default function InventoryPage() {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal Restock (Mutasi IN)
  const [showRestock, setShowRestock] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RawMaterial | null>(null);
  const [mutationQty, setMutationQty] = useState<number>(10);
  const [mutationNotes, setMutationNotes] = useState('');
  const [submittingMutation, setSubmittingMutation] = useState(false);

  // Modal Create Raw Material
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newVariant, setNewVariant] = useState('');
  const [newUnit, setNewUnit] = useState('pcs');
  const [newStock, setNewStock] = useState(0);
  const [newMinStock, setNewMinStock] = useState(10);
  const [newCategoryId, setNewCategoryId] = useState<number | undefined>(undefined);
  const [submittingCreate, setSubmittingCreate] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, catRes] = await Promise.all([
        rawMaterialService.getRawMaterials({ 
          search: searchTerm || undefined, 
          category_id: selectedCategory 
        }),
        categoryService.getRawMaterialCategories(),
      ]);
      setMaterials(res.data);
      setCategories(catRes.data);
    } catch (err: any) {
      console.error('Failed to fetch inventory:', err);
      setError(err?.response?.data?.message || 'Gagal memuat inventaris dari database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [selectedCategory]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInventory();
  };

  const handleOpenRestock = (item: RawMaterial) => {
    setSelectedItem(item);
    setMutationQty(10);
    setMutationNotes('');
    setShowRestock(true);
  };

  const handleSaveRestock = async () => {
    if (!selectedItem || mutationQty <= 0) return;
    setSubmittingMutation(true);
    try {
      await rawMaterialService.createMutation({
        raw_material_id: selectedItem.id,
        type: 'IN',
        qty: mutationQty,
        notes: mutationNotes || undefined,
      });
      setShowRestock(false);
      await fetchInventory();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal menambahkan mutasi stok');
    } finally {
      setSubmittingMutation(false);
    }
  };

  const handleCreateRawMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSubmittingCreate(true);
    try {
      await rawMaterialService.createRawMaterial({
        name: newName.trim(),
        variant: newVariant.trim() || undefined,
        unit: newUnit.trim() || 'pcs',
        stock: newStock,
        min_stock_warning: newMinStock,
        category_id: newCategoryId,
      });
      setShowCreateModal(false);
      setNewName('');
      setNewVariant('');
      setNewStock(0);
      await fetchInventory();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal membuat bahan baku baru');
    } finally {
      setSubmittingCreate(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-main mb-2">Inventaris Bahan Baku</h1>
          <p className="text-text-muted">Data stok bahan baku langsung terhubung ke database MySQL.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchInventory} 
            className="flex items-center gap-2 px-4 py-3 font-bold skeuo-button text-text-main"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 font-bold skeuo-button text-brand-600"
          >
            <Plus className="w-5 h-5" />
            Bahan Baru
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl skeuo-inset bg-red-50 text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1 skeuo p-6">
          <form onSubmit={handleSearch} className="flex gap-4 mb-6">
            <div className="flex-1 flex items-center gap-3 px-4 py-3 skeuo-inset">
              <Search className="w-5 h-5 text-text-muted" />
              <input 
                type="text" 
                placeholder="Cari nama bahan baku..." 
                className="bg-transparent border-none outline-none w-full text-text-main placeholder:text-text-muted/70"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              value={selectedCategory || ''} 
              onChange={e => setSelectedCategory(e.target.value ? Number(e.target.value) : undefined)}
              className="px-4 py-3 skeuo font-medium text-text-main outline-none bg-transparent rounded-xl"
            >
              <option value="">Semua Kategori</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button type="submit" className="px-6 py-3 font-bold skeuo-button text-text-main">
              Cari
            </button>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-text-muted/20">
                  <th className="pb-4 font-bold text-text-muted">Nama Bahan</th>
                  <th className="pb-4 font-bold text-text-muted">Varian</th>
                  <th className="pb-4 font-bold text-text-muted">Stok Saat Ini</th>
                  <th className="pb-4 font-bold text-text-muted">Batas Minimum</th>
                  <th className="pb-4 font-bold text-text-muted">Status</th>
                  <th className="pb-4 font-bold text-text-muted text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-text-muted">
                      Memuat data dari database...
                    </td>
                  </tr>
                ) : materials.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-text-muted">
                      Belum ada data bahan baku di database.
                    </td>
                  </tr>
                ) : (
                  materials.map(item => (
                    <tr key={item.id} className="border-b border-text-muted/10 last:border-0 hover:bg-white/10 transition-colors">
                      <td className="py-4 font-bold text-text-main flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg skeuo-inset flex items-center justify-center text-text-muted">
                          <Package className="w-5 h-5" />
                        </div>
                        {item.name}
                      </td>
                      <td className="py-4 text-text-muted">
                        {item.variant || '-'}
                      </td>
                      <td className="py-4">
                        <span className="font-bold text-lg text-text-main">{item.stock}</span> <span className="text-text-muted">{item.unit}</span>
                      </td>
                      <td className="py-4 text-text-muted">
                        {item.min_stock_warning} {item.unit}
                      </td>
                      <td className="py-4">
                        {item.is_low_stock ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold skeuo-inset text-red-500 bg-red-50 flex items-center gap-1 w-max">
                            <AlertTriangle className="w-3 h-3" /> Menipis
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-bold skeuo-inset text-emerald-500 bg-emerald-50">
                            Aman
                          </span>
                        )}
                      </td>
                      <td className="py-4 text-right">
                        <button 
                          onClick={() => handleOpenRestock(item)}
                          className="px-4 py-2 text-xs font-bold skeuo-button text-brand-600 flex items-center gap-2 ml-auto"
                        >
                          <ArrowUpRight className="w-4 h-4" /> Mutasi IN
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

      {/* Restock Modal */}
      {showRestock && selectedItem && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="skeuo p-8 w-full max-w-md">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xl font-bold text-text-main">Restock Bahan Baku (IN)</h2>
              <button onClick={() => setShowRestock(false)} className="text-text-muted hover:text-text-main">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-text-muted mb-6">Tambahkan stok untuk <strong>{selectedItem.name}</strong></p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Jumlah Mutasi IN ({selectedItem.unit})</label>
                <div className="flex items-center gap-3 px-4 py-3 skeuo-inset">
                  <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                  <input 
                    type="number" 
                    min="1"
                    value={mutationQty}
                    onChange={e => setMutationQty(Number(e.target.value))}
                    placeholder="Contoh: 10" 
                    className="bg-transparent border-none outline-none w-full text-text-main font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Keterangan / Catatan</label>
                <div className="flex items-center gap-3 px-4 py-3 skeuo-inset h-24 items-start">
                  <textarea 
                    value={mutationNotes}
                    onChange={e => setMutationNotes(e.target.value)}
                    placeholder="Contoh: Kulakan dari supplier..." 
                    className="bg-transparent border-none outline-none w-full text-text-main resize-none h-full"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button 
                onClick={() => setShowRestock(false)}
                className="flex-1 py-3 font-bold skeuo-button text-text-muted"
                disabled={submittingMutation}
              >
                Batal
              </button>
              <button 
                onClick={handleSaveRestock}
                disabled={submittingMutation}
                className="flex-1 py-3 font-bold skeuo-button text-brand-600"
              >
                {submittingMutation ? 'Menyimpan...' : 'Simpan Stok'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCreateRawMaterial} className="skeuo p-8 w-full max-w-md">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-text-main">Tambah Bahan Baku Baru</h2>
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-text-muted hover:text-text-main">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Nama Bahan *</label>
                <div className="px-4 py-3 skeuo-inset">
                  <input 
                    type="text" 
                    required
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="Contoh: Kertas Art Paper 260gr" 
                    className="bg-transparent border-none outline-none w-full text-text-main"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Varian (Opsional)</label>
                <div className="px-4 py-3 skeuo-inset">
                  <input 
                    type="text" 
                    value={newVariant}
                    onChange={e => setNewVariant(e.target.value)}
                    placeholder="Contoh: A3+ / Roll" 
                    className="bg-transparent border-none outline-none w-full text-text-main"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Satuan</label>
                  <div className="px-4 py-3 skeuo-inset">
                    <input 
                      type="text" 
                      value={newUnit}
                      onChange={e => setNewUnit(e.target.value)}
                      placeholder="pcs / rim / liter" 
                      className="bg-transparent border-none outline-none w-full text-text-main"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Stok Awal</label>
                  <div className="px-4 py-3 skeuo-inset">
                    <input 
                      type="number" 
                      value={newStock}
                      onChange={e => setNewStock(Number(e.target.value))}
                      className="bg-transparent border-none outline-none w-full text-text-main font-bold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Peringatan Stok Minimum</label>
                <div className="px-4 py-3 skeuo-inset">
                  <input 
                    type="number" 
                    value={newMinStock}
                    onChange={e => setNewMinStock(Number(e.target.value))}
                    className="bg-transparent border-none outline-none w-full text-text-main font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button 
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-3 font-bold skeuo-button text-text-muted"
                disabled={submittingCreate}
              >
                Batal
              </button>
              <button 
                type="submit"
                disabled={submittingCreate}
                className="flex-1 py-3 font-bold skeuo-button text-brand-600"
              >
                {submittingCreate ? 'Menyimpan...' : 'Simpan Bahan'}
              </button>
            </div>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
}
