import React, { useState } from 'react';
import { enrichDishDetails } from '../services/geminiService';
import { Dish, UserProfile } from '../types';
import { getScaledQuantity } from '../utils/quantityUtils';
import { Save, X, ChefHat, ScrollText, Users, Play, Lock, Sparkles, Loader2 } from 'lucide-react';
import ChefModeView from './dish/ChefModeView';

interface Props {
    dish: Dish;
    userProfile?: UserProfile;
    onClose: () => void;
    onSave: (dishId: string, notes: string, servings: number) => void;
    onCook?: (dish: Dish, usedIngredients: string[]) => void;
    onUpdate?: (dish: Dish) => void;
}

const DishModal: React.FC<Props> = ({ dish, userProfile, onClose, onSave, onCook, onUpdate }) => {
    const [notes, setNotes] = useState(dish.userNotes || '');
    const [tab, setTab] = useState<'recipe' | 'notes'>('recipe');
    const [servings, setServings] = useState(dish.servings || 1);
    const [chefMode, setChefMode] = useState(false);
    const [isEnriching, setIsEnriching] = useState(false);
    const [isHydrating, setIsHydrating] = useState(false);

    // LAZY HYDRATION: Self-repair if dish is missing data (Ghost Dish Check)
    React.useEffect(() => {
        const needsRepair = !dish.ingredients || dish.ingredients.length === 0 || !dish.instructions || dish.instructions.length === 0;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isLocked = (dish as any).isLocked;

        if (needsRepair && !isHydrating && !isEnriching && !isLocked) {
            console.log("[DishModal] Dish missing data (Ghost). Triggering Lazy Hydration for:", dish.name);
            setIsHydrating(true);
            import('../services/geminiService').then(({ enrichDishDetails }) => {
                enrichDishDetails(dish, userProfile).then(fullDish => {
                    if (onUpdate) onUpdate(fullDish);
                    setIsHydrating(false);
                }).catch(err => {
                    console.error("Hydration Failed", err);
                    setIsHydrating(false);
                });
            });
        }
    }, [dish.id]); // Only run once per dish open


    const handleCommit = () => {
        onSave(dish.id, notes, servings);
        onClose();
    };

    const handleChefFinish = (usedIngredients: string[]) => {
        if (onCook) {
            onCook(dish, usedIngredients);
        }
        onClose();
    };

    // --- CHEF MODE RENDER ---
    if (chefMode) {
        return (
            <ChefModeView
                dish={dish}
                servings={servings}
                onClose={() => setChefMode(false)}
                onFinish={handleChefFinish}
            />
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
                        <span className="font-mono text-[10px] uppercase bg-ink text-white px-1">Recipe</span>
                        <h3 className="font-black text-2xl uppercase mt-2 leading-none text-ink">{dish.name}</h3>
                        <p className="font-serif italic text-gray-600 mt-1">{dish.localName}</p>
                    </div>
                </div>

                {(isHydrating || isEnriching) && (
                    <div className="p-2 bg-blue-50 border-b border-blue-100 flex items-center gap-2 justify-center text-xs font-bold text-blue-700 animate-pulse">
                        <Loader2 className="animate-spin" size={14} /> RESTORING RECIPE DATA...
                    </div>
                )}

                {!isHydrating && (
                    <div className="mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-[10px] text-yellow-800 flex items-center gap-2 mx-4">
                        <span className="font-bold">⚠️ AI GENERATED:</span> Verify ingredients and instructions before cooking.
                    </div>
                )}

                {/* Tab Switcher */}
                <div className="flex border-b-2 border-ink">
                    <button
                        onClick={() => setTab('recipe')}
                        className={`flex-1 py-4 text-xs font-bold uppercase flex items-center justify-center gap-2 transition-colors ${tab === 'recipe' ? 'bg-ink text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
                    >
                        <ChefHat size={16} /> Ingredients
                    </button>
                    <button
                        onClick={() => setTab('notes')}
                        className={`flex-1 py-4 text-xs font-bold uppercase flex items-center justify-center gap-2 transition-colors ${tab === 'notes' ? 'bg-ink text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
                    >
                        <ScrollText size={16} /> Notes
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-white flex flex-col">
                    {tab === 'recipe' ? (
                        <div className="space-y-8 flex-1">
                            {/* Serving Scaler */}
                            <div className="bg-blue-50 border border-blue-200 p-3 flex justify-between items-center">
                                <div className="flex items-center gap-2 text-blue-800">
                                    <Users size={16} />
                                    <span className="font-mono text-xs font-bold uppercase">Servings</span>
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
                                <h4 className="font-mono text-xs font-bold text-ink bg-gray-100 inline-block px-2 py-1 mb-4 uppercase">Ingredients</h4>
                                <ul className="space-y-2">
                                    {dish.ingredients.map((ing, i) => (
                                        <li key={i} className="text-sm font-medium flex justify-between items-end border-b border-dashed border-gray-300 pb-1">
                                            <span className="text-ink">{ing.name}</span>
                                            <span className={`font-mono text-xs ${servings > 1 ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
                                                {getScaledQuantity(ing.quantity, servings)}
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
                                <Play size={20} fill="currentColor" /> Start Cooking
                            </button>

                            {/* Instructions Preview */}
                            <div className="opacity-60 grayscale">
                                <h4 className="font-mono text-xs font-bold text-ink bg-gray-100 inline-block px-2 py-1 mb-4 uppercase">Instructions</h4>
                                {dish.instructions && dish.instructions.length > 0 ? (
                                    <ol className="space-y-4">
                                        {dish.instructions.slice(0, 3).map((step, i) => (
                                            <li key={i} className="text-sm flex gap-4">
                                                <span className="shrink-0 w-6 h-6 border-2 border-ink text-ink flex items-center justify-center font-mono text-xs font-bold">{i + 1}</span>
                                                <span className="text-gray-800 leading-snug pt-0.5 line-clamp-2">{step}</span>
                                            </li>
                                        ))}
                                        {dish.instructions.length > 3 && (
                                            <li className="text-xs text-center italic font-mono pt-2">...Start Cooking to see full steps</li>
                                        )}
                                    </ol>
                                ) : (
                                    <div className="mt-8 bg-gradient-to-br from-brand-50 to-brand-100/50 border border-brand-200 p-6 rounded-xl text-center relative overflow-hidden group">
                                        {/* Background Decoration */}
                                        <ChefHat className="absolute top-[-20%] right-[-10%] text-brand-500/5 w-32 h-32 rotate-12 group-hover:rotate-0 transition-transform duration-700" />

                                        <h4 className="font-mono text-xs font-black uppercase text-brand-800 mb-2">Want to cook this?</h4>
                                        <p className="text-xs text-brand-700 mb-4 px-4 leading-relaxed">
                                            Unlock the full step-by-step guide, precise measurements, and chef's secrets.
                                        </p>

                                        {onUpdate && (
                                            <button
                                                onClick={async () => {
                                                    setIsEnriching(true);
                                                    const richDish = await enrichDishDetails(dish, userProfile);
                                                    onUpdate(richDish);
                                                    setIsEnriching(false);
                                                }}
                                                disabled={isEnriching}
                                                className="w-full bg-brand-500 hover:bg-brand-600 text-white py-3 px-4 font-black uppercase text-xs tracking-wider rounded-lg shadow-hard-sm hover:shadow-hard active:translate-y-px active:shadow-none transition-all flex items-center justify-center gap-2"
                                            >
                                                {isEnriching ? (
                                                    <>
                                                        <Loader2 className="animate-spin" size={14} /> Chef is writing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles size={14} /> Generate Full Recipe
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* COMMIT BUTTON IN RECIPE TAB TOO */}
                            <button
                                onClick={handleCommit}
                                className="w-full mt-4 bg-white text-ink border-2 border-ink py-3 font-bold uppercase tracking-wider hover:bg-gray-50 transition-all text-xs"
                            >
                                <Save size={14} className="inline mr-2" /> Save & Close
                            </button>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col">
                            <label className="block font-mono text-xs font-bold text-ink uppercase mb-2">
                                My Notes
                            </label>
                            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                                These notes will be saved for next time.
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
                                <Save size={18} className="inline mr-2" /> Save Notes
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DishModal;