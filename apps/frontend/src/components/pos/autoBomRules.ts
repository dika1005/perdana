import { Product } from '../../types/product';
import { RawMaterial } from '../../types/rawMaterial';
import { CartItemMaterial } from './types';

/**
 * Smart Auto-BOM Engine (Bill of Materials Lengkap Percetakan Perdana):
 * Menghasilkan rekomendasi resep bahan baku lengkap & riil untuk seluruh produk cetak:
 * (Bahan Utama/Kertas + Tinta Cetak CMYK + Perekat/Lem + Plastik Packing/Stand).
 */
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
  const unit = (product.unit_name || '').toLowerCase();
  const safeQty = Math.max(1, qty);
  const safeLength = length > 0 ? length : 1;
  const safeWidth = width > 0 ? width : 1;
  const areaMeter = Math.max(1, Math.ceil(safeLength * safeWidth * safeQty));

  // Helper pencari bahan dengan multi-keyword toleran (mencari di nama & varian)
  const findMat = (...patterns: string[]): RawMaterial | undefined => {
    for (const pattern of patterns) {
      const p = pattern.toLowerCase();
      const found = allMaterials.find(m => 
        m.name.toLowerCase().includes(p) || (m.variant && m.variant.toLowerCase().includes(p))
      );
      if (found) return found;
    }
    return undefined;
  };

  const results: CartItemMaterial[] = [];

  const addMat = (mat: RawMaterial | undefined, amount: number) => {
    if (!mat || amount <= 0) return;
    const existing = results.find(r => r.raw_material_id === mat.id);
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

  // =========================================================================
  // 1. BANNER, SPANDUK, BENDERA & DISPLAY
  // =========================================================================
  if (pName.includes('spanduk kain') || pName.includes('bendera') || pName.includes('umbul')) {
    addMat(findMat('kain tc', 'spanduk kain', 'kain'), areaMeter);
    addMat(findMat('tinta cetak black', 'tinta black'), 1);
    addMat(findMat('tinta cetak cyan', 'tinta cyan'), 1);
    return results;
  }

  if (pName.includes('x banner') || pName.includes('x-banner')) {
    addMat(findMat('flexi banner', 'flexi', 'banner'), safeQty * 2); // ~2 meter per banner
    addMat(findMat('stand x banner', 'stand x', 'stand'), safeQty);
    addMat(findMat('tinta cetak cyan', 'tinta cyan'), 1);
    addMat(findMat('tinta cetak magenta', 'tinta magenta'), 1);
    return results;
  }

  if (pName.includes('roll banner')) {
    addMat(findMat('flexi banner', 'flexi', 'banner'), safeQty * 2);
    addMat(findMat('rangka roll banner', 'roll banner', 'rangka'), safeQty);
    addMat(findMat('tinta cetak cyan', 'tinta cyan'), 1);
    addMat(findMat('tinta cetak magenta', 'tinta magenta'), 1);
    return results;
  }

  if (pName.includes('stand y') || pName.includes('stand x')) {
    addMat(findMat('stand x banner', 'stand y banner', 'stand'), safeQty);
    return results;
  }

  if (pName.includes('spanduk') || (pName.includes('banner') && !pName.includes('stand'))) {
    addMat(findMat('flexi banner', 'flexi', 'banner'), areaMeter);
    addMat(findMat('tinta cetak cyan', 'tinta cyan'), 1);
    addMat(findMat('tinta cetak magenta', 'tinta magenta'), 1);
    return results;
  }

  // =========================================================================
  // 2. STIKER & LABEL
  // =========================================================================
  if (pName.includes('sticker (meter)') || pName.includes('sticker cutting') || pName.includes('stiker vinyl') || pName.includes('meter')) {
    addMat(findMat('stiker vinyl', 'vinyl roll', 'vinyl'), areaMeter);
    addMat(findMat('tinta cetak black', 'tinta black'), 1);
    addMat(findMat('tinta cetak cyan', 'tinta cyan'), 1);
    return results;
  }

  if (pName.includes('sticker') || pName.includes('stiker')) {
    addMat(findMat('stiker cromo', 'cromo', 'stiker'), safeQty);
    addMat(findMat('tinta cetak cyan', 'tinta cyan'), 1);
    addMat(findMat('tinta cetak magenta', 'tinta magenta'), 1);
    return results;
  }

  // =========================================================================
  // 3. STEMPEL & AKSESORIS
  // =========================================================================
  if (pName.includes('stempel flash')) {
    addMat(findMat('karet stempel', 'karet', 'stempel'), safeQty);
    addMat(findMat('tinta cetak cyan', 'tinta cyan'), 1);
    addMat(findMat('tinta cetak black', 'tinta black'), 1);
    return results;
  }

  if (pName.includes('stempel')) {
    addMat(findMat('karet stempel', 'karet', 'stempel'), safeQty);
    addMat(findMat('tinta cetak black', 'tinta black'), 1);
    return results;
  }

  // =========================================================================
  // 4. UNDANGAN & AMPLOP
  // =========================================================================
  if (pName.includes('undangan digital')) {
    return []; // Produk jasa digital tanpa bahan fisik
  }

  if (pName.includes('undangan blangko')) {
    addMat(findMat('kertas bc tik', 'bc tik', 'bw 21'), Math.max(1, Math.ceil(safeQty * 0.5)));
    addMat(findMat('tinta cetak black', 'tinta black'), 1);
    addMat(findMat('plastik und. ukuran 11', 'plastik und. ukuran 12', 'plastik und'), safeQty);
    return results;
  }

  if (pName.includes('undangan')) {
    addMat(findMat('kertas bw 23', 'bw 23', 'kunsruk', 'bw 21'), Math.max(1, Math.ceil(safeQty * 0.5)));
    addMat(findMat('tinta cetak cyan', 'tinta cyan'), 1);
    addMat(findMat('tinta cetak magenta', 'tinta magenta'), 1);
    addMat(findMat('plastik und. ukuran 11', 'plastik und. ukuran 12', 'plastik und'), safeQty);
    return results;
  }

  if (pName.includes('amplop')) {
    if (pName.includes('panjang')) {
      addMat(findMat('amplop panjang', 'amplop'), safeQty * 100);
    } else {
      addMat(findMat('amplop sedang', 'amplop'), safeQty * 100);
    }
    if (pName.includes('custom') || pName.includes('cetak')) {
      addMat(findMat('tinta cetak black', 'tinta black'), 1);
      addMat(findMat('tinta cetak cyan', 'tinta cyan'), 1);
    }
    return results;
  }

  // =========================================================================
  // 5. NOTA, FAKTUR & KOP SURAT
  // =========================================================================
  if (pName.includes('nota') || pName.includes('faktur') || pName.includes('kwitansi')) {
    const sheetsPerRim = 500 * safeQty;
    if (pName.includes('3 ply')) {
      addMat(findMat('ncr putih', 'ncr'), sheetsPerRim);
      addMat(findMat('ncr kuning', 'ncr biru', 'ncr'), sheetsPerRim);
      addMat(findMat('ncr merah', 'ncr'), sheetsPerRim);
    } else if (pName.includes('2 ply')) {
      addMat(findMat('ncr putih', 'ncr'), sheetsPerRim);
      addMat(findMat('ncr merah', 'ncr kuning', 'ncr'), sheetsPerRim);
    } else {
      addMat(findMat('hvs f4 putih', 'hvs'), sheetsPerRim);
    }
    // Tinta Cetak Nota
    addMat(findMat('tinta cetak black', 'tinta black'), 1);
    // Lem Jilid Nota
    addMat(findMat('lem fox', 'lem'), 1);
    return results;
  }

  if (pName.includes('kop surat')) {
    addMat(findMat('hvs f4 putih', 'hvs'), 500 * safeQty);
    addMat(findMat('tinta cetak cyan', 'tinta cyan'), 1);
    addMat(findMat('tinta cetak black', 'tinta black'), 1);
    return results;
  }

  // =========================================================================
  // 6. BUKU YASIN, MAJMU & QUR'AN (Multi Bahan Lengkap: Isi + Cover + Lem + Plastik)
  // =========================================================================
  if (pName.includes('yasin') || pName.includes('majmu') || pName.includes("qur'an") || pName.includes('quran')) {
    const isAP = pName.includes('ap') || pName.includes('art paper');
    const isHardCover = pName.includes('hard');
    
    // Hitung lembar isi per buku
    let sheetsPerBook = 16; // default 128 hal HVS
    if (pName.includes('176')) sheetsPerBook = 22;
    else if (pName.includes('208')) sheetsPerBook = 26;
    else if (pName.includes('210')) sheetsPerBook = 26;
    else if (pName.includes('224')) sheetsPerBook = 28;
    else if (pName.includes('majmu kecil')) sheetsPerBook = 24;
    else if (pName.includes('majmu sedang')) sheetsPerBook = 32;
    else if (pName.includes("qur'an kecil") || pName.includes('quran kecil')) sheetsPerBook = 50;
    else if (pName.includes("qur'an besar") || pName.includes('quran besar')) sheetsPerBook = 75;

    const totalSheets = sheetsPerBook * safeQty;

    // 1. Kertas Isi Buku
    if (isAP) {
      addMat(findMat('kertas kunsruk', 'kunsruk', 'art paper'), totalSheets);
    } else if (pName.includes('majmu')) {
      addMat(findMat('ciwi putih', 'kertas ciwi', 'hvs f4 putih'), totalSheets);
    } else {
      addMat(findMat('hvs f4 putih', 'kertas hvs', 'hvs'), totalSheets);
    }

    // 2. Kertas Cover Buku
    if (isHardCover) {
      addMat(findMat('kertas kunsruk', 'kunsruk', 'bw 23'), safeQty);
      // 3. Perekat Lem Fox
      addMat(findMat('lem fox', 'lem'), Math.max(1, Math.ceil(safeQty * 0.02)));
    } else {
      addMat(findMat('kertas bw 23', 'bw 23', 'bw 21', 'kunsruk'), safeQty);
    }

    // 4. Plastik Pembungkus Souvenir Yasin
    addMat(findMat('plastik und. ukuran 15', 'plastik und. ukuran 14', 'plastik und'), safeQty);

    return results;
  }

  // =========================================================================
  // 7. BROSUR, MAP, KALENDER & SERTIFIKAT
  // =========================================================================
  if (pName.includes('brosur')) {
    const isFullColour = pName.includes('full') || pName.includes('colour') || pName.includes('color');
    const isHvs = pName.includes('hvs');
    const sheetsPerRim = 500 * safeQty;

    // 1. Kertas Bahan Brosur
    if (isHvs) {
      addMat(findMat('kertas hvs f4 putih', 'hvs f4 putih', 'hvs'), sheetsPerRim);
    } else {
      addMat(findMat('kertas kunsruk', 'kunsruk', 'art paper'), sheetsPerRim);
    }

    // 2. Tinta Cetak
    if (isFullColour) {
      addMat(findMat('tinta cetak cyan', 'cyan'), 1);
      addMat(findMat('tinta cetak magenta', 'magenta'), 1);
      addMat(findMat('tinta cetak yellow', 'yellow'), 1);
      addMat(findMat('tinta cetak black', 'black'), 1);
    } else {
      addMat(findMat('tinta cetak black', 'tinta black'), 1);
    }

    // 3. Plastik Packing Brosur
    addMat(findMat('plastik und. ukuran 15', 'plastik und. ukuran 14', 'plastik und'), safeQty);

    return results;
  }

  if (pName.includes('map') || pName.includes('raport') || pName.includes('sampul')) {
    addMat(findMat('kertas bc tik', 'bc tik', 'bw 21'), safeQty);
    if (pName.includes('cetak') || pName.includes('emboss') || pName.includes('raport')) {
      addMat(findMat('ciwi putih', 'kertas ciwi', 'bw 23'), safeQty * 5);
      addMat(findMat('lem fox', 'lem'), 1);
    }
    return results;
  }

  if (pName.includes('kalender')) {
    addMat(findMat('kertas kunsruk', 'kunsruk', 'art paper'), safeQty * 6);
    addMat(findMat('kertas bw 23', 'bw 23'), safeQty);
    addMat(findMat('tinta cetak cyan', 'tinta cyan'), 1);
    addMat(findMat('tinta cetak magenta', 'tinta magenta'), 1);
    return results;
  }

  if (pName.includes('sertifikat') || pName.includes('piagam')) {
    const amount = (unit.includes('rim') || pName.includes('/rim')) ? 500 * safeQty : safeQty;
    addMat(findMat('kertas bw 23', 'bw 23', 'kertas bc tik', 'bc tik'), amount);
    addMat(findMat('tinta cetak cyan', 'tinta cyan'), 1);
    addMat(findMat('tinta cetak black', 'tinta black'), 1);
    return results;
  }

  // =========================================================================
  // 8. SOUVENIR, ID CARD, KEMASAN & BUKU
  // =========================================================================
  if (pName.includes('id card') || pName.includes('lanyard')) {
    addMat(findMat('tali lanyard & case id', 'lanyard', 'case id'), safeQty);
    addMat(findMat('kertas stiker cromo', 'stiker cromo', 'cromo'), Math.max(1, Math.ceil(safeQty / 10)));
    addMat(findMat('tinta cetak cyan', 'tinta cyan'), 1);
    return results;
  }

  if (pName.includes('gantungan kunci') || pName.includes('name tag')) {
    addMat(findMat('gantungan kunci polos', 'gantungan kunci', 'akrilik'), safeQty);
    addMat(findMat('kertas stiker cromo', 'stiker cromo'), Math.max(1, Math.ceil(safeQty / 20)));
    return results;
  }

  if (pName.includes('box makanan') || pName.includes('paper bag')) {
    addMat(findMat('kertas kunsruk', 'kunsruk', 'kertas bw 23', 'bc tik'), safeQty);
    addMat(findMat('lem fox', 'lem'), Math.max(1, Math.ceil(safeQty * 0.01)));
    addMat(findMat('tinta cetak black', 'tinta black'), 1);
    return results;
  }

  if (pName.includes('note book') || pName.includes('notebook')) {
    addMat(findMat('hvs f4 putih', 'kertas hvs', 'hvs'), safeQty * 25);
    addMat(findMat('kertas bw 21', 'bw 21', 'bw 23'), safeQty);
    addMat(findMat('lem fox', 'lem'), 1);
    return results;
  }

  if (pName.includes('year book') || pName.includes('yearbook')) {
    addMat(findMat('kertas kunsruk', 'kunsruk', 'art paper'), safeQty * 40);
    addMat(findMat('kertas bw 23', 'bw 23'), safeQty);
    addMat(findMat('lem fox', 'lem'), Math.max(1, Math.ceil(safeQty * 0.05)));
    addMat(findMat('tinta cetak cyan', 'tinta cyan'), 1);
    addMat(findMat('tinta cetak magenta', 'tinta magenta'), 1);
    return results;
  }

  if (pName.includes('jasa') || pName.includes('setting') || pName.includes('dll')) {
    addMat(findMat('hvs f4 putih', 'kertas hvs', 'hvs'), safeQty);
    return results;
  }

  // Default fallback: Kertas HVS + Tinta
  addMat(findMat('hvs f4 putih', 'kertas hvs', 'kunsruk', 'bw 23'), safeQty);
  addMat(findMat('tinta cetak black', 'tinta black'), 1);
  return results;
}
