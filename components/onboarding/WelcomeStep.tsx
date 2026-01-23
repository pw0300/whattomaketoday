import React from 'react';
import { motion } from 'framer-motion';
import { ChefHat, ArrowRight } from 'lucide-react';
import { UserProfile } from '../../types';

interface Props {
    profile: UserProfile;
    onProfileChange: (p: UserProfile) => void;
    onNext: () => void;
}

const WelcomeStep: React.FC<Props> = ({ profile, onProfileChange, onNext }) => {
    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                <div className="bg-brand-100 p-4 rounded-full mb-4">
                    <ChefHat size={48} className="text-brand-600" />
                </div>

                <h2 className="text-3xl font-display font-black text-ink">
                    Hi, I'm <span className="text-brand-500">TadkaSync</span>.
                </h2>

                <p className="text-ink-light max-w-xs leading-relaxed">
                    I'm your new AI kitchen assistant. I'll help you plan meals, track your pantry, and prevent food waste.
                </p>

                <div className="w-full max-w-xs pt-4">
                    <label className="block text-xs font-bold uppercase tracking-widest text-ink-light mb-2">
                        What should I call you?
                    </label>
                    <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => onProfileChange({ ...profile, name: e.target.value })}
                        placeholder="Enter your name..."
                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 font-medium text-ink focus:border-brand-500 focus:bg-white transition-all outline-none text-center text-lg"
                        autoFocus
                    />
                </div>
            </div>

            <div className="pt-8">
                <button
                    onClick={onNext}
                    disabled={!profile.name || profile.name.trim().length < 2}
                    className="w-full bg-ink text-white py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Let's Get Cooking <ArrowRight size={16} />
                </button>
            </div>
        </div>
    );
};

export default WelcomeStep;
