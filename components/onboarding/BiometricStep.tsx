import React from 'react';
import { UserProfile, DietaryPreference, Biometrics, Macros } from '../../types';
import { Calculator, Target, ArrowRight } from 'lucide-react';

interface Props {
    profile: UserProfile;
    onProfileChange: (profile: UserProfile) => void;
    onFinish: () => void;
    onBack: () => void;
}

const DIETARY_OPTIONS: DietaryPreference[] = ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Any'];

const BiometricStep: React.FC<Props> = ({ profile, onProfileChange, onFinish, onBack }) => {
    const updateBiometric = (key: keyof Biometrics, value: any) => {
        onProfileChange({
            ...profile,
            biometrics: { ...profile.biometrics!, [key]: value }
        });
    };

    const updateMacro = (key: keyof Macros, value: string) => {
        const num = parseInt(value) || 0;
        onProfileChange({
            ...profile,
            dailyTargets: { ...profile.dailyTargets, [key]: num }
        });
    };

    return (
        <div className="animate-in fade-in slide-in-from-right duration-300">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 uppercase">
                <Calculator className="w-6 h-6" strokeWidth={2.5} />
                My Info
            </h2>

            <p className="mb-2 text-sm font-medium text-gray-600">Dietary Type:</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
                {DIETARY_OPTIONS.map(opt => (
                    <button
                        key={opt}
                        onClick={() => onProfileChange({ ...profile, dietaryPreference: opt })}
                        className={`p-3 border-2 transition-all font-bold uppercase text-xs ${profile.dietaryPreference === opt
                            ? 'border-ink bg-ink text-white shadow-hard-sm'
                            : 'border-ink bg-white text-ink hover:bg-gray-50'
                            }`}
                    >
                        {opt}
                    </button>
                ))}
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 p-4 mb-6">
                <div className="flex items-center gap-2 mb-3 text-blue-700">
                    <Target size={16} />
                    <span className="font-black uppercase text-xs">Your Goals</span>
                </div>

                {/* Biometrics Inputs */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                        <label className="text-[9px] uppercase font-bold text-gray-500 block">Gender</label>
                        <select
                            value={profile.biometrics?.gender}
                            onChange={(e) => updateBiometric('gender', e.target.value)}
                            className="w-full border-b-2 border-ink bg-transparent py-1 text-sm font-bold focus:outline-none"
                        >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[9px] uppercase font-bold text-gray-500 block">Goal</label>
                        <select
                            value={profile.biometrics?.goal}
                            onChange={(e) => updateBiometric('goal', e.target.value)}
                            className="w-full border-b-2 border-ink bg-transparent py-1 text-sm font-bold focus:outline-none"
                        >
                            <option value="Lose">Lose Weight</option>
                            <option value="Maintain">Maintain</option>
                            <option value="Gain">Build Muscle</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[9px] uppercase font-bold text-gray-500 block">Age</label>
                        <input type="number" value={profile.biometrics?.age} onChange={(e) => updateBiometric('age', parseInt(e.target.value))} className="w-full border-b-2 border-ink bg-transparent py-1 text-sm font-bold focus:outline-none" />
                    </div>
                    <div>
                        <label className="text-[9px] uppercase font-bold text-gray-500 block">Height (cm)</label>
                        <input type="number" value={profile.biometrics?.height} onChange={(e) => updateBiometric('height', parseInt(e.target.value))} className="w-full border-b-2 border-ink bg-transparent py-1 text-sm font-bold focus:outline-none" />
                    </div>
                    <div>
                        <label className="text-[9px] uppercase font-bold text-gray-500 block">Weight (kg)</label>
                        <input type="number" value={profile.biometrics?.weight} onChange={(e) => updateBiometric('weight', parseInt(e.target.value))} className="w-full border-b-2 border-ink bg-transparent py-1 text-sm font-bold focus:outline-none" />
                    </div>
                    <div>
                        <label className="text-[9px] uppercase font-bold text-gray-500 block">Activity</label>
                        <select
                            value={profile.biometrics?.activityLevel}
                            onChange={(e) => updateBiometric('activityLevel', e.target.value)}
                            className="w-full border-b-2 border-ink bg-transparent py-1 text-sm font-bold focus:outline-none"
                        >
                            <option value="Sedentary">Sedentary</option>
                            <option value="Light">Light</option>
                            <option value="Moderate">Moderate</option>
                            <option value="Active">Active</option>
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-2 border-t border-blue-200">
                    <span className="font-mono text-xs uppercase text-blue-600">Daily Calorie Goal:</span>
                    <span className="font-black text-xl text-blue-800">{profile.dailyTargets.calories} kcal</span>
                </div>
            </div>

            <p className="mb-2 text-sm font-medium text-gray-600 flex items-center gap-2">
                Manual Override (Optional):
            </p>
            <div className="grid grid-cols-3 gap-3 mb-6 opacity-70 hover:opacity-100 transition-opacity">
                <div>
                    <label className="text-[10px] font-mono uppercase text-gray-500">Protein (g)</label>
                    <input
                        type="number"
                        value={profile.dailyTargets.protein}
                        onChange={(e) => updateMacro('protein', e.target.value)}
                        className="w-full border-2 border-ink p-2 font-mono text-sm focus:bg-yellow-50 focus:outline-none"
                    />
                </div>
                <div>
                    <label className="text-[10px] font-mono uppercase text-gray-500">Carbs (g)</label>
                    <input
                        type="number"
                        value={profile.dailyTargets.carbs}
                        onChange={(e) => updateMacro('carbs', e.target.value)}
                        className="w-full border-2 border-ink p-2 font-mono text-sm focus:bg-yellow-50 focus:outline-none"
                    />
                </div>
                <div>
                    <label className="text-[10px] font-mono uppercase text-gray-500">Fat (g)</label>
                    <input
                        type="number"
                        value={profile.dailyTargets.fat}
                        onChange={(e) => updateMacro('fat', e.target.value)}
                        className="w-full border-2 border-ink p-2 font-mono text-sm focus:bg-yellow-50 focus:outline-none"
                    />
                </div>
            </div>

            <textarea
                className="w-full border-2 border-ink p-3 mb-6 bg-white font-mono text-sm min-h-[60px] resize-none focus:outline-none"
                placeholder="Other context (e.g. 'Intermittent Fasting')..."
                value={profile.customNotes}
                onChange={(e) => onProfileChange({ ...profile, customNotes: e.target.value })}
            />

            <div className="flex gap-4">
                <button
                    onClick={onBack}
                    className="flex-1 bg-white border-2 border-ink text-ink py-4 font-bold uppercase hover:bg-gray-100"
                >
                    Back
                </button>
                <button
                    onClick={onFinish}
                    className="flex-1 bg-brand-600 text-white border-2 border-ink py-4 font-black uppercase shadow-hard hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-2"
                >
                    Start Cooking <ArrowRight size={18} strokeWidth={3} />
                </button>
            </div>
        </div>
    );
};

export default BiometricStep;
