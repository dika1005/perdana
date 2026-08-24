import {
  Printer,
  Tag,
  FileText,
  Layers,
  Sparkles,
  Package,
  Zap,
  Award,
  Shield,
  Truck,
  Search,
  MessageSquare,
  CheckCircle2,
  LucideIcon
} from 'lucide-react';

export interface PresetService {
  id: string;
  name: string;
  desc: string;
  icon: LucideIcon;
  gradient: string;
  bgLight: string;
  borderLight: string;
  textColor: string;
  tag: string;
  matchKeyword: string;
}

export interface FeatureHighlight {
  icon: LucideIcon;
  title: string;
  desc: string;
  color: string;
}

export interface OrderStep {
  step: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  gradient: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export const PRESET_SERVICES: PresetService[] = [
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

export const MARQUEE_ITEMS: string[] = [
  '⚡ Cetak Spanduk & Banner Kilat',
  '⭐ Stiker Vinyl & Chromo Die-Cut',
  '🔥 Kartu Nama & ID Card PVC',
  '💎 Undangan & Souvenir Premium',
  '🚀 Brosur & Flyer Warna Tajam',
  '📦 Nota NCR & Buku Jilid Spiral',
  '🎯 Cetak Meteran Bebas Ukuran'
];

export const FEATURE_HIGHLIGHTS: FeatureHighlight[] = [
  {
    icon: Zap,
    title: 'Express & Kilat',
    desc: 'Bisa same-day service siap pakai',
    color: 'from-amber-500 to-orange-500'
  },
  {
    icon: Award,
    title: 'Warna Tajam CMYK',
    desc: 'Mesin beresolusi tinggi & akurat',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: Shield,
    title: 'Harga Terbuka',
    desc: 'Sesuai katalog asli tanpa biaya tersembunyi',
    color: 'from-emerald-500 to-teal-500'
  },
  {
    icon: Truck,
    title: 'Ambil / Kirim',
    desc: 'Ambil di tempat atau kurir ekspedisi',
    color: 'from-violet-500 to-purple-500'
  }
];

export const ORDER_WORKFLOW_STEPS: OrderStep[] = [
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
];

export const FAQS: FaqItem[] = [
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
