'use client';

import React from 'react';
import { OrderStatus } from '../../types/transaction';
import { Customer } from '../../types/customer';
import { TrackingCard } from './TrackingCard';

interface TrackingColumnProps {
  title: string;
  status: OrderStatus;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  bgClass: string;
  transactions: any[];
  customers: Customer[];
  onOpenSettle: (job: any) => void;
  onSendWhatsApp: (job: any) => void;
  onAdvanceStatus: (id: number, currentStatus: OrderStatus) => void;
  onPrintSpk: (job: any) => void;
  onOpenDetail: (job: any) => void;
}

export const TrackingColumn: React.FC<TrackingColumnProps> = ({
  title,
  status,
  icon: Icon,
  colorClass,
  bgClass,
  transactions,
  customers,
  onOpenSettle,
  onSendWhatsApp,
  onAdvanceStatus,
  onPrintSpk,
  onOpenDetail,
}) => {
  const columnJobs = transactions.filter(j => j.order_status === status);

  return (
    <div className="flex-1 min-w-[280px] max-w-[340px] flex flex-col skeuo bg-bg-skeuo h-[calc(100vh-180px)] overflow-hidden">
      {/* Column Header */}
      <div className={`px-4 py-3.5 flex justify-between items-center ${bgClass}`}>
        <div className={`flex items-center gap-2 font-semibold text-xs ${colorClass}`}>
          <Icon className="w-4 h-4" />
          <span>{title}</span>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 ${colorClass}`}>
          {columnJobs.length}
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar space-y-2.5 bg-slate-50/40 dark:bg-slate-950/20">
        {columnJobs.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs">
            <p>Tidak ada pesanan</p>
          </div>
        ) : (
          columnJobs.map(job => (
            <TrackingCard
              key={job.id}
              job={job}
              status={status}
              customers={customers}
              onOpenSettle={onOpenSettle}
              onSendWhatsApp={onSendWhatsApp}
              onAdvanceStatus={onAdvanceStatus}
              onPrintSpk={onPrintSpk}
              onOpenDetail={onOpenDetail}
            />
          ))
        )}
      </div>
    </div>
  );
};
