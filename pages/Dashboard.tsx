import React, { useEffect, useMemo } from 'react';
import { AppView, UserProfile, Dish, SwipeDirection } from '../types';
import { INITIAL_DISHES } from '../constants';
import { generateNewDishes, generateNewDishesProgressive } from '../services/geminiService';
import { filterStarterRecipes } from '../data/starterRecipes';
import {
    syncStateToCloud,
    fetchCloudState,
    signInWithGoogle,
    reconcileGuestToUser,
    onAuthStateChanged,
    logout
} from '../services/firebaseService';
import { addPantryItem, deductPantryItem } from '../services/pantryService';
import { useStore } from '../store/useStore';
import IntroWalkthrough from '../components/IntroWalkthrough';
import Onboarding from '../components/Onboarding';
import SwipeDeck from '../components/SwipeDeck';
import WeeklyPlanner from '../components/WeeklyPlanner';
import GroceryList from '../components/GroceryList';
import PantryView from '../components/PantryView';
import ProfileView from '../components/ProfileView';
import DishModal from '../components/DishModal';
import Receipt from '../components/Receipt';
import CookView from '../components/CookView';
import AuthOverlay from '../components/AuthOverlay';
import CuratingScreen from '../components/CuratingScreen';
import { Layers, LayoutGrid, ClipboardList, Package, Settings, Loader2, User, LogOut, BookOpen } from 'lucide-react';
import FirebaseStatus from '../components/debug/FirebaseStatus';
import NavDock from '../components/NavDock';
import SEO from '../components/SEO';
import BlogView from '../components/BlogView';
import { motion, AnimatePresence } from 'framer-motion';

const Dashboard: React.FC = () => {
    // --- Zustand Store ---
    const {
        currentUser, setCurrentUser,
        isSyncing, setIsSyncing,
        showAuth, setShowAuth,
        view, setView,
        userProfile, setUserProfile,
        availableDishes, setAvailableDishes,
        approvedDishes, setApprovedDishes,
        weeklyPlan, setWeeklyPlan,
        pantryStock, setPantryStock, togglePantryItem, clearPantry,
        fetchingMore, setFetchingMore,
        isSeeding, setIsSeeding,
        modifyingDish, setModifyingDish,
        showReceipt, setShowReceipt,
        initialImportTab, setInitialImportTab,
        hydrateFromCloud, getAppState,
    } = useStore();

    // Generate or retrieve session ID for anonymous users
    const [sessionId] = React.useState(() => {
        const existing = localStorage.getItem('session_id');
        if (existing) return existing;
        const newId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('session_id', newId);
        return newId;
    });

    const userId = React.useMemo(() => currentUser?.uid || sessionId, [currentUser, sessionId]);

    // Initialize Auth & Local State
    useEffect(() => {
        const unsub = onAuthStateChanged(async (firebaseUser) => {
            if (firebaseUser) {
                setCurrentUser({
                    uid: firebaseUser.uid,
                    name: firebaseUser.displayName || 'Chef',
                    photo: firebaseUser.photoURL || ''
                });
                const cloudData = await fetchCloudState(firebaseUser.uid);
                if (cloudData) {
                    hydrateFromCloud(cloudData);
                }
            }
        });

        const init = async () => {
            try {
                // Zustand persist handles profile loading, but we check intro state here
                const introSeen = localStorage.getItem('intro_seen');

                // If Zustand has a profile (from persist), go to Swipe
                if (userProfile) {
                    setView(AppView.Swipe);
                } else if (!introSeen) {
                    setView(AppView.Intro);
                } else {
                    setView(AppView.Onboarding);
                }

                // Seed initial dishes if empty
                if (availableDishes.length === 0) {
                    setAvailableDishes(INITIAL_DISHES);
                }
            } catch (e) {
                console.error("Init Error", e);
            }
        };
        init();
        return () => unsub();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Safety Lag Fix: Validate deck when profile changes
    useEffect(() => {
        if (!userProfile) return;

        const validateDeck = (profile: UserProfile, dishes: Dish[]) => {
            return dishes.filter(dish => {
                // Check allergens - look in dish.allergens array
                const hasUnsafeAllergen = profile.allergens.some(allergen =>
                    dish.allergens?.includes(allergen)
                );

                // Check dietary preference - look in dish.tags for diet info
                const dietMismatch =
                    (profile.dietaryPreference === 'Vegetarian' && dish.tags?.includes('Non-Veg')) ||
                    (profile.dietaryPreference === 'Vegan' && (dish.tags?.includes('Non-Veg') || dish.ingredients?.some(i => i.category === 'Dairy')));

                return !hasUnsafeAllergen && !dietMismatch;
            });
        };

        setAvailableDishes(prev => validateDeck(userProfile, prev));
    }, [userProfile?.allergens, userProfile?.dietaryPreference]);

    // Sync Bridge: Push state to cloud when user is logged in
    useEffect(() => {
        if (currentUser && userProfile) {
            const state = getAppState();
            syncStateToCloud(currentUser.uid, state);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [approvedDishes, weeklyPlan, pantryStock, userProfile, currentUser]);

    const handleAuth = React.useCallback(async () => {
        setIsSyncing(true);
        try {
            const user = await signInWithGoogle();
            const cloudData = await fetchCloudState(user.uid);
            const currentLocal = getAppState();
            const reconciled = reconcileGuestToUser(currentLocal, cloudData);

            hydrateFromCloud(reconciled);
            setCurrentUser(user);
            setShowAuth(false);
            setView(AppView.Swipe);
        } catch (e) {
            console.error("Auth failed", e);
        } finally {
            setIsSyncing(false);
        }
    }, [getAppState, hydrateFromCloud, setCurrentUser, setIsSyncing, setShowAuth, setView]);

    const handleLogout = React.useCallback(async () => {
        await logout();
        localStorage.clear();
        setCurrentUser(null);
        window.location.reload();
    }, [setCurrentUser]);

    const handleSwipe = React.useCallback((dishId: string, direction: SwipeDirection) => {
        const dish = availableDishes.find(d => d.id === dishId);
        if (!dish) return;

        if (direction === SwipeDirection.Right || direction === SwipeDirection.Up) {
            setApprovedDishes((prev) => [...prev, { ...dish, isStaple: direction === SwipeDirection.Up }]);

            // Track Like
            import('../services/userHistoryService').then(({ trackLikedDish }) => {
                if (userId) trackLikedDish(userId, dish);
            });

            // HYDRATION: If dish lacks ingredients (Light Mode), fetch them now
            if (!dish.ingredients || dish.ingredients.length === 0) {
                import('../services/geminiService').then(({ enrichDishDetails }) => {
                    enrichDishDetails(dish, userProfile || undefined).then(fullDish => {
                        console.log("[Hydration] Fetched details for:", fullDish.name);
                        setApprovedDishes(prev => prev.map(d => d.id === dish.id ? { ...fullDish, isStaple: d.isStaple } : d));
                    });
                });
            }
        } else if (direction === SwipeDirection.Left) {
            // Track Dislike
            import('../services/userHistoryService').then(({ trackDislikedDish }) => {
                if (userId) trackDislikedDish(userId, dish);
            });

            if (userProfile) {
                // Feedback Loop: Track dislikes in profile too (legacy/redundant but keeps existing logic)
                const updatedProfile = {
                    ...userProfile,
                    dislikedDishes: [...(userProfile.dislikedDishes || []), dish.name]
                };
                setUserProfile(updatedProfile);
            }
        }

        // FIX: Remove swiped dish from availableDishes to keep SwipeDeck activeIndex in sync
        setAvailableDishes(prev => prev.filter(d => d.id !== dishId));

        // Recalculate unswiped based on new availableDishes (after removal)
        const remainingAfterSwipe = availableDishes.length - 1; // -1 for the dish we just swiped

        // AGGRESSIVE Prefetching: Trigger when < 5 cards left. Use Progressive for instant display.
        if (remainingAfterSwipe < 5 && !fetchingMore && userProfile) {
            setFetchingMore(true);
            generateNewDishesProgressive(3, userProfile, (newDish) => {
                // Each dish appears instantly as it arrives - DEDUP by ID AND NAME
                setAvailableDishes((prev) => {
                    // Skip if already in available (by ID or name)
                    if (prev.some(d => d.id === newDish.id || d.name.toLowerCase() === newDish.name.toLowerCase())) return prev;
                    // Skip if already approved/liked (by name)
                    if (approvedDishes.some(d => d.name.toLowerCase() === newDish.name.toLowerCase())) return prev;
                    return [...prev, newDish];
                });
            }, 'Explorer').finally(() => setFetchingMore(false));
        }
    }, [availableDishes, approvedDishes, fetchingMore, setApprovedDishes, setAvailableDishes, setFetchingMore, userId, userProfile, setUserProfile]);

    const handleIntroComplete = React.useCallback(() => {
        localStorage.setItem('intro_seen', 'true');
        setView(AppView.Onboarding);
    }, [setView]);

    // === NEW: Curating Screen State ===
    const [curatingDishCount, setCuratingDishCount] = React.useState(0);
    const [recentDishName, setRecentDishName] = React.useState<string | undefined>();
    const [curatingProfile, setCuratingProfile] = React.useState<UserProfile | null>(null);

    const handleOnboardingComplete = React.useCallback(async (profile: UserProfile) => {
        setUserProfile(profile);
        setCuratingProfile(profile);

        // Get filtered starter recipes
        const safeStarterDishes = filterStarterRecipes({
            dietaryPreference: profile.dietaryPreference,
            allergens: profile.allergens,
            cuisines: profile.cuisines
        }).filter(d => !approvedDishes.some(ad => ad.id === d.id));

        // Prepare starter dishes
        const initialDishes = safeStarterDishes.slice(0, 5);

        // Reset state for progressive loading
        setAvailableDishes([]);
        setCuratingDishCount(0);
        setView(AppView.Curating);

        // Calculate needed AI dishes
        const TARGET_DISHES = 10;
        const neededFromAI = Math.max(0, TARGET_DISHES - initialDishes.length);

        // 1. Progressively load starter dishes (simulate "finding" them)
        const timers: NodeJS.Timeout[] = [];
        initialDishes.forEach((dish, index) => {
            const timer = setTimeout(() => {
                setAvailableDishes(prev => {
                    // Dedup just in case
                    if (prev.some(d => d.id === dish.id)) return prev;
                    return [...prev, dish];
                });
                setCuratingDishCount(prev => prev + 1);
                setRecentDishName(dish.name);
            }, (index + 1) * 800); // 800ms delay per starter dish
            timers.push(timer);
        });

        // Cleanup timers if component unmounts or dependency changes
        return () => timers.forEach(clearTimeout);

        // 2. Start AI generation in parallel (after a small head start)
        if (neededFromAI > 0) {
            // Slight delay before AI kicks in to let user read "Analyzing..."
            setTimeout(() => {
                generateNewDishesProgressive(
                    neededFromAI,
                    profile,
                    (newDish) => {
                        // Update state as each dish arrives - DEDUP by ID AND NAME
                        setAvailableDishes(prev => {
                            // Skip if already in available (by ID or name)
                            if (prev.some(d => d.id === newDish.id || d.name.toLowerCase() === newDish.name.toLowerCase())) return prev;
                            return [...prev, newDish];
                        });
                        setCuratingDishCount(prev => prev + 1);
                        setRecentDishName(newDish.name);
                    },
                    'Explorer'
                ).catch(e => console.error("[Curating] Generation error:", e));
            }, 2000);
        }
    }, [approvedDishes, setAvailableDishes, setCuratingDishCount, setRecentDishName, setUserProfile, setCuratingProfile, setView]);

    const handleCuratingComplete = React.useCallback(() => {
        setView(AppView.Swipe);
        setCuratingProfile(null);
    }, [setView, setCuratingProfile]);

    const isCookView = useMemo(() => new URLSearchParams(window.location.search).get('view') === 'cook', []);
    if (isCookView) return <CookView />;

    if (view === AppView.Intro) return <IntroWalkthrough onComplete={handleIntroComplete} />;

    if (isSeeding) return <div className="h-screen flex flex-col items-center justify-center bg-[#F8F5F2] font-mono text-xs text-[#1A4D2E]"><Loader2 className="animate-spin mb-4" />Creating your menu...</div>;
    if (!userProfile || view === AppView.Onboarding) return <Onboarding onComplete={handleOnboardingComplete} />;

    // NEW: Curating Screen after onboarding
    if (view === AppView.Curating) {
        return (
            <CuratingScreen
                dishesLoaded={curatingDishCount}
                targetDishes={10}
                recentDishName={recentDishName}
                userCuisines={curatingProfile?.cuisines || userProfile?.cuisines}
                onComplete={handleCuratingComplete}
            />
        );
    }

    return (
        <div className="h-screen flex flex-col bg-background text-ink overflow-hidden selection:bg-brand-100 selection:text-brand-900 font-sans">
            <SEO title="My Kitchen" />

            {/* Header: Clean & Minimal - Glass Effect */}
            <div className="absolute top-0 w-full px-6 py-4 flex justify-between items-center z-50 pointer-events-none">
                <div className="pointer-events-auto flex items-center gap-3">
                    <span className="font-display text-2xl font-black tracking-tight text-ink bg-clip-text text-transparent bg-gradient-to-r from-ink to-ink-light">TadkaSync.</span>
                </div>

                <div className="pointer-events-auto">
                    <button
                        onClick={() => currentUser ? handleLogout() : setShowAuth(true)}
                        onTouchEnd={(e) => {
                            e.preventDefault();
                            currentUser ? handleLogout() : setShowAuth(true);
                        }}
                        className="bg-white/50 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full shadow-premium hover:shadow-premium-hover hover:bg-white transition-all flex items-center gap-2 group"
                    >
                        {currentUser ? (
                            <>
                                <img src={currentUser.photo} className="w-6 h-6 rounded-full border border-white shadow-sm" alt="Profile" />
                                <LogOut size={14} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                            </>
                        ) : (
                            <span className="font-display text-xs font-bold uppercase tracking-wider text-ink-light group-hover:text-brand-600">Sign In</span>
                        )}
                    </button>
                </div>
            </div>

            <div className="flex-1 relative overflow-hidden pt-20 pb-28">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={view}
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 1.02 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} // Apple-style easing
                        className="h-full w-full max-w-md mx-auto relative"
                    >
                        {view === AppView.Swipe && (
                            <SwipeDeck
                                dishes={availableDishes.filter(d => !approvedDishes.some(ad => ad.id === d.id))}
                                approvedDishes={approvedDishes}
                                approvedCount={approvedDishes.length}
                                onSwipe={handleSwipe}
                                onModify={setModifyingDish}
                                onImport={(d) => { setAvailableDishes(prev => [d, ...prev]); setApprovedDishes(prev => [...prev, d]); }}
                                onDelete={(id) => setApprovedDishes(prev => prev.filter(d => d.id !== id))}
                                pantryStock={pantryStock}
                                userProfile={userProfile}
                                fetchingMore={fetchingMore}
                                initialImportTab={initialImportTab}
                            />
                        )}
                        {view === AppView.Planner && <WeeklyPlanner approvedDishes={approvedDishes} userProfile={userProfile} onPlanUpdate={setWeeklyPlan} onRequestMoreDishes={() => { }} onPublish={() => setShowReceipt(true)} pantryStock={pantryStock} onDishClick={(dish) => setModifyingDish(dish)} />}
                        {view === AppView.Shopping && <GroceryList plan={weeklyPlan} pantryStock={pantryStock} onToggleItem={(item) => {
                            togglePantryItem(item);
                        }} onPrintTicket={() => setShowReceipt(true)} />}
                        {view === AppView.Pantry && <PantryView pantryStock={pantryStock} onToggleItem={togglePantryItem} onBatchAdd={(items) => setPantryStock(prev => items.reduce((acc, item) => addPantryItem(acc, { name: item }), prev))} onClear={clearPantry} onCookFromPantry={() => { setInitialImportTab('pantry'); setView(AppView.Swipe); }} />}
                        {view === AppView.Journal && <BlogView />}
                        {view === AppView.Profile && <ProfileView userProfile={userProfile} onUpdateProfile={setUserProfile} onFactoryReset={() => { localStorage.clear(); window.location.reload(); }} />}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Bottom Dock: Premium Floating Glass */}
            {/* BOUNTY FIX: Extracted to component */}
            <NavDock view={view} setView={setView} />

            {showAuth && <AuthOverlay onLogin={handleAuth} onClose={() => setShowAuth(false)} loading={isSyncing} />}

            {
                modifyingDish && (
                    <DishModal
                        dish={modifyingDish}
                        userProfile={userProfile || undefined}
                        onClose={() => setModifyingDish(null)}
                        onSave={(id, notes, servings) => {
                            setApprovedDishes(prev => prev.map(d => d.id === id ? { ...d, userNotes: notes, servings } : d));
                            setModifyingDish(null);
                        }}
                        onUpdate={(updatedDish) => {
                            setApprovedDishes(prev => prev.map(d => d.id === updatedDish.id ? updatedDish : d));
                            setAvailableDishes(prev => prev.map(d => d.id === updatedDish.id ? updatedDish : d));
                            setModifyingDish(updatedDish);
                        }}
                        onCook={(dish, usedIngredients) => {
                            // Find pantry items that match used ingredients and remove them
                            setPantryStock(prev => {
                                let currentStock = [...prev];
                                usedIngredients.forEach(ingredientName => {
                                    const match = currentStock.find(i => i.name.toLowerCase() === ingredientName.toLowerCase());
                                    if (match) {
                                        currentStock = deductPantryItem(currentStock, match.id);
                                    }
                                });
                                return currentStock;
                            });

                            // BOUNTY FIX: Infinite Credit Exploit
                            const now = Date.now();
                            const timeSinceLastCook = now - (dish.lastCooked || 0);
                            const COOLDOWN = 12 * 60 * 60 * 1000; // 12 Hours

                            if (timeSinceLastCook > COOLDOWN) {
                                // Award credits only if outside cooldown
                                if (userProfile) {
                                    setUserProfile({ ...userProfile, credits: (userProfile.credits || 0) + 3 });
                                }
                                // Update lastCooked on the dish
                                setApprovedDishes(prev => prev.map(d => d.id === dish.id ? { ...d, lastCooked: now } : d));
                            } else {
                                console.log(`[Economy] Credit farming blocked. Cooldown active for: ${dish.name}`);
                            }

                            setModifyingDish(null);
                        }}
                    />
                )
            }

            {
                showReceipt && (
                    <Receipt
                        plan={weeklyPlan}
                        missingIngredients={[]}
                        onClose={() => setShowReceipt(false)}
                        onSend={() => {
                            alert("Order Transmitted (Simulated)");
                            setShowReceipt(false);
                        }}
                    />
                )
            }
            {/* Debug Tool */}
            {/* <FirebaseStatus /> -- Hidden for production feel */}
        </div >
    );
};

export default Dashboard;
