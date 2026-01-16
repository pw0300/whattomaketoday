import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { UtensilsCrossed, Plus, X } from 'lucide-react';

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

    const addLikedDish = (dish: string) => {
        if (dish.trim()) {
            onProfileChange({
                ...profile,
                likedDishes: [...(profile.likedDishes || []), dish.trim()]
            });
        }
    };

    const removeLikedDish = (index: number) => {
        onProfileChange({
            ...profile,
            likedDishes: profile.likedDishes.filter((_, idx) => idx !== index)
        });
    };

    return (
        <div className="animate-in fade-in slide-in-from-right duration-300">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 uppercase">
                <UtensilsCrossed className="w-6 h-6" strokeWidth={2.5} />
                Your Tastes
            </h2>
            <p className="mb-4 text-sm font-medium text-gray-600">Select preferred cuisines:</p>

            {/* Standard Options */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                {CUISINE_SUGGESTIONS.map((cuisine) => (
                    <button
                        key={cuisine}
                        onClick={() => toggleCuisine(cuisine)}
                        className={`p-3 border-2 transition-all flex justify-center items-center font-bold uppercase text-xs text-center h-12 ${profile.cuisines.includes(cuisine)
                            ? 'border-ink bg-yellow-300 text-ink shadow-hard-sm'
                            : 'border-ink bg-white text-ink hover:bg-gray-50'
                            }`}
                    >
                        {cuisine}
                    </button>
                ))}
            </div>

            {/* Custom Cuisine Adder */}
            <div className="mb-6">
                <label className="text-[10px] font-mono uppercase text-gray-500 mb-1 block">Add Cuisines</label>
                <div className="flex gap-2 mb-3">
                    <input
                        type="text"
                        value={customCuisineInput}
                        onChange={(e) => setCustomCuisineInput(e.target.value)}
                        placeholder="e.g. Ethiopian, Peruvian..."
                        className="flex-1 border-2 border-ink p-2 font-mono text-sm focus:bg-yellow-50 focus:outline-none"
                        onKeyDown={(e) => e.key === 'Enter' && addCustomCuisine()}
                    />
                    <button
                        onClick={addCustomCuisine}
                        className="bg-ink text-white px-3 border-2 border-ink hover:bg-gray-800"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                <div className="flex flex-wrap gap-2">
                    {profile.cuisines.filter(c => !CUISINE_SUGGESTIONS.includes(c)).map(c => (
                        <span key={c} className="bg-yellow-300 border border-ink px-2 py-1 text-[10px] font-bold uppercase flex items-center gap-1">
                            {c} <button onClick={() => toggleCuisine(c)}><X size={10} /></button>
                        </span>
                    ))}
                </div>
            </div>

            {/* Favorite Dishes Seeder */}
            <div className="mb-6">
                <label className="text-[10px] font-mono uppercase text-gray-500 mb-1 block">Your Favorites</label>
                <input
                    type="text"
                    placeholder="e.g. Butter Chicken, Pasta Carbonara..."
                    className="w-full border-2 border-ink p-2 font-mono text-sm focus:bg-yellow-50 focus:outline-none mb-2"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            addLikedDish(e.currentTarget.value);
                            e.currentTarget.value = '';
                        }
                    }}
                />
                <div className="flex flex-wrap gap-2">
                    {profile.likedDishes?.map((d, i) => (
                        <span key={i} className="bg-brand-100 border border-brand-500 text-brand-900 px-2 py-1 text-[10px] font-bold uppercase flex items-center gap-1">
                            {d} <button onClick={() => removeLikedDish(i)}><X size={10} /></button>
                        </span>
                    ))}
                </div>
            </div>

            <textarea
                className="w-full border-2 border-ink p-2 mb-6 bg-white font-mono text-xs h-20 resize-none focus:outline-none placeholder:text-gray-400"
                placeholder="Flavor notes (e.g. 'Love spicy', 'No cilantro', 'Prefer creamy textures')..."
                value={profile.cuisineNotes}
                onChange={(e) => onProfileChange({ ...profile, cuisineNotes: e.target.value })}
            />

            <div className="flex gap-4">
                <button
                    onClick={onBack}
                    className="flex-1 bg-white border-2 border-ink text-ink py-4 font-bold uppercase hover:bg-gray-100"
                >
                    Back
                </button>
                <button
                    onClick={onNext}
                    className="flex-1 bg-brand-500 text-white border-2 border-ink py-4 font-black uppercase shadow-hard hover:translate-y-1 hover:shadow-none transition-all"
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default CuisineStep;
