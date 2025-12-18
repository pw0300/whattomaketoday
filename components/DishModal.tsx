import React, { useState } from 'react';
import { Dish } from '../types';
import { Save, X, ChefHat, ScrollText } from 'lucide-react';

interface Props {
  dish: Dish;
  onClose: () => void;
  onSave: (dishId: string, notes: string) => void;
}

const DishModal: React.FC<Props> = ({ dish, onClose, onSave }) => {
  const [notes, setNotes] = useState(dish.userNotes || '');
  const [tab, setTab] = useState<'recipe' | 'notes'>('recipe');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border-2 border-ink w-full max-w-sm shadow-hard overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header (No Image, just text for the 'Paper' vibe) */}
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

        <div className="flex-1 overflow-y-auto p-6 bg-white">
            {tab === 'recipe' ? (
                <div className="space-y-8">
                     {/* Ingredients */}
                    <div>
                        <h4 className="font-mono text-xs font-bold text-ink bg-gray-100 inline-block px-2 py-1 mb-4 uppercase">Mise En Place</h4>
                        <ul className="space-y-2">
                            {dish.ingredients.map((ing, i) => (
                                <li key={i} className="text-sm font-medium flex justify-between items-end border-b border-dashed border-gray-300 pb-1">
                                    <span className="text-ink">{ing.name}</span>
                                    <span className="font-mono text-xs text-gray-500">{ing.quantity}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    {/* Instructions */}
                    <div>
                        <h4 className="font-mono text-xs font-bold text-ink bg-gray-100 inline-block px-2 py-1 mb-4 uppercase">Fire / Steps</h4>
                         {dish.instructions && dish.instructions.length > 0 ? (
                            <ol className="space-y-4">
                                {dish.instructions.map((step, i) => (
                                    <li key={i} className="text-sm flex gap-4">
                                        <span className="shrink-0 w-6 h-6 border-2 border-ink text-ink flex items-center justify-center font-mono text-xs font-bold">{i + 1}</span>
                                        <span className="text-gray-800 leading-snug pt-0.5">{step}</span>
                                    </li>
                                ))}
                            </ol>
                        ) : (
                            <p className="font-mono text-xs text-red-500 uppercase border border-red-200 bg-red-50 p-2 text-center">Data Unavailable</p>
                        )}
                    </div>
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
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                    <button
                        onClick={() => { onSave(dish.id, notes); onClose(); }}
                        className="w-full mt-6 bg-ink text-white border-2 border-ink py-4 font-black uppercase tracking-wider shadow-hard-sm hover:translate-y-px hover:shadow-none transition-all"
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