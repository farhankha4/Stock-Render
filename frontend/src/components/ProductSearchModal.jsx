import React, { useState, useEffect } from 'react';
import { Search, X, Loader2, Check, Package, Tag, ArrowRight } from 'lucide-react';
import { searchProducts, getProductDetails, addTrackedProduct } from '../services/api';

export default function ProductSearchModal({ isOpen, onClose, onProductTracked }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productDetails, setProductDetails] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Initial popular search on open
  useEffect(() => {
    if (isOpen) {
      handleSearch('');
    } else {
      resetState();
    }
  }, [isOpen]);

  const resetState = () => {
    setQuery('');
    setResults([]);
    setSelectedProduct(null);
    setProductDetails(null);
    setSelectedOption(null);
    setErrorMsg(null);
  };

  const handleSearch = async (searchTerm) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await searchProducts(searchTerm);
      setResults(data.results || []);
    } catch (err) {
      setErrorMsg('Failed to fetch search results from store.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectProduct = async (product) => {
    setSelectedProduct(product);
    setIsLoadingDetails(true);
    setErrorMsg(null);
    try {
      const details = await getProductDetails(product.id);
      setProductDetails(details);
      if (details.options && details.options.length > 0) {
        setSelectedOption(details.options[0]);
      } else {
        setSelectedOption({ id: 'default', label: 'Default' });
      }
    } catch (err) {
      setErrorMsg('Failed to load product options details.');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleTrackSubmit = async () => {
    if (!selectedProduct || !selectedOption) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await addTrackedProduct({
        store_product_id: selectedProduct.id,
        slug: selectedProduct.slug,
        name: selectedProduct.name,
        brand: selectedProduct.brand,
        category: selectedProduct.category,
        sku: selectedProduct.sku,
        selected_option_id: selectedOption.id,
        selected_option_label: selectedOption.label
      });
      onProductTracked();
      onClose();
    } catch (err) {
      if (err.response?.status === 409) {
        setErrorMsg('This product and option is already being tracked.');
      } else {
        setErrorMsg('Failed to track product. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Track Product from INE Store</h2>
            <p className="modal-subtitle">Search by full or partial product name, brand, or SKU</p>
          </div>
          <button onClick={onClose} className="btn-close">
            <X size={20} />
          </button>
        </div>

        {errorMsg && (
          <div className="alert alert-error">
            <span>{errorMsg}</span>
          </div>
        )}

        {!selectedProduct ? (
          <div className="modal-body">
            <div className="search-input-wrapper">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
                placeholder="Type to search (e.g. Tamarack, Grooming, Router)..."
                className="search-input"
                autoFocus
              />
            </div>

            <div className="search-results-container">
              {isLoading ? (
                <div className="loading-spinner-box">
                  <Loader2 size={24} className="spin text-emerald-500" />
                  <span>Searching INE catalogue...</span>
                </div>
              ) : results.length === 0 ? (
                <div className="empty-search">
                  <Package size={32} className="text-gray-400" />
                  <p>No products matching "{query}"</p>
                </div>
              ) : (
                <div className="results-list">
                  {results.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectProduct(item)}
                      className="result-item-card"
                    >
                      <div className="result-main font-semibold">
                        <span className="product-category-tag">{item.category}</span>
                        <h3>{item.name}</h3>
                        <p className="product-meta">{item.brand} • SKU: {item.sku}</p>
                      </div>
                      <button className="btn btn-xs btn-outline">
                        <span>Select</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="modal-body">
            <div className="selected-product-banner">
              <button
                onClick={() => setSelectedProduct(null)}
                className="btn-back"
              >
                ← Back to results
              </button>
              <h3 className="text-xl font-bold">{selectedProduct.name}</h3>
              <p className="text-sm text-gray-400">{selectedProduct.brand} • {selectedProduct.category} • SKU: {selectedProduct.sku}</p>
            </div>

            {isLoadingDetails ? (
              <div className="loading-spinner-box">
                <Loader2 size={24} className="spin text-emerald-500" />
                <span>Loading product options...</span>
              </div>
            ) : (
              <div className="option-selection-section">
                <h4 className="option-title">
                  <Tag size={16} />
                  <span>Select Product Option / Size / Pack to Track:</span>
                </h4>

                <div className="options-grid">
                  {productDetails?.options?.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedOption(opt)}
                      className={`option-chip ${selectedOption?.id === opt.id ? 'option-chip-active' : ''}`}
                    >
                      {selectedOption?.id === opt.id && <Check size={14} />}
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>

                <div className="track-action-footer">
                  <button
                    onClick={handleTrackSubmit}
                    disabled={isSubmitting || !selectedOption}
                    className="btn btn-primary btn-full"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="spin" />
                        <span>Starting Initial Scrape...</span>
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        <span>Start Tracking "{selectedOption?.label}"</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
