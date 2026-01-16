
import React, { useEffect, useMemo } from 'react';
import { AppView, UserProfile, Dish, SwipeDirection, AppState } from './types';
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
import { useStore } from './store/useStore';
import IntroWalkthrough from './components/IntroWalkthrough';
import Onboarding from './components/Onboarding';
import SwipeDeck from './components/SwipeDeck';
import WeeklyPlanner from './components/WeeklyPlanner';
import GroceryList from './components/GroceryList';
import PantryView from './components/PantryView';
import ProfileView from './components/ProfileView';
import DishModal from './components/DishModal';
import Receipt from './components/Receipt';
import CookView from './components/CookView';
import AuthOverlay from './components/AuthOverlay';
import ViralFeed from './components/ViralFeed';
import { Layers, LayoutGrid, ClipboardList, Package, Settings, Loader2, User, Flame } from 'lucide-react';

const App: React.FC = () => {
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

  // Sync Bridge: Push state to cloud when user is logged in
  useEffect(() => {
    if (currentUser && userProfile) {
      const state = getAppState();
      syncStateToCloud(currentUser.uid, state);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approvedDishes, weeklyPlan, pantryStock, userProfile, currentUser]);

  const handleAuth = async () => {
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
      setApprovedDishes((prev) => [...prev, { ...dish, isStaple: direction === SwipeDirection.Up }]);
    }

    const unswiped = availableDishes.filter(d => !approvedDishes.some(ad => ad.id === d.id)).length;

    // Aggressive Prefetching: Trigger when < 4 cards left
    if (unswiped < 4 && !fetchingMore && userProfile) {
      setFetchingMore(true);
      generateNewDishes(6, userProfile, 'Explorer')
        .then(newDishes => {
          setAvailableDishes((prev) => {
            const unique = newDishes.filter(nd => !prev.some(pd => pd.id === nd.id));
            return [...prev, ...unique];
          });
          setFetchingMore(false);
        })
        .catch(() => setFetchingMore(false));
    }
  };

  const handleIntroComplete = () => {
    localStorage.setItem('intro_seen', 'true');
    setView(AppView.Onboarding);
  };

  const handleOnboardingComplete = async (profile: UserProfile) => {
    setUserProfile(profile);
    setIsSeeding(true);
    try {
      const dishes = await generateNewDishes(6, profile, 'Explorer');
      setAvailableDishes(dishes);
    } catch (e) {
      console.error("Initial Gen Error", e);
    } finally {
      setIsSeeding(false);
      setView(AppView.Swipe);
    }
  };

  const isCookView = useMemo(() => new URLSearchParams(window.location.search).get('view') === 'cook', []);
  if (isCookView) return <CookView />;

  if (view === AppView.Intro) return <IntroWalkthrough onComplete={handleIntroComplete} />;

  if (isSeeding) return <div className="h-screen flex flex-col items-center justify-center bg-paper font-mono text-xs text-ink"><Loader2 className="animate-spin mb-4" />loading menu...</div>;
  if (!userProfile || view === AppView.Onboarding) return <Onboarding onComplete={handleOnboardingComplete} />;

  return (
    <div className="h-screen flex flex-col bg-paper overflow-hidden text-ink">
      <div className="bg-paper px-4 py-2 border-b-2 border-ink flex justify-between items-center z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${currentUser ? 'bg-brand-500' : 'bg-gray-300'} animate-pulse`} />
          <span className="font-mono text-[9px] uppercase tracking-widest font-black opacity-40">
            {currentUser ? 'Online' : 'Offline'}
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
        {view === AppView.Viral && (
          <ViralFeed
            onAddToDeck={(dish) => {
              setAvailableDishes(prev => {
                const exists = prev.find(d => d.id === dish.id);
                return exists ? prev : [dish, ...prev];
              });
              setApprovedDishes(prev => {
                const exists = prev.find(d => d.id === dish.id);
                return exists ? prev : [dish, ...prev];
              });
            }}
          />
        )}
        {view === AppView.Planner && <WeeklyPlanner approvedDishes={approvedDishes} userProfile={userProfile} onPlanUpdate={setWeeklyPlan} onRequestMoreDishes={() => { }} onPublish={() => setShowReceipt(true)} pantryStock={pantryStock} />}
        {view === AppView.Shopping && <GroceryList plan={weeklyPlan} pantryStock={pantryStock} onToggleItem={togglePantryItem} onPrintTicket={() => setShowReceipt(true)} />}
        {view === AppView.Pantry && <PantryView pantryStock={pantryStock} onToggleItem={togglePantryItem} onBatchAdd={(items) => setPantryStock(prev => [...new Set([...prev, ...items])])} onClear={clearPantry} onCookFromPantry={() => { setInitialImportTab('pantry'); setView(AppView.Swipe); }} />}
        {view === AppView.Profile && <ProfileView userProfile={userProfile} onUpdateProfile={setUserProfile} onFactoryReset={() => { localStorage.clear(); window.location.reload(); }} />}
      </div>

      <div className="h-20 bg-paper border-t-2 border-ink flex justify-around items-center px-1 shrink-0 safe-area-bottom z-40">
        {[
          { v: AppView.Swipe, l: 'Deck', i: Layers },
          { v: AppView.Viral, l: 'Feed', i: Flame, highlight: true },
          { v: AppView.Planner, l: 'Plan', i: LayoutGrid },
          { v: AppView.Shopping, l: 'List', i: ClipboardList },
          { v: AppView.Pantry, l: 'Pantry', i: Package },
          { v: AppView.Profile, l: 'Me', i: Settings },
        ].map(item => (
          <button
            key={item.v}
            onClick={() => setView(item.v)}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${view === item.v ? 'bg-ink text-paper shadow-hard-sm' : 'text-gray-500'} ${(item as any).highlight && view !== item.v ? 'text-brand-500' : ''}`}
          >
            <item.i size={20} className={(item as any).highlight && view !== item.v ? 'animate-pulse' : ''} />
            <span className="font-mono text-[9px] font-bold uppercase">{item.l}</span>
          </button>
        ))}
      </div>

      {showAuth && <AuthOverlay onLogin={handleAuth} onClose={() => setShowAuth(false)} loading={isSyncing} />}

      {
        modifyingDish && (
          <DishModal
            dish={modifyingDish}
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
              setPantryStock(prev => prev.filter(item => !usedIngredients.includes(item)));
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
    </div >
  );
};

export default App;
