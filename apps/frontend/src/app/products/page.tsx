'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { 
  Tag, 
  Layers, 
  Sparkles, 
  FolderTree, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  RefreshCw, 
  X, 
  Check 
} from 'lucide-react';
import { productService } from '../../services/productService';
import { Product, ProductVariant, ProductAddon, PriceType, RangePriceType } from '../../types/product';
import { Category } from '../../types/category';

export default function ProductsMasterPage() {
  const [activeTab, setActiveTab] = useState<'products' | 'variants' | 'addons' | 'categories'>('products');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [addons, setAddons] = useState<ProductAddon[]>([]);
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
  });

  const [vForm, setVForm] = useState({
    variant_name: '',
    price_type: 'FIXED' as RangePriceType,
    price: 0,
    min_price: 0,
    max_price: 0,
  });

  const [aForm, setAForm] = useState({
    name: '',
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
      const [pRes, cRes, aRes] = await Promise.all([
        productService.getProducts({ search: searchTerm || undefined }),
        productService.getCategories(),
        productService.getAddons(),
      ]);
      setProducts(pRes.data);
      setCategories(cRes);
      setAddons(aRes);

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

  // Product Submit
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (productModal.item) {
        await productService.updateProduct(productModal.item.id, pForm);
      } else {
        await productService.createProduct(pForm);
      }
      setProductModal({ open: false });
      await fetchAllData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal menyimpan produk');
    } finally {
      setSubmitting(false);
    }
  };

  // Variant Submit
  const handleVariantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;
    setSubmitting(true);
    try {
      if (variantModal.item) {
        await productService.updateVariant(variantModal.item.id, vForm);
      } else {
        await productService.createVariant(selectedProductId, vForm);
      }
      setVariantModal({ open: false });
      await fetchVariants(selectedProductId);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal menyimpan varian');
    } finally {
      setSubmitting(false);
    }
  };

  // Addon Submit
  const handleAddonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (addonModal.item) {
        await productService.updateAddon(addonModal.item.id, aForm);
      } else {
        await productService.createAddon(aForm);
      }
      setAddonModal({ open: false });
      const aRes = await productService.getAddons();
      setAddons(aRes);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal menyimpan add-on');
    } finally {
      setSubmitting(false);
    }
  };

  // Category Submit
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (categoryModal.item) {
        await productService.updateCategory(categoryModal.item.id, cForm);
      } else {
        await productService.createCategory(cForm);
      }
      setCategoryModal({ open: false });
      const cRes = await productService.getCategories();
      setCategories(cRes);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal menyimpan kategori');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteProduct = async (id: number) => {
    if (!confirm('Hapus produk ini beserta seluruh variannya?')) return;
    try {
      await productService.deleteProduct(id);
      await fetchAllData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal menghapus produk');
    }
  };

  const deleteVariant = async (id: number) => {
    if (!confirm('Hapus varian ini?')) return;
    try {
      await productService.deleteVariant(id);
      if (selectedProductId) await fetchVariants(selectedProductId);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal menghapus varian');
    }
  };

  const deleteAddon = async (id: number) => {
    if (!confirm('Hapus add-on/finishing ini?')) return;
    try {
      await productService.deleteAddon(id);
      const aRes = await productService.getAddons();
      setAddons(aRes);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal menghapus add-on');
    }
  };

  const deleteCategory = async (id: number) => {
    if (!confirm('Hapus kategori ini?')) return;
    try {
      await productService.deleteCategory(id);
      const cRes = await productService.getCategories();
      setCategories(cRes);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal menghapus kategori');
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

      {/* Tabs */}
      <div className="flex gap-3 mb-6 border-b border-black/5 dark:border-white/10 pb-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'products' ? 'skeuo-inset text-brand-600' : 'skeuo-button text-text-muted hover:text-text-main'
          }`}
        >
          <Tag className="w-4 h-4" />
          Katalog Produk Cetak
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
          Add-ons & Finishing
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
        <div className="skeuo p-6">
          <div className="flex justify-between items-center mb-6 gap-4">
            <div className="flex-1 max-w-md flex items-center gap-3 px-4 py-2.5 skeuo-inset">
              <Search className="w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Cari produk..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchAllData()}
                className="bg-transparent border-none outline-none w-full text-sm text-text-main"
              />
            </div>
            <button
              onClick={() => {
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
                });
                setProductModal({ open: true, item: null });
              }}
              className="flex items-center gap-2 px-5 py-2.5 font-bold skeuo-button text-brand-600 text-sm"
            >
              <Plus className="w-4 h-4" />
              Tambah Produk
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-text-muted/20 text-xs font-bold text-text-muted">
                  <th className="pb-3">Nama Produk</th>
                  <th className="pb-3">Kategori</th>
                  <th className="pb-3">Tipe Harga</th>
                  <th className="pb-3">Harga Default</th>
                  <th className="pb-3">Min. Order</th>
                  <th className="pb-3">Varian?</th>
                  <th className="pb-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-text-muted text-xs">
                      Belum ada produk di database.
                    </td>
                  </tr>
                ) : (
                  products.map(p => {
                    const cat = categories.find(c => c.id === p.category_id);
                    return (
                      <tr key={p.id} className="border-b border-text-muted/10 last:border-0 hover:bg-white/10 transition-colors">
                        <td className="py-3.5 font-bold text-text-main">{p.name}</td>
                        <td className="py-3.5 text-text-muted text-xs">{cat?.name || '-'}</td>
                        <td className="py-3.5">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold skeuo-inset text-brand-600">
                            {p.price_type}
                          </span>
                        </td>
                        <td className="py-3.5 font-bold text-brand-600">
                          Rp {Number(p.default_price).toLocaleString('id-ID')}
                        </td>
                        <td className="py-3.5 text-text-muted text-xs">
                          {p.min_order} {p.unit_name}
                        </td>
                        <td className="py-3.5 text-xs">
                          {p.has_variants ? (
                            <span className="text-emerald-500 font-bold">Ya</span>
                          ) : (
                            <span className="text-text-muted">Tidak</span>
                          )}
                        </td>
                        <td className="py-3.5 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
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
                                });
                                setProductModal({ open: true, item: p });
                              }}
                              className="w-8 h-8 flex items-center justify-center skeuo-button text-brand-500 rounded-lg"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteProduct(p.id)}
                              className="w-8 h-8 flex items-center justify-center skeuo-button text-red-400 hover:text-red-500 rounded-lg"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Variants */}
      {activeTab === 'variants' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List Produk Induk */}
          <div className="skeuo p-6">
            <h2 className="text-base font-bold text-text-main mb-4">Pilih Produk Induk</h2>
            <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
              {products.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProductId(p.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all font-semibold text-sm ${
                    selectedProductId === p.id 
                      ? 'skeuo-inset text-brand-600 font-bold' 
                      : 'skeuo-button text-text-muted hover:text-text-main'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="truncate">{p.name}</span>
                    {p.has_variants && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-50 text-brand-600 font-bold">Varian</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Tabel Varian */}
          <div className="lg:col-span-2 skeuo p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-base font-bold text-text-main">
                  Daftar Varian: {products.find(p => p.id === selectedProductId)?.name || '-'}
                </h2>
                <p className="text-xs text-text-muted">Kelola opsi ukuran, ketebalan, atau tipe cetak varian.</p>
              </div>
              <button
                onClick={() => {
                  setVForm({
                    variant_name: '',
                    price_type: 'FIXED',
                    price: 0,
                    min_price: 0,
                    max_price: 0,
                  });
                  setVariantModal({ open: true, item: null });
                }}
                disabled={!selectedProductId}
                className="flex items-center gap-2 px-4 py-2 font-bold skeuo-button text-brand-600 text-sm disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                Tambah Varian
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-text-muted/20 text-xs font-bold text-text-muted">
                    <th className="pb-3">Nama Varian</th>
                    <th className="pb-3">Tipe Harga</th>
                    <th className="pb-3">Harga</th>
                    <th className="pb-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {variants.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-text-muted text-xs">
                        Produk ini belum memiliki varian. Klik 'Tambah Varian' di atas.
                      </td>
                    </tr>
                  ) : (
                    variants.map(v => (
                      <tr key={v.id} className="border-b border-text-muted/10 last:border-0 hover:bg-white/10 transition-colors">
                        <td className="py-3 font-bold text-text-main">{v.variant_name}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold skeuo-inset text-brand-600">
                            {v.price_type}
                          </span>
                        </td>
                        <td className="py-3 font-bold text-brand-600">
                          {v.price_type === 'RANGE' 
                            ? `Rp ${Number(v.min_price).toLocaleString('id-ID')} - ${Number(v.max_price).toLocaleString('id-ID')}`
                            : `Rp ${Number(v.price).toLocaleString('id-ID')}`}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setVForm({
                                  variant_name: v.variant_name,
                                  price_type: v.price_type,
                                  price: Number(v.price),
                                  min_price: Number(v.min_price),
                                  max_price: Number(v.max_price),
                                });
                                setVariantModal({ open: true, item: v });
                              }}
                              className="w-8 h-8 flex items-center justify-center skeuo-button text-brand-500 rounded-lg"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteVariant(v.id)}
                              className="w-8 h-8 flex items-center justify-center skeuo-button text-red-400 hover:text-red-500 rounded-lg"
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
      )}

      {/* Tab 3: Addons */}
      {activeTab === 'addons' && (
        <div className="skeuo p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-base font-bold text-text-main">Master Finishing & Add-ons</h2>
              <p className="text-xs text-text-muted">Finishing percetakan: Laminasi Doff/Glossy, Spiral, Pond, dsb.</p>
            </div>
            <button
              onClick={() => {
                setAForm({
                  name: '',
                  price_type: 'FIXED',
                  default_price: 0,
                  min_price: 0,
                  max_price: 0,
                });
                setAddonModal({ open: true, item: null });
              }}
              className="flex items-center gap-2 px-5 py-2.5 font-bold skeuo-button text-brand-600 text-sm"
            >
              <Plus className="w-4 h-4" />
              Tambah Add-on
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-text-muted/20 text-xs font-bold text-text-muted">
                  <th className="pb-3">Nama Finishing / Add-on</th>
                  <th className="pb-3">Tipe Harga</th>
                  <th className="pb-3">Harga</th>
                  <th className="pb-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {addons.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-text-muted text-xs">
                      Belum ada opsi finishing / add-on.
                    </td>
                  </tr>
                ) : (
                  addons.map(a => (
                    <tr key={a.id} className="border-b border-text-muted/10 last:border-0 hover:bg-white/10 transition-colors">
                      <td className="py-3 font-bold text-text-main">{a.name}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold skeuo-inset text-brand-600">
                          {a.price_type}
                        </span>
                      </td>
                      <td className="py-3 font-bold text-brand-600">
                        {a.price_type === 'RANGE' 
                          ? `Rp ${Number(a.min_price).toLocaleString('id-ID')} - ${Number(a.max_price).toLocaleString('id-ID')}`
                          : `Rp ${Number(a.default_price).toLocaleString('id-ID')}`}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setAForm({
                                name: a.name,
                                price_type: a.price_type,
                                default_price: Number(a.default_price),
                                min_price: Number(a.min_price),
                                max_price: Number(a.max_price),
                              });
                              setAddonModal({ open: true, item: a });
                            }}
                            className="w-8 h-8 flex items-center justify-center skeuo-button text-brand-500 rounded-lg"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteAddon(a.id)}
                            className="w-8 h-8 flex items-center justify-center skeuo-button text-red-400 hover:text-red-500 rounded-lg"
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
      )}

      {/* Tab 4: Categories */}
      {activeTab === 'categories' && (
        <div className="skeuo p-6 max-w-2xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-base font-bold text-text-main">Kategori Produk</h2>
              <p className="text-xs text-text-muted">Pengelompokan produk cetak (Banner, Stiker, Undangan, Brosur, dll).</p>
            </div>
            <button
              onClick={() => {
                setCForm({ name: '' });
                setCategoryModal({ open: true, item: null });
              }}
              className="flex items-center gap-2 px-5 py-2.5 font-bold skeuo-button text-brand-600 text-sm"
            >
              <Plus className="w-4 h-4" />
              Tambah Kategori
            </button>
          </div>

          <div className="space-y-3">
            {categories.map(c => (
              <div key={c.id} className="flex justify-between items-center p-3.5 rounded-xl skeuo-inset">
                <span className="font-bold text-sm text-text-main">{c.name}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setCForm({ name: c.name });
                      setCategoryModal({ open: true, item: c });
                    }}
                    className="w-8 h-8 flex items-center justify-center skeuo-button text-brand-500 rounded-lg"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteCategory(c.id)}
                    className="w-8 h-8 flex items-center justify-center skeuo-button text-red-400 hover:text-red-500 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Produk */}
      {productModal.open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleProductSubmit} className="skeuo p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-bold text-text-main">
                {productModal.item ? 'Edit Produk' : 'Tambah Produk Baru'}
              </h2>
              <button type="button" onClick={() => setProductModal({ open: false })} className="text-text-muted hover:text-text-main">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Nama Produk *</label>
                <input
                  type="text"
                  required
                  value={pForm.name}
                  onChange={e => setPForm({ ...pForm, name: e.target.value })}
                  placeholder="Contoh: Banner Flexi 280gr"
                  className="w-full px-4 py-2.5 skeuo-inset outline-none text-text-main rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Kategori Produk</label>
                <select
                  value={pForm.category_id || ''}
                  onChange={e => setPForm({ ...pForm, category_id: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-4 py-2.5 skeuo outline-none text-text-main rounded-xl bg-transparent font-medium"
                >
                  <option value="">Tanpa Kategori</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">Tipe Harga</label>
                  <select
                    value={pForm.price_type}
                    onChange={e => setPForm({ ...pForm, price_type: e.target.value as PriceType })}
                    className="w-full px-4 py-2.5 skeuo outline-none text-text-main rounded-xl bg-transparent font-medium"
                  >
                    <option value="FIXED">FIXED (Harga Tetap)</option>
                    <option value="RANGE">RANGE (Rentang)</option>
                    <option value="CUSTOM">CUSTOM (Fleksibel)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">Harga Default (Rp)</label>
                  <input
                    type="number"
                    value={pForm.default_price}
                    onChange={e => setPForm({ ...pForm, default_price: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 skeuo-inset outline-none text-text-main rounded-xl font-bold"
                  />
                </div>
              </div>

              {pForm.price_type === 'RANGE' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-1">Harga Minimum (Rp)</label>
                    <input
                      type="number"
                      value={pForm.min_price}
                      onChange={e => setPForm({ ...pForm, min_price: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 skeuo-inset outline-none text-text-main rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-1">Harga Maksimum (Rp)</label>
                    <input
                      type="number"
                      value={pForm.max_price}
                      onChange={e => setPForm({ ...pForm, max_price: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 skeuo-inset outline-none text-text-main rounded-xl"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">Min. Order</label>
                  <input
                    type="number"
                    min="1"
                    value={pForm.min_order}
                    onChange={e => setPForm({ ...pForm, min_order: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 skeuo-inset outline-none text-text-main rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">Satuan</label>
                  <input
                    type="text"
                    value={pForm.unit_name}
                    onChange={e => setPForm({ ...pForm, unit_name: e.target.value })}
                    placeholder="pcs / meter / rim / lembar"
                    className="w-full px-4 py-2.5 skeuo-inset outline-none text-text-main rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="has_variants"
                  checked={pForm.has_variants}
                  onChange={e => setPForm({ ...pForm, has_variants: e.target.checked })}
                  className="w-4 h-4 rounded text-brand-600"
                />
                <label htmlFor="has_variants" className="text-xs font-semibold text-text-main cursor-pointer">
                  Produk memiliki varian ukuran/tipe berbeda
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setProductModal({ open: false })}
                className="flex-1 py-2.5 font-bold skeuo-button text-text-muted text-sm"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 font-bold skeuo-button text-brand-600 text-sm"
              >
                {submitting ? 'Menyimpan...' : 'Simpan Produk'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Varian */}
      {variantModal.open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleVariantSubmit} className="skeuo p-8 w-full max-w-md">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-bold text-text-main">
                {variantModal.item ? 'Edit Varian' : 'Tambah Varian Baru'}
              </h2>
              <button type="button" onClick={() => setVariantModal({ open: false })} className="text-text-muted hover:text-text-main">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Nama Varian *</label>
                <input
                  type="text"
                  required
                  value={vForm.variant_name}
                  onChange={e => setVForm({ ...vForm, variant_name: e.target.value })}
                  placeholder="Contoh: Glossy 260gr / Ukuran A3+"
                  className="w-full px-4 py-2.5 skeuo-inset outline-none text-text-main rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Tipe Harga</label>
                <select
                  value={vForm.price_type}
                  onChange={e => setVForm({ ...vForm, price_type: e.target.value as RangePriceType })}
                  className="w-full px-4 py-2.5 skeuo outline-none text-text-main rounded-xl bg-transparent font-medium"
                >
                  <option value="FIXED">FIXED (Harga Tetap)</option>
                  <option value="RANGE">RANGE (Rentang)</option>
                </select>
              </div>

              {vForm.price_type === 'FIXED' ? (
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">Harga Varian (Rp)</label>
                  <input
                    type="number"
                    value={vForm.price}
                    onChange={e => setVForm({ ...vForm, price: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 skeuo-inset outline-none text-text-main rounded-xl font-bold"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-1">Min. Harga (Rp)</label>
                    <input
                      type="number"
                      value={vForm.min_price}
                      onChange={e => setVForm({ ...vForm, min_price: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 skeuo-inset outline-none text-text-main rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-1">Max. Harga (Rp)</label>
                    <input
                      type="number"
                      value={vForm.max_price}
                      onChange={e => setVForm({ ...vForm, max_price: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 skeuo-inset outline-none text-text-main rounded-xl"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setVariantModal({ open: false })}
                className="flex-1 py-2.5 font-bold skeuo-button text-text-muted text-sm"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 font-bold skeuo-button text-brand-600 text-sm"
              >
                {submitting ? 'Menyimpan...' : 'Simpan Varian'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Addon */}
      {addonModal.open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleAddonSubmit} className="skeuo p-8 w-full max-w-md">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-bold text-text-main">
                {addonModal.item ? 'Edit Add-on' : 'Tambah Add-on / Finishing'}
              </h2>
              <button type="button" onClick={() => setAddonModal({ open: false })} className="text-text-muted hover:text-text-main">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Nama Finishing *</label>
                <input
                  type="text"
                  required
                  value={aForm.name}
                  onChange={e => setAForm({ ...aForm, name: e.target.value })}
                  placeholder="Contoh: Laminasi Doff / Spot UV"
                  className="w-full px-4 py-2.5 skeuo-inset outline-none text-text-main rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Tipe Harga</label>
                <select
                  value={aForm.price_type}
                  onChange={e => setAForm({ ...aForm, price_type: e.target.value as RangePriceType })}
                  className="w-full px-4 py-2.5 skeuo outline-none text-text-main rounded-xl bg-transparent font-medium"
                >
                  <option value="FIXED">FIXED (Harga Tetap)</option>
                  <option value="RANGE">RANGE (Rentang)</option>
                </select>
              </div>

              {aForm.price_type === 'FIXED' ? (
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">Tarif Finishing (Rp)</label>
                  <input
                    type="number"
                    value={aForm.default_price}
                    onChange={e => setAForm({ ...aForm, default_price: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 skeuo-inset outline-none text-text-main rounded-xl font-bold"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-1">Min. Tarif (Rp)</label>
                    <input
                      type="number"
                      value={aForm.min_price}
                      onChange={e => setAForm({ ...aForm, min_price: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 skeuo-inset outline-none text-text-main rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-1">Max. Tarif (Rp)</label>
                    <input
                      type="number"
                      value={aForm.max_price}
                      onChange={e => setAForm({ ...aForm, max_price: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 skeuo-inset outline-none text-text-main rounded-xl"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setAddonModal({ open: false })}
                className="flex-1 py-2.5 font-bold skeuo-button text-text-muted text-sm"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 font-bold skeuo-button text-brand-600 text-sm"
              >
                {submitting ? 'Menyimpan...' : 'Simpan Add-on'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Kategori */}
      {categoryModal.open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCategorySubmit} className="skeuo p-8 w-full max-w-md">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-bold text-text-main">
                {categoryModal.item ? 'Edit Kategori' : 'Tambah Kategori Baru'}
              </h2>
              <button type="button" onClick={() => setCategoryModal({ open: false })} className="text-text-muted hover:text-text-main">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Nama Kategori *</label>
                <input
                  type="text"
                  required
                  value={cForm.name}
                  onChange={e => setCForm({ name: e.target.value })}
                  placeholder="Contoh: Spanduk & Banner"
                  className="w-full px-4 py-2.5 skeuo-inset outline-none text-text-main rounded-xl"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setCategoryModal({ open: false })}
                className="flex-1 py-2.5 font-bold skeuo-button text-text-muted text-sm"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 font-bold skeuo-button text-brand-600 text-sm"
              >
                {submitting ? 'Menyimpan...' : 'Simpan Kategori'}
              </button>
            </div>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
}
