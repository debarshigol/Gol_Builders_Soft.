'use client';

import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { TrendingUp, BarChart3, Calendar, Layers, DollarSign } from 'lucide-react';

interface ChartPoint {
  date: string;
  fullDate?: string;
  amount: number;
  cumulativeAmount?: number;
  paidAmount?: number;
  invoicesCount?: number;
  rawTimestamp?: number;
}

interface SalesChartsProps {
  chartData: ChartPoint[];
  paymentBreakdown: Array<{
    name: string;
    count: number;
    color: string;
  }>;
}

function formatCurrency(val: number): string {
  if (val >= 100000) {
    return `₹${(val / 100000).toFixed(1)}L`;
  }
  if (val >= 1000) {
    return `₹${(val / 1000).toFixed(1)}k`;
  }
  return `₹${val}`;
}

export const SalesCharts: React.FC<SalesChartsProps> = ({
  chartData,
  paymentBreakdown,
}) => {
  const [metricMode, setMetricMode] = useState<'daily' | 'cumulative'>('daily');
  const [timeframe, setTimeframe] = useState<'all' | '30days' | '7days'>('all');

  // Filter chart data by timeframe
  const filteredData = useMemo(() => {
    if (!chartData || chartData.length === 0) return [];
    if (timeframe === 'all') return chartData;

    const now = Date.now();
    const days = timeframe === '7days' ? 7 : 30;
    const cutoff = now - days * 24 * 60 * 60 * 1000;

    const sliced = chartData.filter(d => (d.rawTimestamp ? d.rawTimestamp >= cutoff : true));
    return sliced.length > 0 ? sliced : chartData;
  }, [chartData, timeframe]);

  // Compute summary stats for the active chart view
  const periodTotalRevenue = useMemo(() => {
    return filteredData.reduce((sum, d) => sum + d.amount, 0);
  }, [filteredData]);

  const periodTotalInvoices = useMemo(() => {
    return filteredData.reduce((sum, d) => sum + (d.invoicesCount || 1), 0);
  }, [filteredData]);

  const totalPaymentTransactions = useMemo(() => {
    return paymentBreakdown.reduce((sum, p) => sum + p.count, 0);
  }, [paymentBreakdown]);

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: ChartPoint = payload[0].payload;
      return (
        <div className="bg-slate-950/95 border border-slate-700/80 p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs space-y-1.5 min-w-[160px]">
          <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 border-b border-slate-800 pb-1">
            <Calendar className="w-3 h-3 text-indigo-400" />
            <span>{data.fullDate || data.date}</span>
          </div>

          <div className="flex justify-between items-center pt-0.5">
            <span className="text-slate-400">Daily Revenue:</span>
            <span className="font-mono font-bold text-emerald-400 text-sm">
              ₹{data.amount.toLocaleString('en-IN')}
            </span>
          </div>

          {data.cumulativeAmount !== undefined && (
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">Cumulative:</span>
              <span className="font-mono font-semibold text-indigo-300">
                ₹{data.cumulativeAmount.toLocaleString('en-IN')}
              </span>
            </div>
          )}

          {data.invoicesCount !== undefined && (
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">Invoices Billed:</span>
              <span className="font-mono font-bold text-amber-400">
                {data.invoicesCount} {data.invoicesCount === 1 ? 'bill' : 'bills'}
              </span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const activeDataKey = metricMode === 'daily' ? 'amount' : 'cumulativeAmount';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* 1. Revenue Trajectory Area Chart */}
      <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
        
        {/* Header & Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
                <span>Sales Revenue Trajectory</span>
              </h3>
              <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-md border border-indigo-500/20 font-bold">
                ₹{periodTotalRevenue.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Aggregated daily turnover from {periodTotalInvoices} transactions
            </p>
          </div>

          <div className="flex items-center space-x-2 flex-wrap gap-y-1.5">
            {/* View Mode Toggle: Daily vs Cumulative */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setMetricMode('daily')}
                className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center space-x-1 ${
                  metricMode === 'daily'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart3 className="w-3 h-3" />
                <span>Daily</span>
              </button>
              <button
                type="button"
                onClick={() => setMetricMode('cumulative')}
                className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center space-x-1 ${
                  metricMode === 'cumulative'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>Cumulative</span>
              </button>
            </div>

            {/* Timeframe selector */}
            <select
              value={timeframe}
              onChange={e => setTimeframe(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none font-medium"
            >
              <option value="all">All Dates</option>
              <option value="30days">Last 30 Days</option>
              <option value="7days">Last 7 Days</option>
            </select>
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="h-64 w-full mt-4">
          {filteredData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs space-y-2">
              <BarChart3 className="w-8 h-8 text-slate-600" />
              <span>No transactions recorded in this timeframe yet.</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  tickFormatter={formatCurrency}
                  width={55}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey={activeDataKey}
                  stroke="#6366f1"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  activeDot={{ r: 6, fill: '#818cf8', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 2. Payment Modes Breakdown Bar Chart */}
      <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-bold text-white text-base">Payment Breakdown</h3>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
              {totalPaymentTransactions} Total Bills
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-4">Distribution by customer settlement mode</p>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentBreakdown} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#020617',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {paymentBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-800 text-xs">
          {paymentBreakdown.map(p => {
            const pct = totalPaymentTransactions > 0 ? Math.round((p.count / totalPaymentTransactions) * 100) : 0;
            return (
              <div
                key={p.name}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition"
              >
                <span className="flex items-center gap-1.5 text-slate-300 font-medium text-[11px]">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                  {p.name}
                </span>
                <div className="text-right font-mono">
                  <span className="font-bold text-white text-xs">{p.count}</span>
                  <span className="text-[10px] text-slate-500 ml-1">({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
