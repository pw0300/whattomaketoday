import React from 'react';
import { DayPlan } from '../types';
import { Share2, X, Printer, Barcode } from 'lucide-react';

interface Props {
  plan: DayPlan[];
  missingIngredients: { category: string, items: string[] }[];
  onClose: () => void;
  onSend: () => void;
}

const Receipt: React.FC<Props> = ({ plan, missingIngredients, onClose, onSend }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-sm relative">
        
        {/* Actions Header */}
        <div className="flex justify-between items-center mb-4 text-white">
            <h3 className="font-mono text-xs uppercase tracking-widest text-white/70">Generated Artifact</h3>
            <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition">
              <X size={20} />
            </button>
        </div>

        {/* The Receipt Container */}
        <div className="bg-[#F2F0E9] w-full shadow-2xl relative flex flex-col font-mono text-ink text-[12px] leading-tight filter drop-shadow-xl transform rotate-1">
           
           {/* Top ZigZag */}
           <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-br from-transparent to-[#F2F0E9]" style={{ backgroundImage: 'linear-gradient(45deg, transparent 75%, #000 75%), linear-gradient(-45deg, transparent 75%, #000 75%)', backgroundSize: '10px 10px', backgroundPosition: '0 0, 0 5px', height: '0px' }}></div>
           
           {/* Header */}
           <div className="p-6 pb-4 text-center border-b-[2px] border-dashed border-ink/30 mx-2">
             <div className="flex justify-center mb-2">
                <Printer size={24} strokeWidth={1.5} />
             </div>
             <h2 className="text-3xl font-black uppercase tracking-tighter mb-1 scale-y-110">ChefSync</h2>
             <p className="text-[10px] uppercase tracking-widest text-ink/60">Kitchen Operating System v1.0</p>
             <div className="flex justify-between mt-4 text-[10px] uppercase font-bold border-t border-b border-ink py-1">
                <span>Date: {new Date().toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' })}</span>
                <span>Time: {new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                <span>Tkt: #{Math.floor(Math.random() * 9999)}</span>
             </div>
           </div>

           {/* Content Scroll */}
           <div className="px-6 py-4 space-y-6 max-h-[60vh] overflow-y-auto no-scrollbar">
             
             {/* Meals Section */}
             <div>
               <div className="flex items-center gap-2 mb-3">
                  <span className="bg-ink text-[#F2F0E9] px-1 font-bold text-[10px] uppercase">Rotation</span>
                  <div className="flex-1 h-px bg-ink/20"></div>
               </div>
               
               {plan.map((d, i) => (
                 <div key={i} className="mb-4 last:mb-0">
                   <div className="flex justify-between items-baseline mb-1">
                        <span className="font-black text-sm uppercase">{d.day.substring(0,3)}</span>
                        <span className="text-[9px] uppercase text-ink/40 tracking-widest">SVC {i+1}</span>
                   </div>
                   <div className="pl-4 border-l border-ink/20 space-y-2">
                        <div className="flex justify-between items-start">
                            <span className="text-[10px] uppercase font-bold text-ink/50 w-8">AM</span>
                            <span className="flex-1 text-right font-bold">{d.lunch?.name || "OUT OF SERVICE"}</span>
                        </div>
                        {d.lunch?.chefAdvice && (
                            <div className="text-[10px] text-ink/60 italic text-right leading-tight">"{d.lunch.chefAdvice}"</div>
                        )}
                        <div className="flex justify-between items-start">
                            <span className="text-[10px] uppercase font-bold text-ink/50 w-8">PM</span>
                            <span className="flex-1 text-right font-bold">{d.dinner?.name || "STAFF MEAL"}</span>
                        </div>
                         {d.dinner?.chefAdvice && (
                            <div className="text-[10px] text-ink/60 italic text-right leading-tight">"{d.dinner.chefAdvice}"</div>
                        )}
                   </div>
                 </div>
               ))}
             </div>

             {/* Grocery Section */}
             <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-ink text-[#F2F0E9] px-1 font-bold text-[10px] uppercase">Mise En Place</span>
                  <div className="flex-1 h-px bg-ink/20"></div>
               </div>

                {missingIngredients.length === 0 ? (
                  <p className="text-center italic text-ink/40 text-xs py-4">-- Inventory Full --</p>
                ) : (
                  missingIngredients.map((cat) => (
                    <div key={cat.category} className="mb-3">
                      <span className="font-bold text-[10px] uppercase tracking-wider text-ink/50 mb-1 block">{cat.category}</span>
                      {cat.items.map(item => (
                        <div key={item} className="flex justify-between pl-0 text-[11px] py-0.5 border-b border-dotted border-ink/10 last:border-0">
                           <span className="uppercase font-medium">{item.split('(')[0]}</span>
                           <span className="font-mono text-[9px] bg-white border border-ink/20 px-1 rounded-sm ml-2 whitespace-nowrap">{item.split('(')[1]?.replace(')', '') || '1 Unit'}</span>
                        </div>
                      ))}
                    </div>
                  ))
                )}
             </div>

             {/* Footer Totals */}
             <div className="pt-4 border-t-[2px] border-dashed border-ink/30 mt-4">
               <div className="flex justify-between text-xs font-bold uppercase">
                  <span>Services</span>
                  <span>{plan.length * 2}</span>
               </div>
               <div className="flex justify-between text-xs font-bold uppercase">
                  <span>Items</span>
                  <span>{missingIngredients.reduce((acc, cat) => acc + cat.items.length, 0)}</span>
               </div>
               <div className="flex justify-between text-xl font-black uppercase mt-2">
                  <span>Total Due</span>
                  <span>$0.00</span>
               </div>
               <div className="text-center mt-6 mb-2">
                    <Barcode className="w-full h-8 opacity-50" />
                    <p className="text-[9px] uppercase mt-1 tracking-[0.2em]">Domestic Planning Tax Paid</p>
               </div>
             </div>
           </div>
           
           {/* ZigZag Bottom */}
           <div className="relative h-4 w-full bg-[#F2F0E9] translate-y-[95%]">
              <div className="receipt-zigzag opacity-100"></div>
           </div>
        </div>

        {/* Action Button */}
        <button 
          onClick={onSend}
          className="w-full mt-8 bg-brand-500 text-white py-4 font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-none hover:translate-y-1 transition-all flex items-center justify-center gap-3 border-2 border-white"
        >
          <Share2 size={20} strokeWidth={3} />
          Export Manifest
        </button>
      </div>
    </div>
  );
};

export default Receipt;