import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Apple, Carrot, Citrus, Drumstick, Egg, Leaf, Pizza, Sandwich, Soup } from 'lucide-react';

const INGREDIENTS = [
    { icon: Apple, color: '#FF4D4D', name: 'Apple' },
    { icon: Carrot, color: '#FF9F43', name: 'Carrot' },
    { icon: Citrus, color: '#F9C74F', name: 'Citrus' },
    { icon: Drumstick, color: '#A0522D', name: 'Protein' },
    { icon: Egg, color: '#F8F5F2', name: 'Egg' },
    { icon: Leaf, color: '#43AA8B', name: 'Herb' },
    { icon: Pizza, color: '#F3722C', name: 'Carb' },
    { icon: Sandwich, color: '#90BE6D', name: 'Fiber' },
    { icon: Soup, color: '#577590', name: 'Umami' },
];

interface GameObject {
    id: number;
    x: number;
    y: number;
    type: typeof INGREDIENTS[0];
    speed: number;
}

const KitchenMiniGame: React.FC = () => {
    const [score, setScore] = useState(0);
    const [basketX, setBasketX] = useState(50); // Percentage
    const [objects, setObjects] = useState<GameObject[]>([]);
    const gameRef = useRef<HTMLDivElement>(null);
    const basketRef = useRef<HTMLDivElement>(null);

    // Handle Movement (Touch & Mouse)
    const handleMove = useCallback((clientX: number) => {
        if (!gameRef.current) return;
        const rect = gameRef.current.getBoundingClientRect();
        const relativeX = ((clientX - rect.left) / rect.width) * 100;
        setBasketX(Math.max(5, Math.min(95, relativeX)));
    }, []);

    const onMouseMove = (e: React.MouseEvent) => handleMove(e.clientX);
    const onTouchMove = (e: React.TouchEvent) => {
        // Prevent default scrolling on mobile while playing
        if (e.cancelable) e.preventDefault();
        handleMove(e.touches[0].clientX);
    };

    // Game Loop: Spawn Objects
    useEffect(() => {
        const spawnInterval = setInterval(() => {
            const newObj: GameObject = {
                id: Math.random(),
                x: Math.random() * 90 + 5,
                y: -10,
                type: INGREDIENTS[Math.floor(Math.random() * INGREDIENTS.length)],
                speed: 1.5 + Math.random() * 2,
            };
            setObjects(prev => [...prev.slice(-10), newObj]);
        }, 1500);

        return () => clearInterval(spawnInterval);
    }, []);

    // Animation Frame: Physics & Collision
    useEffect(() => {
        let animationFrame: number;

        const update = () => {
            setObjects(prev => {
                const next = prev.map(obj => ({ ...obj, y: obj.y + obj.speed }));

                // Detect collisions
                const remaining = next.filter(obj => {
                    const isCaught = obj.y > 75 && obj.y < 90 && Math.abs(obj.x - basketX) < 15;
                    if (isCaught) {
                        setScore(s => s + 1);
                        return false;
                    }
                    return obj.y < 110; // Keep if not yet fallen off screen
                });

                return remaining;
            });

            animationFrame = requestAnimationFrame(update);
        };

        animationFrame = requestAnimationFrame(update);
        return () => cancelAnimationFrame(animationFrame);
    }, [basketX]);

    return (
        <div
            ref={gameRef}
            onMouseMove={onMouseMove}
            onTouchMove={onTouchMove}
            className="relative w-full h-56 bg-black/10 rounded-3xl overflow-hidden cursor-none touch-none border border-white/5 group shadow-inner"
        >
            {/* HUD */}
            <div className="absolute top-4 left-6 z-20 flex flex-col items-start select-none">
                <span className="text-[10px] uppercase tracking-[0.2em] font-black opacity-40 text-white">Score</span>
                <motion.span
                    key={score}
                    initial={{ y: 5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-2xl font-black text-[#F9C74F]"
                >
                    {score}
                </motion.span>
            </div>

            <div className="absolute top-4 right-6 z-20 flex flex-col items-end select-none">
                <span className="text-[10px] uppercase tracking-[0.2em] font-black opacity-40 text-white">
                    {'ontouchstart' in window ? 'Slide to move' : 'Move cursor'}
                </span>
            </div>

            {/* Decorative Grid */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />

            {/* Falling Objects */}
            <AnimatePresence>
                {objects.map(obj => (
                    <div
                        key={obj.id}
                        style={{
                            position: 'absolute',
                            left: `${obj.x}%`,
                            top: `${obj.y}%`,
                            color: obj.type.color,
                            transform: 'translate(-50%, -50%)'
                        }}
                        className="pointer-events-none drop-shadow-2xl transition-transform duration-100"
                    >
                        <obj.type.icon size={28} style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }} />
                    </div>
                ))}
            </AnimatePresence>

            {/* Basket */}
            <motion.div
                ref={basketRef}
                animate={{ x: `calc(${basketX}% - 2rem)` }}
                transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                className="absolute bottom-6 w-16 h-10 pointer-events-none flex items-end justify-center"
            >
                <div className="relative w-full h-full">
                    {/* Glow */}
                    <div className="absolute -inset-4 bg-[#F9C74F]/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Bowl Visual */}
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-xl border-2 border-white/20 rounded-b-3xl rounded-t-md shadow-2xl" />
                    <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-50" />

                    {/* Catch Feedback */}
                    <AnimatePresence>
                        {score > 0 && (
                            <motion.div
                                key={score}
                                initial={{ scale: 0.5, opacity: 0, y: 0 }}
                                animate={{ scale: 1.5, opacity: 1, y: -40 }}
                                exit={{ opacity: 0 }}
                                className="absolute left-1/2 -translate-x-1/2 text-white font-black text-lg select-none"
                            >
                                ✨
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* Ambiance */}
            <div className="absolute bottom-0 w-full h-20 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        </div>
    );
};

export default KitchenMiniGame;
