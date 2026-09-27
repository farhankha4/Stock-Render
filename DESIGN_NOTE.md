1. How We Made Scraping Reliable
Playwright (Headless Browser): INE’s mock store relies on JavaScript to update prices when selecting product options (e.g., Single vs. Pack of 2). Plain HTTP fetch requests only retrieve empty HTML templates, so we used Playwright Chromium to render the full browser page.
Consent Banner Auto-Dismissal: The scraper automatically detects and clicks away cookie popups (.cookie-banner button) before attempting to select options so clicks are never blocked.
Mouse Movement & Dwell Delays: To handle anti-bot checks and delayed price updates, the scraper simulates realistic cursor movements (40ms steps) and adds a mandatory 600ms dwell delay after clicking an option to let JavaScript recalculate the final price.
3-Attempt Exponential Retry Loop: If the mock store loads slowly or returns a temporary error, the scraper retries up to 3 times (waiting 1s, 2s, and 4s) before marking the attempt as failed.
Strict Regex Validation: Prices and stock levels are validated using regular expressions. If an attempt fails, it records an outcome of failed with empty price/stock fields rather than saving corrupted or zero data.
2. Trade-offs Made
Playwright vs. Cheerio/Axios:
Trade-off: Playwright takes slightly more RAM (~100MB) and 2 seconds longer to boot than simple HTML parsing.
Why: Static HTML parsing cannot execute JavaScript or option clicks on INE's storefront. Reliability and extraction accuracy were chosen over raw speed.
External Cron (cron-job.org) vs. setInterval:
Trade-off: Exposing a token-secured webhook endpoint (/api/scrape/cron?secret=...).
Why: Free hosting backends (Render) sleep after 15 minutes of inactivity. An internal setInterval loop would freeze when the server sleeps, whereas an external cron ping reliably wakes up the backend every 2 hours.
3. What AI Tools Got Wrong & How We Corrected It
What AI Got Wrong Initially: The AI tool originally generated code using static axios.get() requests, expecting option prices to be present inside raw HTML strings.
Why It Failed: On INE's live mock store, variant option prices only appear after user clicks and hover events trigger client-side JavaScript updates.
How We Corrected It: We refactored the scraping architecture to launch Playwright Chromium, dismiss consent popups, click variant buttons, wait for network idle states, and log honest audit outcomes (success, retried, failed) to Supabase.
