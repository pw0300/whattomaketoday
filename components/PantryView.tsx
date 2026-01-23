import React, { useState } from 'react';
import { Package, Plus, X, ChefHat, Trash2, Search } from 'lucide-react';
import { PantryItem } from '../types';
import PantryItemCard from './PantryItemCard';
import AddPantryItemDrawer from './AddPantryItemDrawer';

interface Props {
  pantryStock: PantryItem[];
  onToggleItem: (item: string) => void; // Keeps using string name for simple toggle
  onBatchAdd: (items: string[]) => void;
  onClear: () => void;
  onCookFromPantry: () => void;
}

const SMART_STAPLES = [
  { label: 'Basics', items: ['Salt', 'Pepper', 'Olive Oil', 'Sugar', 'Flour'] },
  { label: 'Indian', items: ['Turmeric', 'Cumin', 'Lentils', 'Basmati Rice'] },
  { label: 'Fridge', items: ['Eggs', 'Milk', 'Butter', 'Onion', 'Potato'] }
];

const PantryView: React.FC<Props> = ({ pantryStock, onToggleItem, onBatchAdd, onClear, onCookFromPantry }) => {
  const [newItem, setNewItem] = useState('');
  const [unknownIngredients, setUnknownIngredients] = useState<string[]>([]);
  const [auditMode, setAuditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleAddItem = () => {
    if (newItem.trim()) {
      const items = newItem.split(',').map(i => i.trim()).filter(i => i.length > 0);
      items.forEach(i => onToggleItem(i));
      setNewItem('');
    }
  };

  const sortedStock = [...pantryStock]
    .filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);

  // Helper now uses object internally, but prop expects string[] for batch
  const handleBatchAdd = (items: string[]) => {
    onBatchAdd(items);
  };

  const manualAdd = (name: string) => {
    // Toggle logic in Dashboard checks existence. 
    // If we want "Add", we should ensure it adds.
    // Since Dashboard uses `togglePantryItem`, if we pass a name that EXISTS, it might remove it?
    // Wait, `onToggleItem` takes a string.
    // We need to implement `onAdd` prop or rely on `onBatchAdd`?
    // onBatchAdd takes string[]. Let's use that.
    onBatchAdd([name]);
  };

  return (
    <div className="flex flex-col h-full bg-paper">
      <div className="p-4 border-b-2 border-ink bg-paper sticky top-0 z-20">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-3xl font-black uppercase text-ink leading-none">Manifest</h2>
            <p className="font-mono text-[10px] text-gray-500 uppercase mt-1">Operational Inventory</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setAuditMode(!auditMode)}
              className={`px-4 py-2 font-black text-[10px] uppercase border-2 transition-all ${auditMode ? 'bg-red-500 text-white border-ink shadow-hard-sm' : 'bg-white text-ink border-ink'}`}
            >
              {auditMode ? 'Confirm Audit' : 'Inventory Audit'}
            </button>
            <div className="bg-ink text-white px-3 py-2 font-mono text-[10px] font-black border-2 border-ink">
              {pantryStock.length} UNIT
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search inventory..."
              className="w-full pl-9 pr-4 py-3 bg-white border-2 border-ink font-mono text-xs focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {!auditMode && (
            <button onClick={() => setIsAddDrawerOpen(true)} className="bg-brand-500 text-white px-4 rounded-none border-2 border-ink shadow-hard active:translate-y-1 active:shadow-none hover:bg-brand-400 transition-all flex items-center justify-center">
              <Plus size={20} strokeWidth={3} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-32 space-y-4">
        {!auditMode && (
          <>
            <div className="grid grid-cols-3 gap-2 py-4">
              {SMART_STAPLES.map(g => (
                <button key={g.label} onClick={() => onBatchAdd(g.items)} className="bg-white border-2 border-ink p-2 font-mono text-[9px] font-black uppercase hover:bg-yellow-50">{g.label}</button>
              ))}
            </div>
          </>
        )}

        {auditMode && (
          <div className="bg-red-50 border-4 border-dashed border-red-500 p-4 mb-4">
            <p className="font-black uppercase text-xs text-red-600 mb-1">Audit Protocol Active</p>
            <p className="font-mono text-[9px] text-red-500">Swipe Left to remove items or update quantity levels.</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3">
          {/* TODO: Add Grouping by Category */}
          {sortedStock.map(item => (
            <PantryItemCard
              key={item.id}
              item={item}
              onUpdate={(updates) => {
                // We need a proper update handler prop passed down from Dashboard -> useStore
                // For now, toggleItem only adds/removes.
                // Ideally we should dispatch an 'updateItem' action.
                // I will defer this implementation until I add 'updatePantryItem' to Store
                console.log("Update item", item.id, updates);
              }}
              onDelete={() => onToggleItem(item.name)} // Toggle removes if exists
              onAddToGrocery={() => {
                // TODO: Add to grocery list logic
                console.log("Add to grocery", item.id);
                onToggleItem(item.name); // Remove from pantry? Or keep?
              }}
            />
          ))}

          {sortedStock.length === 0 && (
            <div className="w-full py-20 text-center opacity-10">
              <Package size={64} className="mx-auto mb-4" />
              <p className="font-black text-2xl uppercase">Zero Inventory</p>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-24 right-6 flex flex-col gap-3 items-end">
        <button
          onClick={onCookFromPantry}
          className="bg-brand-500 text-white p-5 rounded-full border-4 border-ink shadow-hard flex items-center gap-3 transition-all hover:scale-105 active:scale-95"
        >
          <ChefHat size={24} strokeWidth={3} />
          <span className="font-black uppercase text-sm tracking-tighter">Kitchen Autopilot</span>
        </button>
      </div>
      <AddPantryItemDrawer
        isOpen={isAddDrawerOpen}
        onClose={() => setIsAddDrawerOpen(false)}
        onAdd={manualAdd}
      />
    </div>
  );
};

export default PantryView;
