import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Layers, LayoutGrid, ClipboardList, ShieldAlert, Heart } from 'lucide-react';

interface Props {
  onComplete: () => void;
}

const IntroWalkthrough: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const slides = [
    {
      title: "The Household Food OS",
      subtitle: "Eliminate the domestic planning tax.",
      description: "ChefSync is an AI-powered logistics engine for your kitchen. It handles meal planning, inventory, and procurement so you don't have to.",
      visual: (
         <div className="text-8xl">👨‍🍳</div>
      ),
      icon: null
    },
    {
      title: "R&D Phase",
      subtitle: "Curate your database.",
      description: "Swipe on AI-generated dishes tailored to your taste profile. Right to approve, Up to make it a household staple.",
      visual: (
        <div className="relative w-32 h-44 bg-white border-2 border-ink shadow-hard flex flex-col items-center justify-center p-2 rotate-6">
             <div className="absolute top-2 right-2 text-ink"><Heart size={16} fill="currentColor" /></div>
             <div className="w-20 h-20 bg-gray-100 rounded-full mb-3 border border-ink/10"></div>
             <div className="h-2 w-20 bg-gray-200 mb-1"></div>
             <div className="h-2 w-12 bg-gray-200"></div>
             
             {/* Gesture hints */}
             <div className="absolute -right-8 top-1/2 bg-green-500 text-white text-[10px] px-1 font-bold shadow-sm">YES</div>
             <div className="absolute -left-8 top-1/2 bg-red-500 text-white text-[10px] px-1 font-bold shadow-sm">NO</div>
             <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] px-1 font-bold shadow-sm">STAPLE</div>
        </div>
      ),
      icon: <Layers size={32}/>
    },
    {
      title: "Run of Show",
      subtitle: "Automated Service Rotation.",
      description: "Approved dishes are automatically compiled into a cohesive weekly plan. Swap meal slots instantly if plans change.",
      visual: (
        <div className="w-48 bg-white border-2 border-ink shadow-hard p-2 flex flex-col gap-2">
            <div className="flex gap-2 items-center">
                <div className="w-8 h-8 bg-ink text-white flex items-center justify-center text-[10px] font-bold">MON</div>
                <div className="flex-1 bg-gray-50 border border-ink/20 p-1 flex flex-col justify-center">
                    <div className="h-1.5 w-16 bg-gray-300 mb-1"></div>
                    <div className="h-1.5 w-10 bg-gray-200"></div>
                </div>
            </div>
             <div className="flex gap-2 items-center">
                <div className="w-8 h-8 bg-ink text-white flex items-center justify-center text-[10px] font-bold">TUE</div>
                <div className="flex-1 bg-gray-50 border border-ink/20 p-1 flex flex-col justify-center">
                    <div className="h-1.5 w-20 bg-gray-300 mb-1"></div>
                    <div className="h-1.5 w-12 bg-gray-200"></div>
                </div>
            </div>
        </div>
      ),
      icon: <LayoutGrid size={32}/>
    },
    {
      title: "Procurement",
      subtitle: "Smart inventory management.",
      description: "Ingredients are automatically tallied. Check your pantry stock to generate a precise shopping list manifest.",
      visual: (
        <div className="w-40 bg-white border-2 border-ink shadow-hard p-4 relative">
            <div className="absolute -top-3 -right-3 bg-brand-500 text-white text-[10px] font-bold px-2 py-1 border border-ink shadow-sm">GENERATED</div>
            <div className="flex items-center gap-3 mb-3">
                <div className="w-4 h-4 border-2 border-ink bg-green-500 flex items-center justify-center text-white text-[10px]">✓</div>
                <div className="h-1.5 w-20 bg-gray-400"></div>
            </div>
            <div className="flex items-center gap-3 mb-3 opacity-50">
                <div className="w-4 h-4 border-2 border-ink"></div>
                <div className="h-1.5 w-16 bg-gray-300"></div>
            </div>
            <div className="flex items-center gap-3 mb-1 opacity-50">
                <div className="w-4 h-4 border-2 border-ink"></div>
                <div className="h-1.5 w-24 bg-gray-300"></div>
            </div>
        </div>
      ),
      icon: <ClipboardList size={32}/>
    },
    {
      title: "Safety Protocols",
      subtitle: "Dietary constraints are law.",
      description: "Set strict allergen filters and biological constraints. The AI will never suggest a dish that violates your rules.",
      visual: (
        <div className="w-32 h-32 rounded-full border-2 border-ink flex items-center justify-center bg-red-50 text-red-500 shadow-hard">
            <ShieldAlert size={64} strokeWidth={1.5} />
        </div>
      ),
      icon: <ShieldAlert size={32}/>
    }
  ];

  const handleNext = () => {
    if (step < slides.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-paper flex flex-col text-ink">
      {/* Progress Bar */}
      <div className="w-full h-2 bg-gray-200">
        <motion.div 
            className="h-full bg-brand-500"
            initial={{ width: 0 }}
            animate={{ width: `${((step + 1) / slides.length) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <AnimatePresence mode="wait">
            <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center max-w-sm"
            >
                <div className="mb-12 min-h-[180px] flex items-center justify-center">
                    {slides[step].visual}
                </div>
                
                <h1 className="text-3xl font-black uppercase mb-3 leading-none text-ink">
                    {slides[step].title}
                </h1>
                <p className="font-mono text-xs font-bold uppercase text-brand-600 mb-6 tracking-widest bg-brand-50 px-2 py-1">
                    {slides[step].subtitle}
                </p>
                <p className="font-medium text-gray-600 leading-relaxed text-sm">
                    {slides[step].description}
                </p>
            </motion.div>
        </AnimatePresence>
      </div>

      <div className="p-6 pb-12 flex justify-between items-center bg-white border-t-2 border-ink">
        <button 
            onClick={onComplete}
            className="font-mono text-xs font-bold uppercase text-gray-400 hover:text-ink px-4 py-2"
        >
            Skip Intro
        </button>

        <button 
            onClick={handleNext}
            className="bg-ink text-white px-8 py-4 rounded-none border-2 border-transparent hover:border-ink hover:bg-white hover:text-ink font-black uppercase tracking-wider flex items-center gap-2 shadow-hard active:translate-y-1 active:shadow-none transition-all"
        >
            {step === slides.length - 1 ? "Initialize System" : "Next"} <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default IntroWalkthrough;