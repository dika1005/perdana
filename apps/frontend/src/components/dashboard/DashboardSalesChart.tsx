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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-text-main">Grafik Penjualan Harian</h2>
        <span className="text-xs text-text-muted">Real-time dari Database</span>
      </div>

      <div className="h-72 w-full skeuo-inset p-4 rounded-xl flex items-center justify-center">
        {data.length === 0 ? (
          <div className="text-center text-text-muted text-sm">
            <p>Belum ada riwayat transaksi di database.</p>
            <p className="text-xs mt-1 text-text-muted/70">Buat transaksi baru di menu POS untuk melihat grafik.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#a3b1c6" opacity={0.3} vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Rp ${(value / 1000).toLocaleString('id-ID')}k`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#e0e5ec', borderRadius: '12px', border: 'none', boxShadow: '4px 4px 8px rgba(163,177,198,0.5), -4px -4px 8px rgba(255,255,255, 0.6)' }}
                itemStyle={{ color: '#334155', fontWeight: 'bold' }}
                formatter={(value: any) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Total Penjualan']}
              />
              <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#e0e5ec' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
