import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Dish, SwipeDirection, ImageSize } from '../types';
import { Heart, X, Star, Utensils, Link2, Sparkles, Loader2, Image as ImageIcon, Video, Type, UploadCloud, Info } from 'lucide-react';
import { analyzeAndGenerateDish } from '../services/geminiService';

interface Props {
  dishes: Dish[];
  approvedCount: number;
  onSwipe: (dishId: string, direction: SwipeDirection) => void;
  onModify: (dish: Dish) => void;
  onImport: (dish: Dish) => void;
}

type ImportTab = 'text' | 'image' | 'video';

const SwipeDeck: React.FC<Props> = ({ dishes, approvedCount, onSwipe, onModify, onImport }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]); // Reduced rotation for heavier feel
  
  // Color transforms based on position - High Contrast
  const borderRight = useTransform(x, [0, 150], ["#18181b", "#22c55e"]);
  const borderLeft = useTransform(x, [0, -150], ["#18181b", "#ef4444"]);
  const borderUp = useTransform(y, [0, -150], ["#18181b", "#3b82f6"]);
  
  const longPressTimer = useRef<number | null>(null);

  // Import State
  const [showImport, setShowImport] = useState(false);
  const [importTab, setImportTab] = useState<ImportTab>('text');
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageSize, setImageSize] = useState<ImageSize>('1K');
  const [isImporting, setIsImporting] = useState(false);

  const currentDish = dishes[activeIndex];
  const goal = 7; 

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      onSwipe(currentDish.id, SwipeDirection.Right);
      nextCard();
    } else if (info.offset.x < -threshold) {
      onSwipe(currentDish.id, SwipeDirection.Left);
      nextCard();
    } else if (info.offset.y < -threshold) {
      onSwipe(currentDish.id, SwipeDirection.Up);
      nextCard();
    }
  };

  const nextCard = () => {
    setActiveIndex(prev => prev + 1);
    x.set(0);
    y.set(0);
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

    setIsImporting(true);
    let result: Dish | null = null;
    
    if (importTab === 'text') {
        result = await analyzeAndGenerateDish('text', inputText, imageSize);
    } else if (selectedFile) {
        result = await analyzeAndGenerateDish(importTab, selectedFile, imageSize);
    }

    setIsImporting(false);
    if (result) {
      onImport(result);
      setShowImport(false);
      setInputText('');
      setSelectedFile(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center overflow-hidden bg-paper">
      
      {/* Header - Utility Style */}
      <div className="w-full px-6 pt-6 pb-4 flex justify-between items-end z-10 border-b-2 border-ink bg-paper">
        <div>
           <h2 className="text-3xl font-black text-ink uppercase tracking-tight leading-none">R&D</h2>
           <p className="font-mono text-xs text-gray-500 mt-1 uppercase">Sourcing Mode: Active</p>
        </div>
        <div className="flex flex-col items-end">
          <div className="font-mono text-xs font-bold text-ink mb-1 bg-brand-100 px-2 py-0.5 border border-ink shadow-hard-sm">
            {approvedCount}/{goal} IN ROTATION
          </div>
          <div className="w-24 h-3 bg-white border border-ink mt-1">
            <div 
              className="h-full bg-ink transition-all duration-300" 
              style={{ width: `${Math.min((approvedCount / goal) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Import Modal - High Contrast */}
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
                {(['text', 'image', 'video'] as ImportTab[]).map(t => (
                  <button 
                    key={t}
                    onClick={() => setImportTab(t)}
                    className={`flex-1 py-2 font-mono text-xs font-bold uppercase border-2 transition-all ${
                      importTab === t ? 'bg-ink text-white border-ink' : 'bg-white text-gray-500 border-gray-300 hover:border-ink'
                    }`}
                  >
                    {t}
                  </button>
                ))}
            </div>

            <div className="mb-6 flex-1">
                {importTab === 'text' && (
                    <textarea 
                        placeholder="Describe craving / Paste Recipe..."
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
            </div>

            <button 
              onClick={handleMagicImport}
              disabled={isImporting}
              className="w-full bg-brand-500 border-2 border-ink text-white py-4 font-black uppercase tracking-wider shadow-hard active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:active:translate-y-0"
            >
              {isImporting ? <Loader2 className="animate-spin mx-auto" /> : "Process Data"}
            </button>
          </div>
        </div>
      )}

      {/* Main Deck */}
      <div className="relative flex-1 w-full flex items-center justify-center p-4">
        {!currentDish ? (
           <div className="text-center border-2 border-dashed border-ink p-8 bg-white max-w-xs rotate-2 animate-pulse">
            <Loader2 className="w-16 h-16 mx-auto mb-4 text-brand-600 animate-spin" />
            <h2 className="text-xl font-black uppercase mb-2">SOURCING</h2>
            <p className="font-mono text-sm mb-4">Fetching specs matching taste profile...</p>
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
                 {/* Background typography decoration */}
                 <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none select-none overflow-hidden">
                    <span className="text-[150px] font-black leading-none -ml-10">{currentDish.name.charAt(0)}</span>
                 </div>

                 <div className="mt-4 mb-auto z-10">
                    <h3 className="text-3xl font-black leading-tight mb-2 text-ink uppercase">{currentDish.name}</h3>
                    <div className="inline-block border-b-2 border-brand-500 pb-1 mb-4">
                        <p className="text-lg font-serif italic text-gray-600">{currentDish.localName}</p>
                    </div>
                    <p className="font-mono text-xs leading-relaxed text-gray-600 border-l-2 border-gray-300 pl-3 text-left">
                        {currentDish.description}
                    </p>
                 </div>

                 {/* Nutritional Label Style Macros */}
                 <div className="w-full border-2 border-ink p-3 bg-gray-50 z-10 mb-6">
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
              
              {/* Footer Action Hint */}
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

      {/* Controls */}
      <div className="w-full px-8 pb-8 flex justify-center items-center gap-6">
         <button onClick={() => setShowImport(true)} className="w-12 h-12 flex items-center justify-center bg-white border-2 border-ink shadow-hard hover:translate-y-1 hover:shadow-none transition-all rounded-lg">
          <Link2 size={20} />
        </button>
        <button onClick={() => { onSwipe(currentDish.id, SwipeDirection.Left); nextCard(); }} className="w-16 h-16 flex items-center justify-center bg-white border-2 border-ink shadow-hard hover:translate-y-1 hover:shadow-none transition-all rounded-full text-red-500">
          <X size={32} strokeWidth={3} />
        </button>
        <button onClick={() => { onSwipe(currentDish.id, SwipeDirection.Up); nextCard(); }} className="w-12 h-12 flex items-center justify-center bg-white border-2 border-ink shadow-hard hover:translate-y-1 hover:shadow-none transition-all rounded-lg text-blue-500 -mt-8">
          <Star size={24} strokeWidth={3} />
        </button>
        <button onClick={() => { onSwipe(currentDish.id, SwipeDirection.Right); nextCard(); }} className="w-16 h-16 flex items-center justify-center bg-ink border-2 border-ink shadow-hard hover:translate-y-1 hover:shadow-none transition-all rounded-full text-white">
          <Heart size={32} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};

export default SwipeDeck;