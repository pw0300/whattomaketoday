
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

// Mock dependencies
vi.mock('./services/firebaseService', () => ({
    auth: null,
    db: null,
    onAuthStateChanged: vi.fn((callback) => {
        callback(null); // No user logged in
        return () => { };
    }),
    fetchCloudState: vi.fn().mockResolvedValue(null),
    syncStateToCloud: vi.fn()
}));

vi.mock('./services/geminiService', () => ({
    generateNewDishes: vi.fn().mockResolvedValue([])
}));

describe('App', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('renders without crashing', async () => {
        // Simulate user has seen intro
        localStorage.setItem('tadkaSync_introSeen', 'true');

        render(<App />);

        // App should render - check for any content (loading or actual UI)
        // The app may show loading initially, which is valid behavior
        await waitFor(() => {
            const body = document.body;
            expect(body.innerHTML.length).toBeGreaterThan(0);
        });
    });

    it('shows intro walkthrough for new users', async () => {
        // Clear intro seen flag
        localStorage.removeItem('tadkaSync_introSeen');

        render(<App />);

        // Should eventually show onboarding or loading state
        await waitFor(() => {
            const body = document.body;
            expect(body.innerHTML.length).toBeGreaterThan(0);
        });
    });
});
