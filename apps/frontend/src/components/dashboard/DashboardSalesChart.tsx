'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface FormattedSaleItem {
  name: string;
  total: number;
  transaksi: number;
}

interface DashboardSalesChartProps {
  data: FormattedSaleItem[];
}

export const DashboardSalesChart: React.FC<DashboardSalesChartProps> = ({ data }) => {
  return (
    <div className="lg:col-span-2 skeuo p-6">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-sm font-bold text-text-main">Grafik Penjualan Harian</h2>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/60 px-2.5 py-0.5 rounded-full border border-slate-200/60 dark:border-slate-700/60">
          Real-time Database
        </span>
      </div>

      <div className="h-72 w-full p-4 rounded-xl flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/80">
        {data.length === 0 ? (
          <div className="text-center text-slate-400 dark:text-slate-500 text-sm">
            <p className="font-semibold">Belum ada riwayat transaksi di database.</p>
            <p className="text-xs mt-1">Buat transaksi baru di menu POS untuk melihat grafik.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.4} vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `Rp ${(value / 1000).toLocaleString('id-ID')}k`} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--color-bg-skeuo)', 
                  borderRadius: '10px', 
                  border: '1px solid var(--border-skeuo)', 
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                  color: 'var(--color-text-main)',
                  fontSize: '12px',
                  padding: '8px 12px'
                }}
                itemStyle={{ color: '#2563eb', fontWeight: 'bold' }}
                labelStyle={{ color: 'var(--color-text-main)', fontWeight: 'bold', marginBottom: '2px' }}
                formatter={(value: any) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Total Penjualan']}
              />
              <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3.5, fill: '#2563eb', strokeWidth: 2, stroke: '#ffffff' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
