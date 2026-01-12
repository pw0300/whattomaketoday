
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock dependencies
vi.mock('./services/firebaseService', () => ({
    onAuthStateChanged: vi.fn(() => () => { }),
    fetchCloudState: vi.fn(),
    syncStateToCloud: vi.fn()
}));

vi.mock('./services/geminiService', () => ({
    generateNewDishes: vi.fn().mockResolvedValue([])
}));

describe('App', () => {
    it('renders without crashing', () => {
        // Basic render test
        // Note: We might need to wrap in Context providers if added later
        render(<App />);
        // Check for Onboarding element or loading state
        // Since local storage is empty in test env, it should show Onboarding
        expect(screen.getByText(/Kitchen System Setup/i)).toBeDefined();
    });
});
