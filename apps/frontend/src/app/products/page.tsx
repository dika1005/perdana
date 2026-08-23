'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Tag, Layers, Sparkles, FolderTree, RefreshCw } from 'lucide-react';
import { productService } from '../../services/productService';
import { rawMaterialService } from '../../services/rawMaterialService';
import { Product, ProductVariant, ProductAddon, PriceType, RangePriceType } from '../../types/product';
import { Category } from '../../types/category';
import { RawMaterial } from '../../types/rawMaterial';
import { useAlert } from '../../context/AlertContext';

// Modular Product Components
import { ProductListTab } from '../../components/products/ProductListTab';
import { VariantListTab } from '../../components/products/VariantListTab';
import { AddonListTab } from '../../components/products/AddonListTab';
import { CategoryListTab } from '../../components/products/CategoryListTab';
import { ProductFormModal } from '../../components/products/ProductFormModal';
import { VariantFormModal } from '../../components/products/VariantFormModal';
import { AddonFormModal } from '../../components/products/AddonFormModal';
import { CategoryFormModal } from '../../components/products/CategoryFormModal';

export default function ProductsPage() {
  const { showAlert, showConfirm, showToast } = useAlert();
  const [activeTab, setActiveTab] = useState<'products' | 'variants' | 'addons' | 'categories'>('products');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [addons, setAddons] = useState<ProductAddon[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  // Search
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [productModal, setProductModal] = useState<{ open: boolean; item?: Product | null }>({ open: false });
  const [variantModal, setVariantModal] = useState<{ open: boolean; item?: ProductVariant | null }>({ open: false });
  const [addonModal, setAddonModal] = useState<{ open: boolean; item?: ProductAddon | null }>({ open: false });
  const [categoryModal, setCategoryModal] = useState<{ open: boolean; item?: Category | null }>({ open: false });

  // Form states
  const [pForm, setPForm] = useState({
    name: '',
    category_id: undefined as number | undefined,
    price_type: 'FIXED' as PriceType,
    default_price: 0,
    min_price: 0,
    max_price: 0,
    min_order: 1,
    unit_name: 'pcs',
    has_variants: false,
    raw_material_id: undefined as number | undefined,
    material_amount: 1,
  });

  const [vForm, setVForm] = useState({
    variant_name: '',
    price_type: 'FIXED' as RangePriceType,
    price: 0,
    min_price: 0,
    max_price: 0,
    raw_material_id: undefined as number | undefined,
    material_amount: 1,
  });

  const [aForm, setAForm] = useState({
    name: '',
    category_id: null as number | null,
    price_type: 'FIXED' as RangePriceType,
    default_price: 0,
    min_price: 0,
    max_price: 0,
  });

  const [cForm, setCForm] = useState({
    name: '',
  });

  const [submitting, setSubmitting] = useState(false);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [pRes, cRes, aRes, mRes] = await Promise.all([
        productService.getProducts({ search: searchTerm || undefined }),
        productService.getCategories(),
        productService.getAddons(),
        rawMaterialService.getRawMaterials(),
      ]);
      setProducts(pRes.data);
      setCategories(cRes);
      setAddons(aRes);
      setRawMaterials(mRes.data);

      if (pRes.data.length > 0 && !selectedProductId) {
        setSelectedProductId(pRes.data[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load products master:', err);
      setError(err?.response?.data?.message || 'Gagal memuat master produk');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchVariants = async (prodId: number) => {
    try {
      const vars = await productService.getVariants(prodId);
      setVariants(vars);
    } catch (err) {
      console.error('Failed to fetch variants:', err);
    }
  };

  useEffect(() => {
    if (selectedProductId) {
      fetchVariants(selectedProductId);
    }
  }, [selectedProductId]);

  // Product Actions
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (productModal.item) {
        await productService.updateProduct(productModal.item.id, pForm);
        showToast('Produk berhasil diperbarui!', 'success');
      } else {
        await productService.createProduct(pForm);
        showToast('Produk baru berhasil ditambahkan!', 'success');
      }
      setProductModal({ open: false });
      await fetchAllData();
    } catch (err: any) {
      await showAlert({
        title: 'Gagal Menyimpan Produk',
        message: err?.response?.data?.message || 'Terjadi kesalahan saat menyimpan produk.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const deleteProduct = async (id: number) => {
    const confirmed = await showConfirm({
      title: 'Hapus Produk?',
      message: 'Apakah Anda yakin ingin menghapus produk ini beserta seluruh variannya? Tindakan ini tidak dapat dibatalkan.',
      type: 'danger',
      confirmText: 'Ya, Hapus',
    });
    if (!confirmed) return;

    try {
      await productService.deleteProduct(id);
      showToast('Produk berhasil dihapus', 'info');
      await fetchAllData();
    } catch (err: any) {
      await showAlert({
        title: 'Gagal Menghapus Produk',
        message: err?.response?.data?.message || 'Terjadi kesalahan saat menghapus produk.',
        type: 'error',
      });
    }
  };

  // Variant Actions
  const handleVariantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;
    setSubmitting(true);
    try {
      if (variantModal.item) {
        await productService.updateVariant(variantModal.item.id, vForm);
        showToast('Varian berhasil diperbarui!', 'success');
      } else {
        await productService.createVariant(selectedProductId, vForm);
        showToast('Varian baru berhasil ditambahkan!', 'success');
      }
      setVariantModal({ open: false });
      await fetchVariants(selectedProductId);
    } catch (err: any) {
      await showAlert({
        title: 'Gagal Menyimpan Varian',
        message: err?.response?.data?.message || 'Terjadi kesalahan saat menyimpan varian.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const deleteVariant = async (id: number) => {
    const confirmed = await showConfirm({
      title: 'Hapus Varian?',
      message: 'Apakah Anda yakin ingin menghapus varian produk ini?',
      type: 'danger',
      confirmText: 'Ya, Hapus',
    });
    if (!confirmed) return;

    try {
      await productService.deleteVariant(id);
      showToast('Varian berhasil dihapus', 'info');
      if (selectedProductId) await fetchVariants(selectedProductId);
    } catch (err: any) {
      await showAlert({
        title: 'Gagal Menghapus Varian',
        message: err?.response?.data?.message || 'Terjadi kesalahan saat menghapus varian.',
        type: 'error',
      });
    }
  };

  // Addon Actions
  const handleAddonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (addonModal.item) {
        await productService.updateAddon(addonModal.item.id, aForm);
        showToast('Finishing/Add-on berhasil diperbarui!', 'success');
      } else {
        await productService.createAddon(aForm);
        showToast('Finishing/Add-on baru berhasil ditambahkan!', 'success');
      }
      setAddonModal({ open: false });
      const aRes = await productService.getAddons();
      setAddons(aRes);
    } catch (err: any) {
      await showAlert({
        title: 'Gagal Menyimpan Add-on',
        message: err?.response?.data?.message || 'Terjadi kesalahan saat menyimpan finishing/add-on.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const deleteAddon = async (id: number) => {
    const confirmed = await showConfirm({
      title: 'Hapus Finishing / Add-on?',
      message: 'Apakah Anda yakin ingin menghapus opsi finishing / add-on ini?',
      type: 'danger',
      confirmText: 'Ya, Hapus',
    });
    if (!confirmed) return;

    try {
      await productService.deleteAddon(id);
      showToast('Add-on berhasil dihapus', 'info');
      const aRes = await productService.getAddons();
      setAddons(aRes);
    } catch (err: any) {
      await showAlert({
        title: 'Gagal Menghapus Add-on',
        message: err?.response?.data?.message || 'Terjadi kesalahan saat menghapus add-on.',
        type: 'error',
      });
    }
  };

  // Category Actions
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (categoryModal.item) {
        await productService.updateCategory(categoryModal.item.id, cForm);
        showToast('Kategori berhasil diperbarui!', 'success');
      } else {
        await productService.createCategory(cForm);
        showToast('Kategori baru berhasil ditambahkan!', 'success');
      }
      setCategoryModal({ open: false });
      const cRes = await productService.getCategories();
      setCategories(cRes);
    } catch (err: any) {
      await showAlert({
        title: 'Gagal Menyimpan Kategori',
        message: err?.response?.data?.message || 'Terjadi kesalahan saat menyimpan kategori.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const deleteCategory = async (id: number) => {
    const confirmed = await showConfirm({
      title: 'Hapus Kategori?',
      message: 'Apakah Anda yakin ingin menghapus kategori produk ini?',
      type: 'danger',
      confirmText: 'Ya, Hapus',
    });
    if (!confirmed) return;

    try {
      await productService.deleteCategory(id);
      showToast('Kategori berhasil dihapus', 'info');
      const cRes = await productService.getCategories();
      setCategories(cRes);
    } catch (err: any) {
      await showAlert({
        title: 'Gagal Menghapus Kategori',
        message: err?.response?.data?.message || 'Terjadi kesalahan saat menghapus kategori.',
        type: 'error',
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold text-text-main mb-1">Master Produk & Finishing</h1>
          <p className="text-text-muted text-sm">Kelola katalog produk percetakan, variasi, finishing, dan kategori harga.</p>
        </div>
        <button 
          onClick={fetchAllData} 
          className="flex items-center gap-2 px-4 py-2.5 font-bold skeuo-button text-text-main text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Segarkan
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl skeuo-inset bg-red-50 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex gap-3 mb-6 border-b border-black/5 dark:border-white/10 pb-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'products' ? 'skeuo-inset text-brand-600' : 'skeuo-button text-text-muted hover:text-text-main'
          }`}
        >
          <Tag className="w-4 h-4" />
          Katalog Produk
        </button>
        <button
          onClick={() => setActiveTab('variants')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'variants' ? 'skeuo-inset text-brand-600' : 'skeuo-button text-text-muted hover:text-text-main'
          }`}
        >
          <Layers className="w-4 h-4" />
          Varian Produk
        </button>
        <button
          onClick={() => setActiveTab('addons')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'addons' ? 'skeuo-inset text-brand-600' : 'skeuo-button text-text-muted hover:text-text-main'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Finishing & Add-on
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'categories' ? 'skeuo-inset text-brand-600' : 'skeuo-button text-text-muted hover:text-text-main'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          Kategori Produk
        </button>
      </div>

      {/* Tab 1: Products */}
      {activeTab === 'products' && (
        <ProductListTab
          products={products}
          categories={categories}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearchKeyDown={e => e.key === 'Enter' && fetchAllData()}
          onOpenAddModal={() => {
            setPForm({
              name: '',
              category_id: categories[0]?.id,
              price_type: 'FIXED',
              default_price: 0,
              min_price: 0,
              max_price: 0,
              min_order: 1,
              unit_name: 'pcs',
              has_variants: false,
              raw_material_id: undefined,
              material_amount: 1,
            });
            setProductModal({ open: true, item: null });
          }}
          onOpenEditModal={p => {
            setPForm({
              name: p.name,
              category_id: p.category_id || undefined,
              price_type: p.price_type,
              default_price: Number(p.default_price),
              min_price: Number(p.min_price),
              max_price: Number(p.max_price),
              min_order: p.min_order,
              unit_name: p.unit_name,
              has_variants: p.has_variants,
              raw_material_id: p.raw_material_id || undefined,
              material_amount: p.material_amount ? Number(p.material_amount) : 1,
            });
            setProductModal({ open: true, item: p });
          }}
          onDeleteProduct={deleteProduct}
        />
      )}

      {/* Tab 2: Variants */}
      {activeTab === 'variants' && (
        <VariantListTab
          products={products}
          selectedProductId={selectedProductId}
          onSelectProduct={setSelectedProductId}
          variants={variants}
          onOpenAddModal={() => {
            setVForm({
              variant_name: '',
              price_type: 'FIXED',
              price: 0,
              min_price: 0,
              max_price: 0,
              raw_material_id: undefined,
              material_amount: 1,
            });
            setVariantModal({ open: true, item: null });
          }}
          onOpenEditModal={v => {
            setVForm({
              variant_name: v.variant_name,
              price_type: v.price_type,
              price: Number(v.price),
              min_price: Number(v.min_price),
              max_price: Number(v.max_price),
              raw_material_id: v.raw_material_id || undefined,
              material_amount: v.material_amount ? Number(v.material_amount) : 1,
            });
            setVariantModal({ open: true, item: v });
          }}
          onDeleteVariant={deleteVariant}
        />
      )}

      {/* Tab 3: Addons */}
      {activeTab === 'addons' && (
        <AddonListTab
          addons={addons}
          onOpenAddModal={() => {
            setAForm({
              name: '',
              category_id: null,
              price_type: 'FIXED',
              default_price: 0,
              min_price: 0,
              max_price: 0,
            });
            setAddonModal({ open: true, item: null });
          }}
          onOpenEditModal={a => {
            setAForm({
              name: a.name,
              category_id: a.category_id || null,
              price_type: a.price_type,
              default_price: Number(a.default_price),
              min_price: Number(a.min_price),
              max_price: Number(a.max_price),
            });
            setAddonModal({ open: true, item: a });
          }}
          onDeleteAddon={deleteAddon}
        />
      )}

      {/* Tab 4: Categories */}
      {activeTab === 'categories' && (
        <CategoryListTab
          categories={categories}
          onOpenAddModal={() => {
            setCForm({ name: '' });
            setCategoryModal({ open: true, item: null });
          }}
          onOpenEditModal={c => {
            setCForm({ name: c.name });
            setCategoryModal({ open: true, item: c });
          }}
          onDeleteCategory={deleteCategory}
        />
      )}

      {/* Modals */}
      <ProductFormModal
        isOpen={productModal.open}
        item={productModal.item || null}
        categories={categories}
        rawMaterials={rawMaterials}
        formData={pForm}
        onChange={(field, value) => setPForm(prev => ({ ...prev, [field]: value }))}
        submitting={submitting}
        onClose={() => setProductModal({ open: false })}
        onSubmit={handleProductSubmit}
      />

      <VariantFormModal
        isOpen={variantModal.open}
        item={variantModal.item || null}
        rawMaterials={rawMaterials}
        formData={vForm}
        onChange={(field, value) => setVForm(prev => ({ ...prev, [field]: value }))}
        submitting={submitting}
        onClose={() => setVariantModal({ open: false })}
        onSubmit={handleVariantSubmit}
      />

      <AddonFormModal
        isOpen={addonModal.open}
        item={addonModal.item || null}
        categories={categories}
        formData={aForm}
        onChange={(field, value) => setAForm(prev => ({ ...prev, [field]: value }))}
        submitting={submitting}
        onClose={() => setAddonModal({ open: false })}
        onSubmit={handleAddonSubmit}
      />

      <CategoryFormModal
        isOpen={categoryModal.open}
        item={categoryModal.item || null}
        name={cForm.name}
        onChangeName={val => setCForm({ name: val })}
        submitting={submitting}
        onClose={() => setCategoryModal({ open: false })}
        onSubmit={handleCategorySubmit}
      />
    </DashboardLayout>
  );
}
