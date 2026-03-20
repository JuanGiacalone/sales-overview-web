'use client';

import React, { useState, useRef } from 'react';
import { getSalesData, parseUploadedFile, SalesRecord } from '@/lib/parse-data';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { motion } from 'motion/react';
import { DollarSign, ShoppingBag, TrendingUp, Upload, Loader2 } from 'lucide-react';

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#9B59B6'];

export default function Dashboard() {
  const [data, setData] = useState<SalesRecord[]>(getSalesData());
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const parsedData = await parseUploadedFile(file);
      setData(parsedData);
    } catch (error) {
      console.error('Error parsing file:', error);
      alert('Failed to parse file. Please ensure it is a valid .csv or .xlsx file with the correct columns.');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // KPIs
  const totalRevenue = data.reduce((sum, item) => sum + item.price, 0);
  const totalOrders = new Set(data.map(item => item.orderNumber)).size;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Revenue over time
  const revenueByDateMap = new Map<string, number>();
  data.forEach(item => {
    revenueByDateMap.set(item.date, (revenueByDateMap.get(item.date) || 0) + item.price);
  });
  const revenueByDate = Array.from(revenueByDateMap.entries())
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Sales by product
  const salesByProductMap = new Map<string, number>();
  data.forEach(item => {
    salesByProductMap.set(item.product, (salesByProductMap.get(item.product) || 0) + item.price);
  });
  const salesByProduct = Array.from(salesByProductMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Payment methods
  const paymentMethodsMap = new Map<string, number>();
  data.forEach(item => {
    paymentMethodsMap.set(item.paymentMethod, (paymentMethodsMap.get(item.paymentMethod) || 0) + 1);
  });
  const paymentMethods = Array.from(paymentMethodsMap.entries())
    .map(([name, value]) => ({ name, value }));

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-stone-900">Sales Overview</h1>
          <p className="text-stone-500 mt-1">Interactive dashboard for recent transactions.</p>
        </div>
        <div>
          <input
            type="file"
            accept=".csv, .xlsx, .xls"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-stone-900 rounded-full hover:bg-stone-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            Upload Data
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard title="Total Revenue" value={`$${totalRevenue.toFixed(2)}`} icon={<DollarSign className="w-5 h-5" />} delay={0.1} />
        <KpiCard title="Total Orders" value={totalOrders} icon={<ShoppingBag className="w-5 h-5" />} delay={0.2} />
        <KpiCard title="Avg Order Value" value={`$${avgOrderValue.toFixed(2)}`} icon={<TrendingUp className="w-5 h-5" />} delay={0.3} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Revenue Over Time" delay={0.4}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueByDate} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#78716c' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#78716c' }} tickFormatter={(val) => `$${val}`} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Revenue']}
              />
              <Line type="monotone" dataKey="revenue" stroke="#FF6B6B" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Payment Methods" delay={0.5}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={paymentMethods}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={110}
                paddingAngle={2}
                dataKey="value"
              >
                {paymentMethods.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Revenue by Product" className="lg:col-span-2" delay={0.6}>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={salesByProduct} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#78716c' }} tickFormatter={(val) => `$${val}`} />
              <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#78716c' }} width={180} />
              <Tooltip
                cursor={{ fill: '#f5f5f4' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Revenue']}
              />
              <Bar dataKey="value" fill="#4ECDC4" radius={[0, 4, 4, 0]} barSize={24}>
                {salesByProduct.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Data Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden"
      >
        <div className="p-6 border-b border-stone-100">
          <h2 className="text-xl font-medium text-stone-800">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-stone-50 text-stone-500 font-medium">
              <tr>
                <th className="px-6 py-4">Order Number</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Payment Method</th>
                <th className="px-6 py-4 text-right">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {data.map((row, i) => (
                <tr key={i} className="hover:bg-stone-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-stone-700">{row.orderNumber}</td>
                  <td className="px-6 py-4 text-stone-500">{row.date}</td>
                  <td className="px-6 py-4 text-stone-700">{row.product}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-600">
                      {row.paymentMethod}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-stone-900">${row.price.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

function KpiCard({ title, value, icon, delay }: { title: string; value: string | number; icon: React.ReactNode; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 flex items-center space-x-4"
    >
      <div className="p-4 bg-stone-50 rounded-2xl text-stone-600">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-stone-500">{title}</p>
        <p className="text-2xl font-semibold text-stone-900 mt-1">{value}</p>
      </div>
    </motion.div>
  );
}

function ChartCard({ title, children, className = '', delay }: { title: string; children: React.ReactNode; className?: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className={`bg-white p-6 rounded-3xl shadow-sm border border-stone-100 ${className}`}
    >
      <h2 className="text-xl font-medium text-stone-800 mb-6">{title}</h2>
      {children}
    </motion.div>
  );
}
