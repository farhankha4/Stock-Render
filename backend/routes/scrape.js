const express = require('express');
const router = express.Router();
const { Parser } = require('json2csv');
const { db } = require('../config/supabase');
const { scrapeProduct } = require('../scraper/ineScraper');

/**
 * POST /api/scrape/trigger
 * Manually triggers a scrape run for all tracked products or a specific product
 */
router.post('/scrape/trigger', async (req, res) => {
  const { tracked_product_id } = req.body;

  try {
    const products = await db.getTrackedProducts();
    let targets = products;

    if (tracked_product_id) {
      targets = products.filter(p => p.id === tracked_product_id);
    }

    if (targets.length === 0) {
      return res.status(404).json({ error: 'No tracked products found to scrape.' });
    }

    res.json({ message: `Scrape run triggered for ${targets.length} product(s).` });

    // Execute scrapes asynchronously in sequence or batch
    for (const prod of targets) {
      try {
        const result = await scrapeProduct({
          storeProductId: prod.store_product_id,
          optionId: prod.selected_option_id,
          optionLabel: prod.selected_option_label
        });

        await db.recordScrapeOutcome({
          tracked_product_id: prod.id,
          store_product_id: prod.store_product_id,
          product_name: prod.name,
          selected_option: prod.selected_option_label,
          price: result.price,
          stock: result.stock,
          outcome: result.outcome,
          attempts: result.attempts,
          error_message: result.errorMessage
        });
      } catch (err) {
        console.error(`Error scraping product ${prod.store_product_id}:`, err.message);
        await db.recordScrapeOutcome({
          tracked_product_id: prod.id,
          store_product_id: prod.store_product_id,
          product_name: prod.name,
          selected_option: prod.selected_option_label,
          price: null,
          stock: null,
          outcome: 'failed',
          attempts: 1,
          error_message: err.message
        });
      }
    }

  } catch (err) {
    console.error('Error triggering scrape:', err.message);
    if (!res.headersSent) res.status(500).json({ error: 'Failed to trigger scrape' });
  }
});

/**
 * GET /api/scrape/cron
 * Scheduled endpoint triggered every 2 hours by cron-job.org or scheduled job service.
 * Accepts ?secret=CRON_SECRET for security.
 */
router.get('/scrape/cron', async (req, res) => {
  const secret = req.query.secret || req.headers['x-cron-secret'];
  const expectedSecret = process.env.CRON_SECRET || 'ine_cron_secret_2026';

  if (secret !== expectedSecret) {
    return res.status(401).json({ error: 'Unauthorized cron request. Invalid CRON_SECRET.' });
  }

  console.log('[CRON] Scheduled 2-hour scrape job starting...');

  try {
    const products = await db.getTrackedProducts();
    console.log(`[CRON] Found ${products.length} product(s) to scrape.`);

    res.json({ message: `Cron scrape started for ${products.length} product(s).` });

    for (const prod of products) {
      try {
        const result = await scrapeProduct({
          storeProductId: prod.store_product_id,
          optionId: prod.selected_option_id,
          optionLabel: prod.selected_option_label
        });

        await db.recordScrapeOutcome({
          tracked_product_id: prod.id,
          store_product_id: prod.store_product_id,
          product_name: prod.name,
          selected_option: prod.selected_option_label,
          price: result.price,
          stock: result.stock,
          outcome: result.outcome,
          attempts: result.attempts,
          error_message: result.errorMessage
        });
      } catch (err) {
        console.error(`[CRON] Error scraping product ${prod.store_product_id}:`, err.message);
        await db.recordScrapeOutcome({
          tracked_product_id: prod.id,
          store_product_id: prod.store_product_id,
          product_name: prod.name,
          selected_option: prod.selected_option_label,
          price: null,
          stock: null,
          outcome: 'failed',
          attempts: 1,
          error_message: err.message
        });
      }
    }

    console.log('[CRON] Scheduled 2-hour scrape job completed.');

  } catch (err) {
    console.error('[CRON] Fatal error during cron scrape:', err.message);
    if (!res.headersSent) res.status(500).json({ error: 'Cron scrape failed' });
  }
});

/**
 * GET /api/logs
 * Retrieve all scrape logs
 */
router.get('/logs', async (req, res) => {
  try {
    const logs = await db.getScrapeLogs();
    res.json(logs);
  } catch (err) {
    console.error('Error fetching logs:', err.message);
    res.status(500).json({ error: 'Failed to fetch scrape logs' });
  }
});

/**
 * GET /api/export/csv
 * Downloads full scrape history as CSV file per specification.
 */
router.get('/export/csv', async (req, res) => {
  try {
    const logs = await db.getScrapeLogs();

    const formattedData = logs.map(log => ({
      store_product_id: log.store_product_id,
      product_name: log.product_name,
      selected_option: log.selected_option,
      timestamp: new Date(log.timestamp).toISOString(), // ISO 8601, UTC
      price: log.outcome === 'failed' || log.price === null ? '' : log.price,
      stock: log.outcome === 'failed' || log.stock === null ? '' : log.stock,
      outcome: log.outcome
    }));

    const fields = [
      { label: 'Store Product ID', value: 'store_product_id' },
      { label: 'Product Name', value: 'product_name' },
      { label: 'Selected Option', value: 'selected_option' },
      { label: 'Timestamp (ISO 8601 UTC)', value: 'timestamp' },
      { label: 'Price', value: 'price' },
      { label: 'Stock', value: 'stock' },
      { label: 'Outcome', value: 'outcome' }
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(formattedData);

    res.header('Content-Type', 'text/csv');
    res.attachment(`ine_scrape_history_${Date.now()}.csv`);
    return res.send(csv);

  } catch (err) {
    console.error('Error generating CSV export:', err.message);
    res.status(500).json({ error: 'Failed to generate CSV export' });
  }
});

module.exports = router;
