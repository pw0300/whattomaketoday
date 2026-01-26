import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// UAT Config
const BASE_URL = 'https://tadkasync.web.app';
const SCREENSHOT_DIR = path.join(process.cwd(), 'uat_artifacts');

if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR);
}

async function runUAT() {
    console.log('🚀 Starting System UAT on ' + BASE_URL);
    const browser = await chromium.launch({ headless: true }); // Headless for stability in terminal
    const context = await browser.newContext();
    const page = await context.newPage();

    // Debug: Listen to browser console
    page.on('console', msg => console.log(`[Browser] ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', err => console.log(`[Browser Error]: ${err.message}`));

    try {
        console.log('🧹 Clearing Storage first...');
        await page.goto(BASE_URL);
        await page.evaluate(() => localStorage.clear());
        await page.reload();
        // 1. Onboarding / Home
        console.log('1️⃣  Navigating to Home...');
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_home.png') });

        let title = await page.title();
        console.log(`   Internal Page Title: ${title}`);

        // Handle Intro / Onboarding
        // Keep clicking 'Next' or 'Get Started' until we see the main UI (Deck or Plan button)
        let attempts = 0;
        let onCurating = false;

        while (attempts < 20) {
            // Check for Curating Screen
            if (await page.getByText(/Curating your menu|Creating your menu|TadkaSync is thinking/i).isVisible()) {
                if (!onCurating) {
                    console.log('   [Onboarding] ⏳ Entered Curating Screen (Waiting for AI)...');
                    onCurating = true;
                }
                await page.waitForTimeout(2000);
                attempts++;
                continue;
            }

            const btnRegex = /Next|Get Started|Continue|Enter Kitchen|Start Free|Launch App/i;
            const nextBtn = page.getByRole('button', { name: btnRegex }).or(page.getByRole('link', { name: btnRegex }));

            if (await nextBtn.first().isVisible()) {
                console.log(`   [Onboarding] Clicking ${await nextBtn.first().innerText()}...`);
                await nextBtn.first().click();
                await page.waitForTimeout(1000);
            } else {
                // Check if final 'Start Cooking' or similar exists (Curating finish)
                // Curating screen usually ends with 'Reveal Menu' or auto-transition?
                // Checking for "Let's Eat" or similar if known.
                const finishBtn = page.getByRole('button', { name: /Start Cooking|Finish|Go to Kitchen|Reveal Menu|Let's Eat|Start Swiping/i });
                if (await finishBtn.isVisible()) {
                    console.log(`   [Onboarding] Clicking Finish (${await finishBtn.innerText()})...`);
                    await finishBtn.click();
                    await page.waitForTimeout(2000);
                    break;
                }

                // If we see the Deck, we are done
                if (await page.getByText(/Daily Goal|Swipe Request/i).isVisible() || await page.locator('.bg-gradient-brand').count() > 0) {
                    console.log('   [Onboarding] Deck detected. Done.');
                    break;
                }

                // If neither, and we were curating, we might just be waiting.
                if (onCurating && attempts < 15) {
                    // Wait more
                    await page.waitForTimeout(2000);
                    attempts++;
                    continue;
                }

                break;
            }
            attempts++;
        }

        console.log('   Onboarding phase complete.');

        // 2. Deck Interaction (Discovery)
        console.log('2️⃣  Checking Discovery Deck...');
        await page.goto(BASE_URL + '/app'); // Force app route
        await page.waitForTimeout(3000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_deck.png') });

        const cardLikeBtn = page.locator('button').filter({ hasText: 'LIKE' }).or(page.locator('.bg-gradient-brand')); // Heuristic for Like button
        if (await cardLikeBtn.count() > 0) {
            console.log('   Interacting with Deck (Like)...');
            await cardLikeBtn.first().click();
            await page.waitForTimeout(1000);
        } else {
            console.log('   ⚠️ No Like button found (maybe deck is empty?)');
        }

        // 3. Planning
        console.log('3️⃣  Testing Planner (Magic Fill)...');
        await page.getByRole('button', { name: /Plan/i }).click();
        await page.waitForTimeout(1000);

        const magicBtn = page.getByText('Kitchen Autopilot');
        if (await magicBtn.isVisible()) {
            console.log('   Running Kitchen Autopilot...');
            await magicBtn.click();
            // Wait for generation
            await page.waitForTimeout(5000);
            await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_plan_generated.png') });
        } else {
            console.log('   ⚠️ Kitchen Autopilot button not visible.');
        }

        // 4. Grocery List
        console.log('4️⃣  Checking Grocery List...');
        await page.getByRole('button', { name: /List/i }).click(); // 'List' or 'Shop' depending on recent change
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_grocery_list.png') });

        // Add Custom Item
        const input = page.getByPlaceholder(/Add household items/i);
        if (await input.isVisible()) {
            console.log('   Adding Custom Item "UAT Soap"...');
            await input.fill('UAT Soap');
            await input.press('Enter');
            await page.waitForTimeout(5000); // Verify persistance
            await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_grocery_custom_added.png') });

            const added = await page.getByText('UAT Soap').isVisible();
            console.log(`   Item Added Verification: ${added ? '✅' : '❌'}`);
        }

        console.log('✅ UAT Scenario Complete.');
    } catch (error) {
        console.error('❌ UAT Failed:', error);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'error_state.png') });
    } finally {
        await browser.close();
        console.log(`\n📸 Screenshots saved to: ${SCREENSHOT_DIR}`);
    }
}

runUAT();
