import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChefHat, Utensils, Gamepad2 } from 'lucide-react';
import KitchenMiniGame from './KitchenMiniGame';

interface CuratingScreenProps {
    dishesLoaded: number;
    targetDishes: number;
    recentDishName?: string;
    userCuisines?: string[];
    onComplete: () => void;
}

const CURATING_MESSAGES = [
    "Analyzing your taste profile...",
    "Sourcing the perfect recipes...",
    "Matching with your preferences...",
    "Curating your personal menu...",
    "Almost ready..."
];

const CuratingScreen: React.FC<CuratingScreenProps> = ({
    dishesLoaded,
    targetDishes,
    recentDishName,
    userCuisines = [],
    onComplete
}) => {
    const [messageIndex, setMessageIndex] = useState(0);
    const [showComplete, setShowComplete] = useState(false);
    const progress = Math.min((dishesLoaded / targetDishes) * 100, 100);

    // Ref to track latest dish count (avoids stale closure in timeout)
    const dishesLoadedRef = useRef(dishesLoaded);
    useEffect(() => {
        dishesLoadedRef.current = dishesLoaded;
    }, [dishesLoaded]);

    // Rotate through messages
    useEffect(() => {
        const timer = setInterval(() => {
            setMessageIndex(prev => (prev + 1) % CURATING_MESSAGES.length);
        }, 2500);
        return () => clearInterval(timer);
    }, []);

    // BOUNTY FIX: Store timeout refs to prevent double-firing
    const completionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fallbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hasCompletedRef = useRef(false);

    const safeComplete = () => {
        if (hasCompletedRef.current) return;
        hasCompletedRef.current = true;
        // Clear both timeouts when either fires
        if (completionTimeoutRef.current) clearTimeout(completionTimeoutRef.current);
        if (fallbackTimeoutRef.current) clearTimeout(fallbackTimeoutRef.current);
        onComplete();
    };

    // Check if ready
    useEffect(() => {
        if (dishesLoaded >= targetDishes && !hasCompletedRef.current) {
            setShowComplete(true);
            completionTimeoutRef.current = setTimeout(safeComplete, 1500);
        }
    }, [dishesLoaded, targetDishes]);

    // Timeout fallback (30s max wait) - uses ref to get latest dish count
    useEffect(() => {
        fallbackTimeoutRef.current = setTimeout(() => {
            if (dishesLoadedRef.current >= 5) {
                safeComplete();
            }
        }, 30000);
        return () => {
            if (completionTimeoutRef.current) clearTimeout(completionTimeoutRef.current);
            if (fallbackTimeoutRef.current) clearTimeout(fallbackTimeoutRef.current);
        };
    }, []);

    const cuisineHint = userCuisines.length > 0
        ? `Finding ${userCuisines[0]} favorites...`
        : "Discovering new flavors...";

    return (
        <motion.div
            className="fixed inset-0 z-[100] bg-gradient-to-br from-[#1A4D2E] via-[#2D6A4F] to-[#1A4D2E] text-[#F8F5F2] flex flex-col items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
        >
            {/* Floating Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    className="absolute top-20 left-10 text-[#F9C74F]/20"
                    animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                >
                    <ChefHat size={60} />
                </motion.div>
                <motion.div
                    className="absolute bottom-32 right-16 text-[#F9C74F]/20"
                    animate={{ y: [0, 15, 0], rotate: [0, -10, 0] }}
                    transition={{ duration: 3.5, repeat: Infinity }}
                >
                    <Utensils size={48} />
                </motion.div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 max-w-md w-full text-center">
                {/* Logo */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.6 }}
                    className="mb-8"
                >
                    <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight">
                        TadkaSync
                    </h1>
                    <p className="text-[#F9C74F] text-sm font-mono uppercase tracking-widest mt-2">
                        Curating Your Kitchen
                    </p>
                </motion.div>

                {/* Progress Circle */}
                <div className="relative w-32 h-32 mx-auto mb-8">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="rgba(249, 199, 79, 0.2)"
                            strokeWidth="8"
                            fill="none"
                        />
                        <motion.circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="#F9C74F"
                            strokeWidth="8"
                            fill="none"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: progress / 100 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            style={{ strokeDasharray: "352", strokeDashoffset: 0 }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <motion.span
                            className="text-2xl font-bold"
                            key={dishesLoaded}
                            initial={{ scale: 1.2 }}
                            animate={{ scale: 1 }}
                        >
                            {dishesLoaded}/{targetDishes}
                        </motion.span>
                    </div>
                </div>

                {/* Status Message */}
                <AnimatePresence mode="wait">
                    <motion.p
                        key={messageIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 0.8, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-lg mb-4"
                    >
                        {showComplete ? "Your menu is ready!" : CURATING_MESSAGES[messageIndex]}
                    </motion.p>
                </AnimatePresence>

                {/* Cuisine Hint */}
                <p className="text-sm text-[#F9C74F]/70 mb-6">{cuisineHint}</p>

                {/* Mini Game Container */}
                <div className="mb-8 w-full">
                    <div className="flex items-center justify-center gap-2 mb-3 opacity-60">
                        <Gamepad2 size={14} className="text-[#F9C74F]" />
                        <span className="text-[10px] font-mono uppercase tracking-[0.2em]">Kitchen Warm-up</span>
                    </div>
                    <KitchenMiniGame />
                </div>

                {/* Recent Dish Added */}
                <AnimatePresence>
                    {recentDishName && !showComplete && (
                        <motion.div
                            key={recentDishName}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="flex items-center justify-center gap-2 text-[#F9C74F] text-sm"
                        >
                            <Sparkles size={16} />
                            <span className="font-medium">{recentDishName} added</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Ready Button (appears when complete) */}
                <AnimatePresence>
                    {showComplete && (
                        <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-8 px-8 py-3 bg-[#F9C74F] text-[#1A4D2E] rounded-full font-semibold 
                         hover:bg-[#F9C74F]/90 transition-colors shadow-lg"
                            onClick={onComplete}
                        >
                            Start Swiping →
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default CuratingScreen;
