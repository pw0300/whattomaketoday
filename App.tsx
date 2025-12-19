import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AppView, UserProfile, Dish, SwipeDirection, DayPlan, VibeMode, Ingredient } from './types';
import { INITIAL_DISHES, STORAGE_KEYS } from './constants';
import { generateNewDishes } from './services/geminiService';
import Onboarding from './components/Onboarding';
import IntroWalkthrough from './components/IntroWalkthrough';
import SwipeDeck from './components/SwipeDeck';
import WeeklyPlanner from './components/WeeklyPlanner';
import GroceryList from './components/GroceryList';
import PantryView from './components/PantryView';
import ProfileView from './components/ProfileView';
import DishModal from './components/DishModal';
import Receipt from './components/Receipt';
import CookView from './components/CookView'; // Import the new view
import { LayoutGrid, Layers, ClipboardList, Package, Settings, Loader2, AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  // --- COOK VIEW ROUTING CHECK ---
  // If the URL has ?view=cook, we render the CookView immediately and bypass everything else.
  // In a real app, this would be a proper route.
  const isCookView = useMemo(() => {
      const params = new URLSearchParams(window.location.search);
      return params.get('view') === 'cook';
  }, []);

  if (isCookView) {
      return <CookView />;
  }

  // --- STANDARD APP STATE ---
  const [view, setView] = useState<AppView>(AppView.Onboarding);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  // Intro State
  const [showIntro, setShowIntro] = useState(false);
  const [checkingIntro, setCheckingIntro] = useState(true);
  
  // Data
  const [availableDishes, setAvailableDishes] = useState<Dish[]>(INITIAL_DISHES); 
  const [approvedDishes, setApprovedDishes] = useState<Dish[]>([]); 
  const [weeklyPlan, setWeeklyPlan] = useState<DayPlan[]>([]);
  const [pantryStock, setPantryStock] = useState<string[]>([]);
  
  // Undo Stack
  const [swipeHistory, setSwipeHistory] = useState<{dish: Dish, direction: SwipeDirection}[]>([]);

  const [isSeeding, setIsSeeding] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [safetyAlert, setSafetyAlert] = useState<string | null>(null);
  
  // UI State
  const [modifyingDish, setModifyingDish] = useState<Dish | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [initialImportTab, setInitialImportTab] = useState<'text' | 'image' | 'video' | 'pantry' | null>(null);

  // Load from LocalStorage with Safety Check
  useEffect(() => {
    // Check Intro Status
    try {
        const hasSeenIntro = localStorage.getItem(STORAGE_KEYS.INTRO);
        if (!hasSeenIntro) {
            setShowIntro(true);
        }
    } catch (e) {
        console.error("Intro check failed", e);
    } finally {
        setCheckingIntro(false);
    }

    // Load Profile
    try {
      const savedProfile = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        const migratedProfile: UserProfile = {
          ...parsed,
          allergenNotes: parsed.allergenNotes || '',
          conditionNotes: parsed.conditionNotes || '',
          cuisineNotes: parsed.cuisineNotes || '',
          healthReportSummary: parsed.healthReportSummary || '',
        };
        setUserProfile(migratedProfile);
        if (localStorage.getItem(STORAGE_KEYS.INTRO)) {
            setView(AppView.Swipe);
        }
      }
    } catch (e) {
      console.error("Profile data corrupt, resetting", e);
      localStorage.removeItem(STORAGE_KEYS.PROFILE);
    }

    // Load Pantry
    try {
      const savedStock = localStorage.getItem(STORAGE_KEYS.PANTRY);
      if (savedStock) {
        setPantryStock(JSON.parse(savedStock));
      }
    } catch (e) {
      console.error("Pantry data corrupt", e);
      localStorage.removeItem(STORAGE_KEYS.PANTRY);
    }
  }, []);

  // Save Pantry Stock
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PANTRY, JSON.stringify(pantryStock));
  }, [pantryStock]);

  // HELPER: Improved Fuzzy Matcher
  // Returns true if the ingredient is likely in the pantry
  const isIngredientInStock = (recipeIngredientName: string, stock: string[]): boolean => {
      // 1. Normalize
      const normalize = (s: string) => s.toLowerCase().trim();
      
      // 2. Singularize helper (naive but effective for basic cooking terms)
      // e.g. "Onions" -> "Onion", "Tomatoes" -> "Tomato"
      const singularize = (s: string) => {
          if (s.endsWith('ies')) return s.slice(0, -3) + 'y';
          if (s.endsWith('es')) return s.slice(0, -2);
          if (s.endsWith('s') && !s.endsWith('ss')) return s.slice(0, -1);
          return s;
      };

      const target = normalize(recipeIngredientName);
      const targetSingular = singularize(target);

      return stock.some(pantryItem => {
          const item = normalize(pantryItem);
          const itemSingular = singularize(item);

          // Exact Match
          if (item === target) return true;
          // Singular/Plural Match (e.g. Recipe: "Onions", Pantry: "Onion")
          if (itemSingular === targetSingular) return true;

          // Inclusion Match (Permissive)
          // Case A: Pantry has "Rice", Recipe needs "Basmati Rice" -> TRUE (You have rice)
          // Case B: Pantry has "Olive Oil", Recipe needs "Oil" -> TRUE (You have oil)
          if (target.includes(itemSingular)) return true; // Recipe: "Basmati Rice", Pantry: "Rice"
          
          return false;
      });
  };

  // Derived State: Missing Ingredients (Fixes Deduplication Bug)
  const missingIngredients = useMemo(() => {
    const agg: Record<string, string[]> = {
      Produce: [], Protein: [], Dairy: [], Pantry: [], Spices: []
    };
    
    const processIngredient = (ing: Ingredient, dishName: string) => {
      const inStock = isIngredientInStock(ing.name, pantryStock);
      if (!inStock) {
         // Add to list with source info for the receipt to display if needed
         agg[ing.category].push(`${ing.name} (${ing.quantity})`);
      }
    };

    weeklyPlan.forEach(day => {
      day.lunch?.ingredients.forEach(i => processIngredient(i, day.lunch!.name));
      day.dinner?.ingredients.forEach(i => processIngredient(i, day.dinner!.name));
    });

    return Object.entries(agg)
      .filter(([_, items]) => items.length > 0)
      .map(([category, items]) => ({ category, items }));
  }, [weeklyPlan, pantryStock]);

  const deckDishes = useMemo(() => {
    return availableDishes.filter(d => !approvedDishes.some(ad => ad.id === d.id));
  }, [availableDishes, approvedDishes]);

  const handleIntroComplete = () => {
    localStorage.setItem(STORAGE_KEYS.INTRO, 'true');
    setShowIntro(false);
    if (userProfile) {
        setView(AppView.Swipe);
    }
  };

  const handleOnboardingComplete = async (profile: UserProfile) => {
    setUserProfile(profile);
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    setIsSeeding(true);
    const realDishes = await generateNewDishes(6, profile);
    setAvailableDishes(realDishes);
    setIsSeeding(false);
    setView(AppView.Swipe);
  };

  // CRITICAL: Retroactive Safety Audit
  const performSafetyAudit = (newProfile: UserProfile, currentApproved: Dish[], currentAvailable: Dish[], currentPlan: DayPlan[]) => {
      const isUnsafe = (d: Dish) => d.allergens.some(a => newProfile.allergens.includes(a));
      
      let purgedCount = 0;

      // 1. Purge Approved
      const safeApproved = currentApproved.filter(d => {
          if (isUnsafe(d)) { purgedCount++; return false; }
          return true;
      });

      // 2. Purge Available (Deck)
      const safeAvailable = currentAvailable.filter(d => !isUnsafe(d));

      // 3. Purge Weekly Plan
      const safePlan = currentPlan.map(day => ({
          ...day,
          lunch: day.lunch && isUnsafe(day.lunch) ? null : day.lunch,
          dinner: day.dinner && isUnsafe(day.dinner) ? null : day.dinner
      }));

      return { safeApproved, safeAvailable, safePlan, purgedCount };
  };

  const handleUpdateProfile = (newProfile: UserProfile) => {
    setUserProfile(newProfile);
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(newProfile));
    
    // Execute Safety Audit
    const { safeApproved, safeAvailable, safePlan, purgedCount } = performSafetyAudit(
        newProfile, 
        approvedDishes, 
        availableDishes, 
        weeklyPlan
    );

    if (purgedCount > 0) {
        setApprovedDishes(safeApproved);
        setAvailableDishes(safeAvailable);
        setWeeklyPlan(safePlan);
        setSafetyAlert(`SAFETY PROTOCOL: Removed ${purgedCount} dishes violating new allergen rules.`);
        setTimeout(() => setSafetyAlert(null), 5000);
    } else {
        // If simply changing preferences but not safety, just ensure deck is valid
         setAvailableDishes(safeAvailable);
    }
  };

  const handleFactoryReset = useCallback(() => {
    if (confirm("WARNING: This will wipe all data and reset the app. Are you sure?")) {
      localStorage.clear();
      window.location.reload();
    }
  }, []);

  const handleSwipe = (dishId: string, direction: SwipeDirection) => {
    const dish = availableDishes.find(d => d.id === dishId);
    if (!dish) return;

    // Add to history
    setSwipeHistory(prev => [...prev, { dish, direction }]);

    if (direction === SwipeDirection.Right || direction === SwipeDirection.Up) {
      const updatedDish = { ...dish, isStaple: direction === SwipeDirection.Up };
      setApprovedDishes(prev => [...prev, updatedDish]);
    }
    
    const remainingInDeck = deckDishes.length - 1;
    
    if (remainingInDeck < 4 && !fetchingMore && userProfile) {
       setFetchingMore(true);
       generateNewDishes(5, userProfile)
         .then(newDishes => {
            setAvailableDishes(prev => [...prev, ...newDishes]);
            setFetchingMore(false);
         })
         .catch((err) => {
            console.error("Fetch failed", err);
            setFetchingMore(false);
         });
    }
  };

  const handleUndoSwipe = () => {
      if (swipeHistory.length === 0) return;
      const lastAction = swipeHistory[swipeHistory.length - 1];
      
      // Remove from history
      setSwipeHistory(prev => prev.slice(0, -1));

      // If it was approved, remove from approved list
      if (lastAction.direction === SwipeDirection.Right || lastAction.direction === SwipeDirection.Up) {
          setApprovedDishes(prev => prev.filter(d => d.id !== lastAction.dish.id));
      }
  };

  const handleImportDish = (dish: Dish) => {
    setAvailableDishes(prev => [dish, ...prev]);
    setApprovedDishes(prev => [...prev, dish]);
  };

  const handleDeleteDish = (dishId: string) => {
      setApprovedDishes(prev => prev.filter(d => d.id !== dishId));
      setAvailableDishes(prev => prev.filter(d => d.id !== dishId));
      // Also remove from weekly plan if present
      setWeeklyPlan(prev => prev.map(day => ({
          ...day,
          lunch: day.lunch?.id === dishId ? null : day.lunch,
          dinner: day.dinner?.id === dishId ? null : day.dinner
      })));
  };

  const handleModificationSave = (dishId: string, notes: string, servings: number) => {
    const updater = (d: Dish) => d.id === dishId ? { ...d, userNotes: notes, servings: servings } : d;
    setApprovedDishes(prev => prev.map(updater));
    setAvailableDishes(prev => prev.map(updater));
    
    // We must also update the weekly plan directly, as it might hold a copy or reference
    setWeeklyPlan(prev => prev.map(day => ({
        ...day,
        lunch: day.lunch?.id === dishId ? { ...day.lunch, userNotes: notes, servings: servings } : day.lunch,
        dinner: day.dinner?.id === dishId ? { ...day.dinner, userNotes: notes, servings: servings } : day.dinner
    })));
  };

  const handleCookDish = (dish: Dish, usedIngredients: string[]) => {
      setPantryStock(prev => {
          // Normalize ingredients to remove (lowercase, trim)
          const toRemove = new Set(usedIngredients.map(i => i.toLowerCase().trim()));
          
          return prev.filter(pantryItem => {
              // Check if pantry item matches any of the removed items (fuzzy match logic reversed)
              const normalize = (s: string) => s.toLowerCase().trim();
              const item = normalize(pantryItem);
              
              // If the pantry item is in the 'toRemove' list, filter it out
              // We need to match against the dish ingredients that were selected
              
              // Simple check: is this pantry item's normalized name in the set?
              if (toRemove.has(item)) return false;

              // Check for partial matches or singular/plural issues if needed
              // For now, strict name matching on what was presented in the UI is safest
              // The UI in DishModal used the dish's ingredient names.
              // Pantry stock might be "Onions" while dish has "Onion". 
              // We rely on the user confirming the removal in the UI, which lists dish ingredients.
              // So we need to match pantry stock against those names.
              
              // If pantry item "Onions" contains "Onion" (from removal list), remove it?
              // Let's iterate the toRemove set and see if pantry item fuzzy matches
              for (const removalTarget of toRemove) {
                  if (item.includes(removalTarget) || removalTarget.includes(item)) {
                      return false; // Remove it
                  }
              }

              return true; // Keep it
          });
      });
  };

  const handleRequestMoreDishes = async (context: VibeMode) => {
    if (!userProfile) return;
    const newDishes = await generateNewDishes(5, userProfile, context);
    setAvailableDishes(prev => [...prev, ...newDishes]);
  };

  const handlePantryToggle = (ingredientName: string) => {
    setPantryStock(prev => {
        const clean = (s: string) => s.toLowerCase().trim().replace(/s$/, '');
        const target = clean(ingredientName);
        const existing = prev.find(p => clean(p) === target);
        
        if (existing) {
            return prev.filter(p => p !== existing);
        } else {
            return [...prev, ingredientName];
        }
    });
  };

  const handlePantryBatchAdd = (items: string[]) => {
      setPantryStock(prev => {
          const newSet = new Set(prev);
          items.forEach(i => newSet.add(i));
          return Array.from(newSet);
      });
  };

  const handlePantryClear = () => {
      if(confirm("Clear entire pantry inventory?")) {
          setPantryStock([]);
      }
  };

  const handleCookFromPantry = () => {
    setView(AppView.Swipe);
    setInitialImportTab('pantry');
    setTimeout(() => setInitialImportTab(null), 1000);
  };

  const handleShareWhatsApp = () => {
    const homeName = userProfile?.name || "Home";
    
    // VIRAL LOOP OPTIMIZATION: Better formatting
    let message = `🍽️ *${homeName.toUpperCase()} KITCHEN OS* 🍽️\n`;
    message += `_Service Rotation & Logistics_\n\n`;

    message += `📅 *THE PLAN*\n`;
    weeklyPlan.forEach(d => {
      if (!d.lunch && !d.dinner) return; 
      message += `▪️ *${d.day.toUpperCase().slice(0, 3)}*\n`;
      if (d.lunch) message += `   ☀️ ${d.lunch.localName || d.lunch.name} (x${d.lunch.servings || 1})\n`;
      if (d.dinner) message += `   🌙 ${d.dinner.localName || d.dinner.name} (x${d.dinner.servings || 1})\n`;
      message += `\n`;
    });

    message += `🛒 *PROCUREMENT*\n`;
    if (missingIngredients.length === 0) {
      message += `✅ Inventory Full\n`;
    } else {
      missingIngredients.forEach(cat => {
        message += `\n*${cat.category.toUpperCase()}*\n`;
        cat.items.forEach(item => message += `▫️ ${item.split('(')[0]}\n`);
      });
    }

    message += `\n------------------\n`;
    
    // GENERATE LINK (Safe Unicode Encoding)
    const jsonString = JSON.stringify(weeklyPlan);
    // Use encodeURIComponent to handle unicode characters before btoa
    const data = btoa(encodeURIComponent(jsonString));
    const url = `${window.location.origin}${window.location.pathname}?view=cook&data=${encodeURIComponent(data)}`;
    
    message += `📲 *LIVE KITCHEN DISPLAY:*\n${url}\n\n`;

    message += `⚡ *Powered by ChefSync*`;

    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
    window.location.href = whatsappUrl;
  };

  // Nav Component
  const Nav = () => (
    <div className="h-20 bg-paper border-t-2 border-ink flex justify-around items-center px-1 shrink-0 safe-area-bottom z-40 gap-1">
      <button 
        onClick={() => setView(AppView.Swipe)}
        className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-transform active:scale-95 ${view === AppView.Swipe ? 'bg-ink text-paper shadow-hard-sm' : 'text-gray-500 hover:text-ink'}`}
      >
        <Layers size={20} strokeWidth={view === AppView.Swipe ? 3 : 2} />
        <span className="font-mono text-[9px] font-bold uppercase tracking-wide">Deck</span>
      </button>
      <button 
        onClick={() => setView(AppView.Planner)}
        className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-transform active:scale-95 ${view === AppView.Planner ? 'bg-ink text-paper shadow-hard-sm' : 'text-gray-500 hover:text-ink'}`}
      >
        <LayoutGrid size={20} strokeWidth={view === AppView.Planner ? 3 : 2} />
        <span className="font-mono text-[9px] font-bold uppercase tracking-wide">Plan</span>
      </button>
      <button 
        onClick={() => setView(AppView.Shopping)}
        className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-transform active:scale-95 ${view === AppView.Shopping ? 'bg-ink text-paper shadow-hard-sm' : 'text-gray-500 hover:text-ink'}`}
      >
        <ClipboardList size={20} strokeWidth={view === AppView.Shopping ? 3 : 2} />
        <span className="font-mono text-[9px] font-bold uppercase tracking-wide">List</span>
      </button>
      <button 
        onClick={() => setView(AppView.Pantry)}
        className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-transform active:scale-95 ${view === AppView.Pantry ? 'bg-ink text-paper shadow-hard-sm' : 'text-gray-500 hover:text-ink'}`}
      >
        <Package size={20} strokeWidth={view === AppView.Pantry ? 3 : 2} />
        <span className="font-mono text-[9px] font-bold uppercase tracking-wide">Pantry</span>
      </button>
      <button 
        onClick={() => setView(AppView.Profile)}
        className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-transform active:scale-95 ${view === AppView.Profile ? 'bg-ink text-paper shadow-hard-sm' : 'text-gray-500 hover:text-ink'}`}
      >
        <Settings size={20} strokeWidth={view === AppView.Profile ? 3 : 2} />
        <span className="font-mono text-[9px] font-bold uppercase tracking-wide">Sys</span>
      </button>
    </div>
  );

  if (checkingIntro) return null;

  if (showIntro) {
     return <IntroWalkthrough onComplete={handleIntroComplete} />;
  }

  if (isSeeding) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-paper text-ink p-8 text-center">
        {/* IMPROVED SEEDING VISUAL */}
        <div className="w-full max-w-xs font-mono text-xs text-left">
            <div className="mb-2 text-green-600"> > INIT_DB_CONNECTION... OK</div>
            <div className="mb-2 text-green-600"> > PARSING_USER_PREFS... OK</div>
            <div className="mb-2 text-brand-600 animate-pulse"> > QUERYING_GEMINI_NODE...</div>
            <div className="h-32 border border-ink p-2 mt-4 bg-white opacity-50 flex flex-col-reverse overflow-hidden">
                <span className="opacity-30">Generating dish_id: 8829...</span>
                <span className="opacity-50">Validating macros...</span>
                <span className="opacity-70">Checking safety constraints...</span>
                <span className="font-bold">Compiling Rotation...</span>
            </div>
        </div>
      </div>
    );
  }

  if (!userProfile || view === AppView.Onboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="h-screen flex flex-col bg-paper overflow-hidden text-ink selection:bg-brand-500 selection:text-white">
      
      {/* GLOBAL ALERTS */}
      {safetyAlert && (
          <div className="absolute top-4 left-4 right-4 z-[60] bg-red-500 text-white p-3 border-2 border-ink shadow-hard flex items-start gap-3 animate-in slide-in-from-top">
              <AlertTriangle className="shrink-0" />
              <p className="text-xs font-bold uppercase leading-tight">{safetyAlert}</p>
          </div>
      )}

      <div className="flex-1 relative overflow-hidden flex flex-col">
        {view === AppView.Swipe && (
          <SwipeDeck 
            dishes={deckDishes}
            approvedDishes={approvedDishes}
            approvedCount={approvedDishes.length}
            onSwipe={handleSwipe}
            onUndo={swipeHistory.length > 0 ? handleUndoSwipe : undefined}
            onModify={setModifyingDish}
            onImport={handleImportDish}
            onDelete={handleDeleteDish}
            pantryStock={pantryStock}
            userProfile={userProfile}
            initialImportTab={initialImportTab}
          />
        )}
        {view === AppView.Planner && (
          <WeeklyPlanner 
            approvedDishes={approvedDishes}
            userProfile={userProfile}
            onPlanUpdate={setWeeklyPlan}
            onRequestMoreDishes={handleRequestMoreDishes}
            onPublish={() => setShowReceipt(true)}
            pantryStock={pantryStock} // PASSING STOCK FOR MAGIC FILL
          />
        )}
        {view === AppView.Shopping && (
          <GroceryList 
            plan={weeklyPlan} 
            pantryStock={pantryStock}
            onToggleItem={handlePantryToggle}
            onPrintTicket={() => setShowReceipt(true)}
          />
        )}
        {view === AppView.Pantry && (
            <PantryView 
                pantryStock={pantryStock}
                onToggleItem={handlePantryToggle}
                onBatchAdd={handlePantryBatchAdd}
                onClear={handlePantryClear}
                onCookFromPantry={handleCookFromPantry}
            />
        )}
        {view === AppView.Profile && (
          <ProfileView 
            userProfile={userProfile}
            onUpdateProfile={handleUpdateProfile}
            onFactoryReset={handleFactoryReset}
          />
        )}
      </div>

      <Nav />

      {modifyingDish && (
        <DishModal 
          dish={modifyingDish} 
          onClose={() => setModifyingDish(null)}
          onSave={handleModificationSave}
          onCook={handleCookDish}
        />
      )}

      {showReceipt && (
        <Receipt 
          plan={weeklyPlan} 
          missingIngredients={missingIngredients} 
          onClose={() => setShowReceipt(false)}
          onSend={handleShareWhatsApp}
        />
      )}
    </div>
  );
};

export default App;