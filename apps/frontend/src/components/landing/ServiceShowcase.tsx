import React from 'react';
import { FolderTree, X, ChevronDown } from 'lucide-react';
import { PRESET_SERVICES, PresetService } from '../../data/landingData';
import { SectionHeading } from '../shared';

interface ServiceShowcaseProps {
  services?: PresetService[];
  selectedServiceId: string | null;
  onSelectService: (serviceId: string | null) => void;
  onScrollToCatalog: () => void;
}

export const ServiceShowcase: React.FC<ServiceShowcaseProps> = React.memo(({
  services = PRESET_SERVICES,
  selectedServiceId,
  onSelectService,
  onScrollToCatalog
}) => {
  const handleServiceClick = (serviceId: string) => {
    if (selectedServiceId === serviceId) {
      onSelectService(null);
    } else {
      onSelectService(serviceId);
      onScrollToCatalog();
    }
  };

  return (
    <section className="relative z-10 max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 py-14 sm:py-18">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <SectionHeading
          eyebrow="Layanan Percetakan"
          eyebrowIcon={<FolderTree className="w-3.5 h-3.5" />}
          title="Pilihan Layanan Percetakan"
          description="Klik salah satu kategori di bawah untuk menyaring produk di katalog kami secara instan."
        />

        {selectedServiceId && (
          <button 
            onClick={() => onSelectService(null)}
            className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 transition-[background-color,color,transform,box-shadow,border-color] cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Tampilkan Semua Layanan</span>
          </button>
        )}
      </div>

      {/* 6 Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
        {services.map((service) => {
          const isSelected = selectedServiceId === service.id;
          return (
            <div 
              key={service.id}
              onClick={() => handleServiceClick(service.id)}
              className={`glass-card glass-card-hover p-6 rounded-2xl flex flex-col justify-between cursor-pointer transition-[background-color,color,transform,box-shadow,border-color] ${
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
  );
});

ServiceShowcase.displayName = 'ServiceShowcase';
