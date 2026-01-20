import { ingestRecipeFromUrl, extractRecipeLinksFromHtml } from '../services/ingestionService';
import { knowledgeGraph } from '../services/knowledgeGraphService';
import { TOP_CREATORS } from '../data/creators';
import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Helper: Fetch Generic Page Content (for Blogs)
const fetchPageContent = async (page: any, url: string): Promise<string> => {
    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        return await page.evaluate(() => document.body.innerText);
    } catch (e) {
        console.error(`Failed to load ${url}`, e);
        return "";
    }
}

// Helper: Fetch YouTube Video Description (Expanded)
const fetchYouTubeVideoContent = async (page: any, url: string): Promise<string> => {
    try {
        console.log(`[YouTube] Visiting: ${url}`);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Wait for description container
        try {
            await page.waitForSelector('#description-inner', { timeout: 10000 });
        } catch (e) { }

        // Attempt to expand description using Subagent-verified selector
        try {
            const moreButton = page.locator('tp-yt-paper-button#expand').first();
            if (await moreButton.isVisible()) {
                await moreButton.click({ force: true, timeout: 5000 });
                await page.waitForTimeout(1000);
            } else {
                // Fallback
                await page.locator('#expand').click({ force: true, timeout: 3000 });
            }
        } catch (e) {
            // Ignore click errors (might be already open)
        }

        // Extract Description Text using Subagent-verified selector
        const description = await page.evaluate(() => {
            const el = document.querySelector('#description-inner');
            if (el && (el as HTMLElement).innerText.trim().length > 50) {
                return (el as HTMLElement).innerText;
            }
            // Fallback (e.g. for Shorts or different layouts)
            return document.body.innerText;
        });

        if (description.length < 50) console.log(`[YouTube] Warning: Extracted description is short (${description.length} chars)`);
        return description;

    } catch (e) {
        console.error(`[YouTube] Failed to load video ${url}`, e);
        return "";
    }
}

// Helper: Crawl Channel for Video Links
const extractYouTubeVideoLinks = async (page: any, channelUrl: string, limit: number = 50): Promise<string[]> => {
    console.log(`[YouTube] Crawling Channel: ${channelUrl}`);
    try {
        await page.goto(channelUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Agree to cookies if pop-up appears (EU/Global) - crude check
        try {
            await page.getByText('Reject all').click({ timeout: 2000 });
        } catch (e) { }

        // Scroll DEEP to load many videos (User requested "more")
        for (let i = 0; i < 15; i++) {
            await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));
            await page.waitForTimeout(1000);
        }

        const links = await page.evaluate(() => {
            // Try specific ID first
            let anchors = Array.from(document.querySelectorAll('a#video-title-link'));

            // Fallback to title span or generic link
            if (anchors.length === 0) {
                anchors = Array.from(document.querySelectorAll('a#video-title'));
            }
            // Fallback to any link with /watch
            if (anchors.length === 0) {
                anchors = Array.from(document.querySelectorAll('a[href^="/watch"]'));
            }

            return anchors
                .map(a => (a as HTMLAnchorElement).href)
                .filter(href => href.includes('/watch') && !href.includes('&list='));
        }) as string[];

        // Dedup and slice
        console.log(`[YouTube] Found ${links.length} total videos, taking top ${limit}.`);
        return [...new Set(links)].slice(0, limit);

    } catch (e) {
        console.error(`[YouTube] Channel crawl failed: ${channelUrl}`, e);
        return [];
    }
}

const runMassiveCrawl = async () => {
    console.log(`Starting Massive YouTube & Blog Crawl (Scale: 50/creator)...`);

    // Load existing DB to append/merge
    let masterList: any[] = [];
    const outputPath = path.resolve(process.cwd(), 'data/master_recipe_db.json');

    if (fs.existsSync(outputPath)) {
        try {
            masterList = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
            console.log(`Loaded ${masterList.length} existing recipes.`);
        } catch (e) {
            console.warn("Could not read existing DB, starting fresh.");
        }
    }

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    let newCount = 0;

    for (const creator of TOP_CREATORS) {
        console.log(`\n--- Processing Creator: ${creator.name} ---`);

        let recipeLinks: string[] = [];
        let isYouTube = false;

        // 1. Prefer Blog Index (Strategy Pivot: Blog First)
        if (creator.blogUrl) {
            console.log("Checking Blog Index...");
            const indexContent = await fetchPageContent(page, creator.blogUrl);
            if (indexContent) {
                // Try to find recipes on the blog index
                const blogLinks = await extractRecipeLinksFromHtml(creator.blogUrl, indexContent);
                recipeLinks = blogLinks.slice(0, 50); // Up to 50 from blog
            }
        }

        // 2. Fallback to YouTube if Blog yield is low (< 5) or missing
        if (recipeLinks.length < 5 && creator.youtubeUrl) {
            console.log("Blog yield low. Checking YouTube Channel...");
            isYouTube = true;
            const videoLinks = await extractYouTubeVideoLinks(page, creator.youtubeUrl, 50);

            // Merge lists (dedup handled later)
            recipeLinks = [...recipeLinks, ...videoLinks];
        }

        console.log(`Found ${recipeLinks.length} potential recipes (${isYouTube ? 'YouTube' : 'Blog'}).`);

        for (const link of recipeLinks) {
            // Duplicate Check
            if (masterList.some(r => r.sourceUrl === link)) {
                process.stdout.write('.'); // Compact progress
                continue;
            }

            console.log(`\nScraping: ${link}`);

            // Determine platform dynamically (since we might have mixed list)
            const isVideoLink = link.includes('youtube.com') || link.includes('youtu.be');
            let content = "";

            if (isVideoLink) {
                content = await fetchYouTubeVideoContent(page, link);
            } else {
                content = await fetchPageContent(page, link);
            }

            // Safety check for empty content (Lowered threshold for YouTube)
            const threshold = isYouTube ? 50 : 500;
            if (content.length > threshold) {
                try {
                    const dish = await ingestRecipeFromUrl(link, content);
                    if (dish && typeof dish !== 'boolean') {
                        // Enrich Data
                        (dish as any).sourceCreator = creator.name;
                        (dish as any).sourceUrl = link;
                        (dish as any).platform = isYouTube ? 'YouTube' : 'Blog';

                        masterList.push(dish);
                        newCount++;

                        // Learn ingredients into Knowledge Graph (for faster cold starts)
                        if (dish.ingredients && dish.ingredients.length > 0) {
                            knowledgeGraph.learnFromDish(dish);
                        }

                        // Progressive Save (per recipe)
                        fs.writeFileSync(outputPath, JSON.stringify(masterList, null, 2));
                    }
                } catch (err) {
                    console.error(`[Skip] Failed to process ${link}:`, err);
                }
            } else {
                console.warn("Skipping empty/short content.");
            }

            await page.waitForTimeout(2000); // Rate limiting
        }
    }

    await browser.close();
    console.log(`\nMassive Crawl Complete. Added ${newCount} new recipes. Total DB size: ${masterList.length}`);
}

// Execute
runMassiveCrawl();
