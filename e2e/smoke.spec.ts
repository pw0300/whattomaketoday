import { test, expect } from '@playwright/test';

/**
 * E2E Smoke Tests for TadkaSync
 * These tests verify critical user flows work correctly.
 */

test.describe('App Smoke Tests', () => {
    test('should load the application', async ({ page }) => {
        await page.goto('/');

        // App should load without crashing
        await expect(page.locator('body')).toBeVisible();

        // Should see either Intro, Onboarding, or main app
        const hasContent = await page.locator('text=/TadkaSync|ChefSync|Let\'s get setup|Confirm/i').isVisible();
        expect(hasContent || await page.locator('button').first().isVisible()).toBeTruthy();
    });

    test('should display onboarding for new users', async ({ page }) => {
        // Clear localStorage to simulate new user
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.reload();

        // Should see intro or onboarding
        await expect(page.locator('text=/Skip|Next|Confirm/i').first()).toBeVisible({ timeout: 10000 });
    });
});

test.describe('Navigation', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Set intro as seen and a basic profile to skip onboarding
        await page.evaluate(() => {
            localStorage.setItem('intro_seen', 'true');
            localStorage.setItem('profile', JSON.stringify({
                state: {
                    userProfile: {
                        name: 'Test User',
                        allergens: [],
                        conditions: [],
                        cuisines: ['Italian'],
                        dietaryPreference: 'Any',
                        dailyTargets: { protein: 100, carbs: 200, fat: 70, calories: 2000 },
                        isOnboarded: true,
                        biometrics: { age: 30, gender: 'Male', weight: 70, height: 175, activityLevel: 'Moderate', goal: 'Maintain' },
                        likedDishes: []
                    }
                }
            }));
        });
        await page.reload();
    });

    test('should show bottom navigation tabs', async ({ page }) => {
        // Wait for the main app to load
        await page.waitForTimeout(2000);

        // Check for navigation buttons
        const navButtons = page.locator('button:has-text(/Deck|Plan|List|Pantry|Me/i)');
        const count = await navButtons.count();
        expect(count).toBeGreaterThan(0);
    });
});

test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
        // Intercept API calls and make them fail
        await page.route('**/api/generate', route => route.abort());

        await page.goto('/');

        // App should not crash, should still show content
        await expect(page.locator('body')).toBeVisible();
    });
});
