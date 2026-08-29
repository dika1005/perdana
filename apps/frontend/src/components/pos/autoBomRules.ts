import { Product } from '../../types/product';
import { RawMaterial } from '../../types/rawMaterial';
import { CartItemMaterial } from './types';

/**
 * Smart Auto-BOM Engine (Bill of Materials Percetakan Perdana) — versi produksi.
 *
 * DUA MODE:
 *  1) MODE EKSPLISIT (presisi): bila admin sudah menentukan `raw_material_id`
 *     & `material_amount` di master produk, maka bahan utama dihitung tepat:
 *     qty × luas(m², bila kasir isi dimensi) × material_amount + waste 5%,
 *     lalu ditambah komponen pelengkap (tinta proporsional luas, stand/plastik
 *     bila relevan). Tidak lagi menebak dari nama.
 *  2) MODE TEBAK-NAMA (cadangan): bila produk belum di-set bahan utamanya,
 *     gunakan aturan kata kunci nama sebagai fallback agar tetap jalan.
 *
 * Prinsip rumus masuk akal:
 *  - Bahan utama dari LUAS NYATA pesanan (panjang × lebar × qty) bila diisi.
 *  - WASTE/SISA POTONG 5% agar stok tidak kelewat tipis.
 *  - TINTA PROPORSIONAL LUAS: 1 unit tinta per ~5 m² per warna (bukan flat 1).
 */

const WASTE_PCT = 0.05; // 5% sisa potong
const TINTA_PER_M2 = 0.2; // 1 unit tinta per 5 m² (0.2 unit/m²) per warna

function withWaste(qty: number): number {
  return Math.ceil(qty * (1 + WASTE_PCT));
}

function tintaUnits(areaM2: number): number {
  if (areaM2 <= 0) return 1;
  return Math.max(1, Math.ceil(areaM2 * TINTA_PER_M2));
}

export function calculateAutoMaterials(
  product: Product,
  qty: number,
  length: number = 1,
  width: number = 1,
  allMaterials: RawMaterial[]
): CartItemMaterial[] {
  if (!product || !allMaterials || allMaterials.length === 0) {
    return [];
  }

  const pName = (product.name || '').toLowerCase();
  const safeQty = Math.max(1, qty);
  const safeLength = length > 0 ? length : 1;
  const safeWidth = width > 0 ? width : 1;
  const areaMeter = Math.max(1, safeLength * safeWidth) * safeQty; // luas total m²
  // Pengali dimensi: bila kasir mengisi ukuran → luas; bila tidak → 1 (per pcs).
  const dimensionMultiplier = safeLength > 1 || safeWidth > 1 ? safeLength * safeWidth : 1;

  const findMat = (...patterns: string[]): RawMaterial | undefined => {
    for (const pattern of patterns) {
      const p = pattern.toLowerCase();
      const found = allMaterials.find(
        (m) =>
          m.name.toLowerCase().includes(p) ||
          (m.variant && m.variant.toLowerCase().includes(p))
      );
      if (found) return found;
    }
    return undefined;
  };

  const results: CartItemMaterial[] = [];

  const addMat = (mat: RawMaterial | undefined, amount: number) => {
    if (!mat || amount <= 0) return;
    const existing = results.find((r) => r.raw_material_id === mat.id);
    if (existing) {
      existing.material_qty += amount;
    } else {
      results.push({
        raw_material_id: mat.id,
        material_qty: amount,
        material_name: mat.name,
        material_unit: mat.unit,
        material_stock: mat.stock,
      });
    }
  };

  const addTinta = (warna: string, areaM2: number) => {
    addMat(findMat(`tinta cetak ${warna}`, `tinta ${warna}`), tintaUnits(areaM2));
  };

  // Komponen pelengkap umum berdasarkan jenis produk (tinta + plastik + stand).
  const addComplementary = (fullColour: boolean) => {
    if (fullColour) {
      addTinta('cyan', areaMeter);
      addTinta('magenta', areaMeter);
      addTinta('yellow', areaMeter);
      addTinta('black', areaMeter);
    } else {
      addTinta('cyan', areaMeter);
      addTinta('magenta', areaMeter);
      addTinta('black', areaMeter);
    }
    if (pName.includes('undangan')) {
      addMat(findMat('plastik und. ukuran 11', 'plastik und. ukuran 12', 'plastik und'), safeQty);
    }
  };

  // =========================================================================
  // MODE EKSPLISIT: admin sudah menentukan bahan utama & faktornya.
  // =========================================================================
  if (product.raw_material_id) {
    const mainMat = allMaterials.find((m) => m.id === product.raw_material_id);
    if (mainMat) {
      const factor = Number(product.material_amount) || 1;
      const mainQty = withWaste(safeQty * dimensionMultiplier * factor);
      addMat(mainMat, mainQty);

      // Pelengkap: stand untuk banner/x-banner, tinta, plastik undangan.
      if (pName.includes('x banner') || pName.includes('x-banner')) {
        addMat(findMat('stand x banner', 'stand x', 'stand'), safeQty);
      } else if (pName.includes('roll banner')) {
        addMat(findMat('rangka roll banner', 'roll banner', 'rangka'), safeQty);
      }
      addComplementary(pName.includes('full') || pName.includes('colour') || pName.includes('color'));
      return results;
    }
  }

  // =========================================================================
  // MODE TEBAK-NAMA (cadangan bila produk belum di-set bahan utamanya).
  // =========================================================================

  // 1. BANNER / SPANDUK
  if (pName.includes('x banner') || pName.includes('x-banner')) {
    const flexi = withWaste(safeQty * safeLength);
    addMat(findMat('flexi banner', 'flexi', 'banner'), flexi);
    addMat(findMat('stand x banner', 'stand x', 'stand'), safeQty);
    addTinta('cyan', areaMeter);
    addTinta('magenta', areaMeter);
    return results;
  }

  if (pName.includes('roll banner')) {
    const flexi = withWaste(safeQty * safeLength);
    addMat(findMat('flexi banner', 'flexi', 'banner'), flexi);
    addMat(findMat('rangka roll banner', 'roll banner', 'rangka'), safeQty);
    addTinta('cyan', areaMeter);
    addTinta('magenta', areaMeter);
    return results;
  }

  if (pName.includes('spanduk') || pName.includes('banner') || pName.includes('umbul')) {
    addMat(findMat('flexi banner', 'flexi', 'banner'), withWaste(areaMeter));
    addTinta('cyan', areaMeter);
    addTinta('magenta', areaMeter);
    return results;
  }

  // 2. BENDERA / KAIN
  if (pName.includes('bendera') || pName.includes('kain')) {
    addMat(findMat('kain tc', 'spanduk kain', 'kain'), withWaste(areaMeter));
    addTinta('black', areaMeter);
    addTinta('cyan', areaMeter);
    return results;
  }

  // 3. STIKER
  if (
    pName.includes('sticker (meter)') ||
    pName.includes('sticker cutting') ||
    pName.includes('stiker vinyl') ||
    pName.includes('meter')
  ) {
    addMat(findMat('stiker vinyl', 'vinyl roll', 'vinyl'), withWaste(safeQty * safeLength));
    addTinta('black', areaMeter);
    addTinta('cyan', areaMeter);
    return results;
  }

  if (pName.includes('sticker') || pName.includes('stiker')) {
    addMat(findMat('stiker cromo', 'cromo', 'stiker'), withWaste(safeQty));
    addTinta('cyan', areaMeter);
    addTinta('magenta', areaMeter);
    return results;
  }

  // 4. STEMPEL
  if (pName.includes('stempel flash')) {
    addMat(findMat('karet stempel', 'karet', 'stempel'), safeQty);
    addTinta('cyan', areaMeter);
    addTinta('black', areaMeter);
    return results;
  }

  if (pName.includes('stempel')) {
    addMat(findMat('karet stempel', 'karet', 'stempel'), safeQty);
    addTinta('black', areaMeter);
    return results;
  }

  // 5. UNDANGAN & AMPLOP
  if (pName.includes('undangan digital')) {
    return [];
  }

  if (pName.includes('undangan blangko')) {
    addMat(findMat('kertas bc tik', 'bc tik', 'bw 21'), withWaste(safeQty));
    addTinta('black', areaMeter);
    addMat(findMat('plastik und. ukuran 11', 'plastik und. ukuran 12', 'plastik und'), safeQty);
    return results;
  }

  if (pName.includes('undangan')) {
    addMat(findMat('kertas bw 23', 'bw 23', 'kunsruk', 'bw 21'), withWaste(safeQty));
    addTinta('cyan', areaMeter);
    addTinta('magenta', areaMeter);
    addMat(findMat('plastik und. ukuran 11', 'plastik und. ukuran 12', 'plastik und'), safeQty);
    return results;
  }

  if (pName.includes('amplop')) {
    const bahan = withWaste(safeQty);
    if (pName.includes('panjang')) {
      addMat(findMat('amplop panjang', 'amplop'), bahan);
    } else {
      addMat(findMat('amplop sedang', 'amplop'), bahan);
    }
    if (pName.includes('custom') || pName.includes('cetak')) {
      addTinta('black', areaMeter);
      addTinta('cyan', areaMeter);
    }
    return results;
  }

  // 6. NOTA / FAKTUR / KOP SURAT
  if (pName.includes('nota') || pName.includes('faktur') || pName.includes('kwitansi')) {
    const sheets = 500 * safeQty;
    if (pName.includes('3 ply')) {
      addMat(findMat('ncr putih', 'ncr'), sheets);
      addMat(findMat('ncr kuning', 'ncr biru', 'ncr'), sheets);
      addMat(findMat('ncr merah', 'ncr'), sheets);
    } else if (pName.includes('2 ply')) {
      addMat(findMat('ncr putih', 'ncr'), sheets);
      addMat(findMat('ncr merah', 'ncr kuning', 'ncr'), sheets);
    } else {
      addMat(findMat('hvs f4 putih', 'hvs'), sheets);
    }
    addTinta('black', areaMeter);
    addMat(findMat('lem fox', 'lem'), Math.max(1, Math.ceil(safeQty * 0.05)));
    return results;
  }

  if (pName.includes('kop surat')) {
    addMat(findMat('hvs f4 putih', 'hvs'), withWaste(500 * safeQty));
    addTinta('cyan', areaMeter);
    addTinta('black', areaMeter);
    return results;
  }

  // 7. BUKU YASIN / MAJMU / QUR'AN
  if (
    pName.includes('yasin') ||
    pName.includes('majmu') ||
    pName.includes("qur'an") ||
    pName.includes('quran')
  ) {
    const isAP = pName.includes('ap') || pName.includes('art paper');
    const isHardCover = pName.includes('hard');

    let sheetsPerBook = 16;
    if (pName.includes('176')) sheetsPerBook = 22;
    else if (pName.includes('208') || pName.includes('210')) sheetsPerBook = 26;
    else if (pName.includes('224')) sheetsPerBook = 28;
    else if (pName.includes('majmu kecil')) sheetsPerBook = 24;
    else if (pName.includes('majmu sedang')) sheetsPerBook = 32;
    else if (pName.includes("qur'an kecil") || pName.includes('quran kecil')) sheetsPerBook = 50;
    else if (pName.includes("qur'an besar") || pName.includes('quran besar')) sheetsPerBook = 75;

    const totalSheets = withWaste(sheetsPerBook * safeQty);

    if (isAP) {
      addMat(findMat('kertas kunsruk', 'kunsruk', 'art paper'), totalSheets);
    } else if (pName.includes('majmu')) {
      addMat(findMat('ciwi putih', 'kertas ciwi', 'hvs f4 putih'), totalSheets);
    } else {
      addMat(findMat('hvs f4 putih', 'kertas hvs', 'hvs'), totalSheets);
    }

    if (isHardCover) {
      addMat(findMat('kertas kunsruk', 'kunsruk', 'bw 23'), safeQty);
      addMat(findMat('lem fox', 'lem'), Math.max(1, Math.ceil(safeQty * 0.02)));
    } else {
      addMat(findMat('kertas bw 23', 'bw 23', 'bw 21', 'kunsruk'), safeQty);
    }

    addMat(
      findMat('plastik und. ukuran 15', 'plastik und. ukuran 14', 'plastik und'),
      safeQty
    );
    return results;
  }

  // 8. BROSUR / MAP / KALENDER / SERTIFIKAT
  if (pName.includes('brosur')) {
    const isFullColour = pName.includes('full') || pName.includes('colour') || pName.includes('color');
    const isHvs = pName.includes('hvs');
    const sheets = withWaste(500 * safeQty);

    if (isHvs) {
      addMat(findMat('kertas hvs f4 putih', 'hvs f4 putih', 'hvs'), sheets);
    } else {
      addMat(findMat('kertas kunsruk', 'kunsruk', 'art paper'), sheets);
    }

    if (isFullColour) {
      addTinta('cyan', areaMeter);
      addTinta('magenta', areaMeter);
      addTinta('yellow', areaMeter);
      addTinta('black', areaMeter);
    } else {
      addTinta('black', areaMeter);
    }

    addMat(findMat('plastik und. ukuran 15', 'plastik und. ukuran 14', 'plastik und'), safeQty);
    return results;
  }

  if (pName.includes('map') || pName.includes('raport') || pName.includes('sampul')) {
    addMat(findMat('kertas bc tik', 'bc tik', 'bw 21'), withWaste(safeQty));
    if (pName.includes('cetak') || pName.includes('emboss') || pName.includes('raport')) {
      addMat(findMat('ciwi putih', 'kertas ciwi', 'bw 23'), withWaste(safeQty * 5));
      addMat(findMat('lem fox', 'lem'), 1);
    }
    return results;
  }

  if (pName.includes('kalender')) {
    addMat(findMat('kertas kunsruk', 'kunsruk', 'art paper'), withWaste(safeQty * 6));
    addMat(findMat('kertas bw 23', 'bw 23'), safeQty);
    addTinta('cyan', areaMeter);
    addTinta('magenta', areaMeter);
    return results;
  }

  if (pName.includes('sertifikat') || pName.includes('piagam')) {
    const amount = unit_includes_rim(product.unit_name) ? withWaste(500 * safeQty) : withWaste(safeQty);
    addMat(findMat('kertas bw 23', 'bw 23', 'kertas bc tik', 'bc tik'), amount);
    addTinta('cyan', areaMeter);
    addTinta('black', areaMeter);
    return results;
  }

  // 9. SOUVENIR / ID CARD / KEMASAN / BUKU
  if (pName.includes('id card') || pName.includes('lanyard')) {
    addMat(findMat('tali lanyard & case id', 'lanyard', 'case id'), safeQty);
    addMat(findMat('kertas stiker cromo', 'stiker cromo', 'cromo'), Math.max(1, Math.ceil(safeQty / 10)));
    addTinta('cyan', areaMeter);
    return results;
  }

  if (pName.includes('gantungan kunci') || pName.includes('name tag')) {
    addMat(findMat('gantungan kunci polos', 'gantungan kunci', 'akrilik'), safeQty);
    addMat(findMat('kertas stiker cromo', 'stiker cromo'), Math.max(1, Math.ceil(safeQty / 20)));
    return results;
  }

  if (pName.includes('box makanan') || pName.includes('paper bag')) {
    addMat(findMat('kertas kunsruk', 'kunsruk', 'kertas bw 23', 'bc tik'), withWaste(safeQty));
    addMat(findMat('lem fox', 'lem'), Math.max(1, Math.ceil(safeQty * 0.01)));
    addTinta('black', areaMeter);
    return results;
  }

  if (pName.includes('note book') || pName.includes('notebook')) {
    addMat(findMat('hvs f4 putih', 'kertas hvs', 'hvs'), withWaste(safeQty * 25));
    addMat(findMat('kertas bw 21', 'bw 21', 'bw 23'), safeQty);
    addMat(findMat('lem fox', 'lem'), 1);
    return results;
  }

  if (pName.includes('year book') || pName.includes('yearbook')) {
    addMat(findMat('kertas kunsruk', 'kunsruk', 'art paper'), withWaste(safeQty * 40));
    addMat(findMat('kertas bw 23', 'bw 23'), safeQty);
    addMat(findMat('lem fox', 'lem'), Math.max(1, Math.ceil(safeQty * 0.05)));
    addTinta('cyan', areaMeter);
    addTinta('magenta', areaMeter);
    return results;
  }

  if (pName.includes('jasa') || pName.includes('setting') || pName.includes('dll')) {
    addMat(findMat('hvs f4 putih', 'kertas hvs', 'hvs'), withWaste(safeQty));
    return results;
  }

  // Default fallback
  addMat(findMat('hvs f4 putih', 'kertas hvs', 'kunsruk', 'bw 23'), withWaste(safeQty));
  addTinta('black', areaMeter);
  return results;
}

function unit_includes_rim(unit?: string | null): boolean {
  return !!unit && (unit.toLowerCase().includes('rim') || unit.toLowerCase().includes('/rim'));
}
