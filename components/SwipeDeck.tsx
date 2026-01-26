import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from 'framer-motion';
import { Dish, SwipeDirection, ImageSize, UserProfile, PantryItem } from '../types';
import { Heart, X, Star, Link2, Sparkles, Loader2, UploadCloud, Info, Quote, ShoppingBasket, MessageSquarePlus, RefreshCcw, RotateCcw, Grid3X3, Layers, Search, Trash2, Edit, PackageCheck, BrainCircuit, Terminal, Globe } from 'lucide-react';
import { analyzeAndGenerateDish } from '../services/geminiService';
import { calculateHealthScore, getHealthColor } from '../utils/healthScoring';

interface Props {
    dishes: Dish[];
    approvedDishes: Dish[];
    approvedCount: number;
    onSwipe: (dishId: string, direction: SwipeDirection) => void;
    onUndo?: () => void;
    onModify: (dish: Dish) => void;
    onImport: (dish: Dish) => void;
    onDelete: (dishId: string) => void;
    pantryStock: PantryItem[];
    userProfile: UserProfile;
    initialImportTab?: 'text' | 'image' | 'video' | 'pantry' | null;
    fetchingMore?: boolean;
    onRequestMore: () => void;
}

type ImportTab = 'text' | 'image' | 'video' | 'pantry';
type ViewMode = 'deck' | 'registry';

const LOADING_STEPS = [
    { label: "Looking for recipes", icon: Globe },
    { label: "Checking your diet", icon: PackageCheck },
    { label: "Finding good matches", icon: BrainCircuit },
    { label: "Checking pantry", icon: ShoppingBasket },
    { label: "Preparing cards", icon: Terminal }
];

const SwipeDeck: React.FC<Props> = ({ dishes, approvedDishes, approvedCount, onSwipe, onUndo, onModify, onImport, onDelete, pantryStock, userProfile, initialImportTab, fetchingMore, onRequestMore }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('deck');
    const [activeIndex, setActiveIndex] = useState(0);
    const [loadingStep, setLoadingStep] = useState(0);

    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-15, 15]);

    const borderRight = useTransform(x, [0, 150], ["#18181b", "#22c55e"]);
    const borderLeft = useTransform(x, [0, -150], ["#18181b", "#ef4444"]);
    const borderUp = useTransform(y, [0, -150], ["#18181b", "#3b82f6"]);

    // BOUNTY FIX: Swipe Juice
    const likeOpacity = useTransform(x, [50, 150], [0, 1]);
    const nopeOpacity = useTransform(x, [-50, -150], [0, 1]);
    const superOpacity = useTransform(y, [-50, -150], [0, 1]);
    const scale = useTransform(x, [-150, 0, 150], [1.05, 1, 1.05]);

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

    // Track shown dishes for deduplication
    useEffect(() => {
        const trackDish = async () => {
            if (!currentDish) return;

            // Get userId from localStorage (set by Dashboard)
            const userId = localStorage.getItem('session_id');
            if (!userId) return;

            try {
                const { trackShownDish } = await import('../services/userHistoryService');
                await trackShownDish(userId, currentDish);
            } catch (e) {
                console.warn('[SwipeDeck] Failed to track shown dish:', e);
            }
        };

        trackDish();
    }, [currentDish?.id]); // Track when dish changes

    const getPantryMatch = (dish: Dish) => {
        if (!dish || !dish.ingredients) return 0;
        const normalize = (s: string) => s.toLowerCase().trim();
        let matches = 0;
        dish.ingredients.forEach(ing => {
            if (pantryStock.some(p => normalize(p.name).includes(normalize(ing.name)))) matches++;
        });
        return Math.round((matches / (dish.ingredients.length || 1)) * 100);
    };

    const currentMatch = currentDish ? getPantryMatch(currentDish) : 0;

    const triggerFeedback = (direction: SwipeDirection) => {
        if (direction === SwipeDirection.Right) setFeedback({ text: 'APPROVED', color: 'text-green-500 border-green-500', rotation: -6 });
        else if (direction === SwipeDirection.Left) setFeedback({ text: 'SKIPPED', color: 'text-red-500 border-red-500', rotation: 6 });
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

    // FIX: Reset to 0 since parent removes swiped dishes from array
    const nextCard = () => { setActiveIndex(0); x.set(0); y.set(0); };

    const handleMagicImport = async () => {
        if (importTab === 'text' && !inputText.trim()) return;
        setIsImporting(true);
        const result = await analyzeAndGenerateDish(importTab, inputText || (importTab === 'pantry' ? pantryStock.map(p => p.name).join(',') : ''), '1K', userProfile, customInstruction);
        setIsImporting(false);
        if (result) { onImport(result); setShowImport(false); setInputText(''); }
    };

    return (
        <div className="relative w-full h-full flex flex-col items-center overflow-hidden">

            {/* Premium Header */}
            <div className="w-full px-6 pt-4 pb-2 z-10 flex justify-between items-center bg-gradient-to-b from-background via-background to-transparent">
                <div>
                    <h2 className="text-3xl font-display font-black text-ink tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-ink to-ink-light">Discover</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-ink-light font-medium tracking-wide flex items-center gap-1.5 uppercase">
                            {fetchingMore ? <Loader2 size={8} className="animate-spin text-brand-500" /> : <div className="w-1.5 h-1.5 rounded-full bg-brand-500/50" />}
                            {fetchingMore ? 'AI Agent Curating...' : 'Your Cookbook'}
                        </span>
                    </div>
                </div>
                <div className="flex bg-white p-1 rounded-full shadow-sm border border-gray-100">
                    <button onClick={() => setViewMode('deck')} className={`p-2 rounded-full transition-all duration-300 ${viewMode === 'deck' ? 'bg-ink text-white shadow-md transform scale-105' : 'text-ink-light hover:bg-gray-50'}`} title="Swipe View"><Layers size={16} /></button>
                    <button onClick={() => setViewMode('registry')} className={`p-2 rounded-full transition-all duration-300 ${viewMode === 'registry' ? 'bg-ink text-white shadow-md transform scale-105' : 'text-ink-light hover:bg-gray-50'}`} title="Grid View"><Grid3X3 size={16} /></button>
                </div>
            </div>

            {/* Selection Progress (Minimal) */}
            {viewMode === 'deck' && (
                <div className="w-full px-6 mb-4">
                    <div className="flex justify-between items-end mb-1.5">
                        <span className="text-[10px] font-bold text-ink-light uppercase tracking-wider">Daily Goal</span>
                        <span className="text-[10px] font-bold text-ink">{approvedCount}/{goal}</span>
                    </div>
                    <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                            layout
                            className="h-full bg-gradient-brand shadow-[0_0_10px_rgba(249,115,22,0.4)]"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((approvedCount / goal) * 100, 100)}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Main Area */}
            {viewMode === 'deck' ? (
                <div className="relative flex-1 w-full flex items-center justify-center p-4 min-h-[400px]">
                    <AnimatePresence mode="wait">
                        {isDeckEmpty && fetchingMore ? (
                            /* PREMIUM SOURCING CONSOLE */
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                                key="console"
                                className="w-full max-w-xs aspect-[3/4.2] bg-ink text-white shadow-2xl p-8 flex flex-col justify-between relative overflow-hidden rounded-[32px]"
                            >
                                {/* Ambient Background Animation */}
                                <div className="absolute inset-0 z-0">
                                    <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-600/30 via-ink to-ink animate-pulse-slow" />
                                </div>

                                <div className="relative z-10">
                                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-brand-500/80 font-bold flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                                        System Active
                                    </span>
                                </div>

                                <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                                    <div className="bg-white/10 p-5 rounded-full backdrop-blur-md border border-white/10 shadow-float">
                                        {React.createElement(LOADING_STEPS[loadingStep].icon, { className: "w-10 h-10 text-brand-400 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" })}
                                    </div>

                                    <div>
                                        <h3 className="text-3xl font-display font-medium tracking-tight text-white mb-2">
                                            Finding
                                            <span className="block font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-brand-500">Inspiration</span>
                                        </h3>
                                        <p className="font-sans text-[12px] text-white/40 tracking-wide">{LOADING_STEPS[loadingStep].label}</p>
                                    </div>
                                </div>

                                <div className="relative z-10 space-y-3">
                                    <div className="space-y-2">
                                        <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden backdrop-blur-sm">
                                            <motion.div
                                                className="h-full bg-brand-500"
                                                initial={{ width: "0%" }}
                                                animate={{ width: `${((loadingStep + 1) / LOADING_STEPS.length) * 100}%` }}
                                                transition={{ duration: 0.5 }}
                                            />
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] font-medium text-white/30">
                                            <span>AI Agent Working</span>
                                            <span>{Math.round(((loadingStep + 1) / LOADING_STEPS.length) * 100)}%</span>
                                        </div>
                                    </div>
                                    <motion.button
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 8 }}
                                        onClick={() => { localStorage.clear(); window.location.reload(); }}
                                        className="w-full py-3 text-[10px] font-medium uppercase tracking-wider text-red-300 hover:text-white flex items-center justify-center gap-2 rounded-xl hover:bg-white/5 transition-colors"
                                    >
                                        <RotateCcw size={12} /> Restart Engine
                                    </motion.button>
                                </div>
                            </motion.div>
                        ) : isDeckEmpty ? (
                            /* MANUAL REFILL STATE */
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                                key="refill"
                                className="w-full max-w-xs aspect-[3/4.2] bg-white text-ink shadow-premium p-8 flex flex-col justify-center items-center relative overflow-hidden rounded-[32px] border border-gray-100"
                            >
                                <div className="text-center space-y-4">
                                    <div className="bg-brand-50 p-6 rounded-full inline-block mb-2">
                                        <Sparkles className="w-12 h-12 text-brand-500" />
                                    </div>
                                    <h3 className="text-2xl font-display font-bold text-ink">Hungry for More?</h3>
                                    <p className="font-sans text-sm text-ink-light leading-relaxed">
                                        You've viewed this batch. Ready for 10 fresh ideas?
                                    </p>
                                    <button
                                        onClick={onRequestMore}
                                        className="w-full py-4 bg-black text-white rounded-2xl font-bold uppercase tracking-wide hover:scale-105 active:scale-95 transition-all shadow-lg active:shadow-sm"
                                    >
                                        Generate More
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            /* PREMIUM CARD DECK */
                            <div key="deck" className="relative w-full max-w-xs aspect-[3/4.2]">
                                {/* Shadows */}
                                <div className="absolute inset-0 bg-gray-200/50 transform scale-95 translate-y-4 -z-10 rounded-[32px] blur-sm" />
                                <div className="absolute inset-0 bg-gray-100/50 transform scale-90 translate-y-8 -z-20 rounded-[32px] blur-md" />

                                <motion.div
                                    className="w-full h-full bg-surface shadow-premium flex flex-col cursor-grab active:cursor-grabbing relative overflow-hidden rounded-[32px] border border-white/60"
                                    style={{ x, y, rotate, scale }}
                                    drag
                                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                                    onDragEnd={handleDragEnd}
                                >
                                    {/* STAMPS */}
                                    <motion.div style={{ opacity: likeOpacity }} className="absolute top-8 left-8 z-50 border-[6px] border-green-500 rounded-lg p-2 transform -rotate-12 pointer-events-none">
                                        <span className="text-4xl font-black text-green-500 uppercase tracking-widest">LIKE</span>
                                    </motion.div>
                                    <motion.div style={{ opacity: nopeOpacity }} className="absolute top-8 right-8 z-50 border-[6px] border-red-500 rounded-lg p-2 transform rotate-12 pointer-events-none">
                                        <span className="text-4xl font-black text-red-500 uppercase tracking-widest">NOPE</span>
                                    </motion.div>
                                    <motion.div style={{ opacity: superOpacity }} className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 border-[6px] border-blue-500 rounded-lg p-2 transform -rotate-6 pointer-events-none">
                                        <span className="text-3xl font-black text-blue-500 uppercase tracking-widest whitespace-nowrap">STAPLE</span>
                                    </motion.div>
                                    {/* Card Header Image / Gradient */}
                                    <div className="h-[45%] bg-gradient-premium relative p-6 flex flex-col justify-between group overflow-hidden">
                                        {/* Simple decorative circle */}
                                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-100 rounded-full blur-3xl opacity-60" />
                                        <div className="absolute top-10 -left-10 w-32 h-32 bg-accent-yellow/10 rounded-full blur-3xl" />

                                        <div className="flex justify-between items-start relative z-10">
                                            <div className="flex gap-2 items-center">
                                                <span className="px-3 py-1 bg-white/60 backdrop-blur-md rounded-full text-[10px] uppercase font-bold tracking-wider text-ink-light shadow-sm">
                                                    {currentDish.type}
                                                </span>
                                                {/* Health Score Badge */}
                                                {(currentDish.macros || currentDish.healthTags) && (() => {
                                                    const score = calculateHealthScore(currentDish);
                                                    const color = getHealthColor(score);
                                                    return (
                                                        <span className={`px-3 py-1 bg-white/60 backdrop-blur-md rounded-full text-[10px] uppercase font-bold tracking-wider shadow-sm flex items-center gap-1 ${color}`}>
                                                            <Heart size={10} fill="currentColor" /> {score}
                                                        </span>
                                                    );
                                                })()}
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onModify(currentDish); }}
                                                className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm hover:scale-110 transition-transform text-ink-light"
                                            >
                                                <Info size={16} />
                                            </button>
                                        </div>

                                        <div className="relative z-10 mt-auto">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-ink/40 mb-1 block">{currentDish.cuisine}</span>
                                            <h3 className="text-3xl font-display font-black leading-[1.0] text-ink mb-1 tracking-tight">{currentDish.name}</h3>
                                            <p className="font-serif italic text-sm text-ink-light opacity-80">{currentDish.localName}</p>
                                        </div>
                                    </div>

                                    <div className="flex-1 p-6 flex flex-col bg-white/50 backdrop-blur-xl relative">
                                        {/* Stats Row */}
                                        <div className="flex items-center gap-2 mb-6 overflow-x-auto no-scrollbar pb-2">
                                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide border shadow-sm ${currentMatch >= 75 ? 'bg-green-50 border-green-100 text-green-700' : 'bg-gray-50 border-gray-100 text-gray-500'}`}>
                                                <PackageCheck size={12} /> {currentMatch}% Pantry
                                            </div>
                                            {currentDish.healthTags?.slice(0, 3).map(tag => {
                                                let style = "bg-blue-50 border-blue-100 text-blue-700";
                                                let icon = null;
                                                const lowerTag = tag.toLowerCase();

                                                if (lowerTag.includes('diabetes') || lowerTag.includes('low gi') || lowerTag.includes('safe')) {
                                                    style = "bg-green-50 border-green-100 text-green-700";
                                                    icon = "🟢";
                                                } else if (lowerTag.includes('high gi') || lowerTag.includes('warning') || lowerTag.includes('avoid')) {
                                                    style = "bg-red-50 border-red-100 text-red-700";
                                                    icon = "🔴";
                                                } else if (lowerTag.includes('protein') || lowerTag.includes('muscle')) {
                                                    style = "bg-orange-50 border-orange-100 text-orange-700";
                                                    icon = "💪";
                                                }

                                                return (
                                                    <span key={tag} className={`px-3 py-1.5 ${style} border text-[10px] font-bold uppercase rounded-full whitespace-nowrap shadow-sm flex items-center gap-1`}>
                                                        {icon} {tag}
                                                    </span>
                                                );
                                            })}
                                        </div>

                                        <div className="flex-1 overflow-y-auto no-scrollbar mask-gradient-to-b pr-2">
                                            <p className="font-sans text-sm leading-relaxed text-ink-light/90">
                                                {currentDish.description}
                                            </p>
                                        </div>

                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="flex-1 w-full overflow-y-auto p-4 content-start grid grid-cols-2 gap-3 pb-24">
                    {/* Registry Search */}
                    <div className="col-span-2 relative mb-2">
                        <Search size={16} className="absolute left-4 top-3.5 text-gray-400" />
                        <input type="text" placeholder="Search your cookbook..." className="w-full pl-11 pr-4 py-3 text-sm font-sans bg-white border border-gray-100 shadow-sm rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all font-medium" value={registrySearch} onChange={(e) => setRegistrySearch(e.target.value)} />
                    </div>

                    {approvedDishes.filter(d => d.name.toLowerCase().includes(registrySearch.toLowerCase())).map(dish => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            key={dish.id}
                            className="bg-white border border-gray-100 shadow-sm p-4 rounded-2xl relative group flex flex-col h-full hover:shadow-md transition-shadow"
                        >
                            <div className="mb-2">
                                <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider block mb-1">{dish.type}</span>
                                <h4 className="font-display font-bold text-sm text-ink leading-tight line-clamp-2">{dish.name}</h4>
                            </div>
                            <div className="mt-auto pt-4 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => onModify(dish)} className="p-1.5 bg-gray-50 hover:bg-ink hover:text-white rounded-lg transition-colors"><Edit size={12} /></button>
                                <button onClick={() => onDelete(dish.id)} className="p-1.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors"><Trash2 size={12} /></button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )
            }

            {/* Global Controls - Floating Glass Bar */}
            {
                viewMode === 'deck' && (
                    <div className="w-full px-8 pb-6 flex justify-center items-center gap-6 z-20">
                        <button onClick={() => setShowImport(true)} className="w-12 h-12 flex items-center justify-center bg-white text-ink-light shadow-premium rounded-full hover:scale-110 active:scale-95 transition-all"><Link2 size={20} /></button>

                        <button
                            onClick={() => { triggerFeedback(SwipeDirection.Left); onSwipe(currentDish?.id, SwipeDirection.Left); nextCard(); }}
                            disabled={isDeckEmpty}
                            className="w-16 h-16 flex items-center justify-center bg-white text-red-500 shadow-premium rounded-full hover:scale-110 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 border border-red-50 group"
                        >
                            <X size={28} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform" />
                        </button>

                        <button
                            onClick={() => { triggerFeedback(SwipeDirection.Up); onSwipe(currentDish?.id, SwipeDirection.Up); nextCard(); }}
                            disabled={isDeckEmpty}
                            className="w-12 h-12 flex items-center justify-center bg-white text-blue-500 shadow-premium rounded-full hover:scale-110 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 border border-blue-50"
                        >
                            <Star size={20} strokeWidth={2.5} fill="currentColor" className="text-blue-100" />
                        </button>

                        <button
                            onClick={() => { triggerFeedback(SwipeDirection.Right); onSwipe(currentDish?.id, SwipeDirection.Right); nextCard(); }}
                            disabled={isDeckEmpty}
                            className="w-16 h-16 flex items-center justify-center bg-gradient-brand text-white shadow-lg shadow-orange-500/40 rounded-full hover:scale-110 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
                        >
                            <Heart size={28} strokeWidth={2.5} fill="rgba(255,255,255,0.2)" />
                        </button>
                    </div>
                )
            }

            {
                showImport && (
                    <div className="fixed inset-0 z-[100] bg-ink/30 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
                        <div className="bg-surface w-full max-w-sm shadow-2xl p-6 rounded-[32px] relative border border-white/20">
                            <button onClick={() => setShowImport(false)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"><X size={16} /></button>
                            <h3 className="text-xl font-display font-bold text-ink mb-6 flex items-center gap-2"><Sparkles className="text-brand-500 fill-brand-500" size={18} /> Add Recipe</h3>
                            <div className="flex gap-2 mb-6 p-1 bg-gray-50 rounded-xl">
                                {(['text', 'image', 'pantry'] as ImportTab[]).map(t => (
                                    <button key={t} onClick={() => setImportTab(t)} className={`flex-1 py-2 rounded-lg font-sans text-[11px] font-bold uppercase tracking-wider transition-all ${importTab === t ? 'bg-white text-ink shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>{t}</button>
                                ))}
                            </div>
                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                className="w-full h-32 bg-gray-50 border-none p-4 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 mb-6 rounded-2xl resize-none"
                                placeholder="Describe dish or paste URL..."
                            />
                            <button onClick={handleMagicImport} disabled={isImporting} className="w-full bg-ink text-white font-bold py-4 rounded-2xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50">
                                {isImporting ? <Loader2 className="animate-spin mx-auto" /> : "Add to Cookbook"}
                            </button>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default SwipeDeck;
