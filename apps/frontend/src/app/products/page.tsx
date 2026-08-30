'use client';

import React from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Tag, Layers, Sparkles, FolderTree, RefreshCw } from 'lucide-react';
import { useProductManagement } from '../../hooks/useProductManagement';

// Modular Product Components
import { ProductListTab } from '../../components/products/ProductListTab';
import { VariantListTab } from '../../components/products/VariantListTab';
import { AddonListTab } from '../../components/products/AddonListTab';
import { CategoryListTab } from '../../components/products/CategoryListTab';
import { ProductFormModal } from '../../components/products/ProductFormModal';
import { VariantFormModal } from '../../components/products/VariantFormModal';
import { AddonFormModal } from '../../components/products/AddonFormModal';
import { CategoryFormModal } from '../../components/products/CategoryFormModal';
import { BomEditorModal } from '../../components/products/BomEditorModal';

export default function ProductsPage() {
  const [bomTarget, setBomTarget] = React.useState<{ kind: 'product' | 'addon'; id: number; name: string } | null>(null);
  const {
    activeTab,
    setActiveTab,
    loading,
    error,
    products,
    categories,
    addons,
    rawMaterials,
    selectedProductId,
    setSelectedProductId,
    variants,
    searchTerm,
    setSearchTerm,
    productModal,
    setProductModal,
    variantModal,
    setVariantModal,
    addonModal,
    setAddonModal,
    categoryModal,
    setCategoryModal,
    pForm,
    handlePFormChange,
    vForm,
    handleVFormChange,
    aForm,
    handleAFormChange,
    cForm,
    setCForm,
    submitting,
    fetchAllData,
    handleOpenProductModal,
    handleProductSubmit,
    handleDeleteProduct,
    handleOpenVariantModal,
    handleVariantSubmit,
    handleDeleteVariant,
    handleOpenAddonModal,
    handleAddonSubmit,
    handleDeleteAddon,
    handleOpenCategoryModal,
    handleCategorySubmit,
    handleDeleteCategory,
  } = useProductManagement();

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Tag className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>Manajemen Produk & Layanan Cetak</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Kelola daftar produk, varian ukuran/kertas, opsi finishing, dan kategori produk percetakan.
          </p>
        </div>

        <button
          onClick={fetchAllData}
          disabled={loading}
          className="skeuo-button px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 self-start sm:self-auto text-slate-700 dark:text-slate-300"
          title="Segarkan data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-4 mb-6 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* Tabs Header */}
      <div className="flex gap-2 p-1.5 rounded-2xl skeuo-inset bg-slate-100/80 dark:bg-slate-900/60 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'products'
              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200 dark:border-slate-700'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Produk ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('variants')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'variants'
              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200 dark:border-slate-700'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Varian Produk</span>
        </button>

        <button
          onClick={() => setActiveTab('addons')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'addons'
              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200 dark:border-slate-700'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Finishing & Addon ({addons.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'categories'
              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200 dark:border-slate-700'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>Kategori ({categories.length})</span>
        </button>
      </div>

      {/* Tab 1: Products List */}
      {activeTab === 'products' && (
        <ProductListTab
          products={products}
          categories={categories}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearchKeyDown={() => {}}
          onOpenAddModal={() => handleOpenProductModal()}
          onOpenEditModal={handleOpenProductModal}
          onDeleteProduct={handleDeleteProduct}
          onConfigureBom={(product) => setBomTarget({ kind: 'product', id: product.id, name: product.name })}
        />
      )}

      {/* Tab 2: Variants List */}
      {activeTab === 'variants' && (
        <VariantListTab
          products={products}
          selectedProductId={selectedProductId}
          onSelectProduct={setSelectedProductId}
          variants={variants}
          onOpenAddModal={() => handleOpenVariantModal()}
          onOpenEditModal={handleOpenVariantModal}
          onDeleteVariant={handleDeleteVariant}
        />
      )}

      {/* Tab 3: Addons List */}
      {activeTab === 'addons' && (
        <AddonListTab
          addons={addons}
          onOpenAddModal={() => handleOpenAddonModal()}
          onOpenEditModal={handleOpenAddonModal}
          onDeleteAddon={handleDeleteAddon}
          onConfigureBom={(addon) => setBomTarget({ kind: 'addon', id: addon.id, name: addon.name })}
        />
      )}

      {/* Tab 4: Categories List */}
      {activeTab === 'categories' && (
        <CategoryListTab
          categories={categories}
          onOpenAddModal={() => handleOpenCategoryModal()}
          onOpenEditModal={handleOpenCategoryModal}
          onDeleteCategory={handleDeleteCategory}
        />
      )}

      {/* Modals */}
      <ProductFormModal
        isOpen={productModal.open}
        item={productModal.item || null}
        formData={pForm}
        categories={categories}
        rawMaterials={rawMaterials}
        submitting={submitting}
        onChange={handlePFormChange}
        onClose={() => setProductModal({ open: false })}
        onSubmit={handleProductSubmit}
      />

      <VariantFormModal
        isOpen={variantModal.open}
        item={variantModal.item || null}
        formData={vForm}
        rawMaterials={rawMaterials}
        submitting={submitting}
        onChange={handleVFormChange}
        onClose={() => setVariantModal({ open: false })}
        onSubmit={handleVariantSubmit}
      />

      <AddonFormModal
        isOpen={addonModal.open}
        item={addonModal.item || null}
        formData={aForm}
        categories={categories}
        submitting={submitting}
        onChange={handleAFormChange}
        onClose={() => setAddonModal({ open: false })}
        onSubmit={handleAddonSubmit}
      />

      <CategoryFormModal
        isOpen={categoryModal.open}
        item={categoryModal.item || null}
        name={cForm.name}
        onChangeName={(val) => setCForm({ name: val })}
        submitting={submitting}
        onClose={() => setCategoryModal({ open: false })}
        onSubmit={handleCategorySubmit}
      />

      <BomEditorModal
        target={bomTarget}
        rawMaterials={rawMaterials}
        onClose={() => setBomTarget(null)}
      />
    </DashboardLayout>
  );
}
