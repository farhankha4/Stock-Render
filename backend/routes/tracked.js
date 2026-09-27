const express = require('express');
const router = express.Router();
const { db } = require('../config/supabase');
const { scrapeProduct } = require('../scraper/ineScraper');

/**
 * GET /api/tracked
 * List all active tracked products with latest price/stock info
 */
router.get('/tracked', async (req, res) => {
  try {
    const products = await db.getTrackedProducts();
    const logs = await db.getScrapeLogs();

    // Map latest scrape result into each product
    const enriched = products.map(p => {
      const pLogs = logs.filter(l => l.tracked_product_id === p.id);
      const latestSuccess = pLogs.find(l => l.outcome !== 'failed' && l.price !== null);
      const latestAttempt = pLogs[0] || null;

      return {
        ...p,
        current_price: latestSuccess ? latestSuccess.price : null,
        current_stock: latestSuccess ? latestSuccess.stock : null,
        last_scraped_at: latestAttempt ? latestAttempt.timestamp : null,
        last_outcome: latestAttempt ? latestAttempt.outcome : null,
        total_scrapes: pLogs.length,
        success_rate: pLogs.length ? Math.round((pLogs.filter(l => l.outcome !== 'failed').length / pLogs.length) * 100) : 100
      };
    });

    res.json(enriched);
  } catch (err) {
    console.error('Error fetching tracked products:', err.message);
    res.status(500).json({ error: 'Failed to fetch tracked products' });
  }
});

/**
 * POST /api/tracked
 * Add a new product & option to track, and trigger initial scrape
 */
router.post('/tracked', async (req, res) => {
  const { store_product_id, slug, name, brand, category, sku, selected_option_id, selected_option_label } = req.body;

  if (!store_product_id || !name) {
    return res.status(400).json({ error: 'store_product_id and name are required' });
  }

  try {
    const existing = await db.getTrackedProducts();
    const duplicate = existing.find(p => p.store_product_id == store_product_id && p.selected_option_id == selected_option_id);
    if (duplicate) {
      return res.status(409).json({ error: 'This product and option is already being tracked.', product: duplicate });
    }

    const tracked = await db.addTrackedProduct({
      store_product_id,
      slug: slug || '',
      name,
      brand: brand || '',
      category: category || '',
      sku: sku || '',
      selected_option_id: selected_option_id || 'o1',
      selected_option_label: selected_option_label || 'Default'
    });

    // Trigger initial scrape asynchronously or inline
    res.status(201).json({ message: 'Product added to tracking list. Initial scrape started.', product: tracked });

    // Background initial scrape
    scrapeProduct({
      storeProductId: tracked.store_product_id,
      optionId: tracked.selected_option_id,
      optionLabel: tracked.selected_option_label
    }).then(result => {
      db.recordScrapeOutcome({
        tracked_product_id: tracked.id,
        store_product_id: tracked.store_product_id,
        product_name: tracked.name,
        selected_option: tracked.selected_option_label,
        price: result.price,
        stock: result.stock,
        outcome: result.outcome,
        attempts: result.attempts,
        error_message: result.errorMessage
      });
    }).catch(err => {
      console.error(`Initial scrape error for product ${tracked.store_product_id}:`, err.message);
    });

  } catch (err) {
    console.error('Error adding tracked product:', err.message);
    res.status(500).json({ error: 'Failed to add product to tracking list' });
  }
});

/**
 * DELETE /api/tracked/:id
 * Remove a tracked product
 */
router.delete('/tracked/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.removeTrackedProduct(id);
    res.json({ message: 'Product removed from tracking list', id });
  } catch (err) {
    console.error(`Error deleting tracked product ${id}:`, err.message);
    res.status(500).json({ error: 'Failed to delete tracked product' });
  }
});

/**
 * GET /api/tracked/:id/history
 * Fetch price history and scrape logs for a single tracked product
 */
router.get('/tracked/:id/history', async (req, res) => {
  const { id } = req.params;
  try {
    const history = await db.getPriceHistory(id);
    const logs = await db.getScrapeLogs(id);
    res.json({ price_history: history, scrape_logs: logs });
  } catch (err) {
    console.error(`Error fetching history for ${id}:`, err.message);
    res.status(500).json({ error: 'Failed to fetch price history' });
  }
});

module.exports = router;
