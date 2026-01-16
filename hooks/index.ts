import { useState, useEffect } from 'react';

/**
 * Hook to persist state to localStorage with automatic sync
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    const setValue = (value: T | ((prev: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.warn(`Error setting localStorage key "${key}":`, error);
        }
    };

    return [storedValue, setValue];
}

/**
 * Hook to track screen wake lock for cooking mode
 */
export function useWakeLock() {
    const [isSupported, setIsSupported] = useState(false);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        setIsSupported('wakeLock' in navigator);
    }, []);

    const request = async () => {
        if (!isSupported) return;
        try {
            const wakeLock = await (navigator as any).wakeLock.request('screen');
            setIsActive(true);
            wakeLock.addEventListener('release', () => setIsActive(false));
            return wakeLock;
        } catch (err) {
            console.warn('Wake Lock request failed:', err);
        }
    };

    return { isSupported, isActive, request };
}

/**
 * Hook for debouncing a value
 */
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Hook for checking if component is mounted (avoids state updates on unmounted components)
 */
export function useIsMounted() {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        return () => setIsMounted(false);
    }, []);

    return isMounted;
}
