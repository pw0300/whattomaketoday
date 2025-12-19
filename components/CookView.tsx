import React, { useState, useEffect } from 'react';
import { DayPlan, Dish } from '../types';
import { ChefHat, Clock, AlertCircle, CheckSquare, Square, Check, Maximize2 } from 'lucide-react';

const CookView: React.FC = () => {
  const [plan, setPlan] = useState<DayPlan[]>([]);
  const [activeTab, setActiveTab] = useState<'today' | 'tomorrow'>('today');
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Decode plan from URL hash
    try {
        const params = new URLSearchParams(window.location.search);
        const data = params.get('data');
        if (data) {
            // Robust Unicode Decode: data -> atob -> decodeURIComponent -> JSON.parse
            // The params.get() already handles the first layer of URL decoding
            const decodedString = decodeURIComponent(atob(data));
            const decoded = JSON.parse(decodedString);
            setPlan(decoded);
        }
    } catch (e) {
        console.error("Failed to load kitchen data", e);
    }
  }, []);

  const todayIndex = new Date().getDay() - 1; // 0 = Mon (approx for demo)
  const safeTodayIndex = todayIndex < 0 ? 0 : todayIndex;
  
  const displayPlan = activeTab === 'today' 
    ? plan[safeTodayIndex] 
    : plan[(safeTodayIndex + 1) % 7];

  const toggleStep = (id: string) => {
      const next = new Set(completedSteps);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setCompletedSteps(next);
  };

  if (!displayPlan) {
      return (
          <div className="h-screen bg-ink text-white flex flex-col items-center justify-center p-8 text-center">
              <ChefHat size={64} className="mb-4 text-brand-500" />
              <h1 className="text-2xl font-black uppercase mb-2">Kitchen OS</h1>
              <p className="font-mono text-sm opacity-60">Waiting for sync...</p>
          </div>
      );
  }

  const MealCard = ({ title, dish }: { title: string, dish: Dish | null }) => {
      if (!dish) return (
        <div className="bg-white/5 border-2 border-white/10 p-6 rounded-lg mb-4 text-center">
            <p className="font-mono text-xs uppercase opacity-50">{title} Service</p>
            <p className="text-xl font-bold opacity-30 mt-1">OFF DUTY</p>
        </div>
      );

      return (
          <div className="bg-white text-ink p-0 mb-8 shadow-hard rounded-lg overflow-hidden">
              <div className="bg-brand-500 text-white p-4 flex justify-between items-center">
                  <span className="font-mono text-xs font-bold uppercase tracking-widest">{title}</span>
                  <span className="font-mono text-xs font-bold uppercase bg-white/20 px-2 py-1 rounded">
                     {dish.servings || 1} Pax
                  </span>
              </div>
              
              <div className="p-6">
                  <h2 className="text-3xl font-black uppercase leading-none mb-2">{dish.localName || dish.name}</h2>
                  {dish.localName && dish.localName !== dish.name && (
                      <p className="text-sm font-serif italic text-gray-500 mb-4">{dish.name}</p>
                  )}

                  {dish.chefAdvice && (
                      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 mb-6">
                          <p className="font-bold text-sm flex gap-2">
                              <AlertCircle size={16} className="shrink-0 mt-0.5" />
                              {dish.chefAdvice}
                          </p>
                      </div>
                  )}

                  {dish.userNotes && (
                      <div className="bg-ink text-white p-3 mb-6 font-mono text-xs">
                          <span className="opacity-50 block uppercase text-[10px] mb-1">Special Instruction:</span>
                          "{dish.userNotes}"
                      </div>
                  )}

                  <div className="space-y-6">
                      <div>
                          <h3 className="font-black uppercase text-sm border-b-2 border-gray-100 pb-2 mb-3">Mise En Place</h3>
                          <ul className="grid grid-cols-2 gap-2">
                              {dish.ingredients.map((ing, i) => (
                                  <li key={i} className="text-sm flex justify-between border-b border-dotted border-gray-200 pb-1">
                                      <span>{ing.name}</span>
                                      <span className="font-bold text-gray-400">{ing.quantity}</span>
                                  </li>
                              ))}
                          </ul>
                      </div>

                      <div>
                           <h3 className="font-black uppercase text-sm border-b-2 border-gray-100 pb-2 mb-3">Workflow</h3>
                           <div className="space-y-3">
                               {dish.instructions.map((step, i) => {
                                   const stepId = `${dish.id}-step-${i}`;
                                   const isDone = completedSteps.has(stepId);
                                   return (
                                       <div 
                                        key={i} 
                                        onClick={() => toggleStep(stepId)}
                                        className={`flex gap-3 cursor-pointer transition-all ${isDone ? 'opacity-30' : 'opacity-100'}`}
                                       >
                                           <div className={`shrink-0 mt-1 ${isDone ? 'text-green-500' : 'text-gray-300'}`}>
                                               {isDone ? <CheckSquare size={24} /> : <Square size={24} />}
                                           </div>
                                           <p className={`text-lg font-medium leading-snug ${isDone ? 'line-through' : ''}`}>{step}</p>
                                       </div>
                                   );
                               })}
                           </div>
                      </div>
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className="min-h-screen bg-ink pb-20">
      <div className="sticky top-0 z-10 bg-ink border-b border-white/10 p-4 flex justify-between items-center">
          <div>
              <h1 className="text-white font-black uppercase tracking-wider text-xl">Kitchen Display</h1>
              <p className="text-brand-500 font-mono text-xs font-bold uppercase">
                  {displayPlan?.day || "Loading..."}
              </p>
          </div>
          <div className="flex bg-white/10 rounded p-1">
              <button 
                onClick={() => setActiveTab('today')}
                className={`px-3 py-1 font-bold text-xs uppercase rounded transition-colors ${activeTab === 'today' ? 'bg-white text-ink' : 'text-gray-400'}`}
              >
                  Today
              </button>
              <button 
                onClick={() => setActiveTab('tomorrow')}
                className={`px-3 py-1 font-bold text-xs uppercase rounded transition-colors ${activeTab === 'tomorrow' ? 'bg-white text-ink' : 'text-gray-400'}`}
              >
                  Tmrw
              </button>
          </div>
      </div>

      <div className="p-4 max-w-xl mx-auto">
          <MealCard title="Lunch Service" dish={displayPlan?.lunch} />
          <MealCard title="Dinner Service" dish={displayPlan?.dinner} />
      </div>
      
      <div className="fixed bottom-0 left-0 w-full bg-black/90 text-white/50 text-center py-2 font-mono text-[10px] uppercase">
          Live Connection Active • Auto-Sync
      </div>
    </div>
  );
};

export default CookView;