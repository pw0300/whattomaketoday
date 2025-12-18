import React from 'react';
import { DayPlan } from '../types';
import { Share2, X } from 'lucide-react';

interface Props {
  plan: DayPlan[];
  missingIngredients: { category: string, items: string[] }[];
  onClose: () => void;
  onSend: () => void;
}

const Receipt: React.FC<Props> = ({ plan, missingIngredients, onClose, onSend }) => {
  return (
    <div className="fixed inset-0 z-50 bg-zinc-900/95 flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-sm relative">
        <button onClick={onClose} className="absolute -top-12 right-0 text-white/50 hover:text-white">
          <X size={32} />
        </button>

        <div className="bg-white w-full shadow-2xl relative overflow-hidden flex flex-col font-mono text-sm">
           {/* Receipt Header */}
           <div className="p-6 text-center border-b-2 border-dashed border-gray-200">
             <h2 className="text-2xl font-bold uppercase tracking-widest mb-1">ChefSync</h2>
             <p className="text-xs text-gray-500">KITCHEN ORDER TICKET</p>
             <p className="text-xs text-gray-400 mt-2">{new Date().toLocaleDateString()}</p>
           </div>

           {/* Content */}
           <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto no-scrollbar">
             
             {/* Meals Section */}
             <div>
               <p className="text-xs font-bold border-b border-black pb-1 mb-3 uppercase">Service Schedule</p>
               {plan.map((d, i) => (
                 <div key={i} className="flex justify-between mb-2 leading-tight">
                   <div className="w-8 shrink-0 text-gray-400 font-bold">{d.day.substring(0,3).toUpperCase()}</div>
                   <div className="flex-1 text-right">
                     <div>{d.lunch?.localName || "No Service"}</div>
                     <div>{d.dinner?.localName || "Staff Meal"}</div>
                   </div>
                 </div>
               ))}
             </div>

             {/* Grocery Section */}
             <div>
                <p className="text-xs font-bold border-b border-black pb-1 mb-3 uppercase">Procurement List</p>
                {missingIngredients.length === 0 ? (
                  <p className="text-center italic text-gray-400">Inventory Full</p>
                ) : (
                  missingIngredients.map((cat) => (
                    <div key={cat.category} className="mb-2">
                      <span className="font-bold text-xs text-gray-500">{cat.category.toUpperCase()}</span>
                      {cat.items.map(item => (
                        <div key={item} className="flex justify-between pl-2">
                           <span>{item}</span>
                           <span>[ ]</span>
                        </div>
                      ))}
                    </div>
                  ))
                )}
             </div>

             {/* Footer */}
             <div className="pt-4 border-t-2 border-dashed border-gray-200 text-center text-xs text-gray-400">
               TICKET OPEN<br/>
               DOMESTIC PLANNING TAX PAID
             </div>
           </div>
           
           {/* ZigZag Bottom */}
           <div className="relative h-4 w-full bg-white">
              <div className="receipt-zigzag"></div>
           </div>
        </div>

        {/* Action Button */}
        <button 
          onClick={onSend}
          className="w-full mt-6 bg-brand-500 text-white py-4 rounded-full font-bold shadow-lg flex items-center justify-center gap-2 hover:bg-brand-600 transition transform hover:scale-105"
        >
          <Share2 size={20} />
          Send to WhatsApp
        </button>
      </div>
    </div>
  );
};

export default Receipt;