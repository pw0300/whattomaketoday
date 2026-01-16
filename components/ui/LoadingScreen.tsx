import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MESSAGES = [
    "Sourcing fresh ingredients...",
    "Calibrating taste profiles...",
    "Sharpening knives...",
    "Consulting the Chef...",
    "Plating up..."
];

const LoadingScreen: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
    const [msgIndex, setMsgIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setMsgIndex(prev => {
                if (prev === MESSAGES.length - 1) {
                    clearInterval(timer);
                    setTimeout(() => onComplete?.(), 800);
                    return prev;
                }
                return prev + 1;
            });
        }, 800);
        return () => clearInterval(timer);
    }, [onComplete]);

    return (
        <motion.div
            className="fixed inset-0 z-[100] bg-[#1A4D2E] text-[#F8F5F2] flex flex-col items-center justify-center font-serif"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20, transition: { duration: 0.8, ease: "easeInOut" } }}
        >
            <div className="relative mb-8">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="text-6xl md:text-8xl font-black tracking-tighter"
                >
                    TadkaSync.
                </motion.div>
                <motion.div
                    className="absolute -bottom-2 right-0 h-1 bg-[#F9C74F]"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 4.5, ease: "easeInOut" }} // Matches total time approx
                />
            </div>

            <div className="h-8 overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.p
                        key={msgIndex}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 0.7 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="font-mono text-xs uppercase tracking-widest text-[#F9C74F]"
                    >
                        {MESSAGES[msgIndex]}
                    </motion.p>
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default LoadingScreen;
