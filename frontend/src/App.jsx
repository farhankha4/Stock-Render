import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ProductSearchModal from './components/ProductSearchModal';
import TrackedCard from './components/TrackedCard';
import PriceHistoryChart from './components/PriceHistoryChart';
import ScrapeLogTable from './components/ScrapeLogTable';
import {
  getTrackedProducts,
  getProductHistory,
  getAllLogs,
  triggerScrapeRun,
  removeTrackedProduct
} from './services/api';
import { Package, Activity, RefreshCw, AlertCircle, CheckCircle, Info } from 'lucide-react';

function CircularProgressRing({ rate }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius; // ~113.097
  const strokeDashoffset = circumference - (circumference * Math.min(100, Math.max(0, rate))) / 100;

  let strokeColor = '#34D399'; // >= 80% (emerald)
  if (rate < 50) {
    strokeColor = '#F87171'; // < 50% (coral red)
  } else if (rate < 80) {
    strokeColor = '#F59E0B'; // 50-79% (amber)
  }

  return (
    <div className="progress-ring-wrapper">
      <svg className="progress-ring-svg">
        <circle
          cx="24"
          cy="24"
          r={radius}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth="3.5"
          fill="transparent"
        />
        <circle
          cx="24"
          cy="24"
          r={radius}
          stroke={strokeColor}
          strokeWidth="3.5"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="progress-ring-circle"
        />
      </svg>
      <span className="progress-ring-text" style={{ color: strokeColor }}>
        {rate}%
      </span>
    </div>
  );
}

export default function App() {
  const [trackedProducts, setTrackedProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScraping, setIsScraping] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const products = await getTrackedProducts();
      setTrackedProducts(products);

      const allLogsData = await getAllLogs();
      setLogs(allLogsData);

      if (products.length > 0) {
        const currentSel = selectedProduct
          ? products.find(p => p.id === selectedProduct.id) || products[0]
          : products[0];

        setSelectedProduct(currentSel);
        if (currentSel) {
          const hist = await getProductHistory(currentSel.id);
          setHistoryData(hist.price_history || []);
        }
      } else {
        setSelectedProduct(null);
        setHistoryData([]);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      showNotification('Failed to load dashboard data from server.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleSelectProduct = async (product) => {
    setSelectedProduct(product);
    try {
      const hist = await getProductHistory(product.id);
      setHistoryData(hist.price_history || []);
    } catch (err) {
      console.error('Error fetching product history:', err);
    }
  };

  const handleTriggerScrape = async (trackedProductId = null) => {
    setIsScraping(true);
    showNotification('Scrape run triggered successfully', 'info');
    try {
      await triggerScrapeRun(trackedProductId);
      showNotification('Scrape completed & dashboard updated', 'success');
      await fetchDashboardData();
    } catch (err) {
      console.error('Scrape trigger error:', err);
      showNotification('Scrape run encountered errors. Check scrape logs.', 'error');
    } finally {
      setIsScraping(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to untrack this product?')) return;
    try {
      await removeTrackedProduct(id);
      showNotification('Product untracked successfully', 'info');
      await fetchDashboardData();
    } catch (err) {
      showNotification('Failed to remove tracked product.', 'error');
    }
  };

  const showNotification = (msg, type = 'info') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Dashboard Stats
  const totalTracked = trackedProducts.length;
  const totalScrapes = logs.length;
  const successfulScrapes = logs.filter(l => l.outcome !== 'failed').length;
  const overallSuccessRate = totalScrapes ? Math.round((successfulScrapes / totalScrapes) * 100) : 100;

  return (
    <div className="app-layout relative overflow-hidden">
      {/* Phase 5 - Radial Gradient Glow behind header */}
      <div className="header-radial-glow" />

      <Navbar
        onOpenSearch={() => setIsSearchOpen(true)}
        onTriggerScrape={() => handleTriggerScrape()}
        isScraping={isScraping}
        onNotify={showNotification}
      />

      {/* Phase 5 - Glassmorphism Toast Notification in Top-Right */}
      {notification && (
        <div className={`toast-glass toast-${notification.type}`}>
          {notification.type === 'success' && <CheckCircle size={16} className="text-emerald-400" />}
          {notification.type === 'error' && <AlertCircle size={16} className="text-rose-400" />}
          {notification.type === 'info' && <Info size={16} className="text-blue-400" />}
          <span>{notification.msg}</span>
        </div>
      )}

      <main className="main-container relative z-10">
        {/* Overview Stat Cards */}
        <section className="dashboard-stats-grid">
          <div className="stat-card">
            <div className="stat-icon bg-emerald-500/10 text-emerald-400">
              <Package size={20} />
            </div>
            <div>
              <p className="stat-label">Tracked Products</p>
              <h3 className="stat-number">{totalTracked}</h3>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon bg-blue-500/10 text-blue-400">
              <Activity size={20} />
            </div>
            <div>
              <p className="stat-label">Unattended Scrapes</p>
              <h3 className="stat-number">{totalScrapes}</h3>
            </div>
          </div>

          <div className="stat-card stat-card-reliability">
            <CircularProgressRing rate={overallSuccessRate} />
            <div>
              <p className="stat-label">Scraper Reliability</p>
              <h3 className="stat-number">{overallSuccessRate}%</h3>
            </div>
          </div>
        </section>

        {/* Tracked Products Section */}
        <section className="section">
          <div className="section-header">
            <div>
              <h2 className="section-title">Tracked Products & Options</h2>
              <p className="section-subtitle">Real-time prices and stock levels scraped on schedule</p>
            </div>
            <button
              onClick={() => setIsSearchOpen(true)}
              className="btn btn-sm btn-gradient-primary"
            >
              + Track New Product
            </button>
          </div>

          {isLoading ? (
            <div className="loading-box">
              <RefreshCw size={24} className="spin text-emerald-400" />
              <span>Loading tracked products dashboard...</span>
            </div>
          ) : trackedProducts.length === 0 ? (
            <div className="empty-dashboard-box">
              <Package size={48} className="text-neutral-500 mb-3" />
              <h3>No Products Being Tracked</h3>
              <p>Click "Track New Product" to pick products and options from the INE Mock Store.</p>
              <button
                onClick={() => setIsSearchOpen(true)}
                className="btn btn-gradient-primary mt-4"
              >
                Search INE Store
              </button>
            </div>
          ) : (
            <div className="products-grid">
              {trackedProducts.map((product) => (
                <TrackedCard
                  key={product.id}
                  product={product}
                  isSelected={selectedProduct?.id === product.id}
                  onSelect={handleSelectProduct}
                  onScrapeSingle={(id) => handleTriggerScrape(id)}
                  isScraping={isScraping}
                  onDelete={handleDeleteProduct}
                />
              ))}
            </div>
          )}
        </section>

        {/* Analytics & Scrape Logs Section */}
        {selectedProduct && (
          <>
            <section className="section">
              <PriceHistoryChart
                product={selectedProduct}
                historyData={historyData}
              />
            </section>

            <section className="section">
              <ScrapeLogTable
                logs={logs}
                selectedProduct={selectedProduct}
              />
            </section>
          </>
        )}
      </main>

      <ProductSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onProductTracked={() => {
          showNotification('Product tracked successfully', 'success');
          fetchDashboardData();
        }}
      />
    </div>
  );
}
