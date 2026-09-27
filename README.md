# INE Mock Store Price & Stock Tracker

A full-stack web application that allows users to search for products on INE's hosted mock store (`https://demo.inelabteamdev.com`), select specific product options/variants (e.g. storage size, kit, or pack size), track current prices and stock levels over time on a 2-hour schedule, view price history charts and honest audit logs, export history as CSV, and execute headed observable scraper runs.

---

## 🚀 Live Demo & Deployment

- **Frontend Hosting**: Vercel
- **Backend Hosting**: Render.com
- **Database**: Supabase (PostgreSQL)
- **Target Mock Store**: `https://demo.inelabteamdev.com/`

---

## 🛠 Tech Stack

- **Frontend**: React.js, Vite, Tailwind CSS, Recharts, Lucide Icons, Axios
- **Backend**: Node.js, Express.js, Playwright, `@supabase/supabase-js`, `json2csv`
- **Database**: Supabase PostgreSQL (with automatic local JSON fallback for dev/demo)
- **Scraping Engine**: Playwright Chromium (with realistic mouse movement, hover throttling, dwell time simulation, cookie scrim dismissal, and exponential backoff retries)
- **Scheduler**: External Cron (`cron-job.org`) calling `/api/scrape/cron?secret=YOUR_CRON_SECRET` every 2 hours

---

## 📦 Features

1. **Product Search & Option Picker**: Search products from INE's catalogue by name, brand, or SKU, view available options (e.g. Single, Duo pack, Travel set), and track them.
2. **Scheduled Unattended Scraping**: Automatically scrapes current price and stock levels every 2 hours. Intentionally handles awkward store behaviors (consent popups, mouse move hover requirements, HTTP 429 rate limits, async WASM challenges, and store retries).
3. **Price & Stock History Chart**: Interactive Recharts area chart displaying price trends and stock variations over time.
4. **Honest Scrape Log & Audit Trail**: Per-product and global log table recording every single scrape attempt with timestamp (ISO 8601 UTC), attempts count, price, stock, and outcome status (`success`, `retried`, or `failed`). Failures are recorded honestly without missing data.
5. **CSV History Export**: One-click download button generating a CSV file with columns: `Store Product ID`, `Product Name`, `Selected Option`, `Timestamp (ISO 8601 UTC)`, `Price`, `Stock`, and `Outcome`.
6. **Observable Headed Run**: CLI script to launch the scraper in headed mode (`HEADLESS=false`) to visually observe browser interactions and retry handling.

---

## ⚙️ Environment Variables

Create a `.env` file in the project root:

```env
# Server Port
PORT=5000

# Supabase Credentials (optional - app falls back to local JSON DB if omitted)
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Cron Endpoint Security Secret
CRON_SECRET=ine_cron_secret_2026

# Scraper Headless Toggle (true for headless background runs, false for visible headed run)
HEADLESS=true
```

---

## 💻 Local Setup & Running

### 1. Install Dependencies & Build Frontend
```bash
# Install root/backend dependencies
npm install

# Build React frontend
npm run build
```

### 2. Start Local Server
```bash
npm start
```
Open [http://localhost:5000](http://localhost:5000) in your browser.

### 3. Run Observable Headed Scraper (Screen Recording)
To run the scraper in visible headed mode against product `#2383` (or any product ID):
```bash
npm run scrape:headed
# Or with custom product ID and option label:
node backend/scripts/run_headed_scraper.js 2383 "Single"
```

---

## 🕒 Scheduled Scraping Setup (Every 2 Hours)

Because free-tier hosting services (like Render) sleep when idle, scheduled scraping is triggered via an external cron service:

1. Register a free account at [cron-job.org](https://cron-job.org).
2. Create a new cron job pointing to:
   `GET https://your-render-backend-url.onrender.com/api/scrape/cron?secret=ine_cron_secret_2026`
3. Set the schedule frequency to **Every 2 Hours** (`0 */2 * * *`).
4. The endpoint will wake up the backend, scrape all active tracked products in sequence, log honest outcomes to Supabase, and respond with a summary payload.

---

## 🗄️ Database Schema Setup (Supabase)

Execute the contents of `schema.sql` in your Supabase SQL Editor:

- `tracked_products`: Stores product metadata and selected options.
- `scrape_logs`: Audit table for every scrape attempt timestamp, attempt count, price, stock, and outcome status.
- `price_history`: Historical table for successful price and stock snapshots.
