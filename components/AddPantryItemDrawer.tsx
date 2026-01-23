import React, { useState, useEffect } from 'react';
import { X, Search, Plus, Loader2, Sparkles } from 'lucide-react';
import { PantryItem } from '../types';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (name: string, category?: string) => void;
}

// Common staples for suggestions
const STAPLES = [
    { name: 'Rice', category: 'Pantry' },
    { name: 'Dal', category: 'Pantry' },
    { name: 'Milk', category: 'Dairy' },
    { name: 'Eggs', category: 'Dairy' },
    { name: 'Onion', category: 'Produce' },
    { name: 'Potato', category: 'Produce' },
    { name: 'Tomato', category: 'Produce' },
    { name: 'Atta', category: 'Pantry' },
];

const AddPantryItemDrawer: React.FC<Props> = ({ isOpen, onClose, onAdd }) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState(STAPLES);

    useEffect(() => {
        if (query.trim() === '') {
            setSuggestions(STAPLES);
        } else {
            // Simple local filter + maybe future API search
            const lower = query.toLowerCase();
            const filtered = STAPLES.filter(s => s.name.toLowerCase().includes(lower));

            // Always offer the query as an option
            if (!filtered.some(s => s.name.toLowerCase() === lower)) {
                filtered.unshift({ name: query, category: 'Custom' });
            }
            setSuggestions(filtered);
        }
    }, [query]);

    const handleAdd = (name: string, category?: string) => {
        onAdd(name, category);
        setQuery('');
        // Don't close immediately, allow multiple adds
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-50"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: '0%' }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 bg-paper rounded-t-[32px] shadow-2xl z-50 max-h-[85vh] flex flex-col"
                    >
                        <div className="p-6 pb-2">
                            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6" />

                            <div className="relative">
                                <Search className="absolute left-4 top-4 text-gray-400" size={20} />
                                <input
                                    autoFocus
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="What did you buy?"
                                    className="w-full pl-12 pr-12 py-4 bg-white border-2 border-ink rounded-2xl text-lg font-bold placeholder:text-gray-300 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
                                />
                                {query && (
                                    <button
                                        onClick={() => setQuery('')}
                                        className="absolute right-4 top-4 text-gray-400 hover:text-ink"
                                    >
                                        <X size={20} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 pt-2">
                            <h3 className="text-xs font-bold uppercase text-gray-400 ml-2 mb-2 tracking-wider">
                                {query ? 'Suggestions' : 'Quick Add Staples'}
                            </h3>

                            <div className="grid grid-cols-1 gap-2">
                                {suggestions.map((item, idx) => (
                                    <button
                                        key={item.name + idx}
                                        onClick={() => handleAdd(item.name, item.category)}
                                        className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-brand-500 hover:bg-brand-50 transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs group-hover:bg-brand-200 group-hover:text-brand-700 transition-colors">
                                                {item.name.substring(0, 1)}
                                            </div>
                                            <span className="font-bold text-ink">{item.name}</span>
                                        </div>
                                        <Plus size={20} className="text-gray-300 group-hover:text-brand-600" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default AddPantryItemDrawer;
