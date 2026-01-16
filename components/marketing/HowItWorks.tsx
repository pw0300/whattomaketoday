import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Sparkles, ShoppingBag, Utensils, Share2 } from 'lucide-react';

const STEPS = [
    { id: 1, label: 'You Swipe', icon: Smartphone, desc: 'Tell us what you crave. We learn your taste.' },
    { id: 2, label: 'AI Curates', icon: Sparkles, desc: 'Our engine balances nutrition, pantry stock, and taste.' },
    { id: 3, label: 'We Plan', icon: ShoppingBag, desc: 'Instant grocery lists. Zero waste logic.' },
    { id: 4, label: 'You Cook', icon: Utensils, desc: 'Step-by-step guides for the modern chef.' },
    { id: 5, label: 'We Share', icon: Share2, desc: 'Flash your culinary wins to the world.' },
];

const HowItWorks: React.FC = () => {
    const [active, setActive] = useState(0);

    return (
        <div className="w-full max-w-6xl mx-auto py-20 px-4">
            <div className="flex flex-col md:flex-row justify-between items-center relative">

                {/* Connecting Line (Desktop) */}
                <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-[#1A4D2E]/10 -z-10" />

                {STEPS.map((step, idx) => {
                    const isActive = active === idx;
                    return (
                        <motion.div
                            key={step.id}
                            className="relative flex flex-col items-center text-center group cursor-pointer w-full md:w-48 mb-10 md:mb-0"
                            onMouseEnter={() => setActive(idx)}
                            whileHover={{ scale: 1.05 }}
                        >
                            <div
                                className={`
                                w-24 h-24 rounded-full flex items-center justify-center mb-6 transition-all duration-500 relative
                                ${isActive ? 'bg-[#1A4D2E] text-[#F9C74F] shadow-xl scale-110' : 'bg-white text-[#1A4D2E]/40 border border-[#1A4D2E]/10'}
                            `}
                            >
                                <step.icon size={32} />
                                {isActive && (
                                    <motion.div
                                        className="absolute inset-0 rounded-full border-2 border-[#F9C74F]"
                                        layoutId="ring"
                                        transition={{ duration: 0.3 }}
                                    />
                                )}
                            </div>

                            <h4 className={`font-serif text-xl mb-2 transition-colors ${isActive ? 'text-[#1A4D2E]' : 'text-[#1A4D2E]/40'}`}>{step.label}</h4>
                            <p className={`font-sans text-sm px-2 transition-opacity duration-300 ${isActive ? 'opacity-70' : 'opacity-0 h-0 hidden md:block'}`}>
                                {step.desc}
                            </p>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    );
};

export default HowItWorks;
