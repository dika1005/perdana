import React from 'react';
import { Phone } from 'lucide-react';
import { PublicProduct } from '../../services/publicService';
import { formatRupiah } from '../../utils/format';
import { createWaLink } from '../../utils/whatsapp';
import { WaLinkButton } from '../shared';

interface ProductCardProps {
  product: PublicProduct;
  categoryName: string | null;
  storeName?: string;
  storePhone?: string;
}

export const ProductCard: React.FC<ProductCardProps> = React.memo(({
  product,
  categoryName,
  storeName = 'Perdana Printing',
  storePhone
}) => {
  // Label harga mengikuti cara produk dijual agar tidak menyesatkan:
  //  - AREA (m²)   -> "Harga per m²", badge "Ukuran Bebas (P×L)"
  //  - METER       -> "Harga per meter", badge "Ukuran Bebas (P×L)"
  //  - CUSTOM      -> "Hubungi Kami" (harga nego, jangan tampilkan angka placeholder)
  //  - RANGE       -> "Rentang Harga: min - max"
  //  - selain itu  -> "Harga:" normal
  const unit = (product.unit_name || 'pcs').trim().toLowerCase();
  const isAreaUnit = ['m2', 'm²', 'sqm', 'meter_persegi', 'meter persegi'].includes(unit);
  const isMeter = unit === 'meter' || unit === 'm';
  const isCustomSize = isAreaUnit || isMeter;
  const isCustomPrice = product.price_type === 'CUSTOM';

  const waMessage = `Halo ${storeName},\n\nSaya ingin pesan / konsultasi produk:\n• *${product.name}*\n\nMohon info harga dan cara kirim file desain. Terima kasih!`;
  const orderUrl = createWaLink(storePhone, waMessage);

  const priceLabel = product.price_type === 'RANGE'
    ? 'Rentang Harga:'
    : isAreaUnit ? 'Harga per m²:'
    : isMeter ? 'Harga per meter:'
    : 'Harga:';

  return (
    <div className="glass-card glass-card-hover p-5 sm:p-6 rounded-2xl flex flex-col justify-between group">
      <div>
        {/* Badges */}
        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          {categoryName && (
            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40">
              {categoryName}
            </span>
          )}
          {(isCustomSize || isCustomPrice) && (
            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/40">
              {isCustomSize ? 'Ukuran Bebas (P×L)' : 'Harga Nego'}
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
              {formatRupiah(product.min_price)} <span className="text-slate-400 font-normal text-xs">-</span> {formatRupiah(product.max_price)}
            </div>
          </div>
        ) : isCustomPrice ? (
          <div className="mb-2.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Harga:</span>
            <div className="text-amber-600 dark:text-amber-400 font-extrabold text-base">
              Hubungi Kami
            </div>
          </div>
        ) : (
          <div className="mb-2.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
              {priceLabel}
            </span>
            <div className="text-blue-600 dark:text-blue-400 font-extrabold text-lg">
              {formatRupiah(product.default_price)}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            /{product.unit_name || 'pcs'}{product.min_order > 1 ? ` · Min ${product.min_order}` : ''}
          </span>
          <WaLinkButton
            href={orderUrl}
            icon={<Phone className="w-3.5 h-3.5" />}
            className="px-3.5 py-1.5 rounded-xl text-xs shadow-md shadow-emerald-600/20"
          >
            Order WA
          </WaLinkButton>
        </div>

        {/* Variants list preview */}
        {product.has_variants && product.variants && product.variants.length > 0 && (
          <div className="mt-3.5 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/60">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              {product.variants.length} Varian Tersedia:
            </p>
            <div className="space-y-1">
              {product.variants.slice(0, 2).map((v) => (
                <div key={v.id} className="flex justify-between items-center text-[10px] font-medium px-2.5 py-1 rounded-lg bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
                  <span className="truncate mr-2 text-slate-700 dark:text-slate-300">{v.variant_name}</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                    {v.price_type === 'RANGE' 
                      ? `${formatRupiah(v.min_price)} - ${formatRupiah(v.max_price)}` 
                      : formatRupiah(v.price)
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
});

ProductCard.displayName = 'ProductCard';
