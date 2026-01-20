import { chromium } from '@playwright/test';

const fetchYouTubeVideoContent = async (page: any, url: string): Promise<string> => {
    try {
        console.log(`[YouTube] Visiting: ${url}`);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Wait for description container
        try {
            await page.waitForSelector('#description-inner', { timeout: 10000 });
        } catch (e) {
            console.log("Timed out waiting for #description-inner");
        }

        // Attempt to expand description
        try {
            const moreButton = page.locator('tp-yt-paper-button#expand').first();
            if (await moreButton.isVisible()) {
                console.log("Found '...more' button, clicking...");
                await moreButton.click({ force: true, timeout: 5000 });
                await page.waitForTimeout(2000);
            } else {
                console.log("'...more' button not visible via tp-yt-paper-button#expand");
                // Fallback
                const fallback = page.locator('#expand').first();
                if (await fallback.isVisible()) {
                    console.log("Found fallback #expand, clicking...");
                    await fallback.click({ force: true, timeout: 3000 });
                }
            }
        } catch (e) {
            console.log("Error clicking expand:", e);
        }

        // Extract Description Text
        const description = await page.evaluate(() => {
            const el = document.querySelector('#description-inner');
            if (el) {
                return (el as HTMLElement).innerText;
            }
            return "";
        });

        console.log(`Extracted length: ${description.length}`);
        if (description.length > 0) {
            console.log("Preview:", description.substring(0, 100));
        }

        return description;

    } catch (e) {
        console.error(`[YouTube] Failed to load video ${url}`, e);
        return "";
    }
}

(async () => {
    const browser = await chromium.launch({ headless: false }); // Headful to see what happens
    const page = await browser.newPage();

    // Test on a specific video known to fail
    await fetchYouTubeVideoContent(page, 'https://www.youtube.com/watch?v=e5ZX0sx9Cnk');

    await browser.close();
})();
