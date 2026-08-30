'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Plus, RefreshCw } from 'lucide-react';
import { rawMaterialService } from '../../services/rawMaterialService';
import { categoryService } from '../../services/categoryService';
import { RawMaterial } from '../../types/rawMaterial';
import { Category } from '../../types/category';
import { useAlert } from '../../context/AlertContext';

// Modular Inventory Components
import { InventoryTable } from '../../components/inventory/InventoryTable';
import { InventoryRestockModal } from '../../components/inventory/InventoryRestockModal';
import { InventoryCreateModal } from '../../components/inventory/InventoryCreateModal';
import { InventoryLotModal } from '../../components/inventory/InventoryLotModal';
import { InventoryUomModal } from '../../components/inventory/InventoryUomModal';

export default function InventoryPage() {
  const { showAlert, showToast } = useAlert();
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

  // Modal Lot Management
  const [showLotModal, setShowLotModal] = useState(false);
  const [lotMaterial, setLotMaterial] = useState<RawMaterial | null>(null);

  // Modal UOM Conversion
  const [showUomModal, setShowUomModal] = useState(false);
  const [uomMaterial, setUomMaterial] = useState<RawMaterial | null>(null);

  // Modal Create Raw Material
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    variant: '',
    unit: 'pcs',
    package_unit: '',
    package_size: undefined as number | undefined,
    stock: 0,
    min_stock_warning: 10,
    category_id: undefined as number | undefined,
  });
  const [submittingCreate, setSubmittingCreate] = useState(false);

  const fetchInventory = useCallback(async () => {
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
  }, [searchTerm, selectedCategory]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

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

  const handleOpenLots = (item: RawMaterial) => {
    setLotMaterial(item);
    setShowLotModal(true);
  };

  const handleOpenUom = (item: RawMaterial) => {
    setUomMaterial(item);
    setShowUomModal(true);
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
      showToast(`Stok "${selectedItem.name}" berhasil ditambahkan (+${mutationQty} ${selectedItem.unit})!`, 'success');
      await fetchInventory();
    } catch (err: any) {
      await showAlert({
        title: 'Gagal Menambahkan Mutasi Stok',
        message: err?.response?.data?.message || 'Terjadi kesalahan saat menambahkan stok bahan baku.',
        type: 'error',
      });
    } finally {
      setSubmittingMutation(false);
    }
  };

  const handleCreateRawMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim()) return;
    setSubmittingCreate(true);
    try {
      await rawMaterialService.createRawMaterial({
        name: createForm.name.trim(),
        variant: createForm.variant.trim() || undefined,
        unit: createForm.unit.trim() || 'pcs',
        package_unit: createForm.package_unit.trim() || undefined,
        package_size: createForm.package_size,
        stock: createForm.stock,
        min_stock_warning: createForm.min_stock_warning,
        category_id: createForm.category_id,
      });
      setShowCreateModal(false);
      setCreateForm({
        name: '',
        variant: '',
        unit: 'pcs',
        package_unit: '',
        package_size: undefined,
        stock: 0,
        min_stock_warning: 10,
        category_id: undefined,
      });
      showToast('Bahan baku baru berhasil ditambahkan!', 'success');
      await fetchInventory();
    } catch (err: any) {
      await showAlert({
        title: 'Gagal Membuat Bahan Baku',
        message: err?.response?.data?.message || 'Terjadi kesalahan saat membuat bahan baku baru.',
        type: 'error',
      });
    } finally {
      setSubmittingCreate(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-main mb-2">Inventaris Bahan Baku</h1>
          <p className="text-text-muted">Kelola saldo fisik, stok terpesan (reserved), penerimaan lot roll, dan konversi satuan.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchInventory} 
            className="flex items-center gap-2 px-4 py-3 font-bold skeuo-button text-text-main rounded-xl cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 font-bold skeuo-button text-brand-600 rounded-xl cursor-pointer"
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

      {/* Inventory Table */}
      <InventoryTable
        materials={materials}
        categories={categories}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onSearchSubmit={handleSearch}
        onOpenRestock={handleOpenRestock}
        onOpenLots={handleOpenLots}
        onOpenUom={handleOpenUom}
      />

      {/* Restock Modal */}
      <InventoryRestockModal
        isOpen={showRestock}
        selectedItem={selectedItem}
        mutationQty={mutationQty}
        onChangeQty={setMutationQty}
        mutationNotes={mutationNotes}
        onChangeNotes={setMutationNotes}
        submitting={submittingMutation}
        onClose={() => setShowRestock(false)}
        onSubmit={handleSaveRestock}
      />

      {/* Lot / Roll Management Modal */}
      <InventoryLotModal
        isOpen={showLotModal}
        material={lotMaterial}
        onClose={() => setShowLotModal(false)}
        onRefreshMaterial={fetchInventory}
      />

      {/* UOM Conversion Modal */}
      <InventoryUomModal
        isOpen={showUomModal}
        material={uomMaterial}
        onClose={() => setShowUomModal(false)}
      />

      {/* Create Modal */}
      <InventoryCreateModal
        isOpen={showCreateModal}
        formData={createForm}
        onChange={(field, value) => setCreateForm(prev => ({ ...prev, [field]: value }))}
        submitting={submittingCreate}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateRawMaterial}
      />
    </DashboardLayout>
  );
}
