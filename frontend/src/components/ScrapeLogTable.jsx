import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, XCircle, Clock, FileText, ChevronDown, ChevronUp } from 'lucide-react';

function getRelativeTime(timestamp) {
  if (!timestamp) return 'N/A';
  const now = Date.now();
  const past = new Date(timestamp).getTime();
  const diffSec = Math.max(0, Math.floor((now - past) / 1000));

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

export default function ScrapeLogTable({ logs = [], selectedProduct = null }) {
  const [outcomeFilter, setOutcomeFilter] = useState('all');
  const [expandedLogId, setExpandedLogId] = useState(null);

  const productLogs = selectedProduct
    ? logs.filter(l => l.tracked_product_id === selectedProduct.id)
    : logs;

  const displayLogs = productLogs.filter(l => {
    if (outcomeFilter === 'all') return true;
    return l.outcome === outcomeFilter;
  });

  const formatUtcIso = (isoStr) => {
    if (!isoStr) return 'N/A';
    try {
      return new Date(isoStr).toISOString();
    } catch {
      return isoStr;
    }
  };

  const formatCurrency = (val) => {
    if (val === null || val === undefined || val === '') return '—';
    return `₹${Number(val).toLocaleString('en-IN')}`;
  };

  const getOutcomeBadge = (outcome) => {
    switch (outcome) {
      case 'success':
        return (
          <span className="badge badge-success">
            <ShieldCheck size={12} />
            <span>Success</span>
          </span>
        );
      case 'retried':
        return (
          <span className="badge badge-warning">
            <AlertTriangle size={12} />
            <span>Retried</span>
          </span>
        );
      case 'failed':
        return (
          <span className="badge badge-danger">
            <XCircle size={12} />
            <span>Failed</span>
          </span>
        );
      default:
        return (
          <span className="badge badge-gray">
            <Clock size={12} />
            <span>Unknown</span>
          </span>
        );
    }
  };

  return (
    <div className="table-card">
      <div className="table-header flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-emerald-400" />
          <div>
            <h2 className="table-title">
              {selectedProduct ? `Scrape Logs for ${selectedProduct.name}` : 'Unattended Scrape Logs'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Honest Audit Trail • {displayLogs.length} attempts</p>
          </div>
        </div>

        {/* Phase 4 - Filter Tab Bar */}
        <div className="filter-tab-bar">
          <button
            onClick={() => setOutcomeFilter('all')}
            className={`filter-tab ${outcomeFilter === 'all' ? 'filter-tab-active' : ''}`}
          >
            All ({productLogs.length})
          </button>
          <button
            onClick={() => setOutcomeFilter('success')}
            className={`filter-tab ${outcomeFilter === 'success' ? 'filter-tab-active' : ''}`}
          >
            Success ({productLogs.filter(l => l.outcome === 'success').length})
          </button>
          <button
            onClick={() => setOutcomeFilter('retried')}
            className={`filter-tab ${outcomeFilter === 'retried' ? 'filter-tab-active' : ''}`}
          >
            Retried ({productLogs.filter(l => l.outcome === 'retried').length})
          </button>
          <button
            onClick={() => setOutcomeFilter('failed')}
            className={`filter-tab ${outcomeFilter === 'failed' ? 'filter-tab-active' : ''}`}
          >
            Failed ({productLogs.filter(l => l.outcome === 'failed').length})
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="logs-table">
          <thead>
            <tr>
              <th>Store Product ID</th>
              <th>Product Name</th>
              <th>Option</th>
              <th>Timestamp</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Attempts</th>
              <th>Outcome</th>
              <th>Log Details / Error</th>
            </tr>
          </thead>
          <tbody>
            {displayLogs.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center py-8 text-gray-500">
                  No scrape logs matching filter "{outcomeFilter}".
                </td>
              </tr>
            ) : (
              displayLogs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                const errorText = log.error_message || '';
                const isLongError = errorText.length > 60;
                const truncatedText = isLongError ? errorText.substring(0, 60) + '...' : errorText;

                return (
                  <React.Fragment key={log.id}>
                    <tr className={log.outcome === 'failed' ? 'table-row-failed' : ''}>
                      <td className="font-mono text-emerald-400 font-bold">#{log.store_product_id}</td>
                      <td className="font-semibold text-white max-w-[180px] truncate">{log.product_name}</td>
                      <td>
                        <span className="option-badge">{log.selected_option}</span>
                      </td>

                      {/* Relative time with ISO 8601 UTC tooltip on hover */}
                      <td className="font-mono text-xs text-gray-300 cursor-help" title={`Exact UTC: ${formatUtcIso(log.timestamp)}`}>
                        {getRelativeTime(log.timestamp)}
                      </td>

                      <td className="font-semibold tabular-nums">
                        {log.outcome === 'failed' ? <span className="text-gray-500 italic">empty</span> : formatCurrency(log.price)}
                      </td>
                      <td className="tabular-nums">
                        {log.outcome === 'failed' ? <span className="text-gray-500 italic">empty</span> : (log.stock !== null ? `${log.stock} units` : '—')}
                      </td>
                      <td className="text-center font-mono">
                        <span className="attempts-pill">
                          {log.attempts || 1}
                        </span>
                      </td>
                      <td>{getOutcomeBadge(log.outcome)}</td>

                      {/* Truncated Error Log + Toggle Button */}
                      <td className="text-xs text-gray-400 max-w-xs">
                        {errorText ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-rose-400 font-mono text-[11px] leading-tight">
                              {isExpanded ? errorText : truncatedText}
                            </span>
                            {isLongError && (
                              <button
                                onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                                className="text-[10px] text-gray-400 hover:text-white underline flex items-center gap-0.5 w-fit"
                              >
                                <span>{isExpanded ? 'Hide full log' : 'View full log'}</span>
                                {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500">Normal execution</span>
                        )}
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
