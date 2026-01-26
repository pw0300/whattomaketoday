import { test, expect } from '@playwright/test';

/**
 * E2E Smoke Tests for TadkaSync
 * These tests verify critical user flows work correctly.
 */

test.describe('App Smoke Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Capture console logs to debug potential app errors
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log(`[App Console Error] ${msg.text()}`);
            }
        });
        page.on('pageerror', err => console.error(`[App Page Error]: ${err.message}`));
    });

    test('should load the application', async ({ page }) => {
        await page.goto('/app');
        await expect(page.locator('body')).toBeVisible();

        // Should see either Intro, Onboarding, or main app content
        // We use a flexible locator to catch any of these valid states
        // We use a flexible locator to catch any of these valid states
        const anythingVisible = page.locator('#root');
        await expect(anythingVisible).toBeVisible({ timeout: 30000 });
    });

    test('should display onboarding for new users', async ({ page }) => {
        // 1. Load app
        await page.goto('/app');

        // 2. Clear storage to guarantee "New User" state
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });

        // 3. Reload to apply empty storage
        await page.reload();
        await page.waitForLoadState('networkidle');

        // 4. Expect Intro Walkthrough ("The Sous-Chef")
        await expect(page.getByText('The Sous-Chef')).toBeVisible({ timeout: 20000 });

        // 5. Verify "Continue" button exists
        await expect(page.getByRole('button', { name: /Continue/i })).toBeVisible();
    });
});

test.describe('Navigation', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/app');

        // Seed a valid user profile to skip onboarding
        await page.evaluate(() => {
            localStorage.setItem('intro_seen', 'true');

            const profile = {
                uid: 'test-user-123',
                name: 'Test Chef',
                allergens: [],
                conditions: [],
                cuisines: ['Indian'], // Use a valid cuisine string from types if enum
                dietaryPreference: 'Any',
                dailyTargets: { protein: 150, carbs: 250, fat: 80, calories: 2400 },
                isOnboarded: true,
                biometrics: { age: 30, gender: 'Male', weight: 80, height: 180, activityLevel: 'Moderate', goal: 'Maintain' },
                likedDishes: [],
                dislikedDishes: [],
                credits: 10
            };

            // Mimic Zustand persist structure exactly
            const state = {
                state: {
                    userProfile: profile,
                    approvedDishes: [],
                    availableDishes: [],
                    weeklyPlan: [],
                    pantryStock: []
                },
                version: 0
            };

            localStorage.setItem('tadkaSync_profile', JSON.stringify(state));
        });

        // Reload to let the app hydrate from this seed
        await page.reload();
    });

    test('should show bottom navigation tabs', async ({ page }) => {
        // Wait for hydration and main dashboard render
        // The "Deck" tab is the default view
        await expect(page.getByRole('button', { name: /Deck/i })).toBeVisible({ timeout: 15000 });

        const navButtons = page.getByRole('button', { name: /Deck|Plan|List|Pantry|Me/i });
        expect(await navButtons.count()).toBeGreaterThan(0);
    });
});

test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
        await page.route('**/api/generate', route => route.abort());
        await page.goto('/app');
        await expect(page.locator('body')).toBeVisible();
    });
});
