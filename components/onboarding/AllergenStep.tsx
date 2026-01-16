import React from 'react';
import { UserProfile, Allergen } from '../../types';
import { ShieldAlert } from 'lucide-react';

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
        <div className="animate-in fade-in slide-in-from-right duration-300">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 uppercase">
                <ShieldAlert className="w-6 h-6" strokeWidth={2.5} />
                Food Restrictions
            </h2>
            <p className="mb-4 text-sm font-medium text-gray-600">Exclude ingredients containing:</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
                {Object.values(Allergen).map((allergen) => (
                    <button
                        key={allergen}
                        onClick={() => toggleAllergen(allergen)}
                        className={`p-4 border-2 transition-all font-bold uppercase text-sm ${profile.allergens.includes(allergen)
                            ? 'border-ink bg-ink text-white shadow-hard-sm'
                            : 'border-ink bg-white text-ink hover:bg-gray-50'
                            }`}
                    >
                        {allergen}
                    </button>
                ))}
            </div>

            <textarea
                className="w-full border-2 border-ink p-2 mb-6 bg-white font-mono text-xs h-20 resize-none focus:outline-none placeholder:text-gray-400"
                placeholder="Specific allergies (e.g. 'Severe Peanut Allergy', 'No raw tomatoes')..."
                value={profile.allergenNotes}
                onChange={(e) => onProfileChange({ ...profile, allergenNotes: e.target.value })}
            />

            <button
                onClick={onNext}
                className="w-full bg-brand-500 text-white border-2 border-ink py-4 font-black uppercase shadow-hard hover:translate-y-1 hover:shadow-none transition-all"
            >
                Confirm & Next
            </button>
        </div>
    );
};

export default AllergenStep;
