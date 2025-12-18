import React, { useState } from 'react';
import { UserProfile, Allergen, HealthCondition, Cuisine, DietType } from '../types';
import { Check, ShieldAlert, Activity, UtensilsCrossed, Target, Plus, X } from 'lucide-react';

interface Props {
  onComplete: (profile: UserProfile) => void;
}

const CUISINE_OPTIONS: Cuisine[] = [
  'North Indian', 'South Indian', 'Italian', 'Mexican', 
  'Thai', 'Chinese', 'Mediterranean', 'American'
];

const Onboarding: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [customCuisine, setCustomCuisine] = useState('');
  const [profile, setProfile] = useState<UserProfile>({
    name: 'Home Chef',
    allergens: [],
    conditions: [],
    cuisines: [],
    dietType: DietType.Vegetarian,
    dailyTargets: { protein: 120, carbs: 200, fat: 60, calories: 1800 },
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

  const toggleCuisine = (c: string) => {
    setProfile(prev => ({
      ...prev,
      cuisines: prev.cuisines.includes(c)
        ? prev.cuisines.filter(x => x !== c)
        : [...prev.cuisines, c]
    }));
  };

  const addCustomCuisine = () => {
    if (customCuisine.trim() && !profile.cuisines.includes(customCuisine.trim())) {
      toggleCuisine(customCuisine.trim());
      setCustomCuisine('');
    }
  };

  const updateMacro = (key: keyof typeof profile.dailyTargets, val: string) => {
    const num = parseInt(val) || 0;
    setProfile(prev => ({
      ...prev,
      dailyTargets: { ...prev.dailyTargets, [key]: num }
    }));
  };

  const handleFinish = () => {
    const finalProfile = {
      ...profile,
      cuisines: profile.cuisines.length > 0 ? profile.cuisines : ['North Indian', 'Italian'],
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
            
            <p className="mb-2 text-sm font-bold uppercase text-ink">Dietary Preference:</p>
            <div className="grid grid-cols-3 gap-2 mb-6">
              {Object.values(DietType).map((dt) => (
                <button
                  key={dt}
                  onClick={() => setProfile({...profile, dietType: dt})}
                  className={`p-2 border-2 text-[10px] font-black uppercase text-center flex flex-col items-center justify-center gap-1 transition-all ${
                    profile.dietType === dt
                      ? 'border-ink bg-ink text-white shadow-hard-sm'
                      : 'border-ink bg-white text-ink hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-3 h-3 border border-current flex items-center justify-center rounded-sm ${dt === DietType.Vegetarian ? 'text-green-500' : dt === DietType.Eggetarian ? 'text-yellow-500' : 'text-red-600'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full bg-current`}></div>
                  </div>
                  {dt.replace('Vegetarian', 'Veg')}
                </button>
              ))}
            </div>

            <p className="mb-2 text-sm font-bold uppercase text-ink">Active conditions:</p>
             <div className="grid grid-cols-1 gap-2 mb-6">
              {Object.values(HealthCondition).filter(c => c !== HealthCondition.None).map((cond) => (
                <button
                  key={cond}
                  onClick={() => toggleCondition(cond)}
                  className={`p-3 border-2 transition-all flex justify-between items-center font-bold uppercase text-xs ${
                    profile.conditions.includes(cond)
                      ? 'border-ink bg-blue-100 text-ink shadow-hard-sm'
                      : 'border-ink bg-white text-ink hover:bg-gray-50'
                  }`}
                >
                  {cond}
                  {profile.conditions.includes(cond) && <Check className="w-4 h-4" strokeWidth={3} />}
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
              <Target className="w-6 h-6" strokeWidth={2.5} />
              Performance Targets
            </h2>
            <p className="mb-4 text-sm font-medium text-gray-600">Daily Nutritional Ceilings:</p>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="flex flex-col">
                <label className="font-mono text-[10px] uppercase font-bold text-gray-500 mb-1">Protein (g)</label>
                <input 
                  type="number" 
                  value={profile.dailyTargets.protein} 
                  onChange={(e) => updateMacro('protein', e.target.value)}
                  className="bg-white border-2 border-ink p-3 font-mono font-bold focus:bg-yellow-50 focus:outline-none"
                />
              </div>
              <div className="flex flex-col">
                <label className="font-mono text-[10px] uppercase font-bold text-gray-500 mb-1">Carbs (g)</label>
                <input 
                  type="number" 
                  value={profile.dailyTargets.carbs} 
                  onChange={(e) => updateMacro('carbs', e.target.value)}
                  className="bg-white border-2 border-ink p-3 font-mono font-bold focus:bg-yellow-50 focus:outline-none"
                />
              </div>
              <div className="flex flex-col">
                <label className="font-mono text-[10px] uppercase font-bold text-gray-500 mb-1">Fat (g)</label>
                <input 
                  type="number" 
                  value={profile.dailyTargets.fat} 
                  onChange={(e) => updateMacro('fat', e.target.value)}
                  className="bg-white border-2 border-ink p-3 font-mono font-bold focus:bg-yellow-50 focus:outline-none"
                />
              </div>
              <div className="flex flex-col">
                <label className="font-mono text-[10px] uppercase font-bold text-gray-500 mb-1">Energy (kcal)</label>
                <input 
                  type="number" 
                  value={profile.dailyTargets.calories} 
                  onChange={(e) => updateMacro('calories', e.target.value)}
                  className="bg-white border-2 border-ink p-3 font-mono font-bold focus:bg-yellow-50 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setStep(2)}
                className="flex-1 bg-white border-2 border-ink text-ink py-4 font-bold uppercase hover:bg-gray-100"
              >
                Back
              </button>
              <button 
                onClick={() => setStep(4)}
                className="flex-1 bg-brand-500 text-white border-2 border-ink py-4 font-black uppercase shadow-hard hover:translate-y-1 hover:shadow-none transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-in fade-in slide-in-from-right duration-300">
             <h2 className="text-xl font-bold mb-4 flex items-center gap-2 uppercase">
              <UtensilsCrossed className="w-6 h-6" strokeWidth={2.5} />
              Taste Profile
            </h2>
            <p className="mb-2 text-sm font-medium text-gray-600">Select preferred cuisines:</p>
             <div className="grid grid-cols-2 gap-2 mb-4">
              {CUISINE_OPTIONS.map((cuisine) => (
                <button
                  key={cuisine}
                  onClick={() => toggleCuisine(cuisine)}
                  className={`p-2 border-2 transition-all flex justify-center items-center font-bold uppercase text-[10px] text-center h-10 ${
                    profile.cuisines.includes(cuisine)
                      ? 'border-ink bg-yellow-300 text-ink shadow-hard-sm'
                      : 'border-ink bg-white text-ink hover:bg-gray-50'
                  }`}
                >
                  {cuisine}
                </button>
              ))}
            </div>

            <div className="mb-6">
              <label className="font-mono text-[10px] uppercase font-bold text-gray-500 block mb-1">Add Custom Cuisine</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={customCuisine}
                  onChange={(e) => setCustomCuisine(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomCuisine()}
                  className="flex-1 bg-white border-2 border-ink p-2 font-mono text-sm focus:bg-yellow-50 focus:outline-none"
                  placeholder="e.g. Marathi, Naga..."
                />
                <button 
                  onClick={addCustomCuisine}
                  className="bg-ink text-white p-2 border-2 border-ink"
                >
                  <Plus size={20} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {profile.cuisines.filter(c => !CUISINE_OPTIONS.includes(c as any)).map(c => (
                  <span key={c} className="bg-ink text-white text-[10px] font-mono px-2 py-1 flex items-center gap-1">
                    {c}
                    <X size={12} className="cursor-pointer" onClick={() => toggleCuisine(c)} />
                  </span>
                ))}
              </div>
            </div>

             <div className="flex gap-4">
              <button 
                onClick={() => setStep(3)}
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