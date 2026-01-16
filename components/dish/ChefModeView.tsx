import React, { useState, useEffect } from 'react';
import { Dish } from '../../types';
import { getScaledQuantity } from '../../utils/quantityUtils';
import { ArrowLeft, CheckCircle, Circle, CheckSquare, Square } from 'lucide-react';

interface Props {
    dish: Dish;
    servings: number;
    onClose: () => void;
    onFinish: (usedIngredients: string[]) => void;
}

const ChefModeView: React.FC<Props> = ({ dish, servings, onClose, onFinish }) => {
    const [showDepletion, setShowDepletion] = useState(false);
    const [ingredientsToRemove, setIngredientsToRemove] = useState<Set<string>>(new Set());
    const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
    const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());

    // Initialize Depletion logic: Auto-select Fresh items
    useEffect(() => {
        if (showDepletion) {
            const freshItems = new Set<string>();
            dish.ingredients.forEach(ing => {
                if (['Produce', 'Protein', 'Dairy'].includes(ing.category)) {
                    freshItems.add(ing.name);
                }
            });
            setIngredientsToRemove(freshItems);
        }
    }, [showDepletion, dish.ingredients]);

    // Disable body scroll when in Chef Mode
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

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
        onFinish(Array.from(ingredientsToRemove));
    };

    return (
        <div className="fixed inset-0 z-[60] bg-ink text-white flex flex-col animate-in slide-in-from-bottom duration-300">

            {/* Depletion Dialog Overlay */}
            {showDepletion && (
                <div className="absolute inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="bg-paper text-ink w-full max-w-sm p-6 shadow-hard border-2 border-white animate-in zoom-in-95 duration-200">
                        <h3 className="font-black uppercase text-xl mb-1">Update Pantry</h3>
                        <p className="font-mono text-xs text-gray-600 mb-4">Mark items as used to remove from pantry.</p>

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
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Chef Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/20 bg-ink sticky top-0 z-10">
                <button onClick={onClose} className="p-2 -ml-2 text-gray-400 hover:text-white">
                    <ArrowLeft size={24} />
                </button>
                <div className="text-center">
                    <h3 className="font-black uppercase text-sm tracking-widest text-brand-500">Cooking Mode</h3>
                    <p className="font-bold text-xs">{dish.name}</p>
                </div>
                <div className="w-8"></div> {/* Spacer */}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
                {/* Mise En Place Checklist */}
                <section>
                    <h4 className="font-mono text-xs font-bold text-brand-500 uppercase mb-4 tracking-widest border-b border-white/10 pb-2">
                        1. Ingredients
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
                                            {getScaledQuantity(ing.quantity, servings)}
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
                        2. Instructions
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
                                        <span className="font-mono text-xs text-brand-500 font-bold mb-1">STEP 0{i + 1}</span>
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
                        Done Cooking
                    </button>
                    <p className="font-mono text-[10px] uppercase mt-4 opacity-50">Screen Wake Lock Active</p>
                </div>
            </div>
        </div>
    );
};

export default ChefModeView;
