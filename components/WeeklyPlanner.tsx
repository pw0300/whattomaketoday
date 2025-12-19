import React, { useState, useEffect } from 'react';
import { Dish, DayPlan, VibeMode, UserProfile } from '../types';
import { DAYS_OF_WEEK } from '../constants';
import { RefreshCw, Zap, Coffee, RotateCw, Send, ArrowDownCircle, Eraser, Lock, Unlock, Sparkles, Link as LinkIcon, Copy, CheckSquare } from 'lucide-react';

interface Props {
  approvedDishes: Dish[];
  userProfile: UserProfile;
  onPlanUpdate: (plan: DayPlan[]) => void;
  onRequestMoreDishes: (context: VibeMode) => void;
  onPublish: () => void;
  pantryStock?: string[]; // New Prop
}

const WeeklyPlanner: React.FC<Props> = ({ approvedDishes, userProfile, onPlanUpdate, onRequestMoreDishes, onPublish, pantryStock = [] }) => {
  const [mode, setMode] = useState<VibeMode>('Comfort');
  const [weekPlan, setWeekPlan] = useState<DayPlan[]>([]);
  const [regenerating, setRegenerating] = useState(false);
  const [swappingSlot, setSwappingSlot] = useState<{dayIndex: number, type: 'lunch' | 'dinner'} | null>(null);
  const [showLinkCopied, setShowLinkCopied] = useState(false);

  // Load from LocalStorage on mount
  useEffect(() => {
    const savedPlan = localStorage.getItem('chefSync_weeklyPlan');
    if (savedPlan) {
      try {
        const parsed = JSON.parse(savedPlan);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setWeekPlan(parsed);
          onPlanUpdate(parsed);
          return; 
        }
      } catch (e) {
        console.error("Failed to parse saved plan", e);
      }
    }
    // Initialize empty if no save
    const blankPlan = DAYS_OF_WEEK.map(day => ({ day, lunch: null, dinner: null, isLocked: false }));
    setWeekPlan(blankPlan);
  }, []);

  useEffect(() => {
    if (weekPlan.length > 0) {
      localStorage.setItem('chefSync_weeklyPlan', JSON.stringify(weekPlan));
    }
  }, [weekPlan]);

  // MOAT LOGIC: Advanced Dish Selection
  const getDishFromPool = (pool: Dish[], typeFilter?: 'Lunch' | 'Dinner', excludeIds: string[] = [], recentIds: string[] = [], prioritizePantry = false) => {
    let candidates = pool.filter(d => !excludeIds.includes(d.id));
    if (typeFilter) {
       if (typeFilter === 'Lunch') {
           candidates = candidates.filter(d => d.type === 'Lunch' || d.type === 'Snack' || d.type === 'Breakfast');
       } else if (typeFilter === 'Dinner') {
           candidates = candidates.filter(d => d.type === 'Dinner');
       }
    }
    if (candidates.length === 0) {
        candidates = pool.filter(d => !excludeIds.includes(d.id));
        if (candidates.length === 0) return null;
    }
    const freshCandidates = candidates.filter(d => !recentIds.includes(d.id));
    let finalPool = freshCandidates.length > 0 ? freshCandidates : candidates;

    // --- PANTRY PRIORITIZATION LOGIC ---
    if (prioritizePantry && pantryStock.length > 0) {
        const pantryPool = finalPool.filter(d => {
            // Very basic fuzzy check: Does the dish use at least one ingredient we have?
            return d.ingredients.some(ing => 
                pantryStock.some(s => s.toLowerCase().includes(ing.name.toLowerCase()) || ing.name.toLowerCase().includes(s.toLowerCase()))
            );
        });
        if (pantryPool.length > 0) {
            finalPool = pantryPool; // Narrow down to pantry options
        }
    }

    const weightedPool: Dish[] = [];
    finalPool.forEach(d => {
        weightedPool.push(d);
        if (d.isStaple) weightedPool.push(d); 
    });
    return weightedPool[Math.floor(Math.random() * weightedPool.length)];
  };

  // The Original "Generate Whole Week"
  const generatePlan = (targetMode: VibeMode) => {
    setRegenerating(true);
    setTimeout(() => {
      let pool = filterPoolByMode(targetMode);
      if (pool.length < 5) onRequestMoreDishes(targetMode);

      const recentHistory: string[] = []; 
      
      const newPlan: DayPlan[] = weekPlan.length > 0 
        ? weekPlan.map((existingDay, idx) => {
            if (existingDay.isLocked) {
                if (existingDay.lunch) recentHistory.push(existingDay.lunch.id);
                if (existingDay.dinner) recentHistory.push(existingDay.dinner.id);
                return existingDay;
            }

            const lunch = getDishFromPool(pool, 'Lunch', [], recentHistory);
            if (lunch) {
                recentHistory.push(lunch.id);
                if (recentHistory.length > 3) recentHistory.shift(); 
            }
            const dinner = getDishFromPool(pool, 'Dinner', lunch ? [lunch.id] : [], recentHistory);
            if (dinner) {
                recentHistory.push(dinner.id);
                if (recentHistory.length > 3) recentHistory.shift();
            }
            return { day: DAYS_OF_WEEK[idx], lunch, dinner, isLocked: false };
        })
        : DAYS_OF_WEEK.map(day => {
            return { day, lunch: null, dinner: null, isLocked: false }; 
        });

      setWeekPlan(newPlan);
      onPlanUpdate(newPlan);
      setRegenerating(false);
    }, 800);
  };

  // --- NEW FEATURE: MAGIC FILL (Autopilot) ---
  const handleMagicFill = () => {
      setRegenerating(true);
      setTimeout(() => {
          let pool = filterPoolByMode(mode);
          if (pool.length < 3) {
             alert("Not enough approved dishes to auto-fill. Swipe right on more dishes!");
             setRegenerating(false);
             return;
          }

          const todayIdx = new Date().getDay() - 1; // 0=Mon
          const safeTodayIdx = todayIdx < 0 ? 0 : todayIdx;
          
          const newPlan = [...weekPlan];
          const recentHistory: string[] = [];

          // Only fill Today + Next 2 days
          for (let i = 0; i < 7; i++) {
              if (i >= safeTodayIdx && i <= safeTodayIdx + 2) {
                  if (newPlan[i].isLocked) continue;

                  // Prioritize Pantry for Magic Fill
                  const lunch = getDishFromPool(pool, 'Lunch', [], recentHistory, true);
                  if (lunch) recentHistory.push(lunch.id);
                  
                  const dinner = getDishFromPool(pool, 'Dinner', lunch ? [lunch.id] : [], recentHistory, true);
                  if (dinner) recentHistory.push(dinner.id);

                  newPlan[i] = { ...newPlan[i], lunch, dinner };
              }
          }
          setWeekPlan(newPlan);
          onPlanUpdate(newPlan);
          setRegenerating(false);
      }, 600);
  };

  const filterPoolByMode = (targetMode: VibeMode) => {
    let pool = [...approvedDishes];
    if (targetMode === 'Strict') {
      pool = pool.filter(d => 
        d.macros.calories <= (userProfile.dailyTargets.calories / 2)
      );
    } else if (targetMode === 'Comfort') {
      const staples = pool.filter(d => d.isStaple);
      if (staples.length > 0) pool = [...pool, ...staples, ...staples];
    }
    return pool.length > 0 ? pool : approvedDishes;
  };

  const handleSwapSlot = (dayIndex: number, type: 'lunch' | 'dinner') => {
    if (weekPlan[dayIndex].isLocked) return;

    setSwappingSlot({ dayIndex, type });
    setTimeout(() => {
      const pool = filterPoolByMode(mode);
      const currentDay = weekPlan[dayIndex];
      const otherDish = type === 'lunch' ? currentDay.dinner : currentDay.lunch;
      const excludeIds = [
        type === 'lunch' ? currentDay.lunch?.id || '' : currentDay.dinner?.id || '',
        otherDish?.id || ''
      ];

      const targetType = type === 'lunch' ? 'Lunch' : 'Dinner';
      const newDish = getDishFromPool(pool, targetType, excludeIds) || getDishFromPool(pool, undefined, excludeIds);
      
      const newPlan = [...weekPlan];
      newPlan[dayIndex] = { ...newPlan[dayIndex], [type]: newDish };

      setWeekPlan(newPlan);
      onPlanUpdate(newPlan);
      setSwappingSlot(null);
    }, 500);
  };

  const handleLeftovers = (dayIndex: number) => {
      if (dayIndex === 0 || weekPlan[dayIndex].isLocked) return; 
      const prevDinner = weekPlan[dayIndex - 1].dinner;
      if (!prevDinner) return;

      const newPlan = [...weekPlan];
      newPlan[dayIndex] = {
          ...newPlan[dayIndex],
          lunch: {
              ...prevDinner,
              name: `${prevDinner.name} (Leftovers)`,
              localName: "Reheated"
          }
      };
      setWeekPlan(newPlan);
      onPlanUpdate(newPlan);
  };

  const handleClearWeek = () => {
    if (confirm("Reset the entire week? This unlocks all days and clears meals.")) {
        const blankPlan = DAYS_OF_WEEK.map(day => ({ day, lunch: null, dinner: null, isLocked: false }));
        setWeekPlan(blankPlan);
        onPlanUpdate(blankPlan);
    }
  };

  const toggleLock = (index: number) => {
      const newPlan = [...weekPlan];
      newPlan[index] = { ...newPlan[index], isLocked: !newPlan[index].isLocked };
      setWeekPlan(newPlan);
      onPlanUpdate(newPlan);
  };

  const handleModeChange = (newMode: VibeMode) => {
    setMode(newMode);
    // When changing modes, we usually want to regenerate NON-LOCKED days
    generatePlan(newMode);
  };

  // --- NEW FEATURE: SHARE LINK ---
  const handleCopyLink = () => {
      // Serialize plan to base64 with robust unicode handling
      const jsonString = JSON.stringify(weekPlan);
      const data = btoa(encodeURIComponent(jsonString));
      const url = `${window.location.origin}${window.location.pathname}?view=cook&data=${encodeURIComponent(data)}`;
      
      navigator.clipboard.writeText(url).then(() => {
          setShowLinkCopied(true);
          setTimeout(() => setShowLinkCopied(false), 2000);
      });
  };

  return (
    <div className="flex flex-col h-full bg-paper">
      {/* Header */}
      <div className="p-4 bg-paper border-b-2 border-ink sticky top-0 z-20">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-black uppercase text-ink">Run of Show</h2>
            <div className="flex items-center gap-2">
                 <button 
                    onClick={handleClearWeek}
                    className="text-[10px] font-bold uppercase text-red-500 hover:text-red-700 flex items-center gap-1 border border-red-200 bg-red-50 px-2 py-1"
                >
                    <Eraser size={12} /> Clear Board
                </button>
            </div>
        </div>
        
        {/* Magic Fill Banner */}
        <button 
            onClick={handleMagicFill}
            disabled={regenerating}
            className="w-full mb-4 bg-brand-100 border-2 border-brand-500 text-brand-900 p-3 flex items-center justify-between shadow-sm active:translate-y-1 transition-all"
        >
            <div className="flex items-center gap-2">
                <Sparkles size={18} className={regenerating ? 'animate-spin' : ''} />
                <div className="text-left">
                    <span className="block font-black uppercase text-xs">Kitchen Autopilot</span>
                    <span className="block text-[10px] opacity-75">Auto-Fill next 3 days based on pantry</span>
                </div>
            </div>
            <div className="bg-brand-500 text-white px-2 py-1 text-[10px] font-bold uppercase">Run</div>
        </button>

        <div className="flex gap-2">
          {(['Strict', 'Comfort', 'Explorer'] as VibeMode[]).map((m) => (
            <button
              key={m}
              onClick={() => handleModeChange(m)}
              className={`flex-1 py-2 font-mono text-xs font-bold uppercase border-2 transition-all ${
                mode === m ? 'bg-ink text-white border-ink shadow-hard-sm' : 'bg-white text-gray-500 border-gray-300'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        {regenerating && weekPlan.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-ink animate-pulse">
            <RefreshCw className="w-12 h-12 animate-spin mb-4" strokeWidth={1.5} />
            <p className="font-mono text-sm uppercase tracking-widest">Optimizing Rotation...</p>
          </div>
        ) : (
          weekPlan.map((dayPlan, idx) => (
            <div key={dayPlan.day} className={`bg-white border-2 border-ink shadow-hard relative transition-all ${dayPlan.isLocked ? 'ring-2 ring-brand-500 ring-offset-2' : ''}`}>
              {/* Day Header */}
              <div className={`bg-ink text-white px-3 py-1 flex justify-between items-center ${dayPlan.isLocked ? 'bg-brand-600' : 'bg-ink'}`}>
                <h3 className="font-black uppercase tracking-wider text-sm">{dayPlan.day}</h3>
                <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] opacity-75">DAY 0{idx + 1}</span>
                    <button 
                        onClick={() => toggleLock(idx)}
                        className="text-white hover:text-brand-200 transition-colors"
                    >
                        {dayPlan.isLocked ? <Lock size={14} /> : <Unlock size={14} className="opacity-50" />}
                    </button>
                </div>
              </div>
              
              <div className={`p-0 relative ${dayPlan.isLocked ? 'bg-gray-50' : ''}`}>
                 {/* Locked Overlay Hint */}
                 {dayPlan.isLocked && (
                     <div className="absolute inset-0 bg-white/10 z-10 pointer-events-none flex items-center justify-center">
                         <Lock size={64} className="text-black/5" />
                     </div>
                 )}

                {/* Lunch Slot */}
                <div className="flex group border-b border-ink border-dashed relative">
                  <div className="w-12 bg-gray-50 flex items-center justify-center border-r border-ink border-dashed">
                    <Zap size={18} className="text-gray-400" />
                  </div>
                  <div className="flex-1 p-3 min-w-0">
                    <div className="flex justify-between items-start">
                        <div>
                             <p className="font-mono text-[10px] text-gray-400 uppercase mb-1">AM SERVICE</p>
                             <p className="font-bold text-sm text-ink truncate pr-2 leading-tight">
                                {dayPlan.lunch?.name || "86'd (OUT)"}
                             </p>
                             <p className="font-serif italic text-xs text-gray-500">{dayPlan.lunch?.localName}</p>
                        </div>
                        <div className="flex gap-2 relative z-20">
                             {/* Leftover Button */}
                             {idx > 0 && weekPlan[idx-1].dinner && !dayPlan.lunch && !dayPlan.isLocked && (
                                <button
                                    onClick={() => handleLeftovers(idx)}
                                    className="p-2 hover:bg-orange-100 text-orange-400 hover:text-orange-600 rounded-full transition"
                                    title="Eat Leftovers"
                                >
                                    <ArrowDownCircle size={14} />
                                </button>
                             )}
                             {!dayPlan.isLocked && (
                                <button 
                                    onClick={() => handleSwapSlot(idx, 'lunch')}
                                    className="p-2 hover:bg-gray-100 rounded-full transition text-gray-400 hover:text-ink"
                                    disabled={!!swappingSlot}
                                >
                                    <RotateCw size={14} className={swappingSlot?.dayIndex === idx && swappingSlot?.type === 'lunch' ? 'animate-spin text-brand-600' : ''} />
                                </button>
                             )}
                        </div>
                    </div>
                  </div>
                </div>

                {/* Dinner Slot */}
                <div className="flex group">
                   <div className="w-12 bg-gray-50 flex items-center justify-center border-r border-ink border-dashed">
                    <Coffee size={18} className="text-gray-400" />
                  </div>
                  <div className="flex-1 p-3 min-w-0">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-mono text-[10px] text-gray-400 uppercase mb-1">PM SERVICE</p>
                            <p className="font-bold text-sm text-ink truncate pr-2 leading-tight">
                            {dayPlan.dinner?.name || 'STAFF MEAL / LEFTOVERS'}
                            </p>
                            <p className="font-serif italic text-xs text-gray-500">{dayPlan.dinner?.localName}</p>
                        </div>
                        {!dayPlan.isLocked && (
                            <button 
                                onClick={() => handleSwapSlot(idx, 'dinner')}
                                className="p-2 hover:bg-gray-100 rounded-full transition text-gray-400 hover:text-ink"
                                disabled={!!swappingSlot}
                            >
                                <RotateCw size={14} className={swappingSlot?.dayIndex === idx && swappingSlot?.type === 'dinner' ? 'animate-spin text-brand-600' : ''} />
                            </button>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* FABs */}
      <div className="absolute bottom-24 right-6 flex flex-col gap-4 items-end">
        {/* SHARE LINK BUTTON (Matches App.tsx behavior now) */}
        <button 
          onClick={handleCopyLink}
          className="bg-white text-ink px-5 py-3 border-2 border-ink shadow-hard hover:translate-y-1 hover:shadow-none transition-all active:bg-gray-100 flex items-center gap-2 font-bold uppercase rounded-full"
        >
          {showLinkCopied ? <CheckSquare size={18} /> : <LinkIcon size={18} />}
          {showLinkCopied ? "Link Copied!" : "Kitchen Link"}
        </button>

        <button 
          onClick={onPublish}
          className="bg-ink text-white px-5 py-3 border-2 border-ink shadow-hard hover:translate-y-1 hover:shadow-none transition-all active:bg-gray-800 flex items-center gap-2 font-bold uppercase rounded-full"
        >
          <Send size={18} /> Transmit Order
        </button>
      </div>
    </div>
  );
};

export default WeeklyPlanner;