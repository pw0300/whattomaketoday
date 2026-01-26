import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AppView, UserProfile, Dish, DayPlan, AppState, PantryItem } from '../types';
import { addPantryItem, deductPantryItem } from '../services/pantryService';
import { STORAGE_KEYS } from '../constants';

// --- Auth Slice ---
interface AuthSlice {
    currentUser: { uid: string; name: string; photo: string } | null;
    isSyncing: boolean;
    showAuth: boolean;
    setCurrentUser: (user: AuthSlice['currentUser']) => void;
    setIsSyncing: (syncing: boolean) => void;
    setShowAuth: (show: boolean) => void;
}

// --- Navigation Slice ---
interface NavigationSlice {
    view: AppView;
    setView: (view: AppView) => void;
}

// --- Profile Slice ---
interface ProfileSlice {
    userProfile: UserProfile | null;
    setUserProfile: (profile: UserProfile | null) => void;
}

// --- Dishes Slice ---
interface DishesSlice {
    availableDishes: Dish[];
    approvedDishes: Dish[];
    fetchingMore: boolean;
    isSeeding: boolean;
    setAvailableDishes: (dishes: Dish[] | ((prev: Dish[]) => Dish[])) => void;
    setApprovedDishes: (dishes: Dish[] | ((prev: Dish[]) => Dish[])) => void;
    setFetchingMore: (fetching: boolean) => void;
    setIsSeeding: (seeding: boolean) => void;
    addApprovedDish: (dish: Dish) => void;
    removeDish: (dishId: string) => void;
}

// --- Planner Slice ---
interface PlannerSlice {
    weeklyPlan: DayPlan[];
    setWeeklyPlan: (plan: DayPlan[]) => void;
}

// --- Pantry Slice ---
interface PantrySlice {
    pantryStock: PantryItem[];
    setPantryStock: (stock: PantryItem[] | ((prev: PantryItem[]) => PantryItem[])) => void;
    togglePantryItem: (item: string) => void;
    clearPantry: () => void;
}

// --- UI Modals Slice ---
interface UISlice {
    modifyingDish: Dish | null;
    showReceipt: boolean;
    initialImportTab: 'text' | 'image' | 'video' | 'pantry' | null;
    setModifyingDish: (dish: Dish | null) => void;
    setShowReceipt: (show: boolean) => void;
    setInitialImportTab: (tab: UISlice['initialImportTab']) => void;
}

// --- Combined Store ---
export type AppStore = AuthSlice & NavigationSlice & ProfileSlice & DishesSlice & PlannerSlice & PantrySlice & UISlice & {
    // Bulk operations for cloud sync
    hydrateFromCloud: (state: AppState) => void;
    getAppState: () => AppState;
};

export const useStore = create<AppStore>()(
    persist(
        (set, get) => ({
            // --- Auth ---
            currentUser: null,
            isSyncing: false,
            showAuth: false,
            setCurrentUser: (user) => set({ currentUser: user }),
            setIsSyncing: (syncing) => set({ isSyncing: syncing }),
            setShowAuth: (show) => set({ showAuth: show }),

            // --- Navigation ---
            view: AppView.Onboarding,
            setView: (view) => set({ view }),

            // --- Profile ---
            userProfile: null,
            setUserProfile: (profile) => set({ userProfile: profile }),

            // --- Dishes ---
            availableDishes: [],
            approvedDishes: [],
            fetchingMore: false,
            isSeeding: false,
            setAvailableDishes: (dishes) =>
                set((state) => ({
                    availableDishes: typeof dishes === 'function' ? dishes(state.availableDishes) : dishes,
                })),
            setApprovedDishes: (dishes) =>
                set((state) => ({
                    approvedDishes: typeof dishes === 'function' ? dishes(state.approvedDishes) : dishes,
                })),
            setFetchingMore: (fetching) => set({ fetchingMore: fetching }),
            setIsSeeding: (seeding) => set({ isSeeding: seeding }),
            addApprovedDish: (dish) =>
                set((state) => ({ approvedDishes: [...state.approvedDishes, dish] })),
            removeDish: (dishId) =>
                set((state) => ({
                    approvedDishes: state.approvedDishes.filter((d) => d.id !== dishId),
                })),

            // --- Planner ---
            weeklyPlan: [],
            setWeeklyPlan: (plan) => set({ weeklyPlan: plan }),

            // --- Pantry ---
            pantryStock: [],
            setPantryStock: (stock) =>
                set((state) => ({
                    pantryStock: typeof stock === 'function' ? stock(state.pantryStock) : stock,
                })),
            togglePantryItem: (itemName) =>
                set((state) => {
                    const exists = state.pantryStock.find(i => i.name.toLowerCase() === itemName.toLowerCase());
                    if (exists) {
                        return { pantryStock: deductPantryItem(state.pantryStock, exists.id) };
                    } else {
                        return { pantryStock: addPantryItem(state.pantryStock, { name: itemName }) };
                    }
                }),
            clearPantry: () => set({ pantryStock: [] }),

            // --- UI ---
            modifyingDish: null,
            showReceipt: false,
            initialImportTab: null,
            setModifyingDish: (dish) => set({ modifyingDish: dish }),
            setShowReceipt: (show) => set({ showReceipt: show }),
            setInitialImportTab: (tab) => set({ initialImportTab: tab }),

            // --- Bulk Sync ---
            hydrateFromCloud: (cloudState) =>
                set({
                    userProfile: cloudState.profile,
                    approvedDishes: cloudState.approvedDishes,
                    weeklyPlan: cloudState.weeklyPlan,
                    pantryStock: cloudState.pantryStock,
                    view: AppView.Swipe,
                }),
            getAppState: () => {
                const state = get();
                return {
                    profile: state.userProfile,
                    approvedDishes: state.approvedDishes,
                    weeklyPlan: state.weeklyPlan,
                    pantryStock: state.pantryStock,
                };
            },
        }),
        {
            name: STORAGE_KEYS.PROFILE, // Key for localStorage
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                userProfile: state.userProfile,
                // AGGRESSIVE CLAMP: Only keep last 20 approved dishes to prevent quota bomb
                approvedDishes: state.approvedDishes.slice(-20),
                // Only keep actual current swipe deck, max 5 items
                availableDishes: state.availableDishes.slice(0, 5),
                weeklyPlan: state.weeklyPlan,
                pantryStock: state.pantryStock,
            }),
            onRehydrateStorage: () => (state, error) => {
                if (error) {
                    console.error('[useStore] Rehydration Failed:', error);
                    localStorage.removeItem(STORAGE_KEYS.PROFILE); // Emergency self-heal
                } else {
                    console.log('[useStore] Rehydrated from localStorage');
                }
            },
        }
    )
);
