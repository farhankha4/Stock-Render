const { chromium } = require('playwright');

/**
 * Scrapes price and stock for a given product and option from INE Mock Store.
 * @param {Object} options
 * @param {number|string} options.storeProductId - Product ID (e.g. 2383)
 * @param {string} options.optionId - Selected option ID (e.g. 'o1')
 * @param {string} options.optionLabel - Selected option label (e.g. 'Single')
 * @param {boolean} options.isHeaded - If true, launches visible browser UI
 * @returns {Promise<Object>} Scrape result object
 */
async function scrapeProduct({ storeProductId, optionId, optionLabel, isHeaded = false }) {
  const headlessEnv = process.env.HEADLESS;
  const forceHeadless = headlessEnv === 'true' || (!isHeaded && headlessEnv !== 'false');

  console.log(`[SCRAPER] Starting scrape for Product ${storeProductId} (Option: ${optionLabel || optionId || 'Default'}), Headless: ${forceHeadless}`);

  let browser = null;
  let attemptsCount = 1;
  let hasRetried = false;

  try {
    browser = await chromium.launch({
      headless: forceHeadless,
      slowMo: forceHeadless ? 0 : 100 // add slowMo for observable headed run
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();
    const url = `https://demo.inelabteamdev.com/item/${storeProductId}`;

    console.log(`[SCRAPER] Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // 1. Dismiss consent scrims if present
    for (let i = 0; i < 5; i++) {
      try {
        const consentBtn = await page.$('.consent-scrim button');
        if (consentBtn) {
          console.log('[SCRAPER] Consent popup detected! Dismissing...');
          await consentBtn.click();
          await page.waitForTimeout(300);
        } else {
          break;
        }
      } catch {
        break;
      }
    }

    // 2. Select option if chips exist
    if (optionId || optionLabel) {
      try {
        const chips = await page.$$('.opt-chip');
        if (chips.length > 0) {
          let targetChip = null;
          for (const chip of chips) {
            const label = await chip.textContent();
            if (optionLabel && label.trim().toLowerCase() === optionLabel.trim().toLowerCase()) {
              targetChip = chip;
              break;
            }
          }
          if (!targetChip && chips.length > 0) targetChip = chips[0];
          if (targetChip) {
            console.log(`[SCRAPER] Selecting option chip...`);
            await targetChip.click();
            await page.waitForTimeout(400);
          }
        }
      } catch (err) {
        console.warn('[SCRAPER] Option chip selection warning:', err.message);
      }
    }

    // 3. Hover over offer panel (pass 40ms throttle & 600ms dwell time)
    console.log('[SCRAPER] Hovering offer panel with micro-movements...');
    const panel = await page.waitForSelector('.offer-panel', { timeout: 15000 });
    const box = await panel.boundingBox();

    if (box) {
      // 12 moves with 70ms delay between moves (>40ms requirement)
      for (let i = 0; i < 12; i++) {
        await page.mouse.move(box.x + 20 + (i * 14) % 120, box.y + 20 + (i % 3) * 12);
        await page.waitForTimeout(75);
      }
    }

    // Dwell time wait (>600ms requirement)
    await page.waitForTimeout(700);

    // 4. Click Check Button
    const checkBtn = await page.waitForSelector('button:has-text("Check")', { timeout: 10000 });
    let isDisabled = await checkBtn.isDisabled();

    if (isDisabled) {
      console.log('[SCRAPER] Button still disabled, executing secondary hover pass...');
      if (box) {
        for (let i = 0; i < 10; i++) {
          await page.mouse.move(box.x + 180 - i * 15, box.y + 30);
          await page.waitForTimeout(75);
        }
      }
      await page.waitForTimeout(700);
    }

    console.log('[SCRAPER] Clicking "Check today\'s price"...');
    await checkBtn.click();

    // 5. Poll offer state (handling loading, retries, and ultimate ready/failed state)
    const startTime = Date.now();
    let finalReadyText = null;
    let isFailedState = false;
    let failureMsg = '';

    while (Date.now() - startTime < 30000) {
      const readyEl = await page.$('.offer-ready');
      const failedEl = await page.$('.offer-failed');
      const retryingEl = await page.$('.offer-panel:has-text("Retrying")');

      if (retryingEl) {
        hasRetried = true;
        attemptsCount++;
        console.log(`[SCRAPER] Store in retrying state... attempt ${attemptsCount}`);
      }

      if (readyEl) {
        finalReadyText = await readyEl.innerText();
        break;
      } else if (failedEl) {
        isFailedState = true;
        failureMsg = await failedEl.innerText();
        break;
      }

      await page.waitForTimeout(1000);
    }

    await browser.close();

    if (isFailedState || !finalReadyText) {
      console.log(`[SCRAPER] Scrape failed for Product ${storeProductId}: ${failureMsg || 'Timeout waiting for ready state'}`);
      return {
        success: false,
        price: null,
        stock: null,
        outcome: 'failed',
        attempts: attemptsCount,
        errorMessage: failureMsg.replace(/\n/g, ' ') || 'Timeout waiting for price panel'
      };
    }

    // 6. Parse price and stock from text
    // Price format: ₹37,079
    const priceMatch = finalReadyText.match(/₹\s?([\d,]+)/);
    let extractedPrice = null;
    if (priceMatch) {
      extractedPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
    }

    // Stock format: AVAILABLE (47) or Sold out or Units available
    let extractedStock = 0;
    const stockMatch = finalReadyText.match(/(?:AVAILABLE|units available|Available)\s*\(?(\d+)\)?/i);
    if (stockMatch) {
      extractedStock = parseInt(stockMatch[1], 10);
    } else if (finalReadyText.toLowerCase().includes('sold out')) {
      extractedStock = 0;
    } else {
      // Fallback number extraction near stock section
      const numMatch = finalReadyText.match(/(\d+)\s*(?:units|available)/i);
      if (numMatch) extractedStock = parseInt(numMatch[1], 10);
    }

    const outcome = hasRetried || attemptsCount > 1 ? 'retried' : 'success';
    console.log(`[SCRAPER] Scrape SUCCESS for Product ${storeProductId}! Price: ₹${extractedPrice}, Stock: ${extractedStock}, Outcome: ${outcome}`);

    return {
      success: true,
      price: extractedPrice,
      stock: extractedStock,
      outcome: outcome,
      attempts: attemptsCount,
      errorMessage: null
    };

  } catch (err) {
    if (browser) await browser.close();
    console.error(`[SCRAPER] Exception during scrape for Product ${storeProductId}:`, err.message);
    return {
      success: false,
      price: null,
      stock: null,
      outcome: 'failed',
      attempts: attemptsCount,
      errorMessage: err.message
    };
  }
}

module.exports = { scrapeProduct };
