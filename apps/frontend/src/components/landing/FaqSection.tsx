import React, { useState } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';
import { FAQS, FaqItem } from '../../data/landingData';
import { SectionHeading } from '../shared';

interface FaqSectionProps {
  faqs?: FaqItem[];
}

export const FaqSection: React.FC<FaqSectionProps> = React.memo(({ faqs = FAQS }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq((prev) => (prev === index ? null : index));
  };

  return (
    <section id="faq" className="relative z-10 max-w-4xl mx-auto px-6 sm:px-10 lg:px-16 py-14 sm:py-18">
      <SectionHeading
        align="center"
        eyebrow="Bantuan & FAQ"
        title="Pertanyaan yang Sering Diajukan"
        description="Info seputar format file desain, waktu pengerjaan, dan pengiriman"
        className="mb-8"
      />

      <div className="space-y-3.5">
        {faqs.map((faq, idx) => {
          const isOpen = openFaq === idx;
          return (
            <div 
              key={idx} 
              className={`glass-card rounded-2xl overflow-hidden transition-[box-shadow,border-color,background-color] duration-200 ${
                isOpen 
                  ? 'ring-2 ring-blue-500/50 dark:ring-blue-400/50 shadow-lg bg-blue-50/20 dark:bg-blue-950/20 border-blue-200/80 dark:border-blue-800/80' 
                  : 'hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4 font-bold text-xs sm:text-sm text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors group cursor-pointer"
              >
                <span className={`flex items-center gap-3 transition-colors duration-200 ${isOpen ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                  <HelpCircle className={`w-4 h-4 shrink-0 transition-colors duration-200 ${isOpen ? 'text-blue-600 dark:text-blue-400' : 'text-blue-500'}`} />
                  <span>{faq.q}</span>
                </span>
                <div className={`p-1 rounded-full transition-transform duration-200 ease-out ${isOpen ? 'rotate-180 bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>
              
              {/* Smooth Animated Accordion Body using CSS Grid */}
              <div 
                className={`grid transition-[grid-template-rows,opacity] duration-250 ease-out ${
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
  );
});

FaqSection.displayName = 'FaqSection';
