const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { randomUUID: uuidv4 } = require('crypto');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Connected to Supabase PostgreSQL Database.');
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err.message);
  }
} else {
  console.log('SUPABASE_URL / SUPABASE_KEY not found. Using local JSON store fallback for development/demo.');
}

// In-memory / local JSON store fallback
const LOCAL_DB_FILE = path.join(__dirname, 'local_db.json');

function seedLocalData() {
  const p1_id = '11111111-1111-4111-a111-111111111111';
  const p2_id = '22222222-2222-4222-a222-222222222222';
  const p3_id = '33333333-3333-4333-a333-333333333333';

  const now = Date.now();
  const hours = h => new Date(now - h * 3600 * 1000).toISOString();

  const tracked_products = [
    {
      id: p1_id,
      store_product_id: 2383,
      slug: 'tamarack-grooming-kit-prime',
      name: 'Tamarack Grooming Kit Prime',
      brand: 'Tamarack',
      category: 'Personal Care',
      sku: 'SK-2383-TA',
      selected_option_id: 'o1',
      selected_option_label: 'Single',
      is_active: true,
      created_at: hours(24),
      updated_at: hours(2)
    },
    {
      id: p2_id,
      store_product_id: 2369,
      slug: 'tamarack-floor-lamp-prime',
      name: 'Tamarack Floor Lamp Prime',
      brand: 'Tamarack',
      category: 'Lighting',
      sku: 'SK-2369-TA',
      selected_option_id: 'o2',
      selected_option_label: 'Duo pack',
      is_active: true,
      created_at: hours(24),
      updated_at: hours(2)
    },
    {
      id: p3_id,
      store_product_id: 2958,
      slug: 'veloria-travel-router-arc',
      name: 'Veloria Travel Router Arc',
      brand: 'Veloria',
      category: 'Networking',
      sku: 'SK-2958-VE',
      selected_option_id: 'o1',
      selected_option_label: 'Standard Edition',
      is_active: true,
      created_at: hours(24),
      updated_at: hours(2)
    }
  ];

  const scrape_logs = [
    // P1 logs
    { id: uuidv4(), tracked_product_id: p1_id, store_product_id: 2383, product_name: 'Tamarack Grooming Kit Prime', selected_option: 'Single', timestamp: hours(12), price: 37079, stock: 47, outcome: 'success', attempts: 1, error_message: null },
    { id: uuidv4(), tracked_product_id: p1_id, store_product_id: 2383, product_name: 'Tamarack Grooming Kit Prime', selected_option: 'Single', timestamp: hours(10), price: 37079, stock: 45, outcome: 'success', attempts: 1, error_message: null },
    { id: uuidv4(), tracked_product_id: p1_id, store_product_id: 2383, product_name: 'Tamarack Grooming Kit Prime', selected_option: 'Single', timestamp: hours(8), price: 36500, stock: 40, outcome: 'retried', attempts: 2, error_message: 'Transient HTTP 429 Rate Limit recovered' },
    { id: uuidv4(), tracked_product_id: p1_id, store_product_id: 2383, product_name: 'Tamarack Grooming Kit Prime', selected_option: 'Single', timestamp: hours(6), price: null, stock: null, outcome: 'failed', attempts: 3, error_message: 'Store server error (HTTP 500) after 3 retries' },
    { id: uuidv4(), tracked_product_id: p1_id, store_product_id: 2383, product_name: 'Tamarack Grooming Kit Prime', selected_option: 'Single', timestamp: hours(4), price: 35999, stock: 38, outcome: 'success', attempts: 1, error_message: null },
    { id: uuidv4(), tracked_product_id: p1_id, store_product_id: 2383, product_name: 'Tamarack Grooming Kit Prime', selected_option: 'Single', timestamp: hours(2), price: 37079, stock: 47, outcome: 'success', attempts: 1, error_message: null },

    // P2 logs
    { id: uuidv4(), tracked_product_id: p2_id, store_product_id: 2369, product_name: 'Tamarack Floor Lamp Prime', selected_option: 'Duo pack', timestamp: hours(12), price: 14999, stock: 12, outcome: 'success', attempts: 1, error_message: null },
    { id: uuidv4(), tracked_product_id: p2_id, store_product_id: 2369, product_name: 'Tamarack Floor Lamp Prime', selected_option: 'Duo pack', timestamp: hours(10), price: 14999, stock: 10, outcome: 'success', attempts: 1, error_message: null },
    { id: uuidv4(), tracked_product_id: p2_id, store_product_id: 2369, product_name: 'Tamarack Floor Lamp Prime', selected_option: 'Duo pack', timestamp: hours(8), price: 13999, stock: 8, outcome: 'success', attempts: 1, error_message: null },
    { id: uuidv4(), tracked_product_id: p2_id, store_product_id: 2369, product_name: 'Tamarack Floor Lamp Prime', selected_option: 'Duo pack', timestamp: hours(6), price: 13999, stock: 5, outcome: 'retried', attempts: 2, error_message: 'Slow response, resolved after 1 retry' },
    { id: uuidv4(), tracked_product_id: p2_id, store_product_id: 2369, product_name: 'Tamarack Floor Lamp Prime', selected_option: 'Duo pack', timestamp: hours(4), price: 14499, stock: 3, outcome: 'success', attempts: 1, error_message: null },
    { id: uuidv4(), tracked_product_id: p2_id, store_product_id: 2369, product_name: 'Tamarack Floor Lamp Prime', selected_option: 'Duo pack', timestamp: hours(2), price: 14499, stock: 15, outcome: 'success', attempts: 1, error_message: null },

    // P3 logs
    { id: uuidv4(), tracked_product_id: p3_id, store_product_id: 2958, product_name: 'Veloria Travel Router Arc', selected_option: 'Standard Edition', timestamp: hours(12), price: 8499, stock: 85, outcome: 'success', attempts: 1, error_message: null },
    { id: uuidv4(), tracked_product_id: p3_id, store_product_id: 2958, product_name: 'Veloria Travel Router Arc', selected_option: 'Standard Edition', timestamp: hours(10), price: 8499, stock: 80, outcome: 'success', attempts: 1, error_message: null },
    { id: uuidv4(), tracked_product_id: p3_id, store_product_id: 2958, product_name: 'Veloria Travel Router Arc', selected_option: 'Standard Edition', timestamp: hours(8), price: 7999, stock: 72, outcome: 'success', attempts: 1, error_message: null },
    { id: uuidv4(), tracked_product_id: p3_id, store_product_id: 2958, product_name: 'Veloria Travel Router Arc', selected_option: 'Standard Edition', timestamp: hours(6), price: 7999, stock: 68, outcome: 'success', attempts: 1, error_message: null },
    { id: uuidv4(), tracked_product_id: p3_id, store_product_id: 2958, product_name: 'Veloria Travel Router Arc', selected_option: 'Standard Edition', timestamp: hours(4), price: 8299, stock: 65, outcome: 'success', attempts: 1, error_message: null },
    { id: uuidv4(), tracked_product_id: p3_id, store_product_id: 2958, product_name: 'Veloria Travel Router Arc', selected_option: 'Standard Edition', timestamp: hours(2), price: 8299, stock: 60, outcome: 'success', attempts: 1, error_message: null }
  ];

  const price_history = scrape_logs
    .filter(l => l.outcome !== 'failed' && l.price !== null)
    .map(l => ({
      id: uuidv4(),
      tracked_product_id: l.tracked_product_id,
      store_product_id: l.store_product_id,
      selected_option: l.selected_option,
      price: l.price,
      stock: l.stock,
      recorded_at: l.timestamp
    }));

  return { tracked_products, scrape_logs, price_history };
}

function loadLocalDB() {
  if (!fs.existsSync(LOCAL_DB_FILE)) {
    const seeded = seedLocalData();
    fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(seeded, null, 2));
    return seeded;
  }
  try {
    return JSON.parse(fs.readFileSync(LOCAL_DB_FILE, 'utf8'));
  } catch {
    const seeded = seedLocalData();
    fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(seeded, null, 2));
    return seeded;
  }
}

function saveLocalDB(data) {
  fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(data, null, 2));
}

// Data Abstraction Methods
const db = {
  async getTrackedProducts() {
    if (supabase) {
      const { data, error } = await supabase.from('tracked_products').select('*').eq('is_active', true).order('created_at', { ascending: false });
      if (!error) return data;
      console.error('Supabase error getTrackedProducts:', error.message);
    }
    const local = loadLocalDB();
    return local.tracked_products.filter(p => p.is_active);
  },

  async addTrackedProduct(product) {
    const newProduct = {
      id: uuidv4(),
      store_product_id: Number(product.store_product_id),
      slug: product.slug || '',
      name: product.name,
      brand: product.brand || '',
      category: product.category || '',
      sku: product.sku || '',
      selected_option_id: product.selected_option_id || 'default',
      selected_option_label: product.selected_option_label || 'Default',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (supabase) {
      const { data, error } = await supabase.from('tracked_products').insert([newProduct]).select();
      if (!error && data?.length) return data[0];
      console.error('Supabase error addTrackedProduct:', error.message);
    }

    const local = loadLocalDB();
    local.tracked_products.unshift(newProduct);
    saveLocalDB(local);
    return newProduct;
  },

  async removeTrackedProduct(id) {
    if (supabase) {
      const { error } = await supabase.from('tracked_products').delete().eq('id', id);
      if (!error) return true;
    }
    const local = loadLocalDB();
    local.tracked_products = local.tracked_products.filter(p => p.id !== id);
    saveLocalDB(local);
    return true;
  },

  async recordScrapeOutcome({ tracked_product_id, store_product_id, product_name, selected_option, price, stock, outcome, attempts, error_message }) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      id: uuidv4(),
      tracked_product_id,
      store_product_id: Number(store_product_id),
      product_name,
      selected_option,
      timestamp,
      price: price !== null && price !== undefined ? Number(price) : null,
      stock: stock !== null && stock !== undefined ? Number(stock) : null,
      outcome, // 'success', 'retried', 'failed'
      attempts: attempts || 1,
      error_message: error_message || null
    };

    if (supabase) {
      await supabase.from('scrape_logs').insert([logEntry]);
      if (price !== null && stock !== null) {
        await supabase.from('price_history').insert([{
          id: uuidv4(),
          tracked_product_id,
          store_product_id: Number(store_product_id),
          selected_option,
          price: Number(price),
          stock: Number(stock),
          recorded_at: timestamp
        }]);
      }
    }

    const local = loadLocalDB();
    local.scrape_logs.unshift(logEntry);

    if (price !== null && stock !== null) {
      local.price_history.unshift({
        id: uuidv4(),
        tracked_product_id,
        store_product_id: Number(store_product_id),
        selected_option,
        price: Number(price),
        stock: Number(stock),
        recorded_at: timestamp
      });
    }

    // Update tracked product updated_at
    const tp = local.tracked_products.find(p => p.id === tracked_product_id);
    if (tp) tp.updated_at = timestamp;

    saveLocalDB(local);
    return logEntry;
  },

  async getScrapeLogs(tracked_product_id = null) {
    if (supabase) {
      let query = supabase.from('scrape_logs').select('*').order('timestamp', { ascending: false });
      if (tracked_product_id) query = query.eq('tracked_product_id', tracked_product_id);
      const { data, error } = await query;
      if (!error) return data;
    }
    const local = loadLocalDB();
    if (tracked_product_id) {
      return local.scrape_logs.filter(l => l.tracked_product_id === tracked_product_id);
    }
    return local.scrape_logs;
  },

  async getPriceHistory(tracked_product_id) {
    if (supabase) {
      const { data, error } = await supabase.from('price_history').select('*').eq('tracked_product_id', tracked_product_id).order('recorded_at', { ascending: true });
      if (!error) return data;
    }
    const local = loadLocalDB();
    return local.price_history
      .filter(ph => ph.tracked_product_id === tracked_product_id)
      .sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));
  }
};

module.exports = { supabase, db };
