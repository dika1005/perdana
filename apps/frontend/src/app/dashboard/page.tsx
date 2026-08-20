'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, CreditCard, Clock, AlertTriangle, RefreshCw } from 'lucide-react';

import { reportService } from '../../services/reportService';
import { DailySalesReport, DashboardSummary, TopProductReport } from '../../types/report';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  subtitle: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, colorClass, subtitle }) => (
  <div className="skeuo p-6 flex flex-col gap-4">
    <div className="flex items-center justify-between">
      <div className={`w-12 h-12 rounded-xl skeuo-inset flex items-center justify-center ${colorClass}`}>
        <Icon className="w-6 h-6" />
      </div>
      <span className="text-sm font-medium text-text-muted">{subtitle}</span>
    </div>
    <div>
      <h3 className="text-text-muted font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold text-text-main">{value}</p>
    </div>
  </div>
);

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [salesData, setSalesData] = useState<DailySalesReport[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, salesRes, topRes] = await Promise.all([
        reportService.getSummary(),
        reportService.getDailySales(),
        reportService.getTopProducts(),
      ]);
      setSummary(summaryRes);
      setSalesData(salesRes);
      setTopProducts(topRes);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError(err?.response?.data?.message || 'Gagal memuat data dari database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formattedSalesData = salesData.map(item => ({
    name: new Date(item.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }),
    total: Number(item.total_sales),
    transaksi: item.total_transactions,
  }));

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-main mb-2">Ringkasan Bisnis</h1>
          <p className="text-text-muted">Data performa langsung dari database percetakan.</p>
        </div>
        <button 
          onClick={fetchDashboardData} 
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold skeuo-button text-brand-600 hover:text-brand-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Segarkan Data
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl skeuo-inset bg-red-50/50 border border-red-200 text-red-600 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchDashboardData} className="underline font-bold">Coba Lagi</button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatCard 
          title="Total Omset" 
          value={`Rp ${(summary?.total_omset || 0).toLocaleString('id-ID')}`} 
          icon={TrendingUp} 
          colorClass="text-brand-500" 
          subtitle={`${summary?.total_transactions || 0} transaksi`}
        />
        <StatCard 
          title="Total Pengeluaran" 
          value={`Rp ${(summary?.total_expenses || 0).toLocaleString('id-ID')}`} 
          icon={TrendingDown} 
          colorClass="text-red-500" 
          subtitle="Biaya & operasional"
        />
        <StatCard 
          title="Laba Bersih" 
          value={`Rp ${(summary?.net_profit || 0).toLocaleString('id-ID')}`} 
          icon={TrendingUp} 
          colorClass={(summary?.net_profit || 0) >= 0 ? "text-emerald-500" : "text-red-500"} 
          subtitle="Omset - Pengeluaran"
        />
        <StatCard 
          title="Total Piutang" 
          value={`Rp ${(summary?.total_piutang || 0).toLocaleString('id-ID')}`} 
          icon={CreditCard} 
          colorClass="text-amber-500" 
          subtitle={`${(summary?.dp_transactions || 0) + (summary?.unpaid_transactions || 0)} belum lunas`}
        />
        <StatCard 
          title="Pesanan Aktif" 
          value={`${summary?.active_orders || 0}`} 
          icon={Clock} 
          colorClass="text-blue-500" 
          subtitle={`${summary?.ready_orders || 0} siap diambil`}
        />
        <StatCard 
          title="Bahan Menipis" 
          value={`${summary?.low_stock_raw_materials_count || 0} Item`} 
          icon={AlertTriangle} 
          colorClass="text-rose-500" 
          subtitle="Perlu restock"
        />
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 skeuo p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-text-main">Grafik Penjualan Harian</h2>
            <span className="text-xs text-text-muted">Real-time dari Database</span>
          </div>

          <div className="h-72 w-full skeuo-inset p-4 rounded-xl flex items-center justify-center">
            {formattedSalesData.length === 0 ? (
              <div className="text-center text-text-muted text-sm">
                <p>Belum ada riwayat transaksi di database.</p>
                <p className="text-xs mt-1 text-text-muted/70">Buat transaksi baru di menu POS untuk melihat grafik.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formattedSalesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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

        {/* Top Products */}
        <div className="skeuo p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-text-main">Top Produk Terlaris</h2>
            <span className="text-xs text-text-muted">{topProducts.length} Produk</span>
          </div>

          <div className="space-y-4">
            {topProducts.length === 0 ? (
              <div className="text-center py-12 text-text-muted text-sm">
                Belum ada data penjualan produk.
              </div>
            ) : (
              topProducts.slice(0, 5).map((product, idx) => (
                <div key={idx} className="flex items-center gap-4 skeuo-inset p-3 rounded-xl">
                  <div className="w-8 h-8 rounded-lg skeuo flex items-center justify-center font-bold text-brand-500 text-sm">
                    #{idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-text-main truncate">{product.product_name}</h4>
                    <p className="text-xs text-text-muted">{product.total_qty} terjual</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-brand-600">
                      Rp {Number(product.total_revenue).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
