import React, { useState, useEffect } from 'react';
import { Dish, DayPlan, VibeMode, UserProfile } from '../types';
import { DAYS_OF_WEEK } from '../constants';
import { RefreshCw, Zap, Coffee, RotateCw, Send } from 'lucide-react';

interface Props {
  approvedDishes: Dish[];
  userProfile: UserProfile;
  onPlanUpdate: (plan: DayPlan[]) => void;
  onRequestMoreDishes: (context: VibeMode) => void;
  onPublish: () => void;
}

const WeeklyPlanner: React.FC<Props> = ({ approvedDishes, userProfile, onPlanUpdate, onRequestMoreDishes, onPublish }) => {
  const [mode, setMode] = useState<VibeMode>('Comfort');
  const [weekPlan, setWeekPlan] = useState<DayPlan[]>([]);
  const [regenerating, setRegenerating] = useState(false);
  const [swappingSlot, setSwappingSlot] = useState<{dayIndex: number, type: 'lunch' | 'dinner'} | null>(null);

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
    generatePlan('Comfort');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (weekPlan.length > 0) {
      localStorage.setItem('chefSync_weeklyPlan', JSON.stringify(weekPlan));
    }
  }, [weekPlan]);

  const getDishFromPool = (currentPool: Dish[], excludeIds: string[] = []) => {
    const candidates = currentPool.filter(d => !excludeIds.includes(d.id));
    if (candidates.length === 0) return currentPool[Math.floor(Math.random() * currentPool.length)];
    return candidates[Math.floor(Math.random() * candidates.length)];
  };

  const generatePlan = (targetMode: VibeMode) => {
    setRegenerating(true);
    setTimeout(() => {
      let pool = filterPoolByMode(targetMode);
      if (pool.length < 5) onRequestMoreDishes(targetMode);

      const newPlan: DayPlan[] = DAYS_OF_WEEK.map(day => {
        let lunch = getDishFromPool(pool);
        let dinner = getDishFromPool(pool, [lunch.id]);
        let attempts = 0;
        while (lunch && dinner && lunch.primaryIngredient === dinner.primaryIngredient && attempts < 5) {
          dinner = getDishFromPool(pool, [lunch.id]);
          attempts++;
        }
        return { day, lunch, dinner };
      });

      setWeekPlan(newPlan);
      onPlanUpdate(newPlan);
      setRegenerating(false);
    }, 800);
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
    setSwappingSlot({ dayIndex, type });
    setTimeout(() => {
      const pool = filterPoolByMode(mode);
      const currentDay = weekPlan[dayIndex];
      const otherDish = type === 'lunch' ? currentDay.dinner : currentDay.lunch;
      const excludeIds = [
        type === 'lunch' ? currentDay.lunch?.id || '' : currentDay.dinner?.id || '',
        otherDish?.id || ''
      ];

      const newDish = getDishFromPool(pool, excludeIds);
      const newPlan = [...weekPlan];
      newPlan[dayIndex] = { ...newPlan[dayIndex], [type]: newDish };

      setWeekPlan(newPlan);
      onPlanUpdate(newPlan);
      setSwappingSlot(null);
    }, 500);
  };

  const handleModeChange = (newMode: VibeMode) => {
    setMode(newMode);
    generatePlan(newMode);
  };

  return (
    <div className="flex flex-col h-full bg-paper">
      {/* Header */}
      <div className="p-4 bg-paper border-b-2 border-ink sticky top-0 z-20">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-black uppercase text-ink">Run of Show</h2>
            <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 border border-ink"></span>
                <span className="font-mono text-xs uppercase">Menu Active</span>
            </div>
        </div>
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
        {regenerating ? (
          <div className="flex flex-col items-center justify-center h-64 text-ink animate-pulse">
            <RefreshCw className="w-12 h-12 animate-spin mb-4" strokeWidth={1.5} />
            <p className="font-mono text-sm uppercase tracking-widest">Optimizing Rotation...</p>
          </div>
        ) : (
          weekPlan.map((dayPlan, idx) => (
            <div key={dayPlan.day} className="bg-white border-2 border-ink shadow-hard relative">
              {/* Day Header */}
              <div className="bg-ink text-white px-3 py-1 flex justify-between items-center">
                <h3 className="font-black uppercase tracking-wider text-sm">{dayPlan.day}</h3>
                <span className="font-mono text-[10px] opacity-75">DAY 0{idx + 1}</span>
              </div>
              
              <div className="p-0">
                {/* Lunch Slot */}
                <div className="flex group border-b border-ink border-dashed">
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
                        <button 
                            onClick={() => handleSwapSlot(idx, 'lunch')}
                            className="p-2 hover:bg-gray-100 rounded-full transition text-gray-400 hover:text-ink"
                            disabled={!!swappingSlot}
                        >
                            <RotateCw size={14} className={swappingSlot?.dayIndex === idx && swappingSlot?.type === 'lunch' ? 'animate-spin text-brand-600' : ''} />
                        </button>
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
                        <button 
                            onClick={() => handleSwapSlot(idx, 'dinner')}
                            className="p-2 hover:bg-gray-100 rounded-full transition text-gray-400 hover:text-ink"
                            disabled={!!swappingSlot}
                        >
                            <RotateCw size={14} className={swappingSlot?.dayIndex === idx && swappingSlot?.type === 'dinner' ? 'animate-spin text-brand-600' : ''} />
                        </button>
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
        <button 
          onClick={onPublish}
          className="bg-ink text-white px-5 py-3 border-2 border-ink shadow-hard hover:translate-y-1 hover:shadow-none transition-all active:bg-gray-800 flex items-center gap-2 font-bold uppercase rounded-full"
        >
          <Send size={18} /> Transmit Order
        </button>
        <button 
          onClick={() => generatePlan(mode)} 
          className="bg-brand-500 text-white p-4 border-2 border-ink shadow-hard hover:translate-y-1 hover:shadow-none transition-all active:bg-brand-600 rounded-lg"
        >
          <RefreshCw size={24} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};

export default WeeklyPlanner;