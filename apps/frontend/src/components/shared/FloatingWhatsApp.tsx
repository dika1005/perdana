import React from 'react';
import { Phone } from 'lucide-react';
import { createWaLink } from '../../utils/whatsapp';

interface FloatingWhatsAppProps {
  phone?: string | null;
  message?: string;
}

export const FloatingWhatsApp: React.FC<FloatingWhatsAppProps> = React.memo(({
  phone,
  message = 'Halo, saya ingin tanya produk cetak di Perdana Printing.'
}) => {
  if (!phone) return null;

  return (
    <a
      href={createWaLink(phone, message)}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xl shadow-emerald-600/40 hover:scale-105 active:scale-95 transition-[transform,background-color] duration-200 group"
      title="Chat WhatsApp Langsung"
    >
      <Phone className="w-4 h-4 fill-white" />
      <span className="hidden sm:inline">Hubungi Kami</span>
    </a>
  );
});

FloatingWhatsApp.displayName = 'FloatingWhatsApp';
