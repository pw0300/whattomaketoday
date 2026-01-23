import React, { useMemo, useState, useEffect } from 'react';
import { DayPlan, PantryItem } from '../types';
import { generateGroceryList, GroceryItem } from '../services/groceryService';
import { getCommerceLinks } from '../utils/commerceUtils';
import { Share2, CheckSquare, Square, ShoppingCart, Plus, Trash2, XCircle, Utensils, ExternalLink } from 'lucide-react';

interface Props {
  plan: DayPlan[];
  pantryStock: PantryItem[];
  onToggleItem: (ingredientName: string) => void;
  onPrintTicket: () => void;
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

  // Helper for Custom Items checks (Service handles Plan items)
  const checkStockForCustom = (needed: string) => {
    const clean = (s: string) => s.toLowerCase().trim().replace(/s$/, '');
    const target = clean(needed);
    return pantryStock.some(s => clean(s.name) === target && (s.quantityType === 'binary' || s.quantityLevel > 0));
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
    const activeCustoms = customItems.filter(i => !checkStockForCustom(i));
    setCustomItems(activeCustoms);
  };

  // Group and AGGREGATE ingredients using Service
  const categorizedIngredients = useMemo<Record<string, GroceryItem[]>>(() => {
    // 1. Get Plan Items via Service
    // Map PantryItems to simple strings for the service (name only)
    // The service handles fuzzy matching
    const pantryNames = pantryStock
      .filter(p => p.quantityType === 'binary' || p.quantityLevel > 0)
      .map(p => p.name);

    const serviceItems = generateGroceryList(plan, pantryNames);

    // 2. Bucket them
    const agg: Record<string, GroceryItem[]> = {
      Produce: [], Protein: [], Dairy: [], Pantry: [], Spices: [], Custom: []
    };

    serviceItems.forEach(item => {
      const cat = item.category || 'Pantry';
      if (agg[cat]) {
        agg[cat].push(item);
      } else {
        agg['Pantry'].push(item); // Fallback
      }
    });

    // 3. Add Custom Items
    customItems.forEach(name => {
      const isStocked = checkStockForCustom(name);
      agg['Custom'].push({
        name,
        quantity: '1 unit',
        category: 'Pantry',
        // @ts-ignore - 'sourceDishes' is part of GroceryItem interface but we are manually constructing it for custom
        sourceDishes: ['Manual Entry'],
        isStocked,
        totalQuantity: 1,
        unit: 'unit'
      } as GroceryItem);
    });

    return agg;
  }, [plan, customItems, pantryStock]);

  const isEmpty = Object.values(categorizedIngredients).every((list) => list.length === 0);
  const lists = Object.values(categorizedIngredients);
  const totalItems = lists.reduce((acc, list) => acc + list.length, 0);
  // Count stocked items
  const checkedItems = lists.flat().filter(i => i.isStocked).length;
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
        {customItems.some(i => checkStockForCustom(i)) && (
          <button
            onClick={handleClearCompleted}
            className="w-full mb-4 text-[10px] font-bold uppercase text-red-500 hover:text-red-700 flex items-center justify-center gap-1 border border-red-200 bg-red-50 p-2"
          >
            <XCircle size={12} /> Clear Checked Custom Items
          </button>
        )}

        {Object.entries(categorizedIngredients).map(([category, items]) => {
          // SORTING LOGIC: 
          // 1. Unchecked first
          // 2. Then Alphabetical by Name
          const sortedList = [...items].sort((a, b) => {
            if (a.isStocked !== b.isStocked) return a.isStocked ? 1 : -1;
            return a.name.localeCompare(b.name);
          });

          return sortedList.length > 0 && (
            <div key={category} className="bg-white border-2 border-ink p-4 shadow-hard-sm">
              <h3 className="font-mono text-xs font-bold bg-ink text-white inline-block px-2 py-1 mb-3 uppercase">{category}</h3>
              <div className="space-y-1">
                {sortedList.map((item, idx) => {
                  const isChecked = item.isStocked;
                  const isCustom = category === 'Custom';
                  const key = `${item.name}-${idx}`;

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
                        <div className="flex-1">
                          <p className={`font-bold text-sm ${isChecked ? 'line-through decoration-2 decoration-ink text-gray-500' : 'text-ink'}`}>
                            {item.name}
                          </p>
                          {!isCustom && (
                            <div className="flex flex-col gap-0.5 mt-0.5">
                              <span className="font-mono text-xs text-gray-700 font-bold">{item.quantity}</span>
                              {/* CONTEXT: Show source(s) with expandable breakdown */}
                              {(() => {
                                const hasMultipleSources = item.sourceDishes.length > 1;

                                return hasMultipleSources ? (
                                  <details className="text-[9px] uppercase text-gray-400 cursor-pointer">
                                    <summary className="flex items-center gap-1 hover:text-gray-600">
                                      <Utensils size={8} /> {item.sourceDishes.length} dishes
                                    </summary>
                                    <ul className="mt-1 ml-3 space-y-0.5 text-gray-500">
                                      {item.sourceDishes.map((s, i) => (
                                        <li key={i} className="flex items-center gap-1">
                                          <span className="text-[8px]">•</span>
                                          <span>{s}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </details>
                                ) : (
                                  <span className="text-[9px] uppercase text-gray-400 flex items-center gap-1">
                                    <Utensils size={8} /> {item.sourceDishes[0]}
                                  </span>
                                );
                              })()}
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