import React from 'react';
import { RefreshCw, Trash2, LineChart, ShieldCheck, AlertTriangle, XCircle, Clock } from 'lucide-react';

function getCategoryColorStyle(categoryStr) {
  if (!categoryStr) return { backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#9CA3AF' };
  let hash = 0;
  for (let i = 0; i < categoryStr.length; i++) {
    hash = categoryStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const palettes = [
    { backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#A5B4FC' },  // Indigo pastel
    { backgroundColor: 'rgba(236, 72, 153, 0.15)', color: '#F9A8D4' },  // Pink pastel
    { backgroundColor: 'rgba(14, 165, 233, 0.15)', color: '#7DD3FC' },  // Sky pastel
    { backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#C084FC' },  // Purple pastel
    { backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#FCD34D' },  // Amber pastel
    { backgroundColor: 'rgba(20, 184, 166, 0.15)', color: '#5EEAD4' },  // Teal pastel
    { backgroundColor: 'rgba(249, 115, 22, 0.15)', color: '#FDBA74' },  // Orange pastel
  ];
  const index = Math.abs(hash) % palettes.length;
  return palettes[index];
}

function getRelativeTime(timestamp) {
  if (!timestamp) return 'Never';
  const now = Date.now();
  const past = new Date(timestamp).getTime();
  const diffSec = Math.max(0, Math.floor((now - past) / 1000));

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

export default function TrackedCard({ product, isSelected, onSelect, onScrapeSingle, isScraping, onDelete }) {
  const categoryStyle = getCategoryColorStyle(product.category);

  // Price Hero splitting currency symbol vs numeric amount
  const renderPriceHero = (val) => {
    if (val === null || val === undefined) {
      return <span className="text-xl font-bold text-gray-500">N/A</span>;
    }
    const formatted = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(val);
    return (
      <div className="flex items-baseline">
        <span className="text-base font-medium text-gray-400 mr-0.5">₹</span>
        <span className="text-2xl font-extrabold text-white tabular-nums tracking-tight">{formatted}</span>
      </div>
    );
  };

  const getOutcomeBadge = (outcome) => {
    switch (outcome) {
      case 'success':
        return (
          <span className="badge badge-success">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <ShieldCheck size={12} />
            <span>Success</span>
          </span>
        );
      case 'retried':
        return (
          <span className="badge badge-warning">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <AlertTriangle size={12} />
            <span>Retried</span>
          </span>
        );
      case 'failed':
        return (
          <span className="badge badge-danger">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <XCircle size={12} />
            <span>Failed</span>
          </span>
        );
      default:
        return (
          <span className="badge badge-gray">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            <Clock size={12} />
            <span>Pending</span>
          </span>
        );
    }
  };

  return (
    <div className={`tracked-card ${isSelected ? 'tracked-card-selected' : ''}`}>
      <div className="card-header">
        <div className="card-tags">
          <span className="category-pill" style={categoryStyle}>
            {product.category || 'General'}
          </span>
          <span className="option-pill">
            Option: {product.selected_option_label}
          </span>
        </div>
        <button
          onClick={() => onDelete(product.id)}
          className="btn-icon-danger"
          title="Untrack product"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="card-body">
        <h3 className="card-title">{product.name}</h3>
        <p className="card-subtitle">{product.brand} • Store ID: #{product.store_product_id}</p>

        <div className="price-stock-row">
          <div className="price-box">
            <span className="price-label">Current Price</span>
            {renderPriceHero(product.current_price)}
          </div>

          <div className="stock-box">
            <span className="stock-label">Stock Status</span>
            {product.current_stock > 0 ? (
              <span className="stock-pill stock-pill-in">In Stock ({product.current_stock})</span>
            ) : product.current_stock === 0 ? (
              <span className="stock-pill stock-pill-out">Sold Out</span>
            ) : (
              <span className="stock-pill stock-pill-unknown">Unknown</span>
            )}
          </div>
        </div>

        {/* Phase 2: Combined Last Scraped row with relative time & outcome badge */}
        <div className="meta-footer">
          <div className="scrape-status-meta flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Clock size={13} className="text-gray-500" />
              <span>Scraped {getRelativeTime(product.last_scraped_at)}</span>
            </div>
            {getOutcomeBadge(product.last_outcome)}
          </div>
        </div>
      </div>

      <div className="card-actions">
        <button
          onClick={() => onSelect(product)}
          className={`btn btn-sm ${isSelected ? 'btn-gradient-primary' : 'btn-ghost'} flex-1`}
        >
          <LineChart size={14} />
          <span>{isSelected ? 'Viewing Analytics' : 'View History'}</span>
        </button>

        <button
          onClick={() => onScrapeSingle(product.id)}
          disabled={isScraping}
          className="btn btn-sm btn-ghost"
          title="Scrape price & stock now"
        >
          <RefreshCw size={14} className={isScraping ? 'spin' : ''} />
          <span>Scrape</span>
        </button>
      </div>
    </div>
  );
}
