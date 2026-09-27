import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { TrendingDown, TrendingUp, Minus, ArrowDownRight, ArrowUpRight, LineChart as LineChartIcon, Clock } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-chart-tooltip">
        <div className="tooltip-time">
          <Clock size={12} className="text-gray-400" />
          <span>{new Date(data.rawTime).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div className="tooltip-row">
          <span className="tooltip-label">Selling Price:</span>
          <span className="tooltip-value text-emerald-400 font-bold">₹{Number(data.price).toLocaleString('en-IN')}</span>
        </div>
        <div className="tooltip-row">
          <span className="tooltip-label">Stock Quantity:</span>
          <span className="tooltip-value text-white">{data.stock} units</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function PriceHistoryChart({ product, historyData = [] }) {
  if (!product) return null;

  const formattedChartData = historyData.map((item) => ({
    time: new Date(item.recorded_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }),
    price: Number(item.price),
    stock: Number(item.stock),
    rawTime: item.recorded_at
  }));

  const prices = formattedChartData.map(d => d.price).filter(p => !isNaN(p));
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;
  const latestPrice = prices.length ? prices[prices.length - 1] : 0;
  const initialPrice = prices.length ? prices[0] : 0;
  const priceChange = latestPrice - initialPrice;

  // Trend direction icon & styling
  const renderTrendIndicator = () => {
    if (priceChange < 0) {
      return (
        <span className="stat-strip-val text-emerald-400 flex items-center gap-1">
          <TrendingDown size={14} />
          <span>-{Math.abs(priceChange).toLocaleString('en-IN')} (Price Drop)</span>
        </span>
      );
    } else if (priceChange > 0) {
      return (
        <span className="stat-strip-val text-rose-400 flex items-center gap-1">
          <TrendingUp size={14} />
          <span>+{priceChange.toLocaleString('en-IN')} (Increase)</span>
        </span>
      );
    } else {
      return (
        <span className="stat-strip-val text-gray-400 flex items-center gap-1">
          <Minus size={14} />
          <span>Stable</span>
        </span>
      );
    }
  };

  return (
    <div className="analytics-card">
      <div className="analytics-header">
        <div>
          <div className="analytics-subtitle">PRICE & STOCK OVER TIME</div>
          <h2 className="analytics-title">{product.name} ({product.selected_option_label})</h2>
        </div>

        {/* Phase 3 - Stat Strip */}
        <div className="stat-strip">
          <div className="stat-strip-item">
            <div className="stat-strip-icon text-emerald-400 bg-emerald-500/10">
              <ArrowDownRight size={14} />
            </div>
            <div>
              <span className="stat-strip-label">Lowest Price</span>
              <span className="stat-strip-val text-white">₹{minPrice.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="stat-strip-item">
            <div className="stat-strip-icon text-amber-400 bg-amber-500/10">
              <ArrowUpRight size={14} />
            </div>
            <div>
              <span className="stat-strip-label">Highest Price</span>
              <span className="stat-strip-val text-white">₹{maxPrice.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="stat-strip-item">
            <div className="stat-strip-icon text-blue-400 bg-blue-500/10">
              <LineChartIcon size={14} />
            </div>
            <div>
              <span className="stat-strip-label">Price Trend</span>
              {renderTrendIndicator()}
            </div>
          </div>
        </div>
      </div>

      <div className="chart-container">
        {formattedChartData.length === 0 ? (
          /* Phase 3 - Redesigned Empty Chart State */
          <div className="empty-chart-box">
            <div className="empty-chart-icon-wrap">
              <LineChartIcon size={36} className="text-gray-500 stroke-dashed" />
            </div>
            <h4 className="text-base font-semibold text-white mt-2">No price history recorded yet</h4>
            <p className="text-xs text-gray-400 max-w-sm text-center mt-1">
              Your next scheduled scrape will populate this chart automatically.
            </p>
          </div>
        ) : (
          /* Phase 3 - Recharts with Area Gradient & Draw-in Animation */
          <ResponsiveContainer width="100%" height={290}>
            <AreaChart data={formattedChartData} margin={{ top: 15, right: 30, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34D399" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#34D399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="time" stroke="#6B7280" tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} />
              <YAxis domain={['auto', 'auto']} stroke="#6B7280" tickFormatter={(v) => `₹${v}`} tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#34D399"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#priceGradient)"
                isAnimationActive={true}
                animationDuration={1000}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
