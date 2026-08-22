'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { 
  Search, Phone, MapPin, LogIn, Layers, Printer, X, Sun, Moon,
  RefreshCw, ChevronDown, Star, Zap, Clock, Shield,
  CheckCircle2, MessageSquare, Sparkles, Package, Truck, HelpCircle, Award, Check,
  FileText, Tag, FolderTree, ArrowUpDown, Filter, ArrowRight, ExternalLink
} from 'lucide-react';
import { publicService, PublicCatalog, PublicProduct } from '../services/publicService';
import { formatRupiah } from '../utils/format';

// Standard Printing Services with description & keyword matcher
const PRESET_SERVICES = [
  {
    id: 'banner',
    name: 'Banner & Spanduk',
    desc: 'Cetak Flexi 280g, 340g, Korcin, X-Banner, Roll-up banner untuk promosi luar & dalam ruangan.',
    icon: Printer,
    gradient: 'from-blue-600 to-cyan-500',
    bgLight: 'bg-blue-50 dark:bg-blue-950/40',
    borderLight: 'border-blue-200/60 dark:border-blue-800/40',
    textColor: 'text-blue-600 dark:text-blue-400',
    tag: 'Same Day Service',
    matchKeyword: 'spanduk,banner,flexi,baliho'
  },
  {
    id: 'stiker',
    name: 'Stiker & Label Produk',
    desc: 'Stiker Vinyl, Chromo, Transparan, & Hologram dengan opsi cutting kiss-cut atau die-cut presisi.',
    icon: Tag,
    gradient: 'from-emerald-600 to-teal-500',
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderLight: 'border-emerald-200/60 dark:border-emerald-800/40',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    tag: 'Custom Die-Cut',
    matchKeyword: 'stiker,sticker,label,chromo,vinyl'
  },
  {
    id: 'kartu',
    name: 'Kartu Nama & ID Card',
    desc: 'Art Carton 260-310gsm laminasi doff/glossy, serta ID Card PVC tebal tahan air & anti luntur.',
    icon: FileText,
    gradient: 'from-violet-600 to-indigo-500',
    bgLight: 'bg-violet-50 dark:bg-violet-950/40',
    borderLight: 'border-violet-200/60 dark:border-violet-800/40',
    textColor: 'text-violet-600 dark:text-violet-400',
    tag: 'Premium Finish',
    matchKeyword: 'kartu,card,id card,member,pvc'
  },
  {
    id: 'brosur',
    name: 'Brosur & Flyer Promosi',
    desc: 'Cetak digital & offset A4/A5, brosur lipat 2/3 dengan warna CMYK tajam dan detail tinggi.',
    icon: Layers,
    gradient: 'from-amber-500 to-orange-500',
    bgLight: 'bg-amber-50 dark:bg-amber-950/40',
    borderLight: 'border-amber-200/60 dark:border-amber-800/40',
    textColor: 'text-amber-600 dark:text-amber-400',
    tag: 'Warna Tajam CMYK',
    matchKeyword: 'brosur,flyer,pamflet,poster,leaflet'
  },
  {
    id: 'undangan',
    name: 'Undangan & Merchandise',
    desc: 'Cetak undangan pernikahan, khitan, event resmi, serta souvenir mug, gantungan kunci & merchandise.',
    icon: Sparkles,
    gradient: 'from-pink-600 to-rose-500',
    bgLight: 'bg-pink-50 dark:bg-pink-950/40',
    borderLight: 'border-pink-200/60 dark:border-pink-800/40',
    textColor: 'text-pink-600 dark:text-pink-400',
    tag: 'Desain Eksklusif',
    matchKeyword: 'undangan,souvenir,mug,gantungan,merchandise'
  },
  {
    id: 'buku',
    name: 'Buku, Yasin & Jilid',
    desc: 'Buku Yasin, majalah, nota NCR rangkap, kalender tahunan, jilid spiral kawat / lem panas.',
    icon: Package,
    gradient: 'from-cyan-600 to-blue-500',
    bgLight: 'bg-cyan-50 dark:bg-cyan-950/40',
    borderLight: 'border-cyan-200/60 dark:border-cyan-800/40',
    textColor: 'text-cyan-600 dark:text-cyan-400',
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
    
    const categoryMap = new Map<number, { id: number; name: string; count: number }>();
    
    catalog.categories.forEach((c: { id: number; name: string }) => {
      let cleanName = c.name.replace(/\s*\d{10,}.*$/, '').trim();
      if (!cleanName) cleanName = 'Kategori Umum';
      
      const count = catalog.products.filter((p: PublicProduct) => p.category_id === c.id).length;
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
        break;
    }

    return list;
  }, [catalog, activeCategoryId, selectedServiceId, searchTerm, sortBy]);

  const getCategoryName = (id: number | null) => {
    if (!id || !catalog) return null;
    const found = catalog.categories.find((c: any) => c.id === id);
    if (!found) return null;
    const clean = found.name.replace(/\s*\d{10,}.*$/, '').trim();
    return clean || found.name;
  };

  const formatPrice = (price: number | string) => formatRupiah(price);

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
      a: 'Untuk cetak banner/spanduk standar dan digital print A3+ biasanya bisa selesai dalam hitungan jam atau 1 hari kerja (same-day). Untuk pesanan offset jumlah banyak (undangan, buku, brosur), berkisar 2-4 hari kerja.'
    },
    {
      q: 'Apakah bisa cetak dengan ukuran kustom (bebas meteran)?',
      a: 'Bisa banget! Kami melayani spanduk, banner, stiker meteran, dan poster dengan dimensi panjang x lebar bebas sesuai kebutuhan Anda.'
    },
    {
      q: 'Bagaimana cara pemesanan dan pengiriman?',
      a: 'Cukup pilih produk di katalog, klik tombol "Order WA" untuk kirim file ke admin. Pesanan bisa diambil langsung di workshop kami atau dikirim via kurir instan / ekspedisi reguler.'
    }
  ];

  const marqueeItems = [
    '⚡ Cetak Spanduk & Banner Kilat',
    '⭐ Stiker Vinyl & Chromo Die-Cut',
    '🔥 Kartu Nama & ID Card PVC',
    '💎 Undangan & Souvenir Premium',
    '🚀 Brosur & Flyer Warna Tajam',
    '📦 Nota NCR & Buku Jilid Spiral',
    '🎯 Cetak Meteran Bebas Ukuran'
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-600 selection:text-white transition-colors duration-300 relative overflow-x-hidden">

      {/* ===== AMBIENT BACKGROUND GLOWS & MESH ===== */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[700px] h-[700px] bg-blue-500/15 dark:bg-blue-600/15 rounded-full blur-[150px] animate-pulse-subtle" />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full blur-[150px] animate-float-slow" />
        <div className="absolute bottom-10 left-1/4 w-[650px] h-[650px] bg-cyan-500/10 dark:bg-cyan-600/10 rounded-full blur-[160px] animate-float-reverse" />
      </div>

      {/* ===== TOP MARQUEE TICKER ===== */}
      <div className="relative z-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white py-2 overflow-hidden shadow-sm">
        <div className="animate-neo-marquee font-bold text-xs tracking-wider uppercase flex items-center gap-10">
          {[...marqueeItems, ...marqueeItems, ...marqueeItems].map((item, index) => (
            <div key={index} className="flex items-center gap-8">
              <span>{item}</span>
              <span className="inline-block w-1.5 h-1.5 bg-white/70 rounded-full"></span>
            </div>
          ))}
        </div>
      </div>

      {/* ===== TOP GLASS NAVBAR ===== */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-[#090D16]/80 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 py-3.5 sm:py-4 flex items-center justify-between">
          
          {/* Logo & Store Title */}
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-all duration-300">
              <span>P</span>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-white dark:border-slate-900 rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-white dark:border-slate-900 rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white leading-none">
                  {catalog?.store.name || 'Perdana Printing'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/50">
                  Online POS
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block mt-0.5">
                Digital Printing & Percetakan Profesional
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-600 dark:text-slate-300">
            <button 
              onClick={scrollToCatalog} 
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5 group py-1"
            >
              <Printer className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
              <span>Katalog Produk</span>
            </button>
            <Link 
              href="/cek-pesanan"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/90 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 transition-all group"
            >
              <Package className="w-3.5 h-3.5 text-blue-500 group-hover:rotate-12 transition-transform" />
              <span>Cek Status Pesanan</span>
            </Link>
            <a 
              href={`https://wa.me/${(catalog?.store.phone || '').replace(/[^0-9]/g, '')}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5 py-1"
            >
              <Phone className="w-4 h-4 text-emerald-500" />
              <span>Konsultasi WA</span>
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/cek-pesanan"
              className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
              title="Cek Pesanan"
            >
              <Package className="w-4 h-4 text-blue-500" />
            </Link>

            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 transition-all hover:scale-105 active:scale-95"
              title="Ganti Tema (Dark / Light)"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            <Link 
              href="/login" 
              className="shimmer-btn flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/25 active:scale-95 transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login Kasir</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ===== HERO SECTION (Balanced Vertical & Horizontal) ===== */}
      <section className="relative z-10 pt-10 sm:pt-14 lg:pt-16 pb-12 sm:pb-16 px-6 sm:px-10 lg:px-16 max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 xl:gap-20 items-center">
          
          {/* Left Column: Modern Headline & CTAs */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Live Indicator Pill */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full glass-card border border-blue-200/60 dark:border-blue-900/60 text-xs font-bold text-blue-600 dark:text-blue-400 shadow-sm animate-float-slow">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Workshop Aktif · Siap Cetak Kilat Hari Ini</span>
            </div>

            {/* Main Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.14]">
              Layanan Cetak Cepat,{' '}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                Hasil Tajam & Presisi
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed max-w-xl">
              Solusi percetakan modern untuk bisnis, promosi, dan acara Anda. Dari spanduk flexi, stiker die-cut, kartu nama PVC, brosur promosi, hingga undangan & merchandise dengan harga jujur dan transparan.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              <button 
                onClick={scrollToCatalog}
                className="shimmer-btn flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-xs sm:text-sm shadow-xl shadow-blue-600/30 hover:scale-[1.02] active:scale-95 transition-all"
              >
                <span>Lihat Katalog & Harga</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {catalog?.store.phone && (
                <a 
                  href={`https://wa.me/${catalog.store.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Halo, saya ingin order cetak di Perdana Printing.')}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/25 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <Phone className="w-4 h-4" />
                  <span>Order via WhatsApp</span>
                </a>
              )}

              <Link
                href="/cek-pesanan"
                className="flex items-center gap-2 px-5 py-3.5 rounded-2xl glass-card text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 font-bold text-xs sm:text-sm shadow-sm hover:scale-[1.02] active:scale-95 transition-all"
              >
                <Package className="w-4 h-4 text-blue-500" />
                <span>Lacak Pesanan</span>
              </Link>
            </div>

          </div>

          {/* Right Column: Modern Interactive Workshop Box */}
          <div className="lg:col-span-5 relative">
            
            {/* Floating rating badge */}
            <div className="absolute -top-4 -left-4 z-20 glass-card px-3.5 py-2 rounded-2xl shadow-xl flex items-center gap-2.5 border border-amber-300/40 dark:border-amber-500/30 animate-float-slow">
              <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center">
                <Star className="w-3.5 h-3.5 fill-amber-500" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900 dark:text-white leading-none">4.9 / 5.0</p>
                <p className="text-[10px] text-slate-500 font-medium">Kepuasan Pelanggan</p>
              </div>
            </div>

            <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-5 relative overflow-hidden shadow-xl">
              
              {/* Card Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Workshop Percetakan</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Siap melayani pesanan Anda</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Buka Setiap Hari
                </span>
              </div>

              {/* Store Details Box */}
              {catalog?.store && (
                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 flex items-start gap-3 border border-slate-200/60 dark:border-slate-700/60">
                    <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lokasi Workshop</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 leading-snug">{catalog.store.address}</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 flex items-start gap-3 border border-slate-200/60 dark:border-slate-700/60">
                    <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kontak WhatsApp</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{catalog.store.phone}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Design File Check Offer */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-cyan-500/10 border border-blue-200 dark:border-blue-800/50 space-y-1.5">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Cek Kelayakan File Desain Gratis</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  Kirim file PDF/CDR/AI/JPG ke admin untuk kami pastikan resolusinya tajam dan tidak pecah sebelum dicetak.
                </p>
              </div>

              {catalog?.store.phone && (
                <a 
                  href={`https://wa.me/${catalog.store.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Halo, saya mau konsultasi dan kirim file desain.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shimmer-btn w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-center text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 active:scale-95 transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Kirim File via WhatsApp</span>
                </a>
              )}

            </div>
          </div>

        </div>
      </section>

      {/* ===== 4 FEATURE HIGHLIGHTS ===== */}
      <section className="relative z-10 max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 xl:gap-6">
          {[
            { icon: Zap, title: 'Express & Kilat', desc: 'Bisa same-day service siap pakai', color: 'from-amber-500 to-orange-500' },
            { icon: Award, title: 'Warna Tajam CMYK', desc: 'Mesin beresolusi tinggi & akurat', color: 'from-blue-500 to-cyan-500' },
            { icon: Shield, title: 'Harga Terbuka', desc: 'Sesuai katalog asli tanpa biaya tersembunyi', color: 'from-emerald-500 to-teal-500' },
            { icon: Truck, title: 'Ambil / Kirim', desc: 'Ambil di tempat atau kurir ekspedisi', color: 'from-violet-500 to-purple-500' },
          ].map((item, idx) => (
            <div key={idx} className="glass-card glass-card-hover p-5 sm:p-6 rounded-2xl flex items-start gap-3.5 group">
              <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${item.color} text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform`}>
                <item.icon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">{item.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== KATEGORI LAYANAN SHOWCASE ===== */}
      <section className="relative z-10 max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 py-14 sm:py-18">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/50 mb-2">
              <FolderTree className="w-3.5 h-3.5" />
              Layanan Percetakan
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Pilihan Layanan Percetakan
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl font-medium">
              Klik salah satu kategori di bawah untuk menyaring produk di katalog kami secara instan.
            </p>
          </div>

          {selectedServiceId && (
            <button 
              onClick={() => setSelectedServiceId(null)}
              className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 transition-all"
            >
              <X className="w-3.5 h-3.5" />
              <span>Tampilkan Semua Layanan</span>
            </button>
          )}
        </div>

        {/* 6 Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
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
                    scrollToCatalog();
                  }
                }}
                className={`glass-card glass-card-hover p-6 rounded-2xl flex flex-col justify-between cursor-pointer transition-all ${
                  isSelected 
                    ? 'ring-2 ring-blue-600 dark:ring-blue-400 bg-blue-50/70 dark:bg-blue-950/40 shadow-lg' 
                    : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${service.gradient} text-white flex items-center justify-center shadow-md shadow-blue-500/20`}>
                      <service.icon className="w-5 h-5" />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${service.bgLight} ${service.textColor} border ${service.borderLight}`}>
                      {service.tag}
                    </span>
                  </div>
                  
                  <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white mb-1.5">
                    {service.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    {service.desc}
                  </p>
                </div>

                <div className="pt-4 mt-5 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold">
                  <span className={`${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                    {isSelected ? '✓ Kategori Aktif' : 'Klik untuk filter'}
                  </span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center gap-1">
                    <span>Lihat di Katalog</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===== 4-LANGKAH ALUR PEMESANAN ===== */}
      <section className="relative z-10 py-14 sm:py-18 px-6 sm:px-10 lg:px-16 bg-slate-100/60 dark:bg-slate-900/40 border-y border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-[1440px] mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              Alur Pemesanan
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 tracking-tight">
              4 Langkah Mudah Pesan Cetak
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
              Tanpa registrasi berbelit, Anda langsung terhubung dengan tim percetakan kami
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 xl:gap-6">
            {[
              {
                step: '01',
                icon: Search,
                title: 'Pilih Produk',
                desc: 'Temukan item yang Anda inginkan pada daftar katalog di bawah.',
                gradient: 'from-blue-600 to-cyan-500'
              },
              {
                step: '02',
                icon: MessageSquare,
                title: 'Order via WA',
                desc: 'Kirim file desain (PDF, JPG, CDR, AI) beserta jumlah dan ukuran.',
                gradient: 'from-indigo-600 to-violet-500'
              },
              {
                step: '03',
                icon: Printer,
                title: 'Cetak & Finishing',
                desc: 'File dicek, dicetak mesin resolusi tinggi, dan difinishing rapi.',
                gradient: 'from-violet-600 to-pink-500'
              },
              {
                step: '04',
                icon: CheckCircle2,
                title: 'Ambil / Dikirim',
                desc: 'Pesanan diambil di workshop atau dikirim kurir ke lokasi Anda.',
                gradient: 'from-emerald-600 to-teal-500'
              }
            ].map((s, idx) => (
              <div key={idx} className="glass-card glass-card-hover p-6 sm:p-7 rounded-2xl relative overflow-hidden group">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${s.gradient} text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                    <s.icon className="w-5 h-5" />
                  </div>
                  <span className="font-extrabold text-2xl text-slate-300 dark:text-slate-700">
                    {s.step}
                  </span>
                </div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white mb-1.5">{s.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== DAFTAR PRODUK & KATALOG UTAMA ===== */}
      <section ref={catalogRef} className="relative z-10 max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 py-14 sm:py-18 scroll-mt-20">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/50 mb-2">
              <Printer className="w-3.5 h-3.5" />
              Daftar Produk & Harga
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Katalog Produk Percetakan
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Gunakan pencarian, sortir urutan, atau filter kategori untuk mencari item
            </p>
          </div>

          <div className="flex items-center gap-3">
            {(activeCategoryId !== undefined || selectedServiceId || searchTerm || sortBy !== 'default') && (
              <button 
                onClick={resetAllFilters}
                className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 flex items-center gap-1.5 transition-all"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset Filter</span>
              </button>
            )}
            <div className="glass-card px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300">
              <span className="text-blue-600 dark:text-blue-400 font-extrabold text-sm">{processedProducts.length}</span> / {catalog?.products.length || 0} Produk
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="space-y-4 mb-8">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Search Input */}
            <div className="md:col-span-6 flex items-center gap-3 px-4 py-3 glass-card rounded-2xl focus-within:ring-2 focus-within:ring-blue-500 transition-all">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input 
                type="text" 
                placeholder="Cari nama produk (contoh: Spanduk, Stiker, Kartu Nama, Brosur)..." 
                className="bg-transparent border-none outline-none w-full text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                  title="Hapus"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Dropdown */}
            <div className="md:col-span-3 flex items-center gap-2 px-3.5 py-3 glass-card rounded-2xl">
              <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <select
                value={activeCategoryId === undefined ? '' : activeCategoryId}
                onChange={e => {
                  const val = e.target.value;
                  setActiveCategoryId(val === '' ? undefined : Number(val));
                  setSelectedServiceId(null);
                }}
                className="bg-transparent border-none outline-none w-full text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Semua Kategori ({catalog?.products.length || 0})</option>
                {cleanCategories.map(cat => (
                  <option key={cat.id} value={cat.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {cat.name} ({cat.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="md:col-span-3 flex items-center gap-2 px-3.5 py-3 glass-card rounded-2xl">
              <ArrowUpDown className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortOption)}
                className="bg-transparent border-none outline-none w-full text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <option value="default" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Urutkan: Default</option>
                <option value="price_asc" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Harga: Termurah → Termahal</option>
                <option value="price_desc" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Harga: Termahal → Termurah</option>
                <option value="name_asc" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Nama: A → Z</option>
                <option value="name_desc" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Nama: Z → A</option>
                <option value="custom_size" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Tipe: Ukuran Meteran (P×L)</option>
              </select>
            </div>

          </div>

          {/* Quick Category Filter Pills */}
          {catalog && cleanCategories.length > 0 && (
            <div className="flex gap-2.5 overflow-x-auto pb-2 custom-scrollbar">
              <button 
                onClick={() => {
                  setActiveCategoryId(undefined);
                  setSelectedServiceId(null);
                }}
                className={`px-4 py-2 whitespace-nowrap text-xs font-bold rounded-xl transition-all shrink-0 ${
                  activeCategoryId === undefined && !selectedServiceId
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25' 
                    : 'glass-card text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Semua ({catalog.products.length})
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
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25' 
                        : 'glass-card text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
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
          <div className="glass-card p-12 rounded-3xl text-center max-w-md mx-auto my-8">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-600 dark:text-blue-400" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Memuat Katalog Produk...</p>
          </div>
        ) : error ? (
          <div className="glass-card p-8 rounded-3xl max-w-md mx-auto text-center my-8">
            <Printer className="w-12 h-12 mx-auto mb-3 text-rose-500 opacity-80" />
            <p className="font-extrabold text-base text-slate-900 dark:text-white mb-1">Gagal Memuat Katalog</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{error}</p>
            <button onClick={() => window.location.reload()} className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md">
              Coba Lagi
            </button>
          </div>
        ) : processedProducts.length === 0 ? (
          <div className="glass-card p-12 rounded-3xl max-w-lg mx-auto text-center my-8">
            <Layers className="w-12 h-12 mx-auto mb-3 text-slate-400 opacity-60" />
            <p className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white mb-1">Produk Tidak Ditemukan</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Tidak ada produk yang cocok dengan kata kunci atau filter yang Anda pilih.
            </p>
            <button 
              onClick={resetAllFilters}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20"
            >
              Reset Semua Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 xl:gap-7">
            {processedProducts.map(product => {
              const isCustom = product.price_type === 'CUSTOM' || product.unit_name?.toLowerCase().includes('meter');
              const catName = getCategoryName(product.category_id);

              return (
                <div 
                  key={product.id} 
                  className="glass-card glass-card-hover p-5 sm:p-6 rounded-2xl flex flex-col justify-between group"
                >
                  <div>
                    {/* Badges */}
                    <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                      {catName && (
                        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40">
                          {catName}
                        </span>
                      )}
                      {isCustom && (
                        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/40">
                          Ukuran Bebas (P×L)
                        </span>
                      )}
                      {product.has_variants && (
                        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40">
                          Varian
                        </span>
                      )}
                    </div>

                    {/* Product Name */}
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2">
                      {product.name}
                    </h3>
                  </div>

                  {/* Pricing Box */}
                  <div className="mt-4 pt-3.5 border-t border-slate-200/80 dark:border-slate-800/80">
                    {product.price_type === 'RANGE' ? (
                      <div className="mb-2.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Rentang Harga:</span>
                        <div className="text-blue-600 dark:text-blue-400 font-extrabold text-base">
                          {formatPrice(product.min_price)} <span className="text-slate-400 font-normal text-xs">-</span> {formatPrice(product.max_price)}
                        </div>
                      </div>
                    ) : (
                      <div className="mb-2.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                          {isCustom ? 'Harga per m²:' : 'Harga:'}
                        </span>
                        <div className="text-blue-600 dark:text-blue-400 font-extrabold text-lg">
                          {formatPrice(product.default_price)}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        /{product.unit_name || 'pcs'}{product.min_order > 1 ? ` · Min ${product.min_order}` : ''}
                      </span>
                      <a
                        href={waLink(product.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Order WA</span>
                      </a>
                    </div>

                    {/* Variants list preview */}
                    {product.has_variants && product.variants && product.variants.length > 0 && (
                      <div className="mt-3.5 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/60">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                          {product.variants.length} Varian Tersedia:
                        </p>
                        <div className="space-y-1">
                          {product.variants.slice(0, 2).map((v: any) => (
                            <div key={v.id} className="flex justify-between items-center text-[10px] font-medium px-2.5 py-1 rounded-lg bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
                              <span className="truncate mr-2 text-slate-700 dark:text-slate-300">{v.variant_name}</span>
                              <span className="font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                                {v.price_type === 'RANGE' 
                                  ? `${formatPrice(v.min_price)} - ${formatPrice(v.max_price)}` 
                                  : formatPrice(v.price)
                                }
                              </span>
                            </div>
                          ))}
                          {product.variants.length > 2 && (
                            <p className="text-[10px] font-medium text-slate-400 text-center pt-0.5">
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

      {/* ===== FAQ ACCORDION SECTION ===== */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 sm:px-10 lg:px-16 py-14 sm:py-18">
        <div className="text-center mb-8">
          <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            Bantuan & FAQ
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 tracking-tight">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Info seputar format file desain, waktu pengerjaan, dan pengiriman
          </p>
        </div>

        <div className="space-y-3.5">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div 
                key={idx} 
                className={`glass-card rounded-2xl overflow-hidden transition-all duration-300 ${
                  isOpen 
                    ? 'ring-2 ring-blue-500/50 dark:ring-blue-400/50 shadow-lg bg-blue-50/20 dark:bg-blue-950/20 border-blue-200/80 dark:border-blue-800/80' 
                    : 'hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4 font-bold text-xs sm:text-sm text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors group cursor-pointer"
                >
                  <span className={`flex items-center gap-3 transition-colors duration-200 ${isOpen ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                    <HelpCircle className={`w-4 h-4 shrink-0 transition-colors duration-200 ${isOpen ? 'text-blue-600 dark:text-blue-400' : 'text-blue-500'}`} />
                    <span>{faq.q}</span>
                  </span>
                  <div className={`p-1 rounded-full transition-transform duration-300 ease-in-out ${isOpen ? 'rotate-180 bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>
                
                {/* Smooth Animated Accordion Body using CSS Grid */}
                <div 
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 pb-5 pt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/40 font-medium">
                      {faq.a}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===== CALL TO ACTION BANNER ===== */}
      <section className="relative z-10 max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 py-12 sm:py-16">
        <div className="glass-card p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-cyan-500/10 border border-blue-200/80 dark:border-blue-800/60 shadow-xl relative overflow-hidden">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-8 space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                <Check className="w-3.5 h-3.5" />
                Respon Cepat Jam Kerja
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Punya Kebutuhan Cetak Spesifik atau Grosir?
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl font-medium">
                Konsultasikan kebutuhan spanduk, merchandise, cetak buku nota, atau undangan Anda. Dapatkan penawaran harga khusus untuk pesanan partai besar!
              </p>

              {catalog?.store && (
                <div className="flex flex-wrap gap-5 pt-2 text-xs font-medium text-slate-600 dark:text-slate-300">
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

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3.5 justify-center">
              <a 
                href={`https://wa.me/${(catalog?.store.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Halo, saya ingin konsultasi order cetak partai besar / penawaran harga khusus.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shimmer-btn px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-center text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 active:scale-95 transition-all"
              >
                <Phone className="w-4 h-4" />
                <span>Konsultasi WhatsApp</span>
              </a>
              <button 
                onClick={scrollToCatalog}
                className="px-6 py-3.5 rounded-2xl glass-card text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 font-bold text-center text-xs sm:text-sm transition-all"
              >
                Lihat Katalog Produk
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ===== MODERN FOOTER WITH GOOGLE MAPS ===== */}
      <footer className="relative z-10 border-t border-slate-200/80 dark:border-slate-800/80 pt-12 pb-8 px-6 sm:px-10 lg:px-16 bg-white/70 dark:bg-[#090D16]/80 backdrop-blur-md">
        <div className="max-w-[1440px] mx-auto">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 pb-10 border-b border-slate-200/80 dark:border-slate-800/80">
            
            {/* Column 1: Store Branding & Contact */}
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center font-black text-white text-base shadow-lg shadow-blue-500/25">
                  P
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white leading-tight">
                    {catalog?.store.name || 'Percetakan Perdana'}
                  </h3>
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">
                    Percetakan Digital & Offset Berkualitas
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                Melayani cetak spanduk/banner, stiker produk, kartu nama, brosur, kalender, box kemasan, nota, jilid skripsi, hingga souvenir berkualitas dengan pengerjaan cepat dan harga terjangkau.
              </p>

              <div className="space-y-2.5 pt-1 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">{catalog?.store.address || 'Ciputat, Kec. Ciawigebang, Kabupaten Kuningan, Jawa Barat 45591'}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Senin - Sabtu: 08.00 - 17.00 WIB (Minggu Libur)</span>
                </div>
                {catalog?.store.phone && (
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <a 
                      href={`https://wa.me/${catalog.store.phone.replace(/[^0-9]/g, '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      {catalog.store.phone} (WhatsApp)
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div className="md:col-span-2 space-y-3">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                Tautan Cepat
              </h4>
              <ul className="space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                <li>
                  <button 
                    onClick={scrollToCatalog} 
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left"
                  >
                    Katalog & Daftar Harga
                  </button>
                </li>
                <li>
                  <Link 
                    href="/cek-pesanan" 
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors block"
                  >
                    Lacak Status Pesanan
                  </Link>
                </li>
                <li>
                  <a 
                    href="#faq" 
                    onClick={(e) => {
                      e.preventDefault();
                      window.scrollTo({ top: document.body.scrollHeight - 1200, behavior: 'smooth' });
                    }}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors block"
                  >
                    Bantuan & FAQ
                  </a>
                </li>
                <li className="pt-2">
                  <Link 
                    href="/login" 
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all font-bold"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Portal Kasir POS</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Google Maps Widget */}
            <div className="md:col-span-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>Lokasi Workshop / Toko</span>
                </h4>
                <a 
                  href="https://maps.app.goo.gl/ScZBrW3TXDmgp8LZ7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <span>Buka Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Embedded Interactive Map Card */}
              <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800/80 shadow-md relative group">
                <iframe
                  title="Lokasi Percetakan Perdana"
                  src="https://maps.google.com/maps?q=Percetakan+Perdana,+Ciputat,+Ciawigebang,+Kuningan&t=&z=16&ie=UTF8&iwloc=&output=embed"
                  className="w-full h-44 sm:h-48 border-0"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <div className="p-2.5 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-sm border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  <span className="truncate pr-2">📍 Ciputat, Kec. Ciawigebang, Kuningan</span>
                  <a
                    href="https://maps.app.goo.gl/ScZBrW3TXDmgp8LZ7"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] shadow-sm transition-colors flex items-center gap-1"
                  >
                    <span>Petunjuk Arah</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Copyright Bar */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
            <p>
              © {new Date().getFullYear()} <span className="font-bold text-slate-700 dark:text-slate-200">{catalog?.store.name || 'Percetakan Perdana'}</span>. Hak Cipta Dilindungi.
            </p>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[11px]">Sistem Kasir POS & Job Tracking Aktif</span>
            </div>
          </div>

        </div>
      </footer>

      {/* ===== FLOATING PULSE WHATSAPP BUTTON ===== */}
      {catalog?.store.phone && (
        <a 
          href={`https://wa.me/${catalog.store.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Halo, saya ingin tanya produk cetak di Perdana Printing.')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xl shadow-emerald-600/40 hover:scale-105 active:scale-95 transition-all group"
          title="Chat WhatsApp Langsung"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
          </span>
          <Phone className="w-4 h-4 fill-white" />
          <span className="hidden sm:inline">Hubungi Kami</span>
        </a>
      )}

    </div>
  );
}
