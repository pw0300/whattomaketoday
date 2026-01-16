import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Layers, Clock, ArrowRight } from 'lucide-react';

interface Props {
  onComplete: () => void;
}

const slides = [
  {
    icon: Brain,
    title: "The Sous-Chef",
    desc: "I'm not just a recipe book. I understand your taste, your health, and your pantry.",
  },
  {
    icon: Layers,
    title: "The Swipe",
    desc: "Swipe right on dishes you love. I'll remember every preference.",
  },
  {
    icon: Clock,
    title: "The Plan",
    desc: "I'll curate your week and build your grocery list instantly.",
  },
];

const IntroWalkthrough: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const handleNext = () => {
    if (step < slides.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const CurrentIcon = slides[step].icon;

  return (
    <div className="h-screen w-full bg-[#1A4D2E] text-[#F8F5F2] flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Background Texture */}
      <div className="absolute inset-0 opacity-[0.05]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }}
      />

      <div className="z-10 w-full max-w-sm">
        {/* Animated Icon Container */}
        <motion.div
          key={step}
          initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-24 h-24 bg-[#F8F5F2]/10 rounded-full flex items-center justify-center mb-12 mx-auto border border-[#F8F5F2]/20 backdrop-blur-md"
        >
          <CurrentIcon size={40} className="text-[#F9C74F]" />
        </motion.div>

        {/* Text Content */}
        <div className="text-center h-40">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="font-serif text-4xl mb-4 text-[#F8F5F2]">{slides[step].title}</h2>
              <p className="font-sans text-lg opacity-70 leading-relaxed font-light">{slides[step].desc}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress Indicators */}
        <div className="flex justify-center gap-2 mb-12">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-500 ${i === step ? 'w-8 bg-[#F9C74F]' : 'w-2 bg-[#F8F5F2]/20'}`}
            />
          ))}
        </div>

        {/* Floating Action Button */}
        <motion.button
          onClick={handleNext}
          whileTap={{ scale: 0.95 }}
          className="w-full bg-[#F8F5F2] text-[#1A4D2E] py-4 rounded-full font-mono text-sm uppercase tracking-widest font-bold flex items-center justify-center gap-2 shadow-2xl hover:bg-white transition-colors"
        >
          {step === slides.length - 1 ? "Enter Kitchen" : "Continue"} <ArrowRight size={16} />
        </motion.button>
      </div>
    </div>
  );
};

export default IntroWalkthrough;