import React, { useState } from 'react';
import { UserProfile, Allergen, HealthCondition, Cuisine } from '../types';
import { Check, ShieldAlert, Activity, UtensilsCrossed } from 'lucide-react';

interface Props {
  onComplete: (profile: UserProfile) => void;
}

const CUISINE_OPTIONS: Cuisine[] = [
  'North Indian', 'South Indian', 'Italian', 'Mexican', 
  'Thai', 'Chinese', 'Mediterranean', 'American'
];

const Onboarding: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<UserProfile>({
    name: 'Home Chef',
    allergens: [],
    conditions: [],
    cuisines: [],
    dailyTargets: { protein: 100, carbs: 200, fat: 70, calories: 2000 },
    isOnboarded: false
  });

  const toggleAllergen = (a: Allergen) => {
    setProfile(prev => ({
      ...prev,
      allergens: prev.allergens.includes(a) 
        ? prev.allergens.filter(x => x !== a) 
        : [...prev.allergens, a]
    }));
  };

  const toggleCondition = (c: HealthCondition) => {
    setProfile(prev => ({
      ...prev,
      conditions: prev.conditions.includes(c)
        ? prev.conditions.filter(x => x !== c)
        : [...prev.conditions, c]
    }));
  };

  const toggleCuisine = (c: Cuisine) => {
    setProfile(prev => ({
      ...prev,
      cuisines: prev.cuisines.includes(c)
        ? prev.cuisines.filter(x => x !== c)
        : [...prev.cuisines, c]
    }));
  };

  const handleFinish = () => {
    // Force at least one cuisine if none selected
    const finalProfile = {
      ...profile,
      cuisines: profile.cuisines.length > 0 ? profile.cuisines : ['North Indian', 'Italian'] as Cuisine[],
      isOnboarded: true
    };
    onComplete(finalProfile);
  };

  return (
    <div className="flex flex-col h-full p-6 bg-paper items-center justify-center text-ink">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-black text-ink mb-1 uppercase tracking-tight">ChefSync</h1>
        <p className="font-mono text-sm text-gray-500 mb-8 border-b-2 border-ink pb-4">Household Food OS Setup</p>

        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right duration-300">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 uppercase">
              <ShieldAlert className="w-6 h-6" strokeWidth={2.5} />
              Safety Protocols
            </h2>
            <p className="mb-4 text-sm font-medium text-gray-600">Exclude ingredients containing:</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {Object.values(Allergen).map((allergen) => (
                <button
                  key={allergen}
                  onClick={() => toggleAllergen(allergen)}
                  className={`p-4 border-2 transition-all font-bold uppercase text-sm ${
                    profile.allergens.includes(allergen)
                      ? 'border-ink bg-ink text-white shadow-hard-sm'
                      : 'border-ink bg-white text-ink hover:bg-gray-50'
                  }`}
                >
                  {allergen}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setStep(2)}
              className="w-full bg-brand-500 text-white border-2 border-ink py-4 font-black uppercase shadow-hard hover:translate-y-1 hover:shadow-none transition-all"
            >
              Confirm & Next
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right duration-300">
             <h2 className="text-xl font-bold mb-4 flex items-center gap-2 uppercase">
              <Activity className="w-6 h-6" strokeWidth={2.5} />
              Biological Constraints
            </h2>
            <p className="mb-4 text-sm font-medium text-gray-600">Select active conditions:</p>
             <div className="grid grid-cols-1 gap-3 mb-6">
              {Object.values(HealthCondition).filter(c => c !== HealthCondition.None).map((cond) => (
                <button
                  key={cond}
                  onClick={() => toggleCondition(cond)}
                  className={`p-4 border-2 transition-all flex justify-between items-center font-bold uppercase text-sm ${
                    profile.conditions.includes(cond)
                      ? 'border-ink bg-blue-100 text-ink shadow-hard-sm'
                      : 'border-ink bg-white text-ink hover:bg-gray-50'
                  }`}
                >
                  {cond}
                  {profile.conditions.includes(cond) && <Check className="w-5 h-5" strokeWidth={3} />}
                </button>
              ))}
            </div>
             <div className="flex gap-4">
              <button 
                onClick={() => setStep(1)}
                className="flex-1 bg-white border-2 border-ink text-ink py-4 font-bold uppercase hover:bg-gray-100"
              >
                Back
              </button>
              <button 
                onClick={() => setStep(3)}
                className="flex-1 bg-brand-500 text-white border-2 border-ink py-4 font-black uppercase shadow-hard hover:translate-y-1 hover:shadow-none transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right duration-300">
             <h2 className="text-xl font-bold mb-4 flex items-center gap-2 uppercase">
              <UtensilsCrossed className="w-6 h-6" strokeWidth={2.5} />
              Taste Profile
            </h2>
            <p className="mb-4 text-sm font-medium text-gray-600">Select preferred cuisines:</p>
             <div className="grid grid-cols-2 gap-3 mb-6">
              {CUISINE_OPTIONS.map((cuisine) => (
                <button
                  key={cuisine}
                  onClick={() => toggleCuisine(cuisine)}
                  className={`p-3 border-2 transition-all flex justify-center items-center font-bold uppercase text-xs text-center h-16 ${
                    profile.cuisines.includes(cuisine)
                      ? 'border-ink bg-yellow-300 text-ink shadow-hard-sm'
                      : 'border-ink bg-white text-ink hover:bg-gray-50'
                  }`}
                >
                  {cuisine}
                </button>
              ))}
            </div>
             <div className="flex gap-4">
              <button 
                onClick={() => setStep(2)}
                className="flex-1 bg-white border-2 border-ink text-ink py-4 font-bold uppercase hover:bg-gray-100"
              >
                Back
              </button>
              <button 
                onClick={handleFinish}
                className="flex-1 bg-brand-600 text-white border-2 border-ink py-4 font-black uppercase shadow-hard hover:translate-y-1 hover:shadow-none transition-all"
              >
                Launch OS
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;