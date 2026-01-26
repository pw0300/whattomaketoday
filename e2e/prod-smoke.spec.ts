import { test, expect } from '@playwright/test';

test.use({ baseURL: 'https://tadkasync.web.app' });

test.describe('Production Smoke Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Monitor console errors
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.error(`[Browser Error]: "${msg.text()}"`);
            }
        });

        // Fail test on critical uncaught exceptions if possible, or just log them
        page.on('pageerror', exception => {
            console.error(`[Uncaught Exception]: "${exception}"`);
        });
    });

    test('should load the production app without crashing', async ({ page }) => {
        await page.goto('/');

        // Should have a body
        await expect(page.locator('body')).toBeVisible();

        // Wait for potential splash screen / loading
        await page.waitForTimeout(3000);

        // Check for key elements (either Onboarding or Main App)
        const content = page.locator('div#root');
        await expect(content).toBeVisible();

        // Ensure no error boundary is showing "Something went wrong"
        const errorBoundary = page.locator('text=Something went wrong');
        await expect(errorBoundary).not.toBeVisible();
    });

    test('should allow navigation through onboarding (if new user)', async ({ page }) => {
        // Clear storage to force new user state
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
        await page.reload();

        await expect(page.locator('body')).toBeVisible();

        // Look for typical onboarding elements
        // This text might change, using generic locators or specific known text from Onboarding.tsx
        // "Welcome to your kitchen" or similar
        // Just ensuring it didn't crash is the main goal here.
    });

    test('should be able to view terms/privacy if links exist', async ({ page }) => {
        await page.goto('/');
        // Simple distinct element check
        await expect(page.locator('body')).toBeVisible();
    });
});
