import React, { useMemo } from 'react';
import { DayPlan, Ingredient } from '../types';
import { Share2, CheckSquare, Square, ShoppingCart } from 'lucide-react';

interface Props {
  plan: DayPlan[];
  pantryStock: string[];
  onToggleItem: (ingredientName: string) => void;
  onPrintTicket: () => void;
}

const GroceryList: React.FC<Props> = ({ plan, pantryStock, onToggleItem, onPrintTicket }) => {
  
  // Group ingredients by category for display
  const categorizedIngredients = useMemo<Record<string, Ingredient[]>>(() => {
    const agg: Record<string, Ingredient[]> = {
      Produce: [], Protein: [], Dairy: [], Pantry: [], Spices: []
    };

    const seen = new Set<string>();

    const process = (ing: Ingredient) => {
      const key = `${ing.name}`;
      if (!seen.has(key)) {
        if (agg[ing.category]) {
            agg[ing.category].push(ing);
        } else {
            // Fallback to Pantry if category mismatch
            agg['Pantry'].push(ing);
        }
        seen.add(key);
      }
    };

    plan.forEach(day => {
      day.lunch?.ingredients.forEach(process);
      day.dinner?.ingredients.forEach(process);
    });

    return agg;
  }, [plan]);

  const isEmpty = Object.values(categorizedIngredients).every((list) => list.length === 0);

  return (
    <div className="flex flex-col h-full bg-paper">
      <div className="p-4 border-b-2 border-ink flex justify-between items-center sticky top-0 bg-paper z-10">
        <div>
          <h2 className="text-2xl font-black uppercase text-ink">Dry Storage</h2>
          <p className="font-mono text-xs text-gray-600">Reconcile Inventory</p>
        </div>
        <button 
          onClick={onPrintTicket}
          className="bg-brand-500 text-white border-2 border-ink px-4 py-2 font-bold uppercase shadow-hard hover:shadow-none hover:translate-y-1 transition active:bg-brand-600 flex items-center gap-2 text-xs"
        >
          <Share2 size={16} />
          Print Ticket
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-8 pb-24">
        {(Object.entries(categorizedIngredients)).map(([category, items]) => {
          const list = items as Ingredient[];
          return list.length > 0 && (
            <div key={category} className="bg-white border-2 border-ink p-4 shadow-hard-sm">
              <h3 className="font-mono text-xs font-bold bg-ink text-white inline-block px-2 py-1 mb-3 uppercase">{category}</h3>
              <div className="space-y-1">
                {list.map(item => {
                  const isChecked = pantryStock.includes(item.name);
                  return (
                    <div 
                      key={item.name} 
                      onClick={() => onToggleItem(item.name)}
                      className={`flex items-start gap-3 p-2 transition cursor-pointer group ${isChecked ? 'opacity-50' : 'hover:bg-yellow-50'}`}
                    >
                      <div className={`mt-0.5 text-ink transition-colors group-hover:text-brand-600`}>
                        {isChecked ? <CheckSquare size={18} strokeWidth={2} /> : <Square size={18} strokeWidth={2} />}
                      </div>
                      <div className="flex-1 leading-tight">
                        <p className={`font-bold text-sm ${isChecked ? 'line-through decoration-2 decoration-ink' : 'text-ink'}`}>
                          {item.name}
                        </p>
                        <p className="font-mono text-xs text-gray-500">{item.quantity}</p>
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
             <p className="font-mono text-sm uppercase">No Active Orders</p>
           </div>
        )}
      </div>
    </div>
  );
};

export default GroceryList;