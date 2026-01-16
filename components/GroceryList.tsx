import React, { useMemo, useState, useEffect } from 'react';
import { DayPlan, Ingredient } from '../types';
import { getCommerceLinks } from '../utils/commerceUtils';
import { Share2, CheckSquare, Square, ShoppingCart, Plus, Trash2, XCircle, Utensils, ExternalLink } from 'lucide-react';

interface Props {
  plan: DayPlan[];
  pantryStock: string[];
  onToggleItem: (ingredientName: string) => void;
  onPrintTicket: () => void;
}

// Extended interface for internal use
interface GroceryItem extends Ingredient {
  source?: string; // Which dish is this for?
  originalString?: string; // For fuzzy matching
}

const GroceryList: React.FC<Props> = ({ plan, pantryStock, onToggleItem, onPrintTicket }) => {
  const [customItems, setCustomItems] = useState<string[]>([]);
  const [newItemInput, setNewItemInput] = useState('');

  // Load custom items from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('tadkaSync_customGrocery');
    if (saved) {
      setCustomItems(JSON.parse(saved));
    }
  }, []);

  // Save custom items when changed
  useEffect(() => {
    localStorage.setItem('tadkaSync_customGrocery', JSON.stringify(customItems));
  }, [customItems]);

  const checkStock = (needed: string) => {
    const clean = (s: string) => s.toLowerCase().trim().replace(/s$/, '');
    const target = clean(needed);
    return pantryStock.some(s => clean(s) === target);
  };

  const handleAddCustom = () => {
    if (newItemInput.trim()) {
      setCustomItems(prev => [...prev, newItemInput.trim()]);
      setNewItemInput('');
    }
  };

  const removeCustom = (item: string) => {
    setCustomItems(prev => prev.filter(i => i !== item));
  };

  const handleClearCompleted = () => {
    const activeCustoms = customItems.filter(i => !checkStock(i));
    setCustomItems(activeCustoms);
  };

  // --- MATH ENGINE DUPLICATION (Lean implementation) ---
  const getScaledQuantity = (rawQty: string, servings: number): string => {
    if (!servings || servings === 1) return rawQty;

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


  // Group ingredients by category for display
  const categorizedIngredients = useMemo<Record<string, GroceryItem[]>>(() => {
    const agg: Record<string, GroceryItem[]> = {
      Produce: [], Protein: [], Dairy: [], Pantry: [], Spices: [], Custom: []
    };

    const processIngredient = (ing: Ingredient, sourceDish: string, servings: number) => {
      const scaledQty = getScaledQuantity(ing.quantity, servings);
      const item: GroceryItem = { ...ing, quantity: scaledQty, source: sourceDish };
      if (agg[ing.category]) {
        agg[ing.category].push(item);
      } else {
        agg['Pantry'].push(item);
      }
    };

    plan.forEach(day => {
      day.lunch?.ingredients.forEach(i => processIngredient(i, day.lunch!.name, day.lunch!.servings || 1));
      day.dinner?.ingredients.forEach(i => processIngredient(i, day.dinner!.name, day.dinner!.servings || 1));
    });

    // Add custom items to "Misc"
    customItems.forEach(item => {
      agg['Custom'].push({ name: item, quantity: '1 unit', category: 'Pantry', source: 'Manual Entry' });
    });

    return agg;
  }, [plan, customItems]);

  const isEmpty = Object.values(categorizedIngredients).every((list) => (list as GroceryItem[]).length === 0);

  // Fix: Explicitly cast Object.values result to handle unknown type inference
  const lists = Object.values(categorizedIngredients) as GroceryItem[][];
  const totalItems = lists.reduce((acc, list) => acc + list.length, 0);
  const checkedItems = lists.flat().filter(i => checkStock(i.name)).length;
  const progress = totalItems > 0 ? (checkedItems / totalItems) * 100 : 0;

  return (
    <div className="flex flex-col h-full bg-paper">
      <div className="p-4 border-b-2 border-ink flex justify-between items-center sticky top-0 bg-paper z-10">
        <div>
          <h2 className="text-2xl font-black uppercase text-ink">Shopping List</h2>
          <p className="font-mono text-xs text-gray-600">List</p>
        </div>
        <button
          onClick={onPrintTicket}
          className="bg-white text-ink border-2 border-ink px-4 py-2 font-bold uppercase shadow-hard hover:shadow-none hover:translate-y-1 transition flex items-center gap-2 text-xs"
        >
          <Share2 size={16} />
          Share
        </button>
      </div>

      {/* Progress Bar */}
      <div className="h-2 w-full bg-gray-200 border-b-2 border-ink">
        <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-8 pb-32">
        {/* Custom Item Input */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="Add household items (e.g. Dish Soap)..."
            className="flex-1 border-2 border-ink p-2 font-mono text-xs focus:bg-yellow-50 focus:outline-none"
            value={newItemInput}
            onChange={(e) => setNewItemInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
          />
          <button onClick={handleAddCustom} className="bg-ink text-white px-3 border-2 border-ink shadow-hard active:translate-y-1 active:shadow-none">
            <Plus size={16} />
          </button>
        </div>

        {/* Clear Custom Completed */}
        {customItems.some(i => checkStock(i)) && (
          <button
            onClick={handleClearCompleted}
            className="w-full mb-4 text-[10px] font-bold uppercase text-red-500 hover:text-red-700 flex items-center justify-center gap-1 border border-red-200 bg-red-50 p-2"
          >
            <XCircle size={12} /> Clear Checked Custom Items
          </button>
        )}

        {/* Fix: Explicitly cast Object.entries result to handle unknown type inference */}
        {(Object.entries(categorizedIngredients) as [string, GroceryItem[]][]).map(([category, items]) => {
          // SORTING LOGIC: 
          // 1. Unchecked first
          // 2. Then Alphabetical by Name (so identical items group together)
          const sortedList = [...items].sort((a, b) => {
            const aChecked = checkStock(a.name);
            const bChecked = checkStock(b.name);
            if (aChecked !== bChecked) return aChecked ? 1 : -1;
            return a.name.localeCompare(b.name);
          });

          return sortedList.length > 0 && (
            <div key={category} className="bg-white border-2 border-ink p-4 shadow-hard-sm">
              <h3 className="font-mono text-xs font-bold bg-ink text-white inline-block px-2 py-1 mb-3 uppercase">{category}</h3>
              <div className="space-y-1">
                {sortedList.map((item, idx) => {
                  const isChecked = checkStock(item.name);
                  const isCustom = category === 'Custom';
                  const key = `${item.name}-${idx}`; // Unique key since we now allow dupes

                  return (
                    <div
                      key={key}
                      className={`flex items-start gap-3 p-2 transition group ${isChecked ? 'opacity-40 bg-gray-50' : 'hover:bg-yellow-50'}`}
                    >
                      <div
                        onClick={() => onToggleItem(item.name)}
                        className={`mt-0.5 text-ink transition-colors cursor-pointer group-hover:text-brand-600`}
                      >
                        {isChecked ? <CheckSquare size={18} strokeWidth={2} /> : <Square size={18} strokeWidth={2} />}
                      </div>
                      <div className="flex-1 leading-tight flex justify-between items-start">
                        <div>
                          <p className={`font-bold text-sm ${isChecked ? 'line-through decoration-2 decoration-ink text-gray-500' : 'text-ink'}`}>
                            {item.name}
                          </p>
                          {!isCustom && (
                            <div className="flex flex-col gap-0.5 mt-0.5">
                              <span className="font-mono text-xs text-gray-700 font-bold">{item.quantity}</span>
                              {/* CONTEXT: Show which dish this is for */}
                              <span className="text-[9px] uppercase text-gray-400 flex items-center gap-1">
                                <Utensils size={8} /> {item.source}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 items-center">
                          {!isCustom && !isChecked && (
                            getCommerceLinks(item.name).slice(0, 2).map(link => (
                              <a
                                key={link.name}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`text-[9px] font-bold uppercase px-2 py-1 rounded-md flex items-center gap-1.5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all
                                    ${link.name === 'Blinkit' ? 'bg-[#F8CB46] text-black' :
                                    link.name === 'Zepto' ? 'bg-[#350F9C] text-white' :
                                      'bg-[#FC8019] text-white'}`}
                                title={`Buy on ${link.name}`}
                              >
                                {/* Using text fallback for logos, but styled better */}
                                <span className="font-black tracking-tighter">{link.name}</span>
                                <ExternalLink size={10} className="opacity-70" />
                              </a>
                            ))
                          )}
                          {isCustom && (
                            <button onClick={() => removeCustom(item.name)} className="text-gray-400 hover:text-red-500">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center mt-20 text-gray-400">
            <ShoppingCart size={48} className="mb-4 opacity-20" />
            <p className="font-mono text-sm uppercase">No Active Requirements</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroceryList;