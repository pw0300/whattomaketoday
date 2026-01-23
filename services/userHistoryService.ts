import { db } from './firebaseService';
import { collection, doc, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Dish } from '../types';
import { contextManager } from './contextManagerService';

const USER_HISTORY_COLLECTION = 'user_histories';

export interface UserHistory {
    userId: string;
    shownDishNames: string[]; // Track dish names shown to user
    likedDishes: Array<{ name: string; cuisine: string; tags: string[]; timestamp: Date }>; // Liked dishes with metadata
    dislikedDishes: Array<{ name: string; cuisine: string; tags: string[]; timestamp: Date }>; // Disliked dishes with metadata
    lastUpdated: Date;
}

/**
 * Track a dish as "shown" to the user
 * This prevents showing the same dish repeatedly
 */
export const trackShownDish = async (userId: string, dish: Dish): Promise<void> => {
    if (!db || !userId) return;

    try {
        const userHistoryRef = doc(db, USER_HISTORY_COLLECTION, userId);

        await setDoc(userHistoryRef, {
            shownDishNames: arrayUnion(dish.name),
            lastUpdated: new Date()
        }, { merge: true });

        console.log(`[History] Tracked shown dish: ${dish.name}`);
    } catch (e) {
        console.warn('[History] Failed to track shown dish:', e);
    }
};

/**
 * Track user liking a dish (swiped right or up)
 */
export const trackLikedDish = async (userId: string, dish: Dish): Promise<void> => {
    if (!db || !userId) return;

    try {
        const userHistoryRef = doc(db, USER_HISTORY_COLLECTION, userId);

        await setDoc(userHistoryRef, {
            likedDishes: arrayUnion({
                name: dish.name,
                cuisine: dish.cuisine,
                tags: dish.tags || [],
                timestamp: new Date()
            }),
            lastUpdated: new Date()
        }, { merge: true });

        console.log(`[History] Tracked liked dish: ${dish.name}`);
        contextManager.recordEvent({ type: 'swipe_right', dish, timestamp: Date.now() });
    } catch (e) {
        console.warn('[History] Failed to track liked dish:', e);
    }
};

/**
 * Track user disliking a dish (swiped left)
 */
export const trackDislikedDish = async (userId: string, dish: Dish): Promise<void> => {
    if (!db || !userId) return;

    try {
        const userHistoryRef = doc(db, USER_HISTORY_COLLECTION, userId);

        await setDoc(userHistoryRef, {
            dislikedDishes: arrayUnion({
                name: dish.name,
                cuisine: dish.cuisine,
                tags: dish.tags || [],
                timestamp: new Date()
            }),
            lastUpdated: new Date()
        }, { merge: true });

        console.log(`[History] Tracked disliked dish: ${dish.name}`);
        contextManager.recordEvent({ type: 'swipe_left', dish, timestamp: Date.now() });
    } catch (e) {
        console.warn('[History] Failed to track disliked dish:', e);
    }
};

/**
 * Get list of dish names already shown to this user
 */
export const getShownDishNames = async (userId: string): Promise<string[]> => {
    if (!db || !userId) return [];

    try {
        const userHistoryRef = doc(db, USER_HISTORY_COLLECTION, userId);
        const snapshot = await getDoc(userHistoryRef);

        if (snapshot.exists()) {
            const data = snapshot.data();
            return data.shownDishNames || [];
        }

        return [];
    } catch (e) {
        console.warn('[History] Failed to get shown dishes:', e);
        return [];
    }
};

/**
 * Get user's full history including likes and dislikes
 */
export const getUserHistory = async (userId: string): Promise<UserHistory | null> => {
    if (!db || !userId) return null;

    try {
        const userHistoryRef = doc(db, USER_HISTORY_COLLECTION, userId);
        const snapshot = await getDoc(userHistoryRef);

        if (snapshot.exists()) {
            return snapshot.data() as UserHistory;
        }

        return null;
    } catch (e) {
        console.warn('[History] Failed to get user history:', e);
        return null;
    }
};

/**
 * Analyze user preferences from history
 * Returns patterns like preferred cuisines, tags, etc.
 */
export const analyzeUserPreferences = (history: UserHistory | null): string => {
    if (!history || !history.likedDishes || history.likedDishes.length === 0) {
        return '';
    }

    // Extract preferred cuisines
    const cuisineCounts: Record<string, number> = {};
    history.likedDishes.forEach(dish => {
        cuisineCounts[dish.cuisine] = (cuisineCounts[dish.cuisine] || 0) + 1;
    });

    const topCuisines = Object.entries(cuisineCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([cuisine]) => cuisine);

    // Extract preferred tags
    const tagCounts: Record<string, number> = {};
    history.likedDishes.forEach(dish => {
        dish.tags?.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
    });

    const topTags = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([tag]) => tag);

    // Build preference summary
    let summary = '';

    if (topCuisines.length > 0) {
        summary += `\nUSER LOVES: ${topCuisines.join(', ')} cuisine.`;
    }

    if (topTags.length > 0) {
        summary += `\nPREFERRED QUALITIES: ${topTags.join(', ')}.`;
    }

    // Extract dislikes
    if (history.dislikedDishes && history.dislikedDishes.length > 0) {
        const dislikedCuisines = [...new Set(history.dislikedDishes.map(d => d.cuisine))].slice(0, 3);
        if (dislikedCuisines.length > 0) {
            summary += `\nAVOID: ${dislikedCuisines.join(', ')} dishes.`;
        }
    }

    return summary;
};

/**
 * Check if a dish has already been shown to the user
 */
export const hasSeenDish = (dishName: string, shownDishes: string[]): boolean => {
    return shownDishes.some(shown =>
        shown.toLowerCase().trim() === dishName.toLowerCase().trim()
    );
};

/**
 * Filter dishes to exclude already-shown ones
 */
export const filterUnseenDishes = (dishes: Dish[], shownDishNames: string[]): Dish[] => {
    // Optimization: Create a normalized Set once (O(M)) to allow O(1) lookups
    // This reduces overall complexity from O(N*M) to O(N + M)
    const seenSet = new Set(shownDishNames.map(s => s.toLowerCase().trim()));

    return dishes.filter(dish => !seenSet.has(dish.name.toLowerCase().trim()));
};
