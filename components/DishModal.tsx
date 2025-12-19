import React, { useState, useEffect } from 'react';
import { Dish, Ingredient } from '../types';
import { Save, X, ChefHat, ScrollText, Users, Play, CheckCircle, Circle, ArrowLeft, Maximize2, Trash2, CheckSquare, Square } from 'lucide-react';

interface Props {
  dish: Dish;
  onClose: () => void;
  onSave: (dishId: string, notes: string, servings: number) => void;
  onCook?: (dish: Dish, usedIngredients: string[]) => void; // NEW PROP
}

const DishModal: React.FC<Props> = ({ dish, onClose, onSave, onCook }) => {
  const [notes, setNotes] = useState(dish.userNotes || '');
  const [tab, setTab] = useState<'recipe' | 'notes'>('recipe');
  const [servings, setServings] = useState(dish.servings || 1); 
  const [chefMode, setChefMode] = useState(false);
  
  // Depletion State
  const [showDepletion, setShowDepletion] = useState(false);
  const [ingredientsToRemove, setIngredientsToRemove] = useState<Set<string>>(new Set());

  // Chef Mode State
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());

  // Initialize Depletion logic: Auto-select Fresh items
  useEffect(() => {
    if (showDepletion) {
        const freshItems = new Set<string>();
        dish.ingredients.forEach(ing => {
            // Smart Logic: Default to removing Fresh items, keeping Staples
            if (['Produce', 'Protein', 'Dairy'].includes(ing.category)) {
                freshItems.add(ing.name);
            }
        });
        setIngredientsToRemove(freshItems);
    }
  }, [showDepletion, dish.ingredients]);

  // Disable body scroll when in Chef Mode
  useEffect(() => {
      if (chefMode) {
          document.body.style.overflow = 'hidden';
      } else {
          document.body.style.overflow = '';
      }
      return () => { document.body.style.overflow = ''; };
  }, [chefMode]);

  const toggleIngredient = (idx: number) => {
      const next = new Set(checkedIngredients);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      setCheckedIngredients(next);
  };

  const toggleStep = (idx: number) => {
      const next = new Set(checkedSteps);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      setCheckedSteps(next);
  };

  const toggleDepletionItem = (name: string) => {
      const next = new Set(ingredientsToRemove);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      setIngredientsToRemove(next);
  };

  const handleFinishService = () => {
      if (onCook) {
          onCook(dish, Array.from(ingredientsToRemove));
      }
      setChefMode(false);
      onClose();
  };

  // --- MATH ENGINE START ---
  const parseQuantity = (qty: string): number | null => {
    const clean = qty.trim();
    const mixedMatch = clean.match(/^(\d+)[\s-](\d+)\/(\d+)$/);
    if (mixedMatch) return parseInt(mixedMatch[1]) + (parseInt(mixedMatch[2]) / parseInt(mixedMatch[3]));
    const fractionMatch = clean.match(/^(\d+)\/(\d+)$/);
    if (fractionMatch) return parseInt(fractionMatch[1]) / parseInt(fractionMatch[2]);
    const decimalMatch = clean.match(/^(\d+(\.\d+)?)$/);
    if (decimalMatch) return parseFloat(decimalMatch[1]);
    return null;
  };

  const formatQuantity = (val: number): string => {
    if (val === 0) return "";
    if (Number.isInteger(val)) return val.toString();
    const whole = Math.floor(val);
    const decimal = val - whole;
    const closeTo = (n: number, target: number) => Math.abs(n - target) < 0.05;
    let frac = "";
    if (closeTo(decimal, 0.25)) frac = "¼";
    else if (closeTo(decimal, 0.33)) frac = "⅓";
    else if (closeTo(decimal, 0.5)) frac = "½";
    else if (closeTo(decimal, 0.66)) frac = "⅔";
    else if (closeTo(decimal, 0.75)) frac = "¾";
    else frac = decimal.toFixed(1).replace('.0', '');
    if (frac.startsWith("0.")) return frac; 
    return whole > 0 ? `${whole} ${frac}` : frac;
  };

  const getScaledQuantity = (rawQty: string): string => {
    if (servings === 1) return rawQty;
    const match = rawQty.match(/^([\d\s\/\.-]+)(.*)$/);
    if (match) {
        const numberPart = match[1].trim();
        const textPart = match[2];
        const val = parseQuantity(numberPart);
        if (val !== null) {
            const scaled = val * servings;
            return `${formatQuantity(scaled)}${textPart}`;
        }
    }
    return `${rawQty} (x${servings})`;
  };
  // --- MATH ENGINE END ---

  const handleCommit = () => {
      onSave(dish.id, notes, servings);
      onClose();
  };

  // --- CHEF MODE RENDER ---
  if (chefMode) {
      return (
          <div className="fixed inset-0 z-[60] bg-ink text-white flex flex-col animate-in slide-in-from-bottom duration-300">
              
              {/* Depletion Dialog Overlay */}
              {showDepletion && (
                  <div className="absolute inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
                      <div className="bg-paper text-ink w-full max-w-sm p-6 shadow-hard border-2 border-white animate-in zoom-in-95 duration-200">
                          <h3 className="font-black uppercase text-xl mb-1">Inventory Depletion</h3>
                          <p className="font-mono text-xs text-gray-600 mb-4">Confirm items consumed during service to update pantry.</p>
                          
                          <div className="max-h-60 overflow-y-auto mb-6 border-y-2 border-gray-200 py-2">
                              {dish.ingredients.map((ing) => (
                                  <div key={ing.name} onClick={() => toggleDepletionItem(ing.name)} className="flex items-center gap-3 p-2 cursor-pointer hover:bg-yellow-50">
                                      {ingredientsToRemove.has(ing.name) ? <CheckSquare size={18} className="text-red-500" /> : <Square size={18} className="text-gray-400" />}
                                      <div>
                                          <p className={`font-bold text-sm ${ingredientsToRemove.has(ing.name) ? 'line-through text-gray-400' : 'text-ink'}`}>{ing.name}</p>
                                          <p className="text-[10px] uppercase font-bold text-gray-400">{ing.category}</p>
                                      </div>
                                  </div>
                              ))}
                          </div>

                          <div className="flex gap-3">
                              <button onClick={() => setShowDepletion(false)} className="flex-1 py-3 font-bold uppercase border-2 border-ink hover:bg-gray-100">Cancel</button>
                              <button onClick={handleFinishService} className="flex-1 py-3 font-black uppercase bg-red-500 text-white border-2 border-ink shadow-hard hover:translate-y-1 hover:shadow-none transition-all">
                                  Confirm Update
                              </button>
                          </div>
                      </div>
                  </div>
              )}

              {/* Chef Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/20 bg-ink sticky top-0 z-10">
                  <button onClick={() => setChefMode(false)} className="p-2 -ml-2 text-gray-400 hover:text-white">
                      <ArrowLeft size={24} />
                  </button>
                  <div className="text-center">
                      <h3 className="font-black uppercase text-sm tracking-widest text-brand-500">Service Active</h3>
                      <p className="font-bold text-xs">{dish.name}</p>
                  </div>
                  <div className="w-8"></div> {/* Spacer */}
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
                  {/* Mise En Place Checklist */}
                  <section>
                      <h4 className="font-mono text-xs font-bold text-brand-500 uppercase mb-4 tracking-widest border-b border-white/10 pb-2">
                          1. Mise En Place
                      </h4>
                      <div className="space-y-3">
                          {dish.ingredients.map((ing, i) => {
                              const isChecked = checkedIngredients.has(i);
                              return (
                                  <div 
                                    key={i} 
                                    onClick={() => toggleIngredient(i)}
                                    className={`flex items-start gap-4 p-3 rounded-lg border transition-all cursor-pointer ${isChecked ? 'border-brand-900 bg-brand-900/20 opacity-50' : 'border-white/20 bg-white/5'}`}
                                  >
                                      {isChecked ? <CheckCircle className="text-brand-500 shrink-0" /> : <Circle className="text-gray-500 shrink-0" />}
                                      <div>
                                          <span className={`font-mono text-lg font-bold block ${isChecked ? 'line-through decoration-brand-500 text-gray-400' : 'text-white'}`}>
                                              {getScaledQuantity(ing.quantity)}
                                          </span>
                                          <span className="text-sm text-gray-400 uppercase font-bold">{ing.name}</span>
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                  </section>

                  {/* Steps Checklist */}
                  <section>
                      <h4 className="font-mono text-xs font-bold text-brand-500 uppercase mb-4 tracking-widest border-b border-white/10 pb-2">
                          2. Execution
                      </h4>
                      <div className="space-y-6">
                          {dish.instructions.map((step, i) => {
                               const isChecked = checkedSteps.has(i);
                               return (
                                   <div 
                                     key={i}
                                     onClick={() => toggleStep(i)}
                                     className={`relative pl-4 transition-all cursor-pointer ${isChecked ? 'opacity-40' : 'opacity-100'}`}
                                   >
                                       <div className={`absolute left-0 top-0 bottom-0 w-1 ${isChecked ? 'bg-brand-900' : 'bg-brand-500'}`}></div>
                                       <div className="flex gap-3 mb-1">
                                           <span className="font-mono text-xs text-brand-500 font-bold mb-1">STEP 0{i+1}</span>
                                           {isChecked && <span className="font-mono text-xs text-brand-500 font-bold">✓ COMPLETED</span>}
                                       </div>
                                       <p className={`text-xl font-medium leading-snug ${isChecked ? 'line-through text-gray-500' : 'text-white'}`}>
                                           {step}
                                       </p>
                                   </div>
                               );
                          })}
                      </div>
                  </section>
                  
                  <div className="pt-8 text-center pb-8">
                      <button 
                        onClick={() => setShowDepletion(true)}
                        className="w-full bg-white text-ink font-black uppercase py-4 tracking-widest hover:bg-gray-100 transition-colors"
                      >
                        Finish Service
                      </button>
                      <p className="font-mono text-[10px] uppercase mt-4 opacity-50">Screen Wake Lock Active</p>
                  </div>
              </div>
          </div>
      );
  }

  // --- STANDARD MODAL RENDER ---
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border-2 border-ink w-full max-w-sm shadow-hard overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-paper border-b-2 border-ink p-6 relative shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 bg-white border-2 border-ink p-1 hover:bg-red-50 text-ink transition active:translate-y-1"
          >
            <X size={20} />
          </button>
          <div className="pr-8">
             <span className="font-mono text-[10px] uppercase bg-ink text-white px-1">Selected Spec</span>
             <h3 className="font-black text-2xl uppercase mt-2 leading-none text-ink">{dish.name}</h3>
             <p className="font-serif italic text-gray-600 mt-1">{dish.localName}</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b-2 border-ink">
            <button 
                onClick={() => setTab('recipe')}
                className={`flex-1 py-4 text-xs font-bold uppercase flex items-center justify-center gap-2 transition-colors ${tab === 'recipe' ? 'bg-ink text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
            >
                <ChefHat size={16} /> Specs
            </button>
            <button 
                onClick={() => setTab('notes')}
                className={`flex-1 py-4 text-xs font-bold uppercase flex items-center justify-center gap-2 transition-colors ${tab === 'notes' ? 'bg-ink text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
            >
                <ScrollText size={16} /> Mods
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-white flex flex-col">
            {tab === 'recipe' ? (
                <div className="space-y-8 flex-1">
                     {/* Serving Scaler */}
                     <div className="bg-blue-50 border border-blue-200 p-3 flex justify-between items-center">
                        <div className="flex items-center gap-2 text-blue-800">
                            <Users size={16} />
                            <span className="font-mono text-xs font-bold uppercase">Batch Scale</span>
                        </div>
                        <div className="flex gap-1">
                            {[1, 2, 4, 6].map(num => (
                                <button
                                    key={num}
                                    onClick={() => setServings(num)}
                                    className={`w-8 h-8 font-mono text-xs font-bold border ${servings === num ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-100'}`}
                                >
                                    x{num}
                                </button>
                            ))}
                        </div>
                     </div>

                     {/* Ingredients */}
                    <div>
                        <h4 className="font-mono text-xs font-bold text-ink bg-gray-100 inline-block px-2 py-1 mb-4 uppercase">Mise En Place</h4>
                        <ul className="space-y-2">
                            {dish.ingredients.map((ing, i) => (
                                <li key={i} className="text-sm font-medium flex justify-between items-end border-b border-dashed border-gray-300 pb-1">
                                    <span className="text-ink">{ing.name}</span>
                                    <span className={`font-mono text-xs ${servings > 1 ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
                                        {getScaledQuantity(ing.quantity)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    
                    {/* CHEF MODE LAUNCHER */}
                    <button 
                        onClick={() => setChefMode(true)}
                        className="w-full bg-brand-500 text-white border-2 border-ink py-4 font-black uppercase tracking-wider shadow-hard active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
                    >
                        <Play size={20} fill="currentColor" /> Start Service
                    </button>

                    {/* Instructions Preview */}
                    <div className="opacity-60 grayscale">
                        <h4 className="font-mono text-xs font-bold text-ink bg-gray-100 inline-block px-2 py-1 mb-4 uppercase">Fire / Steps</h4>
                         {dish.instructions && dish.instructions.length > 0 ? (
                            <ol className="space-y-4">
                                {dish.instructions.slice(0, 3).map((step, i) => (
                                    <li key={i} className="text-sm flex gap-4">
                                        <span className="shrink-0 w-6 h-6 border-2 border-ink text-ink flex items-center justify-center font-mono text-xs font-bold">{i + 1}</span>
                                        <span className="text-gray-800 leading-snug pt-0.5 line-clamp-2">{step}</span>
                                    </li>
                                ))}
                                {dish.instructions.length > 3 && (
                                    <li className="text-xs text-center italic font-mono pt-2">...Enter Service Mode to see full steps</li>
                                )}
                            </ol>
                        ) : (
                            <p className="font-mono text-xs text-red-500 uppercase border border-red-200 bg-red-50 p-2 text-center">Data Unavailable</p>
                        )}
                    </div>
                    
                    {/* COMMIT BUTTON IN RECIPE TAB TOO */}
                    <button
                        onClick={handleCommit}
                        className="w-full mt-4 bg-white text-ink border-2 border-ink py-3 font-bold uppercase tracking-wider hover:bg-gray-50 transition-all text-xs"
                    >
                        <Save size={14} className="inline mr-2" /> Save Specs & Close
                    </button>
                </div>
            ) : (
                <div className="h-full flex flex-col">
                     <label className="block font-mono text-xs font-bold text-ink uppercase mb-2">
                        Standing Orders (Notes)
                    </label>
                    <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                        These instructions will be appended to the output ticket every time this dish is fired.
                    </p>
                    <textarea
                        className="w-full border-2 border-ink bg-yellow-50 p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/10 resize-none flex-1 min-h-[150px]"
                        placeholder="e.g. Omit cilantro. Low sodium..."
                        maxLength={250}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                    <div className="text-right text-[10px] text-gray-400 mt-1 mb-4 font-mono">
                        {notes.length}/250
                    </div>
                    <button
                        onClick={handleCommit}
                        className="w-full mt-auto bg-ink text-white border-2 border-ink py-4 font-black uppercase tracking-wider shadow-hard-sm hover:translate-y-px hover:shadow-none transition-all"
                    >
                        <Save size={18} className="inline mr-2" /> Commit Mod
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default DishModal;