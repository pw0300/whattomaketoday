import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from 'framer-motion';
import { Dish, SwipeDirection, ImageSize, UserProfile } from '../types';
import { Heart, X, Star, Link2, Sparkles, Loader2, UploadCloud, Info, Quote, ShoppingBasket, MessageSquarePlus, RefreshCcw, RotateCcw, Grid3X3, Layers, Search, Trash2, Edit } from 'lucide-react';
import { analyzeAndGenerateDish } from '../services/geminiService';

interface Props {
  dishes: Dish[];
  approvedDishes: Dish[]; // NEW PROP
  approvedCount: number;
  onSwipe: (dishId: string, direction: SwipeDirection) => void;
  onUndo?: () => void;
  onModify: (dish: Dish) => void;
  onImport: (dish: Dish) => void;
  onDelete: (dishId: string) => void; // NEW PROP
  pantryStock: string[];
  userProfile: UserProfile;
  initialImportTab?: 'text' | 'image' | 'video' | 'pantry' | null;
}

type ImportTab = 'text' | 'image' | 'video' | 'pantry';
type ViewMode = 'deck' | 'registry';

const SwipeDeck: React.FC<Props> = ({ dishes, approvedDishes, approvedCount, onSwipe, onUndo, onModify, onImport, onDelete, pantryStock, userProfile, initialImportTab }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('deck');
  const [activeIndex, setActiveIndex] = useState(0);
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageSize, setImageSize] = useState<ImageSize>('1K');
  const [isImporting, setIsImporting] = useState(false);

  // Registry Search
  const [registrySearch, setRegistrySearch] = useState('');

  useEffect(() => {
    if (initialImportTab) {
      setShowImport(true);
      setImportTab(initialImportTab);
    }
  }, [initialImportTab]);

  const [feedback, setFeedback] = useState<{ text: string, color: string, rotation: number } | null>(null);

  const currentDish = dishes[activeIndex];
  const isDeckEmpty = !currentDish || activeIndex >= dishes.length;
  const goal = 7; 

  const triggerFeedback = (direction: SwipeDirection) => {
    if (direction === SwipeDirection.Right) {
        setFeedback({ text: 'APPROVED', color: 'text-green-500 border-green-500', rotation: -6 });
    } else if (direction === SwipeDirection.Left) {
        setFeedback({ text: "86'D", color: 'text-red-500 border-red-500', rotation: 6 });
    } else if (direction === SwipeDirection.Up) {
        setFeedback({ text: 'STAPLE', color: 'text-blue-500 border-blue-500', rotation: 0 });
    }
    setTimeout(() => setFeedback(null), 700);
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      triggerFeedback(SwipeDirection.Right);
      onSwipe(currentDish.id, SwipeDirection.Right);
      nextCard();
    } else if (info.offset.x < -threshold) {
      triggerFeedback(SwipeDirection.Left);
      onSwipe(currentDish.id, SwipeDirection.Left);
      nextCard();
    } else if (info.offset.y < -threshold) {
      triggerFeedback(SwipeDirection.Up);
      onSwipe(currentDish.id, SwipeDirection.Up);
      nextCard();
    }
  };

  const nextCard = () => {
    setActiveIndex(prev => prev + 1);
    x.set(0);
    y.set(0);
  };

  const handleUndo = () => {
      if (onUndo && activeIndex > 0) {
          onUndo();
          setActiveIndex(prev => prev - 1);
          x.set(0);
          y.set(0);
      }
  };

  const handlePointerDown = () => {
    longPressTimer.current = window.setTimeout(() => {
      onModify(currentDish);
    }, 600); 
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleMagicImport = async () => {
    if (importTab === 'text' && !inputText.trim()) return;
    if ((importTab === 'image' || importTab === 'video') && !selectedFile) return;
    if (importTab === 'pantry' && pantryStock.length === 0) return;

    setIsImporting(true);
    let result: Dish | null = null;
    
    if (importTab === 'text') {
        result = await analyzeAndGenerateDish('text', inputText, imageSize, userProfile);
    } else if (importTab === 'pantry') {
        result = await analyzeAndGenerateDish('pantry', pantryStock.join(', '), imageSize, userProfile, customInstruction);
    } else if (selectedFile) {
        result = await analyzeAndGenerateDish(importTab, selectedFile, imageSize, userProfile);
    }

    setIsImporting(false);
    if (result) {
      onImport(result);
      setShowImport(false);
      setInputText('');
      setCustomInstruction('');
      setSelectedFile(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        setSelectedFile(e.target.files[0]);
    }
  };

  const handleDeleteClick = (id: string) => {
      if (confirm("Permanently remove this dish from Registry? This cannot be undone.")) {
          onDelete(id);
      }
  };

  // --- RENDER ---

  const filteredRegistry = approvedDishes.filter(d => 
    d.name.toLowerCase().includes(registrySearch.toLowerCase()) || 
    d.localName?.toLowerCase().includes(registrySearch.toLowerCase())
  );

  return (
    <div className="relative w-full h-full flex flex-col items-center overflow-hidden bg-paper">
      
      {/* Feedback Overlay */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 0, x: "-50%" }}
            animate={{ opacity: 1, scale: 1, y: -50, x: "-50%" }}
            exit={{ opacity: 0, scale: 1.2 }}
            className={`absolute top-1/2 left-1/2 z-50 pointer-events-none border-[6px] px-6 py-2 font-black text-5xl uppercase tracking-widest bg-white/90 shadow-hard whitespace-nowrap ${feedback.color}`}
            style={{ rotate: feedback.rotation }}
          >
            {feedback.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header with Toggle */}
      <div className="w-full px-4 pt-4 pb-2 z-10 border-b-2 border-ink bg-paper">
        <div className="flex justify-between items-center mb-4">
             <div>
                <h2 className="text-3xl font-black text-ink uppercase tracking-tight leading-none">R&D</h2>
                <p className="font-mono text-[10px] text-gray-500 uppercase">
                    {viewMode === 'deck' ? 'Sourcing Mode: Active' : 'Registry: Database'}
                </p>
            </div>
             <div className="flex bg-gray-200 p-1 rounded-lg border-2 border-transparent">
                <button 
                    onClick={() => setViewMode('deck')}
                    className={`p-2 rounded transition-all ${viewMode === 'deck' ? 'bg-white shadow-sm text-ink' : 'text-gray-500'}`}
                >
                    <Layers size={18} strokeWidth={viewMode === 'deck' ? 3 : 2} />
                </button>
                <button 
                    onClick={() => setViewMode('registry')}
                    className={`p-2 rounded transition-all ${viewMode === 'registry' ? 'bg-white shadow-sm text-ink' : 'text-gray-500'}`}
                >
                    <Grid3X3 size={18} strokeWidth={viewMode === 'registry' ? 3 : 2} />
                </button>
            </div>
        </div>

        {viewMode === 'deck' ? (
             <div className="w-full">
                 <div className="flex justify-between items-end mb-1">
                    <span className="font-mono text-[10px] font-bold text-ink uppercase">Active Rotation</span>
                    <span className="font-mono text-[10px] font-bold text-ink">{approvedCount}/{goal}</span>
                 </div>
                 <div className="w-full h-2 bg-white border border-ink">
                    <div 
                    className="h-full bg-ink transition-all duration-300" 
                    style={{ width: `${Math.min((approvedCount / goal) * 100, 100)}%` }}
                    />
                </div>
            </div>
        ) : (
            <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-gray-400"/>
                <input 
                    type="text" 
                    placeholder="Search registry..." 
                    className="w-full pl-9 pr-2 py-2 text-xs font-mono border-2 border-ink focus:outline-none focus:bg-yellow-50"
                    value={registrySearch}
                    onChange={(e) => setRegistrySearch(e.target.value)}
                />
            </div>
        )}
      </div>

      {/* Import Modal */}
      {showImport && (
        <div className="absolute inset-0 z-50 bg-ink/50 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white w-full max-w-sm border-2 border-ink shadow-hard p-6 flex flex-col max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black uppercase flex items-center gap-2">
                <Sparkles size={24} className="text-brand-600 fill-current"/> External Source
              </h3>
              <button onClick={() => setShowImport(false)} className="hover:bg-gray-100 p-1 rounded"><X size={24} /></button>
            </div>

            <div className="flex gap-2 mb-6">
                {(['text', 'image', 'video', 'pantry'] as ImportTab[]).map(t => (
                  <button 
                    key={t}
                    onClick={() => setImportTab(t)}
                    className={`flex-1 py-2 font-mono text-[10px] font-bold uppercase border-2 transition-all flex items-center justify-center ${
                      importTab === t ? 'bg-ink text-white border-ink' : 'bg-white text-gray-500 border-gray-300 hover:border-ink'
                    }`}
                  >
                    {t === 'pantry' ? <ShoppingBasket size={14}/> : t}
                  </button>
                ))}
            </div>

            <div className="mb-6 flex-1">
                {importTab === 'text' && (
                    <textarea 
                        placeholder="Describe craving / Paste Recipe..."
                        maxLength={500}
                        className="w-full h-32 border-2 border-ink p-3 font-mono text-sm focus:outline-none focus:bg-yellow-50 resize-none placeholder:text-gray-400"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                    />
                )}
                {(importTab === 'image' || importTab === 'video') && (
                    <label className="w-full h-32 border-2 border-dashed border-ink flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition">
                        {selectedFile ? (
                            <div className="text-center">
                                <p className="font-bold text-sm">{selectedFile.name}</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center text-gray-500">
                                <UploadCloud className="mb-2" size={32} />
                                <span className="font-mono text-xs uppercase">Upload {importTab}</span>
                            </div>
                        )}
                        <input type="file" className="hidden" accept={importTab === 'image' ? 'image/*' : 'video/*'} onChange={handleFileChange}/>
                    </label>
                )}
                {importTab === 'pantry' && (
                    <div className="flex flex-col gap-4">
                        <div className="w-full h-24 border-2 border-ink bg-gray-50 p-3 overflow-y-auto">
                            <div className="flex justify-between items-center mb-2 border-b border-gray-300 pb-1">
                                 <span className="font-mono text-xs uppercase font-bold text-gray-500">Inventory Stock</span>
                                 <span className="font-mono text-[10px] font-bold bg-green-500 text-white px-1.5 rounded-full">{pantryStock.length}</span>
                            </div>
                            {pantryStock.length === 0 ? (
                                 <p className="text-center text-gray-400 font-mono text-xs mt-4 italic">-- No Items in Stock --</p>
                            ) : (
                                <div className="flex flex-wrap gap-1">
                                    {pantryStock.map(item => (
                                        <span key={item} className="text-[10px] font-bold bg-white border border-ink px-2 py-1 uppercase shadow-sm">
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        <div>
                           <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 flex items-center gap-1">
                             <MessageSquarePlus size={12}/> Chef Instructions (Optional)
                           </label>
                           <input 
                             type="text"
                             maxLength={100}
                             className="w-full border-2 border-ink p-2 font-mono text-xs focus:bg-yellow-50 focus:outline-none"
                             placeholder="e.g. 'Make it spicy', 'Soup only'..."
                             value={customInstruction}
                             onChange={(e) => setCustomInstruction(e.target.value)}
                           />
                        </div>
                    </div>
                )}
            </div>

            <button 
              onClick={handleMagicImport}
              disabled={isImporting || (importTab === 'pantry' && pantryStock.length === 0)}
              className="w-full bg-brand-500 border-2 border-ink text-white py-4 font-black uppercase tracking-wider shadow-hard active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:active:translate-y-0"
            >
              {isImporting ? <Loader2 className="animate-spin mx-auto" /> : (importTab === 'pantry' ? "Cook From Pantry" : "Process Data")}
            </button>
          </div>
        </div>
      )}

      {/* VIEW CONTENT */}
      {viewMode === 'registry' ? (
          <div className="flex-1 w-full overflow-y-auto p-4 pb-20">
            {filteredRegistry.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 opacity-50">
                    <Grid3X3 size={48} className="mb-2" />
                    <p className="font-mono text-xs uppercase">Registry Empty</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3">
                    {filteredRegistry.map(dish => (
                        <div key={dish.id} className="bg-white border-2 border-ink shadow-hard-sm p-3 flex flex-col relative group">
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-mono text-[9px] uppercase bg-gray-100 px-1">{dish.type}</span>
                                {dish.isStaple && <Star size={10} className="text-blue-500 fill-current" />}
                            </div>
                            <h4 className="font-bold text-xs leading-tight mb-1 line-clamp-2">{dish.name}</h4>
                            <p className="font-serif italic text-[10px] text-gray-500 mb-3 line-clamp-1">{dish.localName}</p>
                            
                            <div className="mt-auto flex gap-2 pt-2 border-t border-gray-100">
                                <button onClick={() => onModify(dish)} className="flex-1 bg-gray-50 border border-gray-200 py-1 flex items-center justify-center hover:bg-ink hover:text-white transition">
                                    <Edit size={12} />
                                </button>
                                <button onClick={() => handleDeleteClick(dish.id)} className="flex-1 bg-gray-50 border border-gray-200 py-1 flex items-center justify-center hover:bg-red-500 hover:text-white transition">
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
          </div>
      ) : (
        /* Main Deck */
        <div className="relative flex-1 w-full flex items-center justify-center p-4">
            {isDeckEmpty ? (
            <div className="text-center border-2 border-dashed border-ink p-8 bg-white max-w-xs flex flex-col items-center">
                <RefreshCcw className="w-12 h-12 mb-4 text-brand-600 animate-spin" strokeWidth={1.5} />
                <h2 className="text-xl font-black uppercase mb-2">SOURCING SPECS</h2>
                <p className="font-mono text-sm mb-4">Polling Intelligence Layer...</p>
                <div className="w-32 h-1 bg-gray-200 mt-2 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 animate-[shimmer_1s_infinite_linear] w-1/2 translate-x-[-100%]"></div>
                </div>
                <p className="text-[10px] text-gray-400 mt-6 uppercase">If this takes too long, try resetting in System</p>
            </div>
            ) : (
            <div className="relative w-full max-w-xs aspect-[3/4.5]">
                <motion.div
                className="w-full h-full bg-white border-2 border-ink shadow-hard flex flex-col cursor-grab active:cursor-grabbing relative"
                style={{ x, y, rotate, borderColor: x.get() > 0 ? borderRight : x.get() < 0 ? borderLeft : borderUp }}
                drag
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                onDragEnd={handleDragEnd}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                >
                {/* Top Label */}
                <div className="bg-ink text-white py-1 px-3 flex justify-between items-center">
                    <span className="font-mono text-[10px] uppercase tracking-widest">{currentDish.type}</span>
                    <span className="font-mono text-[10px] uppercase tracking-widest">ID: {currentDish.id.slice(-4)}</span>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 p-6 flex flex-col items-center text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none select-none overflow-hidden">
                        <span className="text-[150px] font-black leading-none -ml-10">{currentDish.name.charAt(0)}</span>
                    </div>

                    <div className="mt-4 mb-auto z-10 w-full">
                        <h3 className="text-3xl font-black leading-tight mb-2 text-ink uppercase">{currentDish.name}</h3>
                        <div className="inline-block border-b-2 border-brand-500 pb-1 mb-4">
                            <p className="text-lg font-serif italic text-gray-600">{currentDish.localName}</p>
                        </div>
                        <p className="font-mono text-xs leading-relaxed text-gray-600 border-l-2 border-gray-300 pl-3 text-left">
                            {currentDish.description}
                        </p>

                        {currentDish.chefAdvice && (
                        <div className="mt-4 text-left bg-yellow-50 border-2 border-ink p-3 relative">
                            <Quote size={16} className="absolute -top-3 -left-2 bg-yellow-50 text-ink fill-current" />
                            <p className="font-mono text-[10px] font-bold uppercase text-ink/50 mb-1">Chef's Advice</p>
                            <p className="font-serif italic text-sm text-ink leading-tight">{currentDish.chefAdvice}</p>
                        </div>
                        )}
                    </div>

                    <div className="w-full border-2 border-ink p-3 bg-gray-50 z-10 mb-6 mt-4">
                        <div className="flex justify-between border-b border-ink pb-1 mb-2">
                            <span className="font-black text-xs uppercase">Nutritional Specs</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                            <div className="flex flex-col items-start">
                                <span className="text-[10px] text-gray-500 uppercase">Protein</span>
                                <span className="font-bold">{currentDish.macros.protein}g</span>
                            </div>
                            <div className="flex flex-col items-start border-l border-gray-300 pl-2">
                                <span className="text-[10px] text-gray-500 uppercase">Carbs</span>
                                <span className="font-bold">{currentDish.macros.carbs}g</span>
                            </div>
                            <div className="flex flex-col items-start border-l border-gray-300 pl-2">
                                <span className="text-[10px] text-gray-500 uppercase">Energy</span>
                                <span className="font-bold">{currentDish.macros.calories}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 flex-wrap justify-center z-10">
                        {currentDish.tags.map(tag => (
                            <span key={tag} className="font-mono text-[10px] font-bold bg-white border border-ink px-2 py-1 uppercase shadow-sm">
                                #{tag}
                            </span>
                        ))}
                    </div>
                </div>
                
                <div className="border-t-2 border-ink p-3 bg-yellow-50">
                    <p className="font-mono text-[10px] text-center uppercase font-bold flex items-center justify-center gap-2 text-ink">
                    <Info size={12} strokeWidth={3} />
                    Hold for Full Specs
                    </p>
                </div>
                </motion.div>
            </div>
            )}
        </div>
      )}

      {/* Controls (Only show in Deck Mode) */}
      {viewMode === 'deck' && (
        <div className="w-full px-8 pb-8 flex justify-center items-center gap-4">
            <button onClick={() => setShowImport(true)} className="w-12 h-12 flex items-center justify-center bg-white border-2 border-ink shadow-hard hover:translate-y-1 hover:shadow-none transition-all rounded-lg text-gray-600">
            <Link2 size={20} />
            </button>
            <button 
                onClick={handleUndo} 
                disabled={!onUndo}
                className="w-12 h-12 flex items-center justify-center bg-white border-2 border-ink shadow-hard hover:translate-y-1 hover:shadow-none transition-all rounded-lg text-gray-600 disabled:opacity-50"
            >
                <RotateCcw size={20} />
            </button>
            <button 
            onClick={() => { triggerFeedback(SwipeDirection.Left); onSwipe(currentDish?.id || 'err', SwipeDirection.Left); nextCard(); }} 
            disabled={isDeckEmpty}
            className="w-16 h-16 flex items-center justify-center bg-white border-2 border-ink shadow-hard hover:translate-y-1 hover:shadow-none transition-all rounded-full text-red-500 disabled:opacity-50"
            >
            <X size={32} strokeWidth={3} />
            </button>
            <button 
            onClick={() => { triggerFeedback(SwipeDirection.Up); onSwipe(currentDish?.id || 'err', SwipeDirection.Up); nextCard(); }} 
            disabled={isDeckEmpty}
            className="w-12 h-12 flex items-center justify-center bg-white border-2 border-ink shadow-hard hover:translate-y-1 hover:shadow-none transition-all rounded-lg text-blue-500 disabled:opacity-50"
            >
            <Star size={24} strokeWidth={3} />
            </button>
            <button 
            onClick={() => { triggerFeedback(SwipeDirection.Right); onSwipe(currentDish?.id || 'err', SwipeDirection.Right); nextCard(); }} 
            disabled={isDeckEmpty}
            className="w-16 h-16 flex items-center justify-center bg-ink border-2 border-ink shadow-hard hover:translate-y-1 hover:shadow-none transition-all rounded-full text-white disabled:opacity-50"
            >
            <Heart size={32} strokeWidth={3} />
            </button>
        </div>
      )}
    </div>
  );
};

export default SwipeDeck;