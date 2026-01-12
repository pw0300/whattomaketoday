
import React, { useState, useEffect, useMemo } from 'react';
import { AppView, UserProfile, Dish, SwipeDirection, DayPlan, AppState } from './types';
import { INITIAL_DISHES, STORAGE_KEYS } from './constants';
import { generateNewDishes } from './services/geminiService';
import {
  syncStateToCloud,
  fetchCloudState,
  signInWithGoogle,
  reconcileGuestToUser,
  onAuthStateChanged,
  logout
} from './services/firebaseService';
import Onboarding from './components/Onboarding';
import IntroWalkthrough from './components/IntroWalkthrough';
import SwipeDeck from './components/SwipeDeck';
import WeeklyPlanner from './components/WeeklyPlanner';
import GroceryList from './components/GroceryList';
import PantryView from './components/PantryView';
import ProfileView from './components/ProfileView';
import DishModal from './components/DishModal';
import Receipt from './components/Receipt';
import CookView from './components/CookView';
import AuthOverlay from './components/AuthOverlay';
import { Layers, LayoutGrid, ClipboardList, Package, Settings, Loader2, User } from 'lucide-react';

const App: React.FC = () => {
  // Identity State
  const [currentUser, setCurrentUser] = useState<{ uid: string, name: string, photo: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  // App State
  const [view, setView] = useState<AppView>(AppView.Onboarding);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [checkingIntro, setCheckingIntro] = useState(true);
  const [showIntro, setShowIntro] = useState(false);

  // Core Data
  const [availableDishes, setAvailableDishes] = useState<Dish[]>(INITIAL_DISHES);
  const [approvedDishes, setApprovedDishes] = useState<Dish[]>([]);
  const [weeklyPlan, setWeeklyPlan] = useState<DayPlan[]>([]);
  const [pantryStock, setPantryStock] = useState<string[]>([]);

  const [isSeeding, setIsSeeding] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [modifyingDish, setModifyingDish] = useState<Dish | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [initialImportTab, setInitialImportTab] = useState<'text' | 'image' | 'video' | 'pantry' | null>(null);

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
          setUserProfile(cloudData.profile);
          setApprovedDishes(cloudData.approvedDishes);
          setWeeklyPlan(cloudData.weeklyPlan);
          setPantryStock(cloudData.pantryStock);
        }
      }
    });

    const init = async () => {
      try {
        const hasSeenIntro = localStorage.getItem(STORAGE_KEYS.INTRO);
        if (!hasSeenIntro) setShowIntro(true);

        const savedProfile = localStorage.getItem(STORAGE_KEYS.PROFILE);
        if (savedProfile) {
          const parsed = JSON.parse(savedProfile);
          // MIGRATION: Give legacy users 999 credits (Unlimited Mode)
          if (parsed.credits === undefined || parsed.credits < 999) {
            parsed.credits = 999;
            parsed.unlockedDishIds = parsed.unlockedDishIds || [];
            localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(parsed));
          }
          setUserProfile(parsed);
        }

        const savedPantry = localStorage.getItem(STORAGE_KEYS.PANTRY);
        if (savedPantry) setPantryStock(JSON.parse(savedPantry));

        if (hasSeenIntro && savedProfile) setView(AppView.Swipe);
      } finally {
        setCheckingIntro(false);
      }
    };
    init();
    return () => unsub();
  }, []);

  // Sync Bridge
  useEffect(() => {
    if (currentUser && userProfile) {
      const state: AppState = {
        profile: userProfile,
        approvedDishes,
        weeklyPlan,
        pantryStock
      };
      syncStateToCloud(currentUser.uid, state);
    }
  }, [approvedDishes, weeklyPlan, pantryStock, userProfile, currentUser]);

  const handleAuth = async () => {
    setIsSyncing(true);
    try {
      const user = await signInWithGoogle();
      const cloudData = await fetchCloudState(user.uid);

      const currentLocal: AppState = {
        profile: userProfile!,
        approvedDishes,
        weeklyPlan,
        pantryStock
      };

      const reconciled = reconcileGuestToUser(currentLocal, cloudData);

      setUserProfile(reconciled.profile);
      setApprovedDishes(reconciled.approvedDishes);
      setWeeklyPlan(reconciled.weeklyPlan);
      setPantryStock(reconciled.pantryStock);
      setCurrentUser(user);
      setShowAuth(false);
      setView(AppView.Swipe);
    } catch (e) {
      console.error("Auth failed", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setCurrentUser(null);
    window.location.reload();
  };

  const handleSwipe = (dishId: string, direction: SwipeDirection) => {
    const dish = availableDishes.find(d => d.id === dishId);
    if (!dish) return;

    if (direction === SwipeDirection.Right || direction === SwipeDirection.Up) {
      setApprovedDishes(prev => [...prev, { ...dish, isStaple: direction === SwipeDirection.Up }]);
    }

    const unswiped = availableDishes.filter(d => !approvedDishes.some(ad => ad.id === d.id)).length;
    if (unswiped < 5 && !fetchingMore && userProfile) {
      setFetchingMore(true);
      generateNewDishes(6, userProfile, 'Explorer')
        .then(newDishes => {
          setAvailableDishes(prev => {
            const unique = newDishes.filter(nd => !prev.some(pd => pd.id === nd.id));
            return [...prev, ...unique];
          });
          setFetchingMore(false);
        })
        .catch(() => setFetchingMore(false));
    }
  };

  const handleOnboardingComplete = async (profile: UserProfile) => {
    // GAMIFICATION: Start with 999 Credits (Simulated Unlimited)
    const richProfile = { ...profile, credits: 999, unlockedDishIds: [] };
    setUserProfile(richProfile);
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(richProfile));
    setIsSeeding(true);
    const dishes = await generateNewDishes(8, richProfile);
    setAvailableDishes(dishes);
    setIsSeeding(false);
    setView(AppView.Swipe);
  };

  const isCookView = useMemo(() => new URLSearchParams(window.location.search).get('view') === 'cook', []);
  if (isCookView) return <CookView />;

  if (checkingIntro) return null;
  if (showIntro) return <IntroWalkthrough onComplete={() => { setShowIntro(false); localStorage.setItem(STORAGE_KEYS.INTRO, 'true'); if (userProfile) setView(AppView.Swipe); }} />;
  if (isSeeding) return <div className="h-screen flex flex-col items-center justify-center bg-paper font-mono text-xs"><Loader2 className="animate-spin mb-4" />COMPILING HOUSEHOLD LOGIC...</div>;
  if (!userProfile || view === AppView.Onboarding) return <Onboarding onComplete={handleOnboardingComplete} />;

  return (
    <div className="h-screen flex flex-col bg-paper overflow-hidden text-ink">
      <div className="bg-paper px-4 py-2 border-b-2 border-ink flex justify-between items-center z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${currentUser ? 'bg-brand-500' : 'bg-gray-300'} animate-pulse`} />
          <span className="font-mono text-[9px] uppercase tracking-widest font-black opacity-40">
            {currentUser ? 'Cloud Sync Active' : 'Local Guest Mode'}
          </span>
        </div>
        <button
          onClick={() => currentUser ? handleLogout() : setShowAuth(true)}
          className="flex items-center gap-2 bg-white border-2 border-ink px-3 py-1.5 shadow-hard-sm active:translate-y-0.5 active:shadow-none transition-all rounded-md"
        >
          {currentUser ? (
            <img src={currentUser.photo} className="w-5 h-5 rounded-full border border-ink" alt="Profile" />
          ) : (
            <User size={14} />
          )}
          <span className="font-mono text-[10px] uppercase font-black">{currentUser ? 'Sign Out' : 'Sign In'}</span>
        </button>
      </div>

      <div className="flex-1 relative overflow-hidden">
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
        {view === AppView.Planner && <WeeklyPlanner approvedDishes={approvedDishes} userProfile={userProfile} onPlanUpdate={setWeeklyPlan} onRequestMoreDishes={() => { }} onPublish={() => setShowReceipt(true)} pantryStock={pantryStock} />}
        {view === AppView.Shopping && <GroceryList plan={weeklyPlan} pantryStock={pantryStock} onToggleItem={(item) => setPantryStock(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item])} onPrintTicket={() => setShowReceipt(true)} />}
        {view === AppView.Pantry && <PantryView pantryStock={pantryStock} onToggleItem={(item) => setPantryStock(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item])} onBatchAdd={(items) => setPantryStock(prev => [...new Set([...prev, ...items])])} onClear={() => setPantryStock([])} onCookFromPantry={() => { setInitialImportTab('pantry'); setView(AppView.Swipe); }} />}
        {view === AppView.Profile && <ProfileView userProfile={userProfile} onUpdateProfile={setUserProfile} onFactoryReset={() => { localStorage.clear(); window.location.reload(); }} />}
      </div>

      <div className="h-20 bg-paper border-t-2 border-ink flex justify-around items-center px-1 shrink-0 safe-area-bottom z-40">
        {[
          { v: AppView.Swipe, l: 'Deck', i: Layers },
          { v: AppView.Planner, l: 'Plan', i: LayoutGrid },
          { v: AppView.Shopping, l: 'List', i: ClipboardList },
          { v: AppView.Pantry, l: 'Pantry', i: Package },
          { v: AppView.Profile, l: 'Sys', i: Settings },
        ].map(item => (
          <button
            key={item.v}
            onClick={() => setView(item.v)}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${view === item.v ? 'bg-ink text-paper shadow-hard-sm' : 'text-gray-500'}`}
          >
            <item.i size={20} />
            <span className="font-mono text-[9px] font-bold uppercase">{item.l}</span>
          </button>
        ))}
      </div>

      {showAuth && <AuthOverlay onLogin={handleAuth} onClose={() => setShowAuth(false)} loading={isSyncing} />}

      {modifyingDish && (
        <DishModal
          dish={modifyingDish}
          onClose={() => setModifyingDish(null)}
          userCredits={userProfile?.credits || 0}
          isUnlocked={userProfile?.unlockedDishIds?.includes(modifyingDish.id) || false}
          onSave={(id, notes, servings) => {
            setApprovedDishes(prev => prev.map(d => d.id === id ? { ...d, userNotes: notes, servings } : d));
            setModifyingDish(null);
          }}
          onUpdate={(updatedDish) => {
            setApprovedDishes(prev => prev.map(d => d.id === updatedDish.id ? updatedDish : d));
            setAvailableDishes(prev => prev.map(d => d.id === updatedDish.id ? updatedDish : d));
            setModifyingDish(updatedDish);
          }}
          onUnlock={(dishId) => {
            if (!userProfile) return;
            // GAMIFICATION: Burn 1 Credit
            const newCredits = Math.max(0, (userProfile.credits || 0) - 1);
            const newUnlocked = [...(userProfile.unlockedDishIds || []), dishId];
            setUserProfile({ ...userProfile, credits: newCredits, unlockedDishIds: newUnlocked });
          }}
          onCook={(dish, usedIngredients) => {
            // GAMIFICATION: Earn 3 Credits
            if (userProfile) {
              const newCredits = (userProfile.credits || 0) + 3;
              setUserProfile({ ...userProfile, credits: newCredits });
            }
            // Update Pantry
            setPantryStock(prev => prev.filter(item => !usedIngredients.includes(item)));
            setModifyingDish(null);
          }}
        />
      )}

      {showReceipt && (
        <Receipt
          plan={weeklyPlan}
          missingIngredients={[]}
          onClose={() => setShowReceipt(false)}
          onSend={() => {
            alert("Order Transmitted to Kitchen Display System (Simulated)");
            setShowReceipt(false);
          }}
        />
      )}
    </div>
  );
};

export default App;
