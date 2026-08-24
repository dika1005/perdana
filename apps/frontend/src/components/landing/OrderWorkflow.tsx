import React from 'react';
import { ORDER_WORKFLOW_STEPS, OrderStep } from '../../data/landingData';

interface OrderWorkflowProps {
  steps?: OrderStep[];
}

export const OrderWorkflow: React.FC<OrderWorkflowProps> = React.memo(({
  steps = ORDER_WORKFLOW_STEPS
}) => {
  return (
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
          {steps.map((s, idx) => (
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
  );
});

OrderWorkflow.displayName = 'OrderWorkflow';
