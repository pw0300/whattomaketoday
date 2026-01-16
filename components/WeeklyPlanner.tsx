import React, { useState, useEffect } from 'react';
import { Dish, DayPlan, VibeMode, UserProfile } from '../types';
import { DAYS_OF_WEEK } from '../constants';
import { generateCookAudio, generateCookInstructions } from '../services/geminiService';
import { RefreshCw, Zap, Coffee, RotateCw, Send, ArrowDownCircle, Eraser, Lock, Unlock, Sparkles, Link as LinkIcon, CheckSquare, MessageCircle, Mic, Play, Loader2 } from 'lucide-react';
import DelegateModal from './DelegateModal';

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
  const [swappingSlot, setSwappingSlot] = useState<{ dayIndex: number, type: 'lunch' | 'dinner' } | null>(null);
  const [showLinkCopied, setShowLinkCopied] = useState(false);
  const [showDelegateModal, setShowDelegateModal] = useState(false);

  // Cook Bridge State
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Load from LocalStorage on mount
  useEffect(() => {
    const savedPlan = localStorage.getItem('tadkaSync_weeklyPlan');
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
      localStorage.setItem('tadkaSync_weeklyPlan', JSON.stringify(weekPlan));
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

  // --- COOK BRIDGE (WhatsApp + Audio) ---
  const handleWhatsAppShare = async () => {
    setIsGeneratingText(true);
    try {
      // 1. Generate Hindi Instructions via Gemini
      const aiInstructions = await generateCookInstructions(weekPlan);

      // 2. Fallback if AI fails
      let message = aiInstructions || `👨‍🍳 *Kitchen Orders*\n\n`;

      if (!aiInstructions) {
        // Manual fallback format
        weekPlan.forEach(d => {
          if (!d.lunch && !d.dinner) return;
          message += `*${d.day}*\n`;
          if (d.lunch) message += `☀️ ${d.lunch.localName}\n`;
          if (d.dinner) message += `🌙 ${d.dinner.localName}\n`;
          message += `\n`;
        });
        message += `(AI Generation Failed - Sending Manual List)`;
      }

      // 3. Open WhatsApp
      const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
    } catch (e) {
      alert("Failed to generate instructions");
    } finally {
      setIsGeneratingText(false);
    }
  };

  const handleAudioBriefing = async () => {
    if (audioUrl) {
      // Toggle play if already exists? For now just replay.
      const audio = new Audio(audioUrl);
      audio.play();
      return;
    }

    setIsGeneratingAudio(true);
    try {
      const base64Audio = await generateCookAudio(weekPlan);
      if (base64Audio) {
        const blob = await (await fetch(`data:audio/wav;base64,${base64Audio}`)).blob();
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        const audio = new Audio(url);
        audio.play();
      } else {
        alert("Could not generate audio instructions. Try again.");
      }
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-paper">
      {/* Header */}
      <div className="p-4 bg-paper border-b-2 border-ink sticky top-0 z-20">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-black uppercase text-ink">Weekly Plan</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClearWeek}
              className="text-[10px] font-bold uppercase text-red-500 hover:text-red-700 flex items-center gap-1 border border-red-200 bg-red-50 px-2 py-1"
            >
              <Eraser size={12} /> Clear Plan
            </button>
          </div>
        </div>

        {/* Magic Fill Banner */}
        {/* Magic Fill Banner - Refined */}
        <button
          onClick={handleMagicFill}
          disabled={regenerating}
          className="w-full mb-4 group relative overflow-hidden bg-white border-2 border-brand-200 hover:border-brand-500 rounded-xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all active:scale-[0.99]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-brand-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="flex items-center gap-3 relative z-10">
            <div className={`w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 ${regenerating ? 'animate-pulse' : ''}`}>
              <Sparkles size={20} className={regenerating ? 'animate-spin' : ''} />
            </div>
            <div className="text-left">
              <span className="block font-bold text-gray-900 text-sm">Kitchen Autopilot</span>
              <span className="block text-xs text-brand-600 font-medium">Auto-plan next 3 days</span>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-1.5 text-brand-600 bg-brand-50 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider group-hover:bg-brand-500 group-hover:text-white transition-colors">
            Run <Zap size={12} className="fill-current" />
          </div>
        </button>

        <div className="flex gap-2">
          {(['Strict', 'Comfort', 'Explorer'] as VibeMode[]).map((m) => (
            <button
              key={m}
              onClick={() => handleModeChange(m)}
              className={`flex-1 py-2 font-mono text-xs font-bold uppercase border-2 transition-all ${mode === m ? 'bg-ink text-white border-ink shadow-hard-sm' : 'bg-white text-gray-500 border-gray-300'
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
            <p className="font-mono text-sm uppercase tracking-widest">Planning meals...</p>
          </div>
        ) : (
          weekPlan.map((dayPlan, idx) => (
            <div key={dayPlan.day} className={`bg-white rounded-xl border border-gray-200 shadow-sm relative overflow-hidden transition-all hover:shadow-md ${dayPlan.isLocked ? 'ring-2 ring-brand-500 ring-offset-2' : ''}`}>
              {/* Day Header */}
              <div className={`px-4 py-3 flex justify-between items-center bg-gradient-to-r ${dayPlan.isLocked ? 'from-brand-600 to-brand-500' : 'from-gray-50 to-white border-b border-gray-100'}`}>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-black uppercase tracking-tight ${dayPlan.isLocked ? 'text-white' : 'text-gray-900'}`}>{dayPlan.day.substring(0, 3)}</span>
                  <span className={`text-[10px] font-mono uppercase tracking-wider ${dayPlan.isLocked ? 'text-brand-100' : 'text-gray-400'}`}>
                    • {dayPlan.day}
                  </span>
                </div>

                <button
                  onClick={() => toggleLock(idx)}
                  className={`p-1.5 rounded-full transition-colors ${dayPlan.isLocked ? 'text-white hover:bg-white/20' : 'text-gray-300 hover:text-gray-600 hover:bg-gray-100'}`}
                >
                  {dayPlan.isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                </button>
              </div>

              <div className="p-0 relative">
                {/* Locked Overlay Hint */}
                {dayPlan.isLocked && (
                  <div className="absolute inset-0 bg-white/5 z-10 pointer-events-none flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Lock size={48} className="text-brand-500/10" />
                  </div>
                )}

                {/* Lunch Slot */}
                <div className="flex group border-b border-gray-100 min-h-[5rem]">
                  <div className="w-14 bg-gray-50/50 flex flex-col items-center justify-center gap-1 border-r border-gray-100">
                    <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Lunch</span>
                    <Zap size={14} className="text-orange-300" />
                  </div>
                  <div className="flex-1 p-3 flex justify-between items-center">
                    <div className="flex-1 min-w-0 pr-3">
                      {dayPlan.lunch ? (
                        <>
                          <p className="font-bold text-gray-800 leading-tight truncate">{dayPlan.lunch.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">{dayPlan.lunch.localName}</p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-400 italic">Skipped</p>
                      )}
                    </div>

                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Leftover Button */}
                      {idx > 0 && weekPlan[idx - 1].dinner && !dayPlan.lunch && !dayPlan.isLocked && (
                        <button
                          onClick={() => handleLeftovers(idx)}
                          className="p-1.5 hover:bg-orange-50 text-orange-400 hover:text-orange-600 rounded-md transition"
                          title="Eat Leftovers"
                        >
                          <ArrowDownCircle size={14} />
                        </button>
                      )}
                      {!dayPlan.isLocked && (
                        <button
                          onClick={() => handleSwapSlot(idx, 'lunch')}
                          className="p-1.5 hover:bg-gray-100 rounded-md transition text-gray-400 hover:text-brand-600"
                          title="Swap Dish"
                          disabled={!!swappingSlot}
                        >
                          <RotateCw size={14} className={swappingSlot?.dayIndex === idx && swappingSlot?.type === 'lunch' ? 'animate-spin text-brand-600' : ''} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dinner Slot */}
                <div className="flex group min-h-[5rem]">
                  <div className="w-14 bg-gray-50/50 flex flex-col items-center justify-center gap-1 border-r border-gray-100">
                    <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Dinner</span>
                    <Coffee size={14} className="text-indigo-300" />
                  </div>
                  <div className="flex-1 p-3 flex justify-between items-center">
                    <div className="flex-1 min-w-0 pr-3">
                      {dayPlan.dinner ? (
                        <>
                          <p className="font-bold text-gray-800 leading-tight truncate">{dayPlan.dinner.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">{dayPlan.dinner.localName}</p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-400 italic">Not planned</p>
                      )}
                    </div>

                    {!dayPlan.isLocked && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleSwapSlot(idx, 'dinner')}
                          className="p-1.5 hover:bg-gray-100 rounded-md transition text-gray-400 hover:text-brand-600"
                          title="Swap Dish"
                          disabled={!!swappingSlot}
                        >
                          <RotateCw size={14} className={swappingSlot?.dayIndex === idx && swappingSlot?.type === 'dinner' ? 'animate-spin text-brand-600' : ''} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FABs */}
      <div className="absolute bottom-24 right-6 flex flex-col gap-4 items-end pointer-events-none">
        <div className="flex flex-col gap-4 pointer-events-auto">
          {/* DELEGATE BUTTON */}
          <button
            onClick={() => setShowDelegateModal(true)}
            className="bg-brand-500 text-white w-14 h-14 flex items-center justify-center border-2 border-ink shadow-hard hover:translate-y-1 hover:shadow-none transition-all rounded-full"
            title="Delegate to Cook"
          >
            <Mic size={24} />
          </button>

          {/* SHARELINK BUTTON */}
          <button
            onClick={handleCopyLink}
            className="bg-white text-ink px-5 py-3 border-2 border-ink shadow-hard hover:translate-y-1 hover:shadow-none transition-all active:bg-gray-100 flex items-center gap-2 font-bold uppercase rounded-full"
          >
            {showLinkCopied ? <CheckSquare size={18} /> : <LinkIcon size={18} />}
            {showLinkCopied ? "Copied" : "Link"}
          </button>

          <button
            onClick={onPublish}
            className="bg-ink text-white px-5 py-3 border-2 border-ink shadow-hard hover:translate-y-1 hover:shadow-none transition-all active:bg-gray-800 flex items-center gap-2 font-bold uppercase rounded-full"
          >
            <Send size={18} /> Shop Ingredients
          </button>
        </div>
      </div>

      {showDelegateModal && (
        <DelegateModal
          plan={weekPlan}
          userProfile={userProfile}
          onClose={() => setShowDelegateModal(false)}
        />
      )}
    </div>
  );
};

export default WeeklyPlanner;