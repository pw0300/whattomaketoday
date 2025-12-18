import React, { useState, useEffect, useMemo } from 'react';
import { AppView, UserProfile, Dish, SwipeDirection, DayPlan, VibeMode, Ingredient } from './types';
import { INITIAL_DISHES } from './constants';
import { generateNewDishes } from './services/geminiService';
import Onboarding from './components/Onboarding';
import SwipeDeck from './components/SwipeDeck';
import WeeklyPlanner from './components/WeeklyPlanner';
import GroceryList from './components/GroceryList';
import ProfileView from './components/ProfileView';
import DishModal from './components/DishModal';
import Receipt from './components/Receipt';
import { LayoutGrid, Layers, ShoppingBag, Loader2, Settings } from 'lucide-react';

const App: React.FC = () => {
  // State
  const [view, setView] = useState<AppView>(AppView.Onboarding);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  // Data
  const [availableDishes, setAvailableDishes] = useState<Dish[]>(INITIAL_DISHES); 
  const [approvedDishes, setApprovedDishes] = useState<Dish[]>([]); 
  const [weeklyPlan, setWeeklyPlan] = useState<DayPlan[]>([]);
  const [pantryStock, setPantryStock] = useState<string[]>([]); // Array of ingredient names that are checked
  
  const [isSeeding, setIsSeeding] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);
  
  // UI State
  const [modifyingDish, setModifyingDish] = useState<Dish | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  // Load from LocalStorage
  useEffect(() => {
    const savedProfile = localStorage.getItem('chefSync_profile');
    if (savedProfile) {
      setUserProfile(JSON.parse(savedProfile));
      setView(AppView.Swipe);
    }
    const savedStock = localStorage.getItem('chefSync_pantryStock');
    if (savedStock) {
      setPantryStock(JSON.parse(savedStock));
    }
  }, []);

  // Save Pantry Stock
  useEffect(() => {
    localStorage.setItem('chefSync_pantryStock', JSON.stringify(pantryStock));
  }, [pantryStock]);

  // Derived State: Calculate Missing Ingredients for Receipt
  const missingIngredients = useMemo(() => {
    const agg: Record<string, string[]> = {
      Produce: [], Protein: [], Dairy: [], Pantry: [], Spices: []
    };
    
    // Helper to track unique items
    const added = new Set<string>();

    const processIngredient = (ing: Ingredient) => {
      // If NOT in pantry stock, add to missing list
      if (!pantryStock.includes(ing.name)) {
        const key = `${ing.name}-${ing.quantity}`; // Simple dedupe key
        if (!added.has(key)) {
          agg[ing.category].push(`${ing.name} (${ing.quantity})`);
          added.add(key);
        }
      }
    };

    weeklyPlan.forEach(day => {
      day.lunch?.ingredients.forEach(processIngredient);
      day.dinner?.ingredients.forEach(processIngredient);
    });

    return Object.entries(agg)
      .filter(([_, items]) => items.length > 0)
      .map(([category, items]) => ({ category, items }));
  }, [weeklyPlan, pantryStock]);

  const handleOnboardingComplete = async (profile: UserProfile) => {
    setUserProfile(profile);
    localStorage.setItem('chefSync_profile', JSON.stringify(profile));
    
    setIsSeeding(true);
    const realDishes = await generateNewDishes(6, profile.allergens, profile.cuisines);
    setAvailableDishes(realDishes);
    setIsSeeding(false);
    setView(AppView.Swipe);
  };

  const handleUpdateProfile = (newProfile: UserProfile) => {
    setUserProfile(newProfile);
    localStorage.setItem('chefSync_profile', JSON.stringify(newProfile));
    
    const safeDishes = availableDishes.filter(d => 
      !d.allergens.some(a => newProfile.allergens.includes(a))
    );
    if (safeDishes.length !== availableDishes.length) {
        setAvailableDishes(safeDishes);
    }
  };

  const handleSwipe = (dishId: string, direction: SwipeDirection) => {
    const dish = availableDishes.find(d => d.id === dishId);
    if (!dish) return;

    if (direction === SwipeDirection.Right || direction === SwipeDirection.Up) {
      const updatedDish = { ...dish, isStaple: direction === SwipeDirection.Up };
      setApprovedDishes(prev => [...prev, updatedDish]);
    }
    
    const currentIndex = availableDishes.findIndex(d => d.id === dishId);
    if (availableDishes.length - currentIndex < 4 && !fetchingMore && userProfile) {
       setFetchingMore(true);
       generateNewDishes(5, userProfile.allergens, userProfile.cuisines)
         .then(newDishes => {
            setAvailableDishes(prev => [...prev, ...newDishes]);
            setFetchingMore(false);
         })
         .catch(() => setFetchingMore(false));
    }
  };

  const handleImportDish = (dish: Dish) => {
    setAvailableDishes(prev => [dish, ...prev]);
    setApprovedDishes(prev => [...prev, dish]);
  };

  const handleModificationSave = (dishId: string, notes: string) => {
    setApprovedDishes(prev => prev.map(d => d.id === dishId ? { ...d, userNotes: notes } : d));
    setAvailableDishes(prev => prev.map(d => d.id === dishId ? { ...d, userNotes: notes } : d));
  };

  const handleRequestMoreDishes = async (context: VibeMode) => {
    if (!userProfile) return;
    const newDishes = await generateNewDishes(5, userProfile.allergens, userProfile.cuisines, context);
    setAvailableDishes(prev => [...prev, ...newDishes]);
  };

  const handlePantryToggle = (ingredientName: string) => {
    setPantryStock(prev => 
      prev.includes(ingredientName) 
        ? prev.filter(i => i !== ingredientName)
        : [...prev, ingredientName]
    );
  };

  const handleShareWhatsApp = () => {
    const homeName = userProfile?.name || "Home";
    let message = `🧾 *KITCHEN MANIFEST: ${homeName.toUpperCase()}*\n`;
    message += `📋 *RUN OF SHOW (SERVICE ROTATION)*\n`;
    message += `------------------\n`;

    weeklyPlan.forEach(d => {
      message += `*${d.day.toUpperCase()}*\n`;
      const lunchName = d.lunch?.localName || d.lunch?.name || 'NO SERVICE (OUT)';
      message += `☀️ AM: *${lunchName}*`;
      if (d.lunch?.userNotes) message += `\n   ❗ MOD: ${d.lunch.userNotes}`;
      message += `\n`;

      const dinnerName = d.dinner?.localName || d.dinner?.name || 'CLEAR FRIDGE';
      message += `🌙 PM: *${dinnerName}*`;
      if (d.dinner?.userNotes) message += `\n   ❗ MOD: ${d.dinner.userNotes}`;
      message += `\n\n`;
    });

    message += `📦 *PROCUREMENT*\n`;
    message += `------------------\n`;
    
    if (missingIngredients.length === 0) {
      message += `(Pantry Stocked)\n`;
    } else {
      missingIngredients.forEach(cat => {
        message += `\n*${cat.category.toUpperCase()}*\n`;
        cat.items.forEach(item => message += `□ ${item}\n`);
      });
    }

    message += `\n------------------\n`;
    message += `Generated by ChefSync OS`;

    const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
    window.location.href = url;
  };

  // Nav Component
  const Nav = () => (
    <div className="h-20 bg-paper border-t-2 border-ink flex justify-around items-center px-2 shrink-0 safe-area-bottom z-40">
      <button 
        onClick={() => setView(AppView.Swipe)}
        className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-transform active:scale-95 ${view === AppView.Swipe ? 'bg-ink text-paper shadow-hard-sm' : 'text-gray-500 hover:text-ink'}`}
      >
        <Layers size={20} strokeWidth={view === AppView.Swipe ? 3 : 2} />
        <span className="font-mono text-[10px] font-bold uppercase tracking-wide">Deck</span>
      </button>
      <button 
        onClick={() => setView(AppView.Planner)}
        className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-transform active:scale-95 ${view === AppView.Planner ? 'bg-ink text-paper shadow-hard-sm' : 'text-gray-500 hover:text-ink'}`}
      >
        <LayoutGrid size={20} strokeWidth={view === AppView.Planner ? 3 : 2} />
        <span className="font-mono text-[10px] font-bold uppercase tracking-wide">Plan</span>
      </button>
      <button 
        onClick={() => setView(AppView.Grocery)}
        className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-transform active:scale-95 ${view === AppView.Grocery ? 'bg-ink text-paper shadow-hard-sm' : 'text-gray-500 hover:text-ink'}`}
      >
        <ShoppingBag size={20} strokeWidth={view === AppView.Grocery ? 3 : 2} />
        <span className="font-mono text-[10px] font-bold uppercase tracking-wide">Shop</span>
      </button>
      <button 
        onClick={() => setView(AppView.Profile)}
        className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-transform active:scale-95 ${view === AppView.Profile ? 'bg-ink text-paper shadow-hard-sm' : 'text-gray-500 hover:text-ink'}`}
      >
        <Settings size={20} strokeWidth={view === AppView.Profile ? 3 : 2} />
        <span className="font-mono text-[10px] font-bold uppercase tracking-wide">Sys</span>
      </button>
    </div>
  );

  if (isSeeding) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-paper text-ink p-8 text-center">
        <Loader2 className="w-12 h-12 animate-spin mb-6 text-brand-600" />
        <h2 className="text-2xl font-black uppercase mb-2">Compiling Database</h2>
        <p className="font-mono text-sm">Searching for high-rated recipes based on your taste profile...</p>
      </div>
    );
  }

  if (!userProfile || view === AppView.Onboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="h-screen flex flex-col bg-paper overflow-hidden text-ink selection:bg-brand-500 selection:text-white">
      <div className="flex-1 relative overflow-hidden flex flex-col">
        {view === AppView.Swipe && (
          <SwipeDeck 
            dishes={availableDishes.filter(d => !approvedDishes.some(ad => ad.id === d.id))}
            approvedCount={approvedDishes.length}
            onSwipe={handleSwipe}
            onModify={setModifyingDish}
            onImport={handleImportDish}
          />
        )}
        {view === AppView.Planner && (
          <WeeklyPlanner 
            approvedDishes={approvedDishes}
            userProfile={userProfile}
            onPlanUpdate={setWeeklyPlan}
            onRequestMoreDishes={handleRequestMoreDishes}
            onPublish={() => setShowReceipt(true)}
          />
        )}
        {view === AppView.Grocery && (
          <GroceryList 
            plan={weeklyPlan} 
            pantryStock={pantryStock}
            onToggleItem={handlePantryToggle}
            onPrintTicket={() => setShowReceipt(true)}
          />
        )}
        {view === AppView.Profile && (
          <ProfileView 
            userProfile={userProfile}
            onUpdateProfile={handleUpdateProfile}
          />
        )}
      </div>

      <Nav />

      {modifyingDish && (
        <DishModal 
          dish={modifyingDish} 
          onClose={() => setModifyingDish(null)}
          onSave={handleModificationSave}
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