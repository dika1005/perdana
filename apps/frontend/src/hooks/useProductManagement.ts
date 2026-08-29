import { useState, useEffect, useCallback } from 'react';
import { Product, ProductVariant, ProductAddon, PriceType, RangePriceType } from '../types/product';
import { Category } from '../types/category';
import { RawMaterial } from '../types/rawMaterial';
import { productService } from '../services/productService';
import { rawMaterialService } from '../services/rawMaterialService';
import { useAlert } from '../context/AlertContext';

export function useProductManagement() {
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
      setError(err?.response?.data?.message || 'Gagal mengambil data produk');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [searchTerm]);

  const fetchVariants = useCallback(async (prodId: number) => {
    try {
      const data = await productService.getVariants(prodId);
      setVariants(data);
    } catch (err) {
      console.error('Error fetching variants:', err);
    }
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      fetchVariants(selectedProductId);
    } else {
      setVariants([]);
    }
  }, [selectedProductId, fetchVariants]);

  // Product Handlers
  const handleOpenProductModal = (prod?: Product) => {
    if (prod) {
      setPForm({
        name: prod.name,
        category_id: prod.category_id || undefined,
        price_type: prod.price_type,
        default_price: Number(prod.default_price) || 0,
        min_price: Number(prod.min_price) || 0,
        max_price: Number(prod.max_price) || 0,
        min_order: prod.min_order || 1,
        unit_name: prod.unit_name || 'pcs',
        has_variants: prod.has_variants || false,
        raw_material_id: prod.raw_material_id || undefined,
        material_amount: Number(prod.material_amount) || 1,
      });
      setProductModal({ open: true, item: prod });
    } else {
      setPForm({
        name: '',
        category_id: categories.length > 0 ? categories[0].id : undefined,
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
    }
  };

  const handlePFormChange = (field: string, value: any) => {
    setPForm(prev => ({ ...prev, [field]: value }));
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (productModal.item) {
        await productService.updateProduct(productModal.item.id, pForm);
        showToast('Produk berhasil diperbarui', 'success');
      } else {
        await productService.createProduct(pForm);
        showToast('Produk baru berhasil ditambahkan', 'success');
      }
      setProductModal({ open: false });
      fetchAllData();
    } catch (err: any) {
      showAlert({
        title: 'Gagal Menyimpan',
        message: err?.response?.data?.message || 'Terjadi kesalahan saat menyimpan produk',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    const ok = await showConfirm({
      title: 'Hapus Produk?',
      message: 'Apakah Anda yakin ingin menghapus produk ini? Semua varian terkait juga akan terhapus.',
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      type: 'danger',
    });
    if (!ok) return;

    try {
      await productService.deleteProduct(id);
      showToast('Produk berhasil dihapus', 'success');
      fetchAllData();
    } catch (err: any) {
      showAlert({
        title: 'Gagal Menghapus',
        message: err?.response?.data?.message || 'Produk tidak dapat dihapus.',
        type: 'error',
      });
    }
  };

  // Variant Handlers
  const handleOpenVariantModal = (v?: ProductVariant) => {
    if (v) {
      setVForm({
        variant_name: v.variant_name,
        price_type: v.price_type,
        price: Number(v.price) || 0,
        min_price: Number(v.min_price) || 0,
        max_price: Number(v.max_price) || 0,
        raw_material_id: v.raw_material_id || undefined,
        material_amount: Number(v.material_amount) || 1,
      });
      setVariantModal({ open: true, item: v });
    } else {
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
    }
  };

  const handleVFormChange = (field: string, value: any) => {
    setVForm(prev => ({ ...prev, [field]: value }));
  };

  const handleVariantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;
    setSubmitting(true);
    try {
      if (variantModal.item) {
        await productService.updateVariant(variantModal.item.id, vForm);
        showToast('Varian berhasil diperbarui', 'success');
      } else {
        await productService.createVariant(selectedProductId, vForm);
        showToast('Varian berhasil ditambahkan', 'success');
      }
      setVariantModal({ open: false });
      fetchVariants(selectedProductId);
    } catch (err: any) {
      showAlert({
        title: 'Gagal Menyimpan Varian',
        message: err?.response?.data?.message || 'Terjadi kesalahan saat menyimpan varian',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVariant = async (id: number) => {
    const ok = await showConfirm({
      title: 'Hapus Varian?',
      message: 'Apakah Anda yakin ingin menghapus varian ini?',
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      type: 'danger',
    });
    if (!ok) return;

    try {
      await productService.deleteVariant(id);
      showToast('Varian berhasil dihapus', 'success');
      if (selectedProductId) fetchVariants(selectedProductId);
    } catch (err: any) {
      showAlert({
        title: 'Gagal Menghapus Varian',
        message: err?.response?.data?.message || 'Varian tidak dapat dihapus.',
        type: 'error',
      });
    }
  };

  // Addon Handlers
  const handleOpenAddonModal = (a?: ProductAddon) => {
    if (a) {
      setAForm({
        name: a.name,
        category_id: a.category_id !== undefined ? a.category_id : null,
        price_type: a.price_type,
        default_price: Number(a.default_price) || 0,
        min_price: Number(a.min_price) || 0,
        max_price: Number(a.max_price) || 0,
      });
      setAddonModal({ open: true, item: a });
    } else {
      setAForm({
        name: '',
        category_id: null,
        price_type: 'FIXED',
        default_price: 0,
        min_price: 0,
        max_price: 0,
      });
      setAddonModal({ open: true, item: null });
    }
  };

  const handleAFormChange = (field: string, value: any) => {
    setAForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAddonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (addonModal.item) {
        await productService.updateAddon(addonModal.item.id, aForm);
        showToast('Finishing / Addon berhasil diperbarui', 'success');
      } else {
        await productService.createAddon(aForm);
        showToast('Finishing / Addon berhasil ditambahkan', 'success');
      }
      setAddonModal({ open: false });
      fetchAllData();
    } catch (err: any) {
      showAlert({
        title: 'Gagal Menyimpan',
        message: err?.response?.data?.message || 'Terjadi kesalahan saat menyimpan addon',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAddon = async (id: number) => {
    const ok = await showConfirm({
      title: 'Hapus Finishing / Addon?',
      message: 'Apakah Anda yakin ingin menghapus opsi finishing ini?',
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      type: 'danger',
    });
    if (!ok) return;

    try {
      await productService.deleteAddon(id);
      showToast('Addon berhasil dihapus', 'success');
      fetchAllData();
    } catch (err: any) {
      showAlert({
        title: 'Gagal Menghapus',
        message: err?.response?.data?.message || 'Addon tidak dapat dihapus.',
        type: 'error',
      });
    }
  };

  // Category Handlers
  const handleOpenCategoryModal = (c?: Category) => {
    if (c) {
      setCForm({ name: c.name });
      setCategoryModal({ open: true, item: c });
    } else {
      setCForm({ name: '' });
      setCategoryModal({ open: true, item: null });
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (categoryModal.item) {
        await productService.updateCategory(categoryModal.item.id, cForm);
        showToast('Kategori berhasil diperbarui', 'success');
      } else {
        await productService.createCategory(cForm);
        showToast('Kategori berhasil ditambahkan', 'success');
      }
      setCategoryModal({ open: false });
      fetchAllData();
    } catch (err: any) {
      showAlert({
        title: 'Gagal Menyimpan',
        message: err?.response?.data?.message || 'Terjadi kesalahan saat menyimpan kategori',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    const ok = await showConfirm({
      title: 'Hapus Kategori?',
      message: 'Apakah Anda yakin ingin menghapus kategori ini?',
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      type: 'danger',
    });
    if (!ok) return;

    try {
      await productService.deleteCategory(id);
      showToast('Kategori berhasil dihapus', 'success');
      fetchAllData();
    } catch (err: any) {
      showAlert({
        title: 'Gagal Menghapus',
        message: err?.response?.data?.message || 'Kategori tidak dapat dihapus.',
        type: 'error',
      });
    }
  };

  return {
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
  };
}
