/**
 * API client configuration and utilities
 */

export const API_BASE = '/api';

export const apiEndpoints = {
    generate: `${API_BASE}/generate`,
} as const;

/**
 * Configuration for API retry behavior
 */
export const apiConfig = {
    maxRetries: 3,
    initialDelayMs: 1000,
    backoffFactor: 2,
    timeoutMs: 30000,
};

/**
 * Standard headers for API requests
 */
export const getApiHeaders = (): HeadersInit => ({
    'Content-Type': 'application/json',
});

/**
 * Type-safe fetch wrapper with timeout support
 */
export async function fetchWithTimeout<T>(
    url: string,
    options: RequestInit = {},
    timeoutMs: number = apiConfig.timeoutMs
): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } finally {
        clearTimeout(timeoutId);
    }
}
