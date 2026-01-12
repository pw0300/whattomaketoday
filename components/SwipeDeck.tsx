
import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from 'framer-motion';
import { Dish, SwipeDirection, ImageSize, UserProfile } from '../types';
import { Heart, X, Star, Link2, Sparkles, Loader2, UploadCloud, Info, Quote, ShoppingBasket, MessageSquarePlus, RefreshCcw, RotateCcw, Grid3X3, Layers, Search, Trash2, Edit, PackageCheck, BrainCircuit, Terminal, Globe } from 'lucide-react';
import { analyzeAndGenerateDish } from '../services/geminiService';

interface Props {
    dishes: Dish[];
    approvedDishes: Dish[];
    approvedCount: number;
    onSwipe: (dishId: string, direction: SwipeDirection) => void;
    onUndo?: () => void;
    onModify: (dish: Dish) => void;
    onImport: (dish: Dish) => void;
    onDelete: (dishId: string) => void;
    pantryStock: string[];
    userProfile: UserProfile;
    initialImportTab?: 'text' | 'image' | 'video' | 'pantry' | null;
    fetchingMore?: boolean;
}

type ImportTab = 'text' | 'image' | 'video' | 'pantry';
type ViewMode = 'deck' | 'registry';

const LOADING_STEPS = [
    { label: "Sourcing Global Trends", icon: Globe },
    { label: "Validating Bio-Constraints", icon: PackageCheck },
    { label: "Calculating Flavor Synergy", icon: BrainCircuit },
    { label: "Optimizing Pantry Delta", icon: ShoppingBasket },
    { label: "Compiling Chef Instructions", icon: Terminal }
];

const SwipeDeck: React.FC<Props> = ({ dishes, approvedDishes, approvedCount, onSwipe, onUndo, onModify, onImport, onDelete, pantryStock, userProfile, initialImportTab, fetchingMore }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('deck');
    const [activeIndex, setActiveIndex] = useState(0);
    const [loadingStep, setLoadingStep] = useState(0);

    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-15, 15]);

    const borderRight = useTransform(x, [0, 150], ["#18181b", "#22c55e"]);
    const borderLeft = useTransform(x, [0, -150], ["#18181b", "#ef4444"]);
    const borderUp = useTransform(y, [0, -150], ["#18181b", "#3b82f6"]);

    const longPressTimer = useRef<number | null>(null);

    // Import State
    const [showImport, setShowImport] = useState(false);
    const [importTab, setImportTab] = useState<ImportTab>('text');
    const [inputText, setInputText] = useState('');
    const [customInstruction, setCustomInstruction] = useState('');
    const [isImporting, setIsImporting] = useState(false);

    // Registry Search
    const [registrySearch, setRegistrySearch] = useState('');

    // Sourcing Simulation
    useEffect(() => {
        if (fetchingMore) {
            const interval = setInterval(() => {
                setLoadingStep(prev => (prev + 1) % LOADING_STEPS.length);
            }, 2000);
            return () => clearInterval(interval);
        }
    }, [fetchingMore]);

    useEffect(() => {
        if (initialImportTab) {
            setShowImport(true);
            setImportTab(initialImportTab);
        }
    }, [initialImportTab]);

    const [feedback, setFeedback] = useState<{ text: string, color: string, rotation: number } | null>(null);

    const safeDishes = dishes || [];
    const currentDish = safeDishes[activeIndex];
    const isDeckEmpty = !currentDish || activeIndex >= safeDishes.length;
    const goal = 7;

    const getPantryMatch = (dish: Dish) => {
        if (!dish || !dish.ingredients) return 0;
        const normalize = (s: string) => s.toLowerCase().trim();
        let matches = 0;
        dish.ingredients.forEach(ing => {
            if (pantryStock.some(p => normalize(p).includes(normalize(ing.name)))) matches++;
        });
        return Math.round((matches / (dish.ingredients.length || 1)) * 100);
    };

    const currentMatch = currentDish ? getPantryMatch(currentDish) : 0;

    const triggerFeedback = (direction: SwipeDirection) => {
        if (direction === SwipeDirection.Right) setFeedback({ text: 'APPROVED', color: 'text-green-500 border-green-500', rotation: -6 });
        else if (direction === SwipeDirection.Left) setFeedback({ text: "86'D", color: 'text-red-500 border-red-500', rotation: 6 });
        else if (direction === SwipeDirection.Up) setFeedback({ text: 'STAPLE', color: 'text-blue-500 border-blue-500', rotation: 0 });
        setTimeout(() => setFeedback(null), 700);
    };

    const handleDragEnd = (event: any, info: PanInfo) => {
        if (!currentDish) return;
        const threshold = 100;
        if (info.offset.x > threshold) { triggerFeedback(SwipeDirection.Right); onSwipe(currentDish.id, SwipeDirection.Right); nextCard(); }
        else if (info.offset.x < -threshold) { triggerFeedback(SwipeDirection.Left); onSwipe(currentDish.id, SwipeDirection.Left); nextCard(); }
        else if (info.offset.y < -threshold) { triggerFeedback(SwipeDirection.Up); onSwipe(currentDish.id, SwipeDirection.Up); nextCard(); }
    };

    const nextCard = () => { setActiveIndex(prev => prev + 1); x.set(0); y.set(0); };

    const handleMagicImport = async () => {
        if (importTab === 'text' && !inputText.trim()) return;
        setIsImporting(true);
        const result = await analyzeAndGenerateDish(importTab, inputText || (importTab === 'pantry' ? pantryStock.join(',') : ''), '1K', userProfile, customInstruction);
        setIsImporting(false);
        if (result) { onImport(result); setShowImport(false); setInputText(''); }
    };

    return (
        <div className="relative w-full h-full flex flex-col items-center overflow-hidden bg-paper">

            {/* Intelligence Status Bar */}
            {fetchingMore && (
                <div className="absolute top-0 left-0 w-full h-1 bg-gray-200 z-50 overflow-hidden">
                    <motion.div
                        className="h-full bg-brand-500"
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                    />
                </div>
            )}

            {/* Header */}
            <div className="w-full px-4 pt-4 pb-2 z-10 border-b-2 border-ink bg-paper">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-3xl font-black text-ink uppercase tracking-tight leading-none">R&D Hub</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono text-[9px] text-gray-500 uppercase font-black">
                                {fetchingMore ? 'Intelligence Active' : 'Registry Database'}
                            </span>
                            {fetchingMore && <Loader2 className="animate-spin text-brand-500" size={10} />}
                        </div>
                    </div>
                    <div className="flex bg-gray-200 p-1 rounded-lg border-2 border-transparent">
                        <button onClick={() => setViewMode('deck')} className={`p-2 rounded transition-all ${viewMode === 'deck' ? 'bg-white shadow-sm text-ink' : 'text-gray-500'}`}><Layers size={18} /></button>
                        <button onClick={() => setViewMode('registry')} className={`p-2 rounded transition-all ${viewMode === 'registry' ? 'bg-white shadow-sm text-ink' : 'text-gray-500'}`}><Grid3X3 size={18} /></button>
                    </div>
                </div>

                {viewMode === 'deck' ? (
                    <div className="w-full">
                        <div className="flex justify-between items-end mb-1">
                            <span className="font-mono text-[10px] font-bold text-ink uppercase">Selection Goal</span>
                            <span className="font-mono text-[10px] font-bold text-ink">{approvedCount}/{goal}</span>
                        </div>
                        <div className="w-full h-1.5 bg-white border border-ink rounded-full overflow-hidden">
                            <div className="h-full bg-ink transition-all duration-300" style={{ width: `${Math.min((approvedCount / goal) * 100, 100)}%` }} />
                        </div>
                    </div>
                ) : (
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                        <input type="text" placeholder="Search approved..." className="w-full pl-9 pr-2 py-2 text-xs font-mono border-2 border-ink focus:outline-none focus:bg-yellow-50 rounded-md" value={registrySearch} onChange={(e) => setRegistrySearch(e.target.value)} />
                    </div>
                )}
            </div>

            {/* Main Area */}
            {viewMode === 'deck' ? (
                <div className="relative flex-1 w-full flex items-center justify-center p-4">
                    {isDeckEmpty ? (
                        /* GHOST SOURCING CONSOLE */
                        <div className="w-full max-w-xs aspect-[3/4.5] bg-ink text-white border-4 border-ink shadow-[12px_12px_0px_0px_rgba(0,0,0,0.1)] p-8 flex flex-col justify-center relative overflow-hidden rounded-2xl">
                            <div className="absolute top-4 left-4 font-mono text-[8px] uppercase tracking-widest opacity-40">Process: RECIPE_GEN_V2</div>
                            <div className="mb-8">
                                {React.createElement(LOADING_STEPS[loadingStep].icon, { className: "w-12 h-12 text-brand-500 mb-4 animate-pulse" })}
                                <h3 className="text-2xl font-black uppercase leading-none tracking-tighter">Sourcing Intel</h3>
                                <p className="font-mono text-[10px] text-brand-500 uppercase mt-2">{LOADING_STEPS[loadingStep].label}</p>
                            </div>

                            <div className="space-y-2 border-l-2 border-brand-500/20 pl-4 py-4">
                                {LOADING_STEPS.map((step, i) => (
                                    <div key={i} className={`flex items-center gap-2 transition-opacity duration-500 ${i === loadingStep ? 'opacity-100' : 'opacity-20'}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${i === loadingStep ? 'bg-brand-500' : 'bg-white'}`} />
                                        <span className="font-mono text-[8px] uppercase">{step.label}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 flex items-center gap-3">
                                <Loader2 className="animate-spin text-brand-500" size={16} />
                                <span className="font-mono text-[9px] uppercase font-bold text-white/40">Synchronizing with Knowledge Graph...</span>
                            </div>
                        </div>
                    ) : (
                        /* THE CARD DECK */
                        <div className="relative w-full max-w-xs aspect-[3/4.5]">
                            <div className="absolute inset-0 bg-white border-2 border-gray-300 shadow-sm translate-x-2 translate-y-2 -z-10 rounded-2xl" />
                            <motion.div
                                className="w-full h-full bg-white border-2 border-ink shadow-hard flex flex-col cursor-grab active:cursor-grabbing relative overflow-hidden rounded-2xl"
                                style={{ x, y, rotate, borderColor: x.get() > 0 ? borderRight : x.get() < 0 ? borderLeft : borderUp }}
                                drag
                                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                                onDragEnd={handleDragEnd}
                            >
                                {/* Card Header */}
                                <div className="bg-ink text-white py-3 px-4 flex justify-between items-center relative z-20">
                                    <span className="font-mono text-[10px] uppercase font-black tracking-widest">{currentDish.type}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-[10px] font-black opacity-50 uppercase mr-2">{currentDish.cuisine}</span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onModify(currentDish); }}
                                            className="bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors backdrop-blur-sm"
                                            title="View Details"
                                        >
                                            <Info size={14} className="text-white" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 p-6 flex flex-col">
                                    <h3 className="text-4xl font-black leading-[0.85] mb-2 text-ink uppercase tracking-tighter">{currentDish.name}</h3>
                                    <p className="font-serif italic text-lg text-gray-500 mb-4">{currentDish.localName}</p>

                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border-2 text-[9px] font-black uppercase mb-4 self-start ${currentMatch >= 75 ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-gray-200 bg-gray-50 text-gray-400'}`}>
                                        <PackageCheck size={12} />
                                        {currentMatch}% Pantry Sync
                                    </div>

                                    {currentDish.healthTags && currentDish.healthTags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-6">
                                            {currentDish.healthTags.slice(0, 3).map(tag => (
                                                <span key={tag} className="px-2 py-1 bg-green-50 border border-green-200 text-green-700 text-[9px] font-bold uppercase rounded-md">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <p className="font-mono text-xs leading-relaxed text-gray-700 mb-8 border-l-2 border-ink/10 pl-4 py-2">
                                        {currentDish.description}
                                    </p>

                                    {currentDish.chefAdvice && (
                                        <div className="mt-auto bg-paper border-2 border-ink p-4 relative rounded-xl shadow-hard-sm">
                                            <Quote size={20} className="absolute -top-3 -left-1 text-brand-500 fill-current" />
                                            <p className="font-mono text-[9px] font-black uppercase text-ink/30 mb-1">Dadi's Intel</p>
                                            <p className="font-serif italic text-sm text-ink leading-tight font-black">"{currentDish.chefAdvice}"</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex-1 w-full overflow-y-auto p-4 pb-20 grid grid-cols-2 gap-4">
                    {approvedDishes.filter(d => d.name.toLowerCase().includes(registrySearch.toLowerCase())).map(dish => (
                        <div key={dish.id} className="bg-white border-2 border-ink shadow-hard-sm p-4 rounded-xl relative group">
                            <span className="font-mono text-[8px] uppercase font-black bg-gray-100 px-1 py-0.5 mb-2 block w-max">{dish.type}</span>
                            <h4 className="font-black text-xs uppercase leading-tight line-clamp-2">{dish.name}</h4>
                            <div className="mt-4 flex gap-2">
                                <button onClick={() => onModify(dish)} className="p-2 border border-ink hover:bg-ink hover:text-white transition rounded-md"><Edit size={12} /></button>
                                <button onClick={() => onDelete(dish.id)} className="p-2 border border-ink hover:bg-red-500 hover:text-white transition rounded-md"><Trash2 size={12} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Global Controls */}
            {viewMode === 'deck' && (
                <div className="w-full px-8 pb-8 flex justify-center items-center gap-6 z-20">
                    <button onClick={() => setShowImport(true)} className="w-12 h-12 flex items-center justify-center bg-white border-2 border-ink shadow-hard rounded-xl"><Link2 size={20} /></button>
                    <button onClick={() => { triggerFeedback(SwipeDirection.Left); onSwipe(currentDish?.id, SwipeDirection.Left); nextCard(); }} disabled={isDeckEmpty} className="w-16 h-16 flex items-center justify-center bg-paper border-2 border-ink shadow-hard rounded-full text-red-500 disabled:opacity-30"><X size={32} strokeWidth={3} /></button>
                    <button onClick={() => { triggerFeedback(SwipeDirection.Up); onSwipe(currentDish?.id, SwipeDirection.Up); nextCard(); }} disabled={isDeckEmpty} className="w-12 h-12 flex items-center justify-center bg-paper border-2 border-ink shadow-hard rounded-xl text-blue-500 disabled:opacity-30"><Star size={24} strokeWidth={3} /></button>
                    <button onClick={() => { triggerFeedback(SwipeDirection.Right); onSwipe(currentDish?.id, SwipeDirection.Right); nextCard(); }} disabled={isDeckEmpty} className="w-16 h-16 flex items-center justify-center bg-ink border-2 border-ink shadow-hard rounded-full text-brand-500 disabled:opacity-30"><Heart size={32} strokeWidth={3} /></button>
                </div>
            )}

            {showImport && (
                <div className="fixed inset-0 z-[100] bg-ink/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
                    <div className="bg-paper w-full max-w-sm border-2 border-ink shadow-hard p-6 rounded-2xl relative">
                        <button onClick={() => setShowImport(false)} className="absolute top-4 right-4"><X size={24} /></button>
                        <h3 className="text-xl font-black uppercase mb-6 flex items-center gap-2"><Sparkles className="text-brand-500" /> Sourcing Intel</h3>
                        <div className="flex gap-2 mb-6">
                            {(['text', 'image', 'pantry'] as ImportTab[]).map(t => (
                                <button key={t} onClick={() => setImportTab(t)} className={`flex-1 py-2 font-mono text-[10px] font-black uppercase border-2 ${importTab === t ? 'bg-ink text-white' : 'bg-white'}`}>{t}</button>
                            ))}
                        </div>
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            className="w-full h-32 border-2 border-ink p-4 font-mono text-sm focus:outline-none mb-6 rounded-lg"
                            placeholder="Describe dish or paste URL..."
                        />
                        <button onClick={handleMagicImport} disabled={isImporting} className="w-full bg-brand-500 text-white font-black py-4 uppercase border-2 border-ink shadow-hard transition-all disabled:opacity-50 rounded-xl">
                            {isImporting ? <Loader2 className="animate-spin mx-auto" /> : "Initiate Import"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SwipeDeck;
