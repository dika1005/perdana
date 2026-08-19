'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { 
  Search, Phone, MapPin, LogIn, Layers, Printer, X, Sun, Moon,
  RefreshCw, ChevronDown, ChevronUp, Star, Zap, Clock, Shield,
  CheckCircle2, MessageSquare, Sparkles, Package, Truck, HelpCircle, Award, Check,
  FileText, Tag, ShoppingBag, FolderTree, ArrowUpDown, Filter
} from 'lucide-react';
import { publicService, PublicCatalog, PublicProduct } from '../services/publicService';

// Standard Printing Services with description & keyword matcher
const PRESET_SERVICES = [
  {
    id: 'banner',
    name: 'Banner & Spanduk',
    desc: 'Cetak Flexi 280g, 340g, Korcin, X-Banner, Roll-up banner untuk kebutuhan promosi luar & dalam ruangan.',
    icon: Printer,
    color: 'from-blue-500 to-indigo-600',
    tag: 'Same Day',
    matchKeyword: 'spanduk,banner,flexi,baliho'
  },
  {
    id: 'stiker',
    name: 'Stiker & Label Produk',
    desc: 'Stiker Vinyl, Chromo, Transparan, & Hologram dengan opsi cutting kiss-cut atau die-cut presisi.',
    icon: Tag,
    color: 'from-emerald-500 to-teal-600',
    tag: 'Custom Cutting',
    matchKeyword: 'stiker,sticker,label,chromo,vinyl'
  },
  {
    id: 'kartu',
    name: 'Kartu Nama & ID Card',
    desc: 'Art Carton tebal 260-310gsm dengan laminasi doff/glossy, serta ID Card PVC tahan air dan anti luntur.',
    icon: FileText,
    color: 'from-violet-500 to-purple-600',
    tag: 'Premium Finish',
    matchKeyword: 'kartu,card,id card,member,pvc'
  },
  {
    id: 'brosur',
    name: 'Brosur & Flyer Promosi',
    desc: 'Cetak digital & offset A4/A5, brosur lipat 2/3 dengan warna CMYK tajam dan detail tinggi.',
    icon: Layers,
    color: 'from-amber-500 to-orange-600',
    tag: 'Cetak Cepat',
    matchKeyword: 'brosur,flyer,pamflet,poster,leaflet'
  },
  {
    id: 'undangan',
    name: 'Undangan & Souvenir',
    desc: 'Cetak undangan pernikahan, khitan, event resmi, serta souvenir mug, gantungan kunci, dan merchandise.',
    icon: Sparkles,
    color: 'from-rose-500 to-pink-600',
    tag: 'Desain Elegan',
    matchKeyword: 'undangan,souvenir,mug,gantungan,merchandise'
  },
  {
    id: 'buku',
    name: 'Buku, Yasin & Jilid',
    desc: 'Buku Yasin, majalah, nota NCR rangkap, kalender tahunan, dan aneka penjilidan spiral kawat / lem panas.',
    icon: Package,
    color: 'from-cyan-500 to-blue-600',
    tag: 'Hard / Softcover',
    matchKeyword: 'buku,yasin,nota,ncr,kalender,majalah,jilid'
  }
];

type SortOption = 'default' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'custom_size';

export default function HomePage() {
  const [catalog, setCatalog] = useState<PublicCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState<number | undefined>(undefined);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const catalogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  useEffect(() => {
    const fetchCatalog = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await publicService.getCatalog();
        setCatalog(data);
      } catch (err: any) {
        console.error('Failed to load public catalog:', err);
        setError('Gagal memuat katalog produk. Pastikan server backend aktif.');
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  const scrollToCatalog = () => {
    catalogRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Clean and group categories
  const cleanCategories = useMemo(() => {
    if (!catalog) return [];
    
    // Map categories and clean raw timestamp names
    const categoryMap = new Map<number, { id: number; name: string; count: number }>();
    
    catalog.categories.forEach(c => {
      let cleanName = c.name.replace(/\s*\d{10,}.*$/, '').trim();
      if (!cleanName) cleanName = 'Kategori Umum';
      
      const count = catalog.products.filter(p => p.category_id === c.id).length;
      if (count > 0) {
        categoryMap.set(c.id, { id: c.id, name: cleanName, count });
      }
    });

    return Array.from(categoryMap.values());
  }, [catalog]);

  // Main filtered & sorted product list
  const processedProducts = useMemo(() => {
    if (!catalog) return [];

    let list = [...catalog.products];

    // Filter by active category ID
    if (activeCategoryId !== undefined) {
      list = list.filter(p => p.category_id === activeCategoryId);
    }

    // Filter by service card keyword if selected
    if (selectedServiceId) {
      const service = PRESET_SERVICES.find(s => s.id === selectedServiceId);
      if (service) {
        const keywords = service.matchKeyword.split(',');
        list = list.filter(p => {
          const nameLower = p.name.toLowerCase();
          return keywords.some(k => nameLower.includes(k.trim()));
        });
      }
    }

    // Filter by search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(p => p.name.toLowerCase().includes(q));
    }

    // Sort
    switch (sortBy) {
      case 'price_asc':
        list.sort((a, b) => {
          const priceA = a.price_type === 'RANGE' ? a.min_price : a.default_price;
          const priceB = b.price_type === 'RANGE' ? b.min_price : b.default_price;
          return priceA - priceB;
        });
        break;
      case 'price_desc':
        list.sort((a, b) => {
          const priceA = a.price_type === 'RANGE' ? a.max_price : a.default_price;
          const priceB = b.price_type === 'RANGE' ? b.max_price : b.default_price;
          return priceB - priceA;
        });
        break;
      case 'name_asc':
        list.sort((a, b) => a.name.localeCompare(b.name, 'id'));
        break;
      case 'name_desc':
        list.sort((a, b) => b.name.localeCompare(a.name, 'id'));
        break;
      case 'custom_size':
        list.sort((a, b) => {
          const aIsCustom = a.price_type === 'CUSTOM' || a.unit_name?.toLowerCase().includes('meter') ? 1 : 0;
          const bIsCustom = b.price_type === 'CUSTOM' || b.unit_name?.toLowerCase().includes('meter') ? 1 : 0;
          return bIsCustom - aIsCustom;
        });
        break;
      default:
        // Default order
        break;
    }

    return list;
  }, [catalog, activeCategoryId, selectedServiceId, searchTerm, sortBy]);

  const getCategoryName = (id: number | null) => {
    if (!id || !catalog) return null;
    const found = catalog.categories.find(c => c.id === id);
    if (!found) return null;
    const clean = found.name.replace(/\s*\d{10,}.*$/, '').trim();
    return clean || found.name;
  };

  const formatPrice = (price: number) => `Rp ${Number(price).toLocaleString('id-ID')}`;

  const waLink = (productName: string) => {
    const phone = (catalog?.store.phone || '').replace(/[^0-9]/g, '');
    const message = `Halo ${catalog?.store.name || 'Perdana Printing'},\n\nSaya ingin pesan / konsultasi produk:\n• *${productName}*\n\nMohon info harga dan cara kirim file desain. Terima kasih!`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  const resetAllFilters = () => {
    setActiveCategoryId(undefined);
    setSelectedServiceId(null);
    setSearchTerm('');
    setSortBy('default');
  };

  const faqs = [
    {
      q: 'Format file apa saja yang bisa dikirimkan untuk dicetak?',
      a: 'Kami menerima file PDF, TIFF, JPG/JPEG resolusi tinggi (150-300 DPI), AI (Adobe Illustrator), CDR (CorelDraw), dan PSD. Harap gunakan color profile CMYK agar akurasi warna hasil cetak optimal.'
    },
    {
      q: 'Berapa lama estimasi waktu pengerjaan cetak?',
      a: 'Untuk cetak banner/spanduk standar dan digital print A3+ biasanya bisa selesai dalam hitungan jam atau 1 hari kerja (same-day). Untuk pesanan offset jumlah banyak (undangan, buku, brosur), berkisar 2-5 hari kerja.'
    },
    {
      q: 'Apakah bisa cetak dengan ukuran kustom (bebas meteran)?',
      a: 'Bisa banget! Kami melayani spanduk, banner, stiker meteran, dan poster dengan dimensi panjang x lebar bebas sesuai kebutuhan Anda.'
    },
    {
      q: 'Bagaimana cara pemesanan dan pengiriman?',
      a: 'Cukup pilih produk di katalog, klik tombol "Order WA" untuk kirim file ke admin. Pesanan bisa diambil langsung di toko kami atau dikirim via kurir instan / ekspedisi reguler.'
    }
  ];

  return (
    <div className="min-h-screen bg-bg-skeuo text-text-main font-sans selection:bg-brand-500 selection:text-white">

      {/* ===== TOP NAVBAR ===== */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-bg-skeuo/90 border-b border-black/[0.08] dark:border-white/[0.1] transition-colors">
        <div className="w-full px-5 sm:px-8 lg:px-12 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-blue-500/20">
              P
            </div>
            <div>
              <h1 className="font-extrabold text-sm sm:text-base text-text-main tracking-tight leading-none">
                {catalog?.store.name || 'Perdana Printing'}
              </h1>
              <span className="text-[11px] text-text-muted font-medium">Digital Printing & Percetakan</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-text-muted">
            <button onClick={scrollToCatalog} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Katalog Produk
            </button>
            <a 
              href={`https://wa.me/${(catalog?.store.phone || '').replace(/[^0-9]/g, '')}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Konsultasi WhatsApp
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl skeuo-button flex items-center justify-center text-text-muted hover:text-text-main transition-colors"
              title="Ganti Tema (Dark / Light)"
            >
              {isDarkMode ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            </button>
            <Link 
              href="/login" 
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/25 active:scale-95 transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login Kasir</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-[85vh] flex items-center pt-24 pb-16 px-5 sm:px-8 lg:px-12 overflow-hidden">
        {/* Subtle glow background */}
        <div className="absolute top-1/3 -right-16 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 -left-16 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Big Headline & Action */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 text-xs font-bold text-blue-700 dark:text-blue-300">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Percetakan Digital, Offset & Merchandise Berkualitas</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-text-main leading-[1.12] tracking-tight">
              Layanan Cetak Cepat,{' '}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                Hasil Tajam & Presisi
              </span>
            </h1>

            <p className="text-sm sm:text-base text-text-muted leading-relaxed max-w-2xl font-medium">
              Solusi percetakan terpercaya untuk segala kebutuhan bisnis, promosi, dan acara Anda. 
              Dari spanduk, stiker label, kartu nama, hingga undangan & buku dengan harga transparan.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button 
                onClick={scrollToCatalog}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-600/30 active:scale-95 transition-all"
              >
                <span>Lihat Katalog & Harga</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {catalog?.store.phone && (
                <a 
                  href={`https://wa.me/${catalog.store.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Halo, saya ingin konsultasi order cetak.')}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/25 active:scale-95 transition-all"
                >
                  <Phone className="w-4 h-4" />
                  <span>Order via WhatsApp</span>
                </a>
              )}
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
              {[
                { icon: Zap, title: 'Express & Same-Day', desc: 'Banner & spanduk siap kilat' },
                { icon: Award, title: 'Warna Tajam CMYK', desc: 'Mesin beresolusi tinggi' },
                { icon: Shield, title: 'Harga Terbuka', desc: 'Sesuai katalog transparan' },
                { icon: Truck, title: 'Ambil / Kirim', desc: 'Bisa antar ke alamat Anda' },
              ].map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl skeuo-inset flex flex-col justify-between">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
                    <item.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-text-main leading-tight">{item.title}</h4>
                    <p className="text-[10px] text-text-muted mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Visual Trust & Workshop Info Showcase */}
          <div className="lg:col-span-5">
            <div className="skeuo p-6 sm:p-8 rounded-3xl space-y-6">
              
              <div className="flex items-center justify-between pb-4 border-b border-black/[0.08] dark:border-white/[0.08]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-text-main">Workshop Percetakan</h3>
                    <p className="text-xs text-text-muted">Siap melayani pesanan Anda</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  Buka Setiap Hari
                </span>
              </div>

              {/* Store Details Box */}
              {catalog?.store && (
                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Lokasi Workshop</p>
                      <p className="font-bold text-text-main mt-0.5 leading-snug">{catalog.store.address}</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] flex items-start gap-3">
                    <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Kontak WhatsApp</p>
                      <p className="font-bold text-text-main mt-0.5">{catalog.store.phone}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Flow Summary */}
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 space-y-2">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Siap Kirim File Desain?</span>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  Kirimkan file PDF/CDR/AI/JPG Anda ke WhatsApp kami untuk dicek kelayakan resolusinya sebelum proses cetak.
                </p>
              </div>

              {catalog?.store.phone && (
                <a 
                  href={`https://wa.me/${catalog.store.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Halo, saya mau konsultasi dan kirim file desain.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-center text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 active:scale-95 transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Kirim File via WhatsApp</span>
                </a>
              )}

            </div>
          </div>

        </div>
      </section>

      {/* ===== KATEGORI LAYANAN PERCETAKAN (Showcase Cards dengan Penjelasan) ===== */}
      <section className="w-full px-5 sm:px-8 lg:px-12 py-14 border-t border-black/[0.06] dark:border-white/[0.08]">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 mb-2">
              <FolderTree className="w-3 h-3" />
              Layanan Percetakan
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-text-main tracking-tight">
              Kategori Layanan Percetakan
            </h2>
            <p className="text-xs sm:text-sm text-text-muted mt-1 max-w-2xl font-medium">
              Berbagai jenis layanan percetakan profesional kami yang siap memenuhi kebutuhan promosi dan operasional Anda.
            </p>
          </div>

          {selectedServiceId && (
            <button 
              onClick={() => setSelectedServiceId(null)}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              <span>Tampilkan Semua Layanan</span>
            </button>
          )}
        </div>

        {/* 6 Grid Cards Service Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PRESET_SERVICES.map(service => {
            const isSelected = selectedServiceId === service.id;
            return (
              <div 
                key={service.id}
                onClick={() => {
                  if (isSelected) {
                    setSelectedServiceId(null);
                  } else {
                    setSelectedServiceId(service.id);
                    setActiveCategoryId(undefined);
                  }
                }}
                className={`skeuo p-5 rounded-2xl flex flex-col justify-between cursor-pointer transition-all hover:shadow-lg ${
                  isSelected 
                    ? 'ring-2 ring-blue-600 bg-blue-50/50 dark:bg-blue-950/30' 
                    : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${service.color} text-white flex items-center justify-center shadow-sm`}>
                      <service.icon className="w-5 h-5" />
                    </div>
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                      isSelected 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-black/[0.04] dark:bg-white/[0.06] text-text-muted'
                    }`}>
                      {service.tag}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-sm sm:text-base text-text-main mb-2">
                    {service.name}
                  </h3>
                  <p className="text-xs text-text-muted leading-relaxed font-normal">
                    {service.desc}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between text-xs">
                  <span className={`text-[11px] font-bold ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-text-muted'}`}>
                    {isSelected ? '✓ Kategori Dipilih' : 'Klik untuk memfilter'}
                  </span>
                  <span className="text-blue-600 dark:text-blue-400 font-semibold text-[11px] flex items-center gap-0.5">
                    <span>Lihat di Katalog</span>
                    <ChevronDown className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===== 4-LANGKAH ALUR PEMESANAN ===== */}
      <section className="w-full px-5 sm:px-8 lg:px-12 py-14 bg-black/[0.015] dark:bg-white/[0.015] border-t border-black/[0.06] dark:border-white/[0.08]">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            Alur Pemesanan
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-text-main mt-1 tracking-tight">
            4 Langkah Mudah Pesan Cetak
          </h2>
          <p className="text-xs sm:text-sm text-text-muted mt-2 font-medium">
            Tanpa perlu registrasi akun berbelit, Anda langsung terhubung dengan tim percetakan kami
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              step: '01',
              icon: Search,
              title: 'Pilih Produk di Katalog',
              desc: 'Cari produk yang Anda inginkan di daftar produk di bawah ini.'
            },
            {
              step: '02',
              icon: MessageSquare,
              title: 'Klik Order WA & Kirim File',
              desc: 'Kirimkan file desain (PDF, JPG, CDR, AI) beserta jumlah dan ukuran yang diinginkan.'
            },
            {
              step: '03',
              icon: Printer,
              title: 'Proses Cetak & Finishing',
              desc: 'File diperiksa, dicetak dengan mesin resolusi tinggi, dan difinishing rapi.'
            },
            {
              step: '04',
              icon: CheckCircle2,
              title: 'Selesai & Siap Diambil',
              desc: 'Pesanan diambil di workshop kami atau dikirim via kurir ke lokasi Anda.'
            }
          ].map((s, idx) => (
            <div key={idx} className="skeuo p-5 rounded-2xl relative overflow-hidden group hover:shadow-md transition-all">
              <span className="absolute top-3 right-4 font-black text-3xl text-black/[0.05] dark:text-white/[0.05]">
                {s.step}
              </span>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                <s.icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-text-main mb-1.5">{s.title}</h3>
              <p className="text-xs text-text-muted leading-relaxed font-normal">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== DAFTAR PRODUK & KATALOG LENGKAP ===== */}
      <section ref={catalogRef} className="w-full px-5 sm:px-8 lg:px-12 py-16 scroll-mt-16 border-t border-black/[0.06] dark:border-white/[0.08]">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 mb-2">
              <Printer className="w-3 h-3" />
              Daftar Produk & Harga
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-text-main tracking-tight">
              Katalog Produk Percetakan
            </h2>
            <p className="text-xs sm:text-sm text-text-muted mt-1 font-medium">
              Gunakan pencarian, sortir urutan, atau filter kategori untuk menemukan produk
            </p>
          </div>

          <div className="flex items-center gap-2">
            {(activeCategoryId !== undefined || selectedServiceId || searchTerm || sortBy !== 'default') && (
              <button 
                onClick={resetAllFilters}
                className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset Filter</span>
              </button>
            )}
            <div className="text-xs text-text-muted font-bold bg-black/[0.04] dark:bg-white/[0.05] px-4 py-2.5 rounded-xl whitespace-nowrap">
              <span className="text-blue-600 dark:text-blue-400 font-extrabold">{processedProducts.length}</span> / {catalog?.products.length || 0} Produk
            </div>
          </div>
        </div>

        {/* Search, Category Filter & Sort Bar */}
        <div className="space-y-4 mb-8">
          
          {/* Controls Bar (Search + Dropdown Kategori + Dropdown Sortir) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            
            {/* Search Input */}
            <div className="md:col-span-6 flex items-center gap-3 px-4 py-3 skeuo rounded-2xl">
              <Search className="w-4 h-4 text-text-muted shrink-0" />
              <input 
                type="text" 
                placeholder="Cari nama produk (contoh: Spanduk, Brosur, Stiker, Kartu Nama)..." 
                className="bg-transparent border-none outline-none w-full text-xs sm:text-sm text-text-main placeholder:text-text-muted/60 font-medium"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="text-text-muted hover:text-text-main p-1 rounded-md"
                  title="Hapus pencarian"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Dropdown */}
            <div className="md:col-span-3 flex items-center gap-2 px-3.5 py-2.5 skeuo rounded-2xl">
              <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <select
                value={activeCategoryId === undefined ? '' : activeCategoryId}
                onChange={e => {
                  const val = e.target.value;
                  setActiveCategoryId(val === '' ? undefined : Number(val));
                  setSelectedServiceId(null);
                }}
                className="bg-transparent border-none outline-none w-full text-xs font-bold text-text-main cursor-pointer"
              >
                <option value="" className="bg-bg-skeuo text-text-main">Semua Kategori ({catalog?.products.length || 0})</option>
                {cleanCategories.map(cat => (
                  <option key={cat.id} value={cat.id} className="bg-bg-skeuo text-text-main">
                    {cat.name} ({cat.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="md:col-span-3 flex items-center gap-2 px-3.5 py-2.5 skeuo rounded-2xl">
              <ArrowUpDown className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortOption)}
                className="bg-transparent border-none outline-none w-full text-xs font-bold text-text-main cursor-pointer"
              >
                <option value="default" className="bg-bg-skeuo text-text-main">Urutkan: Default</option>
                <option value="price_asc" className="bg-bg-skeuo text-text-main">Harga: Termurah → Termahal</option>
                <option value="price_desc" className="bg-bg-skeuo text-text-main">Harga: Termahal → Termurah</option>
                <option value="name_asc" className="bg-bg-skeuo text-text-main">Nama: A → Z</option>
                <option value="name_desc" className="bg-bg-skeuo text-text-main">Nama: Z → A</option>
                <option value="custom_size" className="bg-bg-skeuo text-text-main">Tipe: Ukuran Meteran (P×L)</option>
              </select>
            </div>

          </div>

          {/* Quick Category Filter Pills */}
          {catalog && cleanCategories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
              <button 
                onClick={() => {
                  setActiveCategoryId(undefined);
                  setSelectedServiceId(null);
                }}
                className={`px-4 py-2 whitespace-nowrap text-xs font-bold rounded-xl transition-all shrink-0 ${
                  activeCategoryId === undefined && !selectedServiceId
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'skeuo-button text-text-muted hover:text-text-main'
                }`}
              >
                Semua Produk ({catalog.products.length})
              </button>
              {cleanCategories.map(cat => {
                const isCatActive = activeCategoryId === cat.id;
                return (
                  <button 
                    key={cat.id}
                    onClick={() => {
                      setActiveCategoryId(cat.id);
                      setSelectedServiceId(null);
                    }}
                    className={`px-4 py-2 whitespace-nowrap text-xs font-bold rounded-xl transition-all shrink-0 ${
                      isCatActive 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'skeuo-button text-text-muted hover:text-text-main'
                    }`}
                  >
                    {cat.name} ({cat.count})
                  </button>
                );
              })}
            </div>
          )}

        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-28 text-text-muted">
            <RefreshCw className="w-8 h-8 animate-spin mb-3 text-blue-600 dark:text-blue-400" />
            <p className="text-sm font-bold">Memuat daftar produk...</p>
          </div>
        ) : error ? (
          <div className="text-center py-28 skeuo p-8 max-w-md mx-auto rounded-3xl">
            <Printer className="w-12 h-12 mx-auto mb-4 text-text-muted opacity-40" />
            <p className="font-bold text-text-main mb-1">Gagal Memuat Katalog</p>
            <p className="text-xs text-text-muted mb-5">{error}</p>
            <button onClick={() => window.location.reload()} className="px-5 py-2 text-xs font-bold skeuo-button text-blue-600 dark:text-blue-400">
              Coba Lagi
            </button>
          </div>
        ) : processedProducts.length === 0 ? (
          <div className="text-center py-24 skeuo p-8 max-w-lg mx-auto rounded-3xl">
            <Layers className="w-12 h-12 mx-auto mb-3 text-text-muted opacity-40" />
            <p className="font-bold text-text-main mb-1">Produk Tidak Ditemukan</p>
            <p className="text-xs text-text-muted mb-4">
              Tidak ada produk yang cocok dengan filter atau kata kunci saat ini.
            </p>
            <button 
              onClick={resetAllFilters}
              className="px-4 py-2 text-xs font-bold skeuo-button text-blue-600 dark:text-blue-400"
            >
              Reset Semua Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {processedProducts.map(product => {
              const isCustom = product.price_type === 'CUSTOM' || product.unit_name?.toLowerCase().includes('meter');
              const catName = getCategoryName(product.category_id);

              return (
                <div 
                  key={product.id} 
                  className="group skeuo p-5 rounded-2xl flex flex-col justify-between hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                  <div>
                    {/* Category & Tag badges */}
                    <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                      {catName && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                          {catName}
                        </span>
                      )}
                      {isCustom && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                          Ukuran Bebas (P×L)
                        </span>
                      )}
                      {product.has_variants && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                          Pilihan Varian
                        </span>
                      )}
                    </div>

                    {/* Product Name */}
                    <h3 className="font-extrabold text-sm text-text-main leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2">
                      {product.name}
                    </h3>
                  </div>

                  {/* Pricing Block */}
                  <div className="mt-4 pt-3 border-t border-black/[0.06] dark:border-white/[0.08]">
                    {product.price_type === 'RANGE' ? (
                      <div className="mb-2">
                        <span className="text-[10px] text-text-muted block font-semibold">Rentang Harga:</span>
                        <div className="text-blue-600 dark:text-blue-400 font-black text-sm sm:text-base">
                          {formatPrice(product.min_price)} <span className="text-text-muted font-normal text-xs">—</span> {formatPrice(product.max_price)}
                        </div>
                      </div>
                    ) : (
                      <div className="mb-2">
                        <span className="text-[10px] text-text-muted block font-semibold">
                          {isCustom ? 'Harga per m²:' : 'Harga:'}
                        </span>
                        <div className="text-blue-600 dark:text-blue-400 font-black text-base sm:text-lg">
                          {formatPrice(product.default_price)}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-[10px] text-text-muted font-medium">
                        /{product.unit_name || 'pcs'}{product.min_order > 1 ? ` · min ${product.min_order}` : ''}
                      </span>
                      <a
                        href={waLink(product.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm active:scale-95 transition-all"
                      >
                        <Phone className="w-3 h-3" />
                        <span>Order WA</span>
                      </a>
                    </div>

                    {/* Variants preview list */}
                    {product.has_variants && product.variants && product.variants.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-black/[0.06] dark:border-white/[0.06]">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                          {product.variants.length} Varian Tersedia:
                        </p>
                        <div className="space-y-1">
                          {product.variants.slice(0, 2).map(v => (
                            <div key={v.id} className="flex justify-between items-center text-[10px] px-2.5 py-1 rounded-lg skeuo-inset">
                              <span className="text-text-main font-medium truncate mr-2">{v.variant_name}</span>
                              <span className="text-blue-600 dark:text-blue-400 font-bold whitespace-nowrap">
                                {v.price_type === 'RANGE' 
                                  ? `${formatPrice(v.min_price)} - ${formatPrice(v.max_price)}` 
                                  : formatPrice(v.price)
                                }
                              </span>
                            </div>
                          ))}
                          {product.variants.length > 2 && (
                            <p className="text-[9px] text-text-muted text-center pt-0.5">
                              +{product.variants.length - 2} varian lainnya
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ===== FAQ SECTION ===== */}
      <section className="w-full px-5 sm:px-8 lg:px-12 py-16 border-t border-black/[0.06] dark:border-white/[0.08]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              Bantuan & Informasi
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-text-main mt-1 tracking-tight">
              Pertanyaan yang Sering Diajukan
            </h2>
            <p className="text-xs sm:text-sm text-text-muted mt-2 font-medium">
              Informasi seputar format file desain, lama pengerjaan, dan ketentuan cetak
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div 
                  key={idx} 
                  className="skeuo rounded-2xl overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4 font-bold text-xs sm:text-sm text-text-main hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <span className="flex items-center gap-2.5">
                      <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      {faq.q}
                    </span>
                    {isOpen ? <ChevronUp className="w-4 h-4 shrink-0 text-text-muted" /> : <ChevronDown className="w-4 h-4 shrink-0 text-text-muted" />}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs text-text-muted leading-relaxed border-t border-black/[0.06] dark:border-white/[0.08]">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== CALL TO ACTION & WORKSHOP LOCATION ===== */}
      <section className="w-full px-5 sm:px-8 lg:px-12 py-12">
        <div className="skeuo p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-bg-skeuo via-blue-500/[0.03] to-indigo-500/[0.03] border border-black/[0.06] dark:border-white/[0.08] shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-8 space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                <Check className="w-3 h-3" />
                Respon Cepat Jam Kerja
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-text-main tracking-tight">
                Punya Kebutuhan Cetak Spesifik atau Grosir?
              </h2>
              <p className="text-xs sm:text-sm text-text-muted leading-relaxed max-w-xl font-medium">
                Tim desainer dan operator kami siap membantu memeriksa file Anda, memberikan rekomendasi bahan terbaik, serta penawaran khusus untuk pemesanan partai besar.
              </p>

              {catalog?.store && (
                <div className="flex flex-wrap gap-4 pt-2 text-xs text-text-muted font-medium">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>{catalog.store.address}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{catalog.store.phone}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
              <a 
                href={`https://wa.me/${(catalog?.store.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Halo, saya ingin konsultasi order cetak partai besar / penawaran harga.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-center text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 active:scale-95 transition-all"
              >
                <Phone className="w-4 h-4" />
                <span>Konsultasi via WhatsApp</span>
              </a>
              <button 
                onClick={scrollToCatalog}
                className="px-6 py-4 rounded-2xl skeuo-button font-bold text-center text-xs sm:text-sm text-text-main hover:text-blue-600 dark:hover:text-blue-400 transition-all"
              >
                Lihat Katalog Produk
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="w-full border-t border-black/[0.06] dark:border-white/[0.08] py-8 px-5 sm:px-8 lg:px-12 bg-bg-skeuo">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-sm">
              P
            </div>
            <div>
              <span className="font-bold text-xs sm:text-sm text-text-main block">
                {catalog?.store.name || 'Perdana Printing'}
              </span>
              <span className="text-[10px] text-text-muted">
                Sistem Kasir POS & Katalog Publik Percetakan
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-text-muted font-medium">
            <button onClick={scrollToCatalog} className="hover:text-text-main transition-colors">Katalog</button>
            <Link href="/login" className="hover:text-blue-600 dark:hover:text-blue-400 font-bold transition-colors">Login Kasir</Link>
            <span>© {new Date().getFullYear()} {catalog?.store.name || 'Perdana Printing'}</span>
          </div>
        </div>
      </footer>

      {/* ===== FLOATING WHATSAPP BUTTON (Bottom Right) ===== */}
      {catalog?.store.phone && (
        <a 
          href={`https://wa.me/${catalog.store.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Halo, saya ingin tanya produk cetak di Perdana Printing.')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xl shadow-emerald-600/30 hover:scale-105 active:scale-95 transition-all"
          title="Chat WhatsApp Langsung"
        >
          <Phone className="w-4 h-4 animate-bounce" />
          <span className="hidden sm:inline">Hubungi Kami</span>
        </a>
      )}

    </div>
  );
}
