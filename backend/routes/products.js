const express = require('express');
const router = express.Router();

/**
 * GET /api/search?q=query
 * Searches products in INE hosted mock store catalogue
 */
router.get('/search', async (req, res) => {
  const query = (req.query.q || '').trim().toLowerCase();
  const page = req.query.page || 1;
  const limit = req.query.limit || 50;

  try {
    const fetchUrl = `https://demo.inelabteamdev.com/api/v2/listings?page=${page}&limit=${limit}`;
    const response = await fetch(fetchUrl);
    if (!response.ok) {
      return res.status(response.status).json({ error: `INE catalogue API error ${response.status}` });
    }
    const data = await response.json();

    let results = data.results || [];
    if (query) {
      results = results.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        String(p.id).includes(query)
      );
    }

    res.json({
      query,
      count: results.length,
      totalCount: data.count || results.length,
      results
    });
  } catch (err) {
    console.error('Error searching products:', err.message);
    res.status(500).json({ error: 'Failed to search products from store' });
  }
});

/**
 * GET /api/products/:id
 * Fetches detailed product information and options for a product ID
 */
router.get('/products/:id', async (req, res) => {
  const productId = req.params.id;
  try {
    const fetchUrl = `https://demo.inelabteamdev.com/api/v2/items/${productId}`;
    const response = await fetch(fetchUrl);
    if (!response.ok) {
      return res.status(response.status).json({ error: `Product not found (${response.status})` });
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(`Error fetching product ${productId}:`, err.message);
    res.status(500).json({ error: 'Failed to fetch product details' });
  }
});

module.exports = router;
