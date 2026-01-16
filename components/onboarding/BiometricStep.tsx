import React from 'react';
import { UserProfile, DietaryPreference, Biometrics, Macros } from '../../types';
import { Calculator, Target, ArrowRight, ChevronLeft, User, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

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
        <div className="flex flex-col h-full">
            <div className="mb-6">
                <h2 className="font-serif text-3xl text-[#1A4D2E] mb-2">Final Calibration</h2>
                <p className="text-[#1A4D2E]/60 font-sans text-sm">We calculate your needs based on science.</p>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar pr-2">
                {/* Diet Type */}
                <div className="mb-8">
                    <label className="text-[10px] uppercase font-bold text-[#1A4D2E]/40 tracking-widest mb-3 block">Primary Diet</label>
                    <div className="grid grid-cols-4 gap-2">
                        {DIETARY_OPTIONS.map(opt => (
                            <button
                                key={opt}
                                onClick={() => onProfileChange({ ...profile, dietaryPreference: opt })}
                                className={`
                                    py-3 rounded-lg font-bold uppercase text-[10px] transition-all border
                                    ${profile.dietaryPreference === opt
                                        ? 'bg-[#1A4D2E] text-[#F8F5F2] border-[#1A4D2E] shadow-lg'
                                        : 'bg-white text-[#1A4D2E] border-[#1A4D2E]/10 hover:border-[#1A4D2E]/30'
                                    }
                                `}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="bg-white rounded-2xl border border-[#1A4D2E]/10 p-6 shadow-sm mb-6">
                    <div className="flex items-center gap-2 mb-6 opacity-50">
                        <User size={16} />
                        <span className="font-mono text-xs uppercase tracking-widest font-bold">Body Metrics</span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                        {/* Gender */}
                        <div>
                            <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Gender</label>
                            <select
                                value={profile.biometrics?.gender}
                                onChange={(e) => updateBiometric('gender', e.target.value)}
                                className="w-full bg-[#F8F5F2] rounded-md p-2 text-sm font-bold focus:outline-none"
                            >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        </div>
                        {/* Age */}
                        <div>
                            <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Age</label>
                            <input
                                type="number"
                                value={profile.biometrics?.age}
                                onChange={(e) => updateBiometric('age', parseInt(e.target.value))}
                                className="w-full bg-[#F8F5F2] rounded-md p-2 text-sm font-bold focus:outline-none"
                            />
                        </div>
                        {/* Weight */}
                        <div>
                            <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Weight (kg)</label>
                            <input
                                type="number"
                                value={profile.biometrics?.weight}
                                onChange={(e) => updateBiometric('weight', parseInt(e.target.value))}
                                className="w-full bg-[#F8F5F2] rounded-md p-2 text-sm font-bold focus:outline-none"
                            />
                        </div>
                        {/* Height */}
                        <div>
                            <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Height (cm)</label>
                            <input
                                type="number"
                                value={profile.biometrics?.height}
                                onChange={(e) => updateBiometric('height', parseInt(e.target.value))}
                                className="w-full bg-[#F8F5F2] rounded-md p-2 text-sm font-bold focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Goals & Activity */}
                <div className="bg-[#F9C74F]/10 rounded-2xl p-6 border border-[#F9C74F]/20 mb-6">
                    <div className="flex items-center gap-2 mb-6 text-[#1A4D2E]">
                        <TrendingUp size={16} />
                        <span className="font-mono text-xs uppercase tracking-widest font-bold">Goals & Activity</span>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] uppercase font-bold text-[#1A4D2E]/50 block mb-1">Activity Level</label>
                            <select
                                value={profile.biometrics?.activityLevel}
                                onChange={(e) => updateBiometric('activityLevel', e.target.value)}
                                className="w-full bg-white rounded-md p-2 text-sm font-bold text-[#1A4D2E] focus:outline-none"
                            >
                                <option value="Sedentary">Sedentary (Desk Job)</option>
                                <option value="Light">Light (1-3 days/week)</option>
                                <option value="Moderate">Moderate (3-5 days/week)</option>
                                <option value="Active">Active (6-7 days/week)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-bold text-[#1A4D2E]/50 block mb-1">Primary Goal</label>
                            <select
                                value={profile.biometrics?.goal}
                                onChange={(e) => updateBiometric('goal', e.target.value)}
                                className="w-full bg-white rounded-md p-2 text-sm font-bold text-[#1A4D2E] focus:outline-none"
                            >
                                <option value="Lose">Weight Loss (-500 cal)</option>
                                <option value="Maintain">Maintenance</option>
                                <option value="Gain">Muscle Gain (+500 cal)</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-[#1A4D2E]/10 flex items-center justify-between">
                        <span className="font-mono text-xs uppercase text-[#1A4D2E]/60">Daily Target</span>
                        <span className="font-serif text-3xl font-bold text-[#1A4D2E]">{profile.dailyTargets.calories} <span className="text-sm font-sans font-normal opacity-50">kcal</span></span>
                    </div>
                </div>
            </div>

            <div className="flex gap-4 mt-4">
                <button
                    onClick={onBack}
                    className="w-14 h-14 rounded-full border border-[#1A4D2E]/10 flex items-center justify-center text-[#1A4D2E] hover:bg-gray-50 transition-colors"
                >
                    <ChevronLeft size={24} />
                </button>
                <button
                    onClick={onFinish}
                    className="flex-1 bg-[#1A4D2E] text-[#F8F5F2] h-14 rounded-full font-mono text-sm uppercase tracking-widest font-bold shadow-xl hover:bg-[#143d24] hover:shadow-2xl hover:scale-[1.01] transition-all flex items-center justify-center gap-3"
                >
                    Generate Menu <ArrowRight size={18} />
                </button>
            </div>
        </div>
    );
};

export default BiometricStep;
