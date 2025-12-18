import React, { useState } from 'react';
import { Package, Plus, X, ChefHat, Tag, Trash2, Layers } from 'lucide-react';

interface Props {
  pantryStock: string[];
  onToggleItem: (item: string) => void;
  onBatchAdd: (items: string[]) => void;
  onClear: () => void;
  onCookFromPantry: () => void;
}

const SMART_STAPLES = [
  {
      label: 'Basics',
      items: ['Salt', 'Pepper', 'Olive Oil', 'Vegetable Oil', 'Sugar', 'Flour']
  },
  {
      label: 'Indian Kit',
      items: ['Cumin', 'Turmeric', 'Chili Powder', 'Garam Masala', 'Basmati Rice', 'Lentils']
  },
  {
      label: 'Italian Kit',
      items: ['Pasta', 'Canned Tomatoes', 'Garlic', 'Oregano', 'Basil', 'Parmesan']
  },
  {
      label: 'Asian Kit',
      items: ['Soy Sauce', 'Sesame Oil', 'Rice Vinegar', 'Ginger', 'Jasmine Rice']
  },
  {
      label: 'Fridge',
      items: ['Eggs', 'Milk', 'Butter', 'Onions', 'Potatoes']
  }
];

const PantryView: React.FC<Props> = ({ pantryStock, onToggleItem, onBatchAdd, onClear, onCookFromPantry }) => {
  const [newItem, setNewItem] = useState('');

  // Helper to normalize input visually
  const toTitleCase = (str: string) => {
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  };

  const handleAddItem = () => {
    if (newItem.trim()) {
      const itemsToAdd = newItem.split(',').map(i => i.trim()).filter(i => i.length > 0);
      itemsToAdd.forEach(item => {
        if (item.length > 30) return;
        const formatted = toTitleCase(item);
        const exists = pantryStock.some(p => p.toLowerCase().trim() === formatted.toLowerCase().trim());
        if (!exists) {
           onToggleItem(formatted);
        }
      });
      setNewItem('');
    }
  };

  const sortedStock = [...pantryStock].sort();

  return (
    <div className="flex flex-col h-full bg-paper">
      <div className="p-4 border-b-2 border-ink flex justify-between items-center sticky top-0 bg-paper z-10">
        <div>
          <h2 className="text-2xl font-black uppercase text-ink">Inventory</h2>
          <p className="font-mono text-xs text-gray-600">Kitchen Stock</p>
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={onClear}
                disabled={pantryStock.length === 0}
                className="bg-red-100 text-red-500 p-2 border-2 border-red-200 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors disabled:opacity-0"
            >
                <Trash2 size={16} />
            </button>
            <div className="bg-ink text-white px-2 py-1 font-mono text-xs font-bold border-2 border-ink">
                {pantryStock.length} ITEMS
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-32">
        {/* Add Item Input */}
        <div className="flex gap-2 mb-6">
            <div className="flex-1 relative">
                <input 
                    type="text" 
                    value={newItem}
                    maxLength={100}
                    onChange={(e) => setNewItem(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                    placeholder="Add items (comma separated)..."
                    className="w-full border-2 border-ink p-3 pl-10 font-mono text-sm focus:bg-yellow-50 focus:outline-none"
                />
                <Package className="absolute top-3.5 left-3 text-gray-400" size={16} />
            </div>
            <button 
                onClick={handleAddItem}
                className="bg-ink text-white px-4 border-2 border-ink shadow-hard hover:translate-y-1 hover:shadow-none transition-all"
            >
                <Plus size={20} />
            </button>
        </div>

        {/* Smart Staples Groups */}
        <div className="mb-8">
           <div className="flex items-center gap-2 mb-3 opacity-60">
             <Layers size={12} />
             <span className="font-mono text-[10px] uppercase font-bold tracking-wider">Quick Kits</span>
           </div>
           <div className="grid grid-cols-3 gap-2">
             {SMART_STAPLES.map(group => {
                 // Check if all items in this group are present
                 const isComplete = group.items.every(i => pantryStock.some(p => p.toLowerCase() === i.toLowerCase()));
                 
                 return (
                    <button
                        key={group.label}
                        onClick={() => onBatchAdd(group.items)}
                        disabled={isComplete}
                        className={`text-[10px] font-bold uppercase border-2 p-2 flex flex-col items-center gap-1 transition-all ${isComplete ? 'border-gray-200 text-gray-300 bg-gray-50' : 'border-ink bg-white text-ink hover:bg-yellow-50 hover:shadow-hard-sm'}`}
                    >
                        <Tag size={12} className={isComplete ? 'opacity-20' : 'opacity-100'} />
                        {group.label}
                    </button>
                 );
             })}
           </div>
        </div>

        {/* Stock List */}
        <div>
             <div className="flex items-center gap-2 mb-3 opacity-60">
                <Package size={12} />
                <span className="font-mono text-[10px] uppercase font-bold tracking-wider">Current Stock</span>
             </div>
            {sortedStock.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400 opacity-50 border-2 border-dashed border-gray-200">
                    <Package size={48} strokeWidth={1} />
                    <p className="font-mono text-xs mt-4 uppercase tracking-widest">Pantry Empty</p>
                </div>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {sortedStock.map(item => (
                        <div key={item} className="bg-white border-2 border-ink p-1 pl-3 pr-2 flex items-center gap-2 shadow-hard-sm animate-in fade-in zoom-in duration-200 group hover:border-red-500 transition-colors">
                            <span className="font-bold text-sm uppercase text-ink group-hover:text-red-500">{item}</span>
                            <button 
                                onClick={() => onToggleItem(item)}
                                className="hover:bg-red-100 p-1 rounded-sm transition-colors text-gray-400 hover:text-red-500"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>

      {/* Floating Action for Pantry Cook */}
      <div className="fixed bottom-24 right-6 z-20">
            <button
            onClick={onCookFromPantry}
            disabled={pantryStock.length === 0}
            className="bg-brand-500 text-white p-4 rounded-full border-2 border-ink shadow-hard flex items-center gap-2 disabled:opacity-50 disabled:shadow-none transition-all hover:scale-105 active:scale-95 active:bg-brand-600"
            >
                <ChefHat size={20} strokeWidth={2.5} />
                <span className="font-black uppercase text-xs tracking-wider">Cook Now</span>
            </button>
      </div>
    </div>
  );
};

export default PantryView;