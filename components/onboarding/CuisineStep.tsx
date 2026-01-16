import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { UtensilsCrossed, Plus, X, ChevronLeft, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
    profile: UserProfile;
    onProfileChange: (profile: UserProfile) => void;
    onNext: () => void;
    onBack: () => void;
}

const CUISINE_SUGGESTIONS: string[] = [
    'North Indian', 'South Indian', 'Italian', 'Mexican',
    'Thai', 'Chinese', 'Mediterranean', 'American'
];

const CuisineStep: React.FC<Props> = ({ profile, onProfileChange, onNext, onBack }) => {
    const [customCuisineInput, setCustomCuisineInput] = useState('');
    const [favoriteInput, setFavoriteInput] = useState('');

    const toggleCuisine = (c: string) => {
        onProfileChange({
            ...profile,
            cuisines: profile.cuisines.includes(c)
                ? profile.cuisines.filter(x => x !== c)
                : [...profile.cuisines, c]
        });
    };

    const addCustomCuisine = () => {
        if (customCuisineInput.trim() && !profile.cuisines.includes(customCuisineInput.trim())) {
            onProfileChange({
                ...profile,
                cuisines: [...profile.cuisines, customCuisineInput.trim()]
            });
            setCustomCuisineInput('');
        }
    };

    const addLikedDish = () => {
        if (favoriteInput.trim()) {
            onProfileChange({
                ...profile,
                likedDishes: [...(profile.likedDishes || []), favoriteInput.trim()]
            });
            setFavoriteInput('');
        }
    };

    const removeLikedDish = (index: number) => {
        onProfileChange({
            ...profile,
            likedDishes: profile.likedDishes.filter((_, idx) => idx !== index)
        });
    };

    return (
        <div className="flex flex-col h-full">
            <div className="mb-6">
                <h2 className="font-serif text-3xl text-[#1A4D2E] mb-2">Flavor Profile</h2>
                <p className="text-[#1A4D2E]/60 font-sans text-sm">What do you enjoy eating?</p>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar pr-2 space-y-8">
                {/* Standard Cuisines */}
                <div>
                    <label className="text-[10px] uppercase font-bold text-[#1A4D2E]/40 tracking-widest mb-3 block">Popular Cuisines</label>
                    <div className="flex flex-wrap gap-2">
                        {CUISINE_SUGGESTIONS.map((cuisine) => {
                            const isSelected = profile.cuisines.includes(cuisine);
                            return (
                                <motion.button
                                    key={cuisine}
                                    onClick={() => toggleCuisine(cuisine)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`
                                        px-4 py-2 rounded-full font-medium text-sm transition-all border
                                        ${isSelected
                                            ? 'bg-[#F9C74F] text-[#1A4D2E] border-[#F9C74F] shadow-sm'
                                            : 'bg-white text-[#1A4D2E]/70 border-[#1A4D2E]/10 hover:border-[#F9C74F]/50'
                                        }
                                    `}
                                >
                                    {cuisine}
                                </motion.button>
                            )
                        })}
                    </div>
                </div>

                {/* Custom Additions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Add Cuisine */}
                    <div>
                        <label className="text-[10px] uppercase font-bold text-[#1A4D2E]/40 tracking-widest mb-2 block">More Cuisines</label>
                        <div className="flex flex-row items-center gap-2 mb-3 w-full">
                            <input
                                type="text"
                                value={customCuisineInput}
                                onChange={(e) => setCustomCuisineInput(e.target.value)}
                                placeholder="Type & Enter (e.g. 'Lebanese')"
                                className="flex-1 bg-white border border-[#1A4D2E]/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#1A4D2E] focus:ring-1 focus:ring-[#1A4D2E] shadow-sm transition-all"
                                onKeyDown={(e) => e.key === 'Enter' && addCustomCuisine()}
                            />
                            <button
                                onClick={addCustomCuisine}
                                disabled={!customCuisineInput.trim()}
                                className="bg-[#1A4D2E] text-white p-3 rounded-lg hover:bg-[#143d24] disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all shrink-0"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {profile.cuisines.filter(c => !CUISINE_SUGGESTIONS.includes(c)).map(c => (
                                <span key={c} className="bg-[#1A4D2E]/10 px-2 py-1 rounded-md text-xs font-bold text-[#1A4D2E] flex items-center gap-1">
                                    {c} <button onClick={() => toggleCuisine(c)}><X size={10} /></button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Favorite Dishes */}
                    <div>
                        <label className="text-[10px] uppercase font-bold text-[#1A4D2E]/40 tracking-widest mb-2 block">Must-Haves (Favorites)</label>
                        <div className="flex flex-row items-center gap-2 mb-3 w-full">
                            <input
                                type="text"
                                value={favoriteInput}
                                onChange={(e) => setFavoriteInput(e.target.value)}
                                placeholder="Type & Enter (e.g. 'Rajma')"
                                className="flex-1 bg-white border border-[#1A4D2E]/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#F9C74F] focus:ring-1 focus:ring-[#F9C74F] shadow-sm transition-all"
                                onKeyDown={(e) => e.key === 'Enter' && addLikedDish()}
                            />
                            <button
                                onClick={addLikedDish}
                                disabled={!favoriteInput.trim()}
                                className="bg-[#F9C74F] text-[#1A4D2E] p-3 rounded-lg hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all shrink-0"
                            >
                                <Heart size={20} />
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {profile.likedDishes?.map((d, i) => (
                                <span key={i} className="bg-red-50 text-red-800 border border-red-100 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1">
                                    {d} <button onClick={() => removeLikedDish(i)}><X size={10} /></button>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <textarea
                    className="w-full bg-[#F8F5F2] border border-[#1A4D2E]/10 rounded-xl p-4 font-mono text-xs h-20 resize-none focus:outline-none focus:border-[#1A4D2E] transition-all"
                    placeholder="Any specific notes? (e.g. 'Love spicy food', 'No cilantro', 'Prefer creamy textures')..."
                    value={profile.cuisineNotes}
                    onChange={(e) => onProfileChange({ ...profile, cuisineNotes: e.target.value })}
                />
            </div>

            <div className="flex gap-4 mt-6">
                <button
                    onClick={onBack}
                    className="w-14 h-14 rounded-full border border-[#1A4D2E]/10 flex items-center justify-center text-[#1A4D2E] hover:bg-gray-50 transition-colors"
                >
                    <ChevronLeft size={24} />
                </button>
                <button
                    onClick={onNext}
                    className="flex-1 bg-[#1A4D2E] text-[#F8F5F2] h-14 rounded-full font-mono text-sm uppercase tracking-widest font-bold shadow-xl hover:bg-[#143d24] hover:shadow-2xl hover:scale-[1.01] transition-all"
                >
                    Almost Done
                </button>
            </div>
        </div>
    );
};

export default CuisineStep;
