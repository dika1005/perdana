import React from 'react';
import { ORDER_WORKFLOW_STEPS, OrderStep } from '../../data/landingData';
import { SectionHeading } from '../shared';

interface OrderWorkflowProps {
  steps?: OrderStep[];
}

export const OrderWorkflow: React.FC<OrderWorkflowProps> = React.memo(({
  steps = ORDER_WORKFLOW_STEPS
}) => {
  return (
    <section className="relative z-10 py-14 sm:py-18 px-6 sm:px-10 lg:px-16 bg-slate-100/60 dark:bg-slate-900/40 border-y border-slate-200/80 dark:border-slate-800/80">
      <div>
        <SectionHeading
          align="center"
          title="Alur Pemesanan"
          description="Dari memilih produk di katalog sampai pesanan diambil atau dikirim"
          className="mb-10"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 xl:gap-6">
          {steps.map((s, idx) => (
            <div key={idx} className="glass-card glass-card-hover p-6 sm:p-7 rounded-2xl relative overflow-hidden group">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
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
  );
});

OrderWorkflow.displayName = 'OrderWorkflow';
