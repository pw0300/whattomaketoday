import React from 'react';
import { UserProfile, Allergen } from '../../types';
import { ShieldAlert, Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
    profile: UserProfile;
    onProfileChange: (profile: UserProfile) => void;
    onNext: () => void;
}

const AllergenStep: React.FC<Props> = ({ profile, onProfileChange, onNext }) => {
    const toggleAllergen = (a: Allergen) => {
        onProfileChange({
            ...profile,
            allergens: profile.allergens.includes(a)
                ? profile.allergens.filter(x => x !== a)
                : [...profile.allergens, a]
        });
    };

    return (
        <div className="flex flex-col h-full">
            <div className="mb-8">
                <h2 className="font-serif text-3xl text-[#1A4D2E] mb-2">Restricted Items?</h2>
                <p className="text-[#1A4D2E]/60 font-sans text-sm">We'll filter out recipes containing these ingredients entirely.</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8 flex-1 content-start">
                {Object.values(Allergen).map((allergen) => {
                    const isSelected = profile.allergens.includes(allergen);
                    return (
                        <motion.button
                            key={allergen}
                            onClick={() => toggleAllergen(allergen)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`
                                relative p-4 rounded-xl text-left transition-all duration-200 border
                                ${isSelected
                                    ? 'bg-[#1A4D2E] text-[#F8F5F2] border-[#1A4D2E] shadow-lg shadow-[#1A4D2E]/20'
                                    : 'bg-white text-[#1A4D2E] border-[#1A4D2E]/10 hover:border-[#1A4D2E]/30 hover:shadow-md'
                                }
                            `}
                        >
                            <span className="font-serif font-bold text-lg block">{allergen}</span>
                            {isSelected && (
                                <div className="absolute top-4 right-4 bg-[#F9C74F] text-[#1A4D2E] rounded-full p-1">
                                    <Check size={12} strokeWidth={3} />
                                </div>
                            )}
                        </motion.button>
                    )
                })}
            </div>

            <div className="mt-auto space-y-4">
                <div className="relative group">
                    <textarea
                        className="w-full bg-[#F8F5F2] border border-[#1A4D2E]/10 rounded-xl p-4 font-mono text-xs h-24 resize-none focus:outline-none focus:border-[#1A4D2E] focus:ring-1 focus:ring-[#1A4D2E] transition-all"
                        placeholder="Any specifics? (e.g. 'Severe Peanut Allergy', 'No raw tomatoes')..."
                        value={profile.allergenNotes}
                        onChange={(e) => onProfileChange({ ...profile, allergenNotes: e.target.value })}
                    />
                    <div className="absolute top-0 right-0 p-2 pointer-events-none opacity-50">
                        <ShieldAlert size={14} className="text-[#1A4D2E]" />
                    </div>
                </div>

                <button
                    onClick={onNext}
                    className="w-full bg-[#1A4D2E] text-[#F8F5F2] py-4 rounded-full font-mono text-sm uppercase tracking-widest font-bold shadow-xl hover:bg-[#143d24] hover:shadow-2xl hover:scale-[1.01] transition-all"
                >
                    Confirm & Next
                </button>
            </div>
        </div>
    );
};

export default AllergenStep;
