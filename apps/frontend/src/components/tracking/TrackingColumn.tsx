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
  transactions: any[];
  customers: Customer[];
  onOpenSettle: (job: any) => void;
  onSendWhatsApp: (job: any) => void;
  onAdvanceStatus: (id: number, currentStatus: OrderStatus) => void;
}

export const TrackingColumn: React.FC<TrackingColumnProps> = ({
  title,
  status,
  icon: Icon,
  colorClass,
  transactions,
  customers,
  onOpenSettle,
  onSendWhatsApp,
  onAdvanceStatus,
}) => {
  const columnJobs = transactions.filter(j => j.order_status === status);

  return (
    <div className="flex-1 min-w-[300px] flex flex-col skeuo bg-bg-skeuo h-[calc(100vh-180px)]">
      <div className={`p-4 border-b border-white/20 flex justify-between items-center ${colorClass}`}>
        <div className="flex items-center gap-2 font-bold text-sm">
          <Icon className="w-4 h-4" />
          {title}
        </div>
        <span className="w-6 h-6 rounded-full skeuo-inset flex items-center justify-center text-xs font-bold text-text-main">
          {columnJobs.length}
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
        {columnJobs.length === 0 ? (
          <div className="text-center py-12 text-text-muted text-xs">
            Kosong
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
            />
          ))
        )}
      </div>
    </div>
  );
};
