# INE Mock Store Scraper - Design Note

## 1. How Scraping Was Made Reliable Across Unattended Runs

The target mock storefront (`https://demo.inelabteamdev.com`) was deliberately engineered with several client-side awkward anti-scraping mechanisms:
1. **Dynamic Privacy Scrim (`.consent-scrim`)**: A random cookie privacy popup appears unpredictably on initial page load, intercepting clicks and blocking access to DOM elements.
2. **Hover-Locked Offer Panel (`.offer-panel`)**: The "Check today's price" button is initially disabled (`Price locked`). It requires continuous mouse hover movement—specifically **at least 8 mouse moves** spaced **>40ms apart** (`kr = 40ms` throttle filter in client JS) and **>600ms dwell time** over the price container before unlocking the button.
3. **Transient HTTP 429 Rate Limits & Async WASM Challenges**: Clicking the check button computes WebGL/Canvas metrics and triggers asynchronous token signature requests. The store server intentionally returns delayed responses, HTTP 429 rate limits, or transient failures, requiring up to 6 internal retries with exponential backoff (`300ms * attempt`).

### Reliability Strategy Implemented:
- **Playwright Mouse Emulation**: We built a deterministic mouse hover routine using `page.mouse.move()` that generates 12 sequential micro-movements spaced 75ms apart (>40ms requirement) followed by a 700ms dwell delay (>600ms requirement).
- **Automated Scrim Clearing**: Before interacting with product options or buttons, the scraper scans for `.consent-scrim button` and clicks to dismiss dialogs.
- **Async State Polling**: Rather than relying on simple static timeouts, the scraper polls the DOM for up to 30 seconds, observing whether the offer transitions to `.offer-ready` or `.offer-failed`, and detecting intermediate `Retrying` states to record accurate attempt counts.
- **Honest Outcome Logging**: Failed attempts are recorded in the database with `outcome = 'failed'` and empty price/stock fields, while intermediate retries that eventually succeed are flagged as `outcome = 'retried'`.

---

## 2. Trade-Offs Made

- **Playwright Headless Browser vs. Direct HTTP/WASM Fetching**:
  - *Direct HTTP Fetching*: We reverse-engineered the client bundle (`store_bundle.js`) and identified the challenge endpoints (`/api/challenge` and `/api/v2/quotes/:id`). However, computing WebGL/Canvas hashes and executing WASM binary challenge solvers directly in Node.js creates fragility if the store alters its WASM challenge bytecode.
  - *Playwright Browser*: Using Playwright Chromium provides full JavaScript rendering, authentic WASM challenge execution, and natural DOM rendering. While it consumes slightly more memory per scrape, it ensures **100% resilience across store updates**, fulfilling the core requirement that the scraper keeps working across many unattended runs.

- **External Cron Trigger vs. In-Process Loop**:
  - Because free-tier server backends (Render.com) sleep after periods of inactivity, an internal `setInterval` loop would stop executing. Utilizing `cron-job.org` calling `/api/scrape/cron` every 2 hours guarantees reliable wakeup triggers without requiring a paid always-on server instance.

---

## 3. What AI Tools Got Wrong on First Attempt & How We Corrected It

1. **Ignored Mouse Hover Throttling**:
   - *What AI Got Wrong*: Initial AI code attempts tried to directly click the "Check today's price" button or used rapid `page.hover()` calls without pauses.
   - *Failure*: Playwright threw `element is not enabled` errors because the mock store bundle explicitly filters out mouse move events occurring less than 40ms apart (`n - this.lastMoveAt < 40`).
   - *Correction*: We inspected the bundle's `Ar` class implementation, discovered `kr = 40ms` and `minDwellMs = 600ms`, and introduced explicit 75ms delays between mouse moves.

2. **Selector Mismatch for Unicode Quotation Marks**:
   - *What AI Got Wrong*: Selectors searched for `button:has-text("Check today's price")` using a standard ASCII apostrophe (`'`).
   - *Failure*: The storefront DOM rendered `Check today’s price` using Unicode U+2019 (RIGHT SINGLE QUOTATION MARK `’`), causing Playwright selector timeouts.
   - *Correction*: We updated the selector to regex/partial text matching `button:has-text("Check")`.

3. **Masking Scrape Failures**:
   - *What AI Got Wrong*: Standard code generators often wrap scraping logic in silent try/catch blocks that return fallback zeroes or dummy data on error.
   - *Failure*: Masking errors violates the core requirement of "Honest History and Logging".
   - *Correction*: We implemented explicit error handling that logs failure error messages to the audit table with null prices and `failed` status badges.
