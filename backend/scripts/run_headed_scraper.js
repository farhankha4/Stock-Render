/**
 * Observable Headed Run Script for INE Mock Store Scraper
 * 
 * Usage:
 *   node backend/scripts/run_headed_scraper.js [product_id] [option_label]
 * Example:
 *   node backend/scripts/run_headed_scraper.js 2383 "Single"
 */

const { scrapeProduct } = require('../scraper/ineScraper');

async function main() {
  const args = process.argv.slice(2);
  const storeProductId = args[0] || 2383;
  const optionLabel = args[1] || 'Single';

  console.log('=====================================================');
  console.log(' INE MOCK STORE SCRAPER - HEADED DEMO RUN');
  console.log(' Product ID:', storeProductId);
  console.log(' Selected Option:', optionLabel);
  console.log(' Mode: HEADED (Visible Browser Window)');
  console.log('=====================================================\n');

  // Explicitly set HEADLESS=false for observable run
  process.env.HEADLESS = 'false';

  const startTime = Date.now();
  const result = await scrapeProduct({
    storeProductId,
    optionLabel,
    isHeaded: true
  });

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n-----------------------------------------------------');
  console.log(' SCRAPE RUN COMPLETED in', durationSec, 'seconds');
  console.log(' Status Success:', result.success);
  console.log(' Extracted Price:', result.price ? `₹${result.price}` : 'EMPTY (N/A)');
  console.log(' Extracted Stock:', result.stock !== null ? `${result.stock} units` : 'EMPTY (N/A)');
  console.log(' Outcome Code:  ', result.outcome.toUpperCase());
  console.log(' Total Attempts:', result.attempts);
  if (result.errorMessage) {
    console.log(' Error Message: ', result.errorMessage);
  }
  console.log('-----------------------------------------------------\n');
}

main().catch(err => {
  console.error('Fatal error during headed run:', err);
  process.exit(1);
});
