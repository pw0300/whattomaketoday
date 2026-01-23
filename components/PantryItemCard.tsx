import React from 'react';
import { PantryItem } from '../types';
import { Minus, Plus, Trash2, ShoppingCart, AlertCircle } from 'lucide-react';
import { motion, PanInfo } from 'framer-motion';

interface Props {
    item: PantryItem;
    onUpdate: (updates: Partial<PantryItem>) => void;
    onDelete: () => void;
    onAddToGrocery: () => void;
}

const PantryItemCard: React.FC<Props> = ({ item, onUpdate, onDelete, onAddToGrocery }) => {
    const [swipeOffset, setSwipeOffset] = React.useState(0);

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (info.offset.x < -100) {
            // Swiped Left -> Delete/Empty
            onDelete();
        } else if (info.offset.x > 100) {
            // Swiped Right -> Add to Grocery (and maybe remove?)
            onAddToGrocery();
        }
    };

    const QuantityControl = () => {
        if (item.quantityType === 'binary') return null;

        if (item.quantityType === 'loose') {
            // Levels: 1 (Low), 2 (Med), 3 (High)
            // Render 3 bars
            return (
                <div className="flex gap-1 items-center" onClick={(e) => {
                    e.stopPropagation();
                    // Cycle: 3 -> 2 -> 1 -> 3
                    const next = item.quantityLevel === 1 ? 3 : item.quantityLevel - 1;
                    onUpdate({ quantityLevel: next });
                }}>
                    {[1, 2, 3].map(level => (
                        <div
                            key={level}
                            className={`w-2 h-4 rounded-sm transition-all ${item.quantityLevel >= level ? 'bg-brand-500' : 'bg-gray-200'}`}
                        />
                    ))}
                </div>
            );
        }

        if (item.quantityType === 'discrete') {
            return (
                <div className="flex items-center gap-2 bg-gray-100 rounded-full px-2 py-1" onClick={e => e.stopPropagation()}>
                    <button
                        onClick={() => onUpdate({ quantityLevel: Math.max(0, item.quantityLevel - 1) })}
                        className="p-1 hover:text-brand-600 rounded-full"
                    >
                        <Minus size={12} />
                    </button>
                    <span className="font-mono text-xs font-bold w-4 text-center">{item.quantityLevel}</span>
                    <button
                        onClick={() => onUpdate({ quantityLevel: item.quantityLevel + 1 })}
                        className="p-1 hover:text-brand-600 rounded-full"
                    >
                        <Plus size={12} />
                    </button>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="relative overflow-hidden rounded-xl h-16 group">
            {/* Background Actions */}
            <div className="absolute inset-0 flex justify-between items-center text-white px-6 font-bold uppercase text-xs">
                <div className="bg-green-500 absolute left-0 top-0 bottom-0 w-1/2 flex items-center pl-6">
                    <ShoppingCart className="mr-2" size={18} /> Restock
                </div>
                <div className="bg-red-500 absolute right-0 top-0 bottom-0 w-1/2 flex justify-end items-center pr-6">
                    Consumed <Trash2 className="ml-2" size={18} />
                </div>
            </div>

            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={handleDragEnd}
                whileDrag={{ scale: 1.02, cursor: 'grabbing' }}
                className="relative bg-white border-2 border-ink p-3 shadow-hard-sm flex items-center justify-between h-full z-10 cursor-grab active:cursor-grabbing"
            >
                <div className="flex items-center gap-3">
                    <div className={`w-2 h-8 rounded-full ${item.quantityType === 'loose' && item.quantityLevel === 1 ? 'bg-red-500' : 'bg-brand-200'}`} />
                    <div>
                        <h4 className={`font-bold text-sm text-ink leading-none ${item.quantityLevel === 0 ? 'opacity-50 line-through' : ''}`}>
                            {item.name}
                        </h4>
                        <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">{item.category}</span>
                    </div>
                </div>

                <QuantityControl />
            </motion.div>
        </div>
    );
};

export default PantryItemCard;
