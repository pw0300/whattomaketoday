import React, { useState } from 'react';
import { DayPlan } from '../types';
import { Share2, X, Printer, Barcode, Mic, Play, Download, Loader2, Sparkles, MessageCircle } from 'lucide-react';
import { generateVoiceBriefing } from '../services/geminiService';

interface Props {
  plan: DayPlan[];
  missingIngredients: { category: string, items: string[] }[];
  onClose: () => void;
  onSend: () => void;
}

const Receipt: React.FC<Props> = ({ plan, missingIngredients, onClose, onSend }) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

  const handleGenerateVoice = async () => {
      setIsGeneratingAudio(true);
      const base64Wav = await generateVoiceBriefing(plan);
      if (base64Wav) {
          const blob = await (await fetch(`data:audio/wav;base64,${base64Wav}`)).blob();
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
      } else {
          alert("No special notes detected to voice, or generation failed.");
      }
      setIsGeneratingAudio(false);
  };

  const handleShareAudio = async () => {
      if (!audioUrl) return;
      
      try {
          const blob = await (await fetch(audioUrl)).blob();
          const file = new File([blob], "Cook_Instructions.wav", { type: "audio/wav" });
          
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
              await navigator.share({
                  files: [file],
                  title: 'Cook Instructions (Hindi)',
                  text: 'ChefSync Audio Briefing for the Cook.'
              });
          } else {
              const a = document.createElement('a');
              a.href = audioUrl;
              a.download = "Cook_Instructions.wav";
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
          }
      } catch (e) {
          console.error("Sharing failed", e);
      }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 animate-in fade-in duration-300 overflow-y-auto no-scrollbar">
      <div className="w-full max-w-sm relative my-8">
        
        {/* Actions Header */}
        <div className="flex justify-between items-center mb-4 text-white">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/50">Terminal Printout</h3>
            <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition">
              <X size={20} />
            </button>
        </div>

        {/* The Receipt Container */}
        <div className="bg-[#F2F0E9] w-full shadow-2xl relative flex flex-col font-mono text-ink text-[12px] leading-tight filter drop-shadow-xl transform rotate-1">
           
           {/* Header */}
           <div className="p-8 pb-6 text-center border-b-[2px] border-dashed border-ink/30 mx-2">
             <div className="flex justify-center mb-3">
                <Printer size={32} strokeWidth={1} />
             </div>
             <h2 className="text-4xl font-black uppercase tracking-tighter mb-1 scale-y-110">ChefSync OS</h2>
             <p className="text-[9px] uppercase tracking-widest text-ink/40">INTELLIGENCE LAYER ACTIVATED</p>
             <div className="flex justify-between mt-6 text-[10px] uppercase font-bold border-t border-b border-ink py-2">
                <span>Dte: {new Date().toLocaleDateString()}</span>
                <span>Tkt: {Math.floor(Math.random() * 99999)}</span>
             </div>
           </div>

           {/* Content Scroll */}
           <div className="px-8 py-6 space-y-8 max-h-[50vh] overflow-y-auto no-scrollbar">
             
             {/* Meals Section */}
             <div>
               <div className="flex items-center gap-2 mb-4">
                  <span className="bg-ink text-[#F2F0E9] px-1.5 py-0.5 font-black text-[10px] uppercase">Service Rotation</span>
                  <div className="flex-1 h-px bg-ink/20"></div>
               </div>
               
               {plan.filter(d => d.lunch || d.dinner).map((d, i) => (
                 <div key={i} className="mb-6 last:mb-0 border-l-2 border-ink/10 pl-4">
                   <div className="flex justify-between items-baseline mb-2">
                        <span className="font-black text-[13px] uppercase tracking-wider">{d.day}</span>
                        <span className="text-[8px] uppercase text-ink/30 font-bold">NODE {i+1}</span>
                   </div>
                   <div className="space-y-3">
                        {d.lunch && (
                            <div className="flex justify-between items-start gap-4">
                                <span className="text-[9px] uppercase font-bold text-ink/30 shrink-0">AM</span>
                                <span className="flex-1 text-right font-bold leading-none">{d.lunch.localName || d.lunch.name}</span>
                            </div>
                        )}
                        {d.dinner && (
                            <div className="flex justify-between items-start gap-4">
                                <span className="text-[9px] uppercase font-bold text-ink/30 shrink-0">PM</span>
                                <span className="flex-1 text-right font-bold leading-none">{d.dinner.localName || d.dinner.name}</span>
                            </div>
                        )}
                   </div>
                 </div>
               ))}
             </div>

             {/* Inventory Requirements */}
             <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="bg-ink text-[#F2F0E9] px-1.5 py-0.5 font-black text-[10px] uppercase">Procurement List</span>
                  <div className="flex-1 h-px bg-ink/20"></div>
               </div>

                {missingIngredients.length === 0 ? (
                  <p className="text-center italic text-ink/40 text-xs py-4">-- INVENTORY OPTIMIZED --</p>
                ) : (
                  missingIngredients.map((cat) => (
                    <div key={cat.category} className="mb-4">
                      <span className="font-black text-[10px] uppercase tracking-wider text-ink/40 mb-2 block">{cat.category}</span>
                      {cat.items.map(item => (
                        <div key={item} className="flex justify-between pl-0 text-[11px] py-1 border-b border-dotted border-ink/10 last:border-0">
                           <span className="uppercase font-medium pr-4">{item.split('(')[0]}</span>
                           <span className="font-bold whitespace-nowrap">{item.split('(')[1]?.replace(')', '') || '1 Unit'}</span>
                        </div>
                      ))}
                    </div>
                  ))
                )}
             </div>

             {/* Footer Totals */}
             <div className="pt-6 border-t-[2px] border-dashed border-ink/30 mt-6">
               <div className="flex justify-between text-xs font-bold uppercase mb-1">
                  <span>Planned Nodes</span>
                  <span>{plan.filter(d => d.lunch || d.dinner).length}</span>
               </div>
               <div className="flex justify-between text-xl font-black uppercase mt-4 border-t-2 border-ink pt-2">
                  <span>Grand Total</span>
                  <span>0.00</span>
               </div>
               <div className="text-center mt-10 mb-4 opacity-30 grayscale contrast-150">
                    <Barcode className="w-full h-10" />
                    <p className="text-[8px] uppercase mt-2 tracking-[0.4em] font-black">Authentication: {Math.random().toString(36).substring(7).toUpperCase()}</p>
               </div>
             </div>
           </div>
           
           {/* ZigZag Bottom */}
           <div className="relative h-4 w-full bg-[#F2F0E9] translate-y-[95%]">
              <div className="receipt-zigzag opacity-100"></div>
           </div>
        </div>

        {/* Action Button Group */}
        <div className="mt-12 flex flex-col gap-4">
            
            {/* VOICE NOTE UTILITY */}
            <div className="bg-white/5 border-2 border-white/10 p-4 rounded-2xl">
                 <div className="flex items-center gap-2 mb-3 text-brand-500">
                    <Sparkles size={14} />
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest">Hindi Briefing (AI)</span>
                 </div>
                 {!audioUrl ? (
                    <button 
                        onClick={handleGenerateVoice}
                        disabled={isGeneratingAudio}
                        className="w-full bg-brand-500 text-white py-3 font-black uppercase tracking-widest hover:bg-brand-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50 border-2 border-brand-400"
                    >
                        {isGeneratingAudio ? <Loader2 className="animate-spin" /> : <Mic size={18} strokeWidth={3} />}
                        {isGeneratingAudio ? "Synthesizing..." : "Briefing for Cook"}
                    </button>
                 ) : (
                    <div className="flex items-center gap-2 bg-white/10 p-2 rounded-xl border border-white/10">
                        <button onClick={handleShareAudio} className="bg-green-500 text-white p-3 rounded-xl hover:bg-green-600 transition flex items-center gap-2 font-bold uppercase text-[10px]">
                            <MessageCircle size={16} fill="currentColor" /> WhatsApp Audio
                        </button>
                        <audio src={audioUrl} controls className="flex-1 h-10 filter invert" />
                        <button onClick={() => setAudioUrl(null)} className="p-2 text-white/30 hover:text-red-500">
                            <X size={20} />
                        </button>
                    </div>
                 )}
            </div>

            <button 
                onClick={onSend}
                className="w-full bg-white text-ink py-4 font-black uppercase tracking-widest shadow-hard hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-4 border-2 border-ink"
            >
                <Share2 size={22} strokeWidth={3} />
                Transmit Manifest
            </button>
        </div>
      </div>
    </div>
  );
};

export default Receipt;