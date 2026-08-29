import { Product } from '../../types/product';
import { RawMaterial } from '../../types/rawMaterial';
import { CartItemMaterial } from './types';

/**
 * Smart Auto-BOM Engine:
 * Menghitung resep bahan baku otomatis dan kebutuhan fisiknya berdasarkan
 * jenis produk, jumlah pesanan, dan dimensi (untuk spanduk/meteran).
 */
export function calculateAutoMaterials(
  product: Product,
  qty: number,
  length: number = 1,
  width: number = 1,
  allMaterials: RawMaterial[]
): CartItemMaterial[] {
  const pName = (product.name || '').toLowerCase();
  const unit = (product.unit_name || '').toLowerCase();
  const safeQty = Math.max(1, qty);
  const safeLength = length > 0 ? length : 1;
  const safeWidth = width > 0 ? width : 1;
  const areaMeter = Math.max(1, Math.ceil(safeLength * safeWidth * safeQty));

  const findMat = (pattern: string): RawMaterial | undefined => {
    const p = pattern.toLowerCase();
    return allMaterials.find(m => m.name.toLowerCase().includes(p));
  };

  const results: CartItemMaterial[] = [];

  const addMat = (mat: RawMaterial | undefined, amount: number) => {
    if (!mat || amount <= 0) return;
    // Hindari duplikasi bahan
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
  // 1. BUKU YASIN & MAJMU
  // =========================================================================
  if (pName.includes('yasin') || pName.includes('majmu') || pName.includes("qur'an") || pName.includes('quran')) {
    const isAP = pName.includes('ap') || pName.includes('art paper');
    const isHardCover = pName.includes('hard');
    
    // Tentukan jumlah lembar isi per buku
    let sheetsPerBook = 16; // default 128 hal HVS
    if (pName.includes('176')) sheetsPerBook = 22;
    else if (pName.includes('208')) sheetsPerBook = 26;
    else if (pName.includes('210')) sheetsPerBook = 26;
    else if (pName.includes('224')) sheetsPerBook = 28;

    const totalSheets = sheetsPerBook * safeQty;

    // Bahan Isi Buku
    if (isAP) {
      addMat(findMat('Kertas Kunsruk'), totalSheets);
    } else {
      addMat(findMat('Kertas HVS F4 Putih'), totalSheets);
    }

    // Bahan Cover Buku
    if (isHardCover) {
      addMat(findMat('Kertas Kunsruk'), safeQty);
      addMat(findMat('Lem Fox'), Math.max(1, Math.ceil(safeQty * 0.02)));
    } else {
      addMat(findMat('Kertas BW 23') || findMat('Kertas BW 21'), safeQty);
    }

    return results;
  }

  // =========================================================================
  // 2. UNDANGAN
  // =========================================================================
  if (pName.includes('undangan')) {
    if (pName.includes('digital')) {
      return []; // Tanpa bahan fisik
    }
    // 1 Plano = 2 Undangan fisik (0.5 lembar per undangan)
    const sheetsNeeded = Math.max(1, Math.ceil(safeQty * 0.5));
    if (pName.includes('blangko')) {
      addMat(findMat('Kertas BC Tik') || findMat('Kertas BW 21'), sheetsNeeded);
    } else {
      addMat(findMat('Kertas BW 23') || findMat('Kertas Kunsruk'), sheetsNeeded);
    }

    // Plastik Pembungkus Undangan
    const plastik = findMat('Plastik Und. Ukuran 11') || findMat('Plastik Und');
    addMat(plastik, safeQty);

    return results;
  }

  // =========================================================================
  // 3. SPANDUK, BANNER, BENDERA & DISPLAY
  // =========================================================================
  if (pName.includes('x banner') || pName.includes('x-banner')) {
    addMat(findMat('Bahan Flexi Banner 280G'), safeQty);
    addMat(findMat('Stand X Banner'), safeQty);
    return results;
  }

  if (pName.includes('roll banner')) {
    addMat(findMat('Bahan Flexi Banner 280G'), safeQty);
    addMat(findMat('Rangka Roll Banner'), safeQty);
    return results;
  }

  if (pName.includes('stand y') || pName.includes('stand x')) {
    addMat(findMat('Stand Y Banner') || findMat('Stand X Banner'), safeQty);
    return results;
  }

  if (pName.includes('kain') || pName.includes('bendera') || pName.includes('umbul')) {
    addMat(findMat('Bahan Spanduk Kain TC'), areaMeter);
    return results;
  }

  if (pName.includes('spanduk') || pName.includes('banner') || unit.includes('meter')) {
    addMat(findMat('Bahan Flexi Banner 280G'), areaMeter);
    return results;
  }

  // =========================================================================
  // 4. STIKER & LABEL
  // =========================================================================
  if (pName.includes('sticker') || pName.includes('stiker')) {
    if (pName.includes('meter') || pName.includes('cutting') || pName.includes('vinyl')) {
      addMat(findMat('Bahan Stiker Vinyl Roll'), areaMeter);
    } else {
      addMat(findMat('Kertas Stiker Cromo'), safeQty);
    }
    return results;
  }

  // =========================================================================
  // 5. NOTA, FAKTUR & KOP SURAT
  // =========================================================================
  if (pName.includes('nota') || pName.includes('faktur') || pName.includes('kwitansi')) {
    if (pName.includes('3 ply')) {
      addMat(findMat('Kertas NCR Putih'), safeQty);
      addMat(findMat('NCR Kuning') || findMat('NCR Biru'), safeQty);
      addMat(findMat('NCR Merah'), safeQty);
    } else if (pName.includes('2 ply')) {
      addMat(findMat('Kertas NCR Putih'), safeQty);
      addMat(findMat('NCR Merah') || findMat('NCR Kuning'), safeQty);
    } else {
      addMat(findMat('Kertas HVS F4 Putih'), safeQty);
    }
    return results;
  }

  if (pName.includes('kop surat')) {
    addMat(findMat('Kertas HVS F4 Putih'), safeQty);
    return results;
  }

  // =========================================================================
  // 6. STEMPEL
  // =========================================================================
  if (pName.includes('stempel')) {
    addMat(findMat('Bahan Karet Stempel'), safeQty);
    addMat(findMat('Bahan Tinta Cetak Cyan') || findMat('Bahan Tinta Cetak Black'), 1);
    return results;
  }

  // =========================================================================
  // 7. SOUVENIR & MERCHANDISE
  // =========================================================================
  if (pName.includes('id card') || pName.includes('lanyard')) {
    addMat(findMat('Tali Lanyard & Case ID'), safeQty);
    return results;
  }

  if (pName.includes('gantungan kunci')) {
    addMat(findMat('Gantungan Kunci Polos'), safeQty);
    return results;
  }

  if (pName.includes('amplop')) {
    if (pName.includes('panjang')) {
      addMat(findMat('Amplop Panjang'), safeQty);
    } else {
      addMat(findMat('Amplop Sedang'), safeQty);
    }
    return results;
  }

  // =========================================================================
  // 8. BROSUR, MAP, BOX MAKANAN, PAPER BAG, SERTIFIKAT
  // =========================================================================
  if (pName.includes('brosur')) {
    if (pName.includes('hvs')) {
      addMat(findMat('Kertas HVS F4 Putih'), safeQty);
    } else {
      addMat(findMat('Kertas Kunsruk'), safeQty);
    }
    return results;
  }

  if (pName.includes('map') || pName.includes('raport')) {
    addMat(findMat('Kertas BC Tik') || findMat('Kertas Ciwi Putih'), safeQty);
    return results;
  }

  if (pName.includes('box') || pName.includes('paper bag') || pName.includes('notebook') || pName.includes('yearbook')) {
    addMat(findMat('Kertas Kunsruk') || findMat('Kertas BW 23'), safeQty);
    addMat(findMat('Lem Fox'), Math.max(1, Math.ceil(safeQty * 0.01)));
    return results;
  }

  if (pName.includes('sertifikat') || pName.includes('piagam')) {
    addMat(findMat('Kertas BW 23') || findMat('Kertas BC Tik'), safeQty);
    return results;
  }

  return results;
}
