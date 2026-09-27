import React from 'react';
import { RefreshCw, Download, Plus } from 'lucide-react';
import { getCsvExportUrl } from '../services/api';

export default function Navbar({ onOpenSearch, onTriggerScrape, isScraping, onNotify }) {
  const handleExportCsv = () => {
    window.open(getCsvExportUrl(), '_blank');
    if (onNotify) onNotify('CSV exported', 'success');
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="brand-group">
          <span className="brand-logo-text">
            <span className="brand-stock">Stock</span>
            <span className="brand-radar">Radar</span>
          </span>
        </div>

        <div className="nav-actions">
          <div className="schedule-pill" title="Scrapes automatically every 2 hours via external cron">
            <span className="live-pulsing-dot" />
            <span>Schedule: Every 2 Hours</span>
          </div>

          <button
            onClick={onTriggerScrape}
            disabled={isScraping}
            className="btn btn-ghost"
            title="Trigger manual scrape run"
          >
            <RefreshCw size={15} className={isScraping ? 'spin' : ''} />
            <span>{isScraping ? 'Scraping...' : 'Scrape Now'}</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="btn btn-ghost"
            title="Download full scrape history CSV"
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenSearch}
            className="btn btn-gradient-primary"
          >
            <Plus size={16} />
            <span>Track Product</span>
          </button>
        </div>
      </div>
    </header>
  );
}
