require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const productsRouter = require('./backend/routes/products');
const trackedRouter = require('./backend/routes/tracked');
const scrapeRouter = require('./backend/routes/scrape');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api', productsRouter);
app.use('/api', trackedRouter);
app.use('/api', scrapeRouter);

// Serve frontend static assets if built
const frontendDistPath = path.join(__dirname, 'frontend', 'dist');
if (require('fs').existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.use((req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({
      name: 'INE Mock Store Price Tracker Backend API',
      status: 'online',
      endpoints: [
        'GET /api/search?q=query',
        'GET /api/products/:id',
        'GET /api/tracked',
        'POST /api/tracked',
        'DELETE /api/tracked/:id',
        'GET /api/tracked/:id/history',
        'POST /api/scrape/trigger',
        'GET /api/scrape/cron?secret=...',
        'GET /api/logs',
        'GET /api/export/csv'
      ]
    });
  });
}

app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(` INE Mock Store Tracker API Server running on port ${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`=================================================`);
});
