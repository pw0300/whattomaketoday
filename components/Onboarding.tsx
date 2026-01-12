import React, { useState, useEffect } from 'react';
import { UserProfile, Allergen, HealthCondition, Cuisine, DietaryPreference, Macros, Biometrics } from '../types';
import { Check, ShieldAlert, Activity, UtensilsCrossed, FileText, Target, UploadCloud, Loader2, FileCheck, Plus, X, Calculator, ArrowRight } from 'lucide-react';
import { analyzeHealthReport } from '../services/geminiService';

interface Props {
  onComplete: (profile: UserProfile) => void;
}

const CUISINE_SUGGESTIONS: string[] = [
  'North Indian', 'South Indian', 'Italian', 'Mexican',
  'Thai', 'Chinese', 'Mediterranean', 'American'
];

const DIETARY_OPTIONS: DietaryPreference[] = ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Any'];

const Onboarding: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [analyzingReport, setAnalyzingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [customCuisineInput, setCustomCuisineInput] = useState('');

  const [profile, setProfile] = useState<UserProfile>({
    name: 'Home Chef',
    allergens: [],
    allergenNotes: '',
    conditions: [],
    conditionNotes: '',
    healthReportSummary: '',
    cuisines: [],
    cuisineNotes: '',
    dietaryPreference: 'Any',
    customNotes: '',
    dailyTargets: { protein: 0, carbs: 0, fat: 0, calories: 0 },
    isOnboarded: false,
    biometrics: {
      age: 30,
      gender: 'Female',
      weight: 70,
      height: 170,
      activityLevel: 'Moderate',
      goal: 'Maintain'
    },
    likedDishes: []
  });

  // Auto-calculate macros whenever biometrics change
  useEffect(() => {
    if (profile.biometrics) {
      const { age, gender, weight, height, activityLevel, goal } = profile.biometrics;

      // Mifflin-St Jeor Equation
      let bmr = (10 * weight) + (6.25 * height) - (5 * age);
      bmr += gender === 'Male' ? 5 : -161;

      const multipliers = {
        'Sedentary': 1.2,
        'Light': 1.375,
        'Moderate': 1.55,
        'Active': 1.725
      };

      let tdee = Math.round(bmr * multipliers[activityLevel]);

      if (goal === 'Lose') tdee -= 500;
      if (goal === 'Gain') tdee += 500;

      // Macro Split (Balanced: 30P / 35C / 35F)
      const protein = Math.round((tdee * 0.3) / 4);
      const carbs = Math.round((tdee * 0.35) / 4);
      const fat = Math.round((tdee * 0.35) / 9);

      setProfile(prev => ({
        ...prev,
        dailyTargets: {
          calories: tdee,
          protein,
          carbs,
          fat
        }
      }));
    }
  }, [profile.biometrics]); // Only recalculate when biometrics input changes

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
    if (customCuisineInput.trim() && !profile.cuisines.includes(customCuisineInput.trim())) {
      setProfile(prev => ({
        ...prev,
        cuisines: [...prev.cuisines, customCuisineInput.trim()]
      }));
      setCustomCuisineInput('');
    }
  };

  const updateBiometric = (key: keyof Biometrics, value: any) => {
    setProfile(prev => ({
      ...prev,
      biometrics: { ...prev.biometrics!, [key]: value }
    }));
  };

  const updateMacro = (key: keyof Macros, value: string) => {
    const num = parseInt(value) || 0;
    setProfile(prev => ({
      ...prev,
      dailyTargets: { ...prev.dailyTargets, [key]: num }
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setReportError("File too large (Max 5MB)");
        return;
      }
      setReportError(null);
      setAnalyzingReport(true);
      const result = await analyzeHealthReport(file);
      setProfile(prev => ({ ...prev, healthReportSummary: result }));
      setAnalyzingReport(false);
    }
  };

  const handleFinish = () => {
    // Force at least one cuisine if none selected
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
        <p className="font-mono text-sm text-gray-500 mb-8 border-b-2 border-ink pb-4">Kitchen System Setup</p>

        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right duration-300">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 uppercase">
              <ShieldAlert className="w-6 h-6" strokeWidth={2.5} />
              Dietary Requirements
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
              onChange={(e) => setProfile({ ...profile, allergenNotes: e.target.value })}
            />

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
              Health Profile
            </h2>
            <p className="mb-4 text-sm font-medium text-gray-600">Select active conditions:</p>
            <div className="grid grid-cols-1 gap-3 mb-6">
              {Object.values(HealthCondition).filter(c => c !== HealthCondition.None).map((cond) => (
                <button
                  key={cond}
                  onClick={() => toggleCondition(cond)}
                  className={`p-4 border-2 transition-all flex justify-between items-center font-bold uppercase text-sm ${profile.conditions.includes(cond)
                    ? 'border-ink bg-blue-100 text-ink shadow-hard-sm'
                    : 'border-ink bg-white text-ink hover:bg-gray-50'
                    }`}
                >
                  {cond}
                  {profile.conditions.includes(cond) && <Check className="w-5 h-5" strokeWidth={3} />}
                </button>
              ))}
            </div>

            {/* Health Report Upload Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                <FileText size={16} /> Upload Health Data (Lab Report)
              </label>

              <div className="relative">
                {analyzingReport && (
                  <div className="absolute inset-0 bg-white/80 z-10 flex flex-col items-center justify-center border-2 border-ink">
                    <Loader2 className="animate-spin mb-2" />
                    <span className="font-mono text-xs uppercase animate-pulse">Analyzing Biomarkers...</span>
                  </div>
                )}

                {!profile.healthReportSummary ? (
                  <>
                    <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed ${reportError ? 'border-red-500 bg-red-50' : 'border-ink bg-gray-50'} hover:bg-white cursor-pointer transition`}>
                      <UploadCloud size={24} className={`mb-1 ${reportError ? 'text-red-500' : 'text-gray-400'}`} />
                      <span className={`font-mono text-xs uppercase ${reportError ? 'text-red-500' : 'text-gray-500'}`}>{reportError || "Scan / Upload PDF or IMG"}</span>
                      <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFileUpload} />
                    </label>
                    {reportError && <p className="text-[10px] text-red-500 font-bold mt-1 text-center">{reportError}</p>}
                  </>
                ) : (
                  <div className="w-full border-2 border-green-500 bg-green-50 p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-xs uppercase text-green-700 flex items-center gap-1">
                        <FileCheck size={14} /> Analysis Complete
                      </span>
                      <button onClick={() => setProfile(prev => ({ ...prev, healthReportSummary: '' }))} className="text-xs underline text-green-700">Remove</button>
                    </div>
                    <textarea
                      value={profile.healthReportSummary}
                      onChange={(e) => setProfile(prev => ({ ...prev, healthReportSummary: e.target.value }))}
                      className="w-full bg-transparent font-mono text-xs text-green-900 focus:outline-none resize-none h-20"
                    />
                  </div>
                )}
              </div>
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
              <label className="text-[10px] font-mono uppercase text-gray-500 mb-1 block">Add Custom Cuisines</label>
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
              <label className="text-[10px] font-mono uppercase text-gray-500 mb-1 block">Your Favorites (Seeds Generation)</label>
              <input
                type="text"
                placeholder="e.g. Butter Chicken, Pasta Carbonara..."
                className="w-full border-2 border-ink p-2 font-mono text-sm focus:bg-yellow-50 focus:outline-none mb-2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = e.currentTarget.value.trim();
                    if (val) {
                      setProfile(prev => ({ ...prev, likedDishes: [...(prev.likedDishes || []), val] }));
                      e.currentTarget.value = '';
                    }
                  }
                }}
              />
              <div className="flex flex-wrap gap-2">
                {profile.likedDishes?.map((d, i) => (
                  <span key={i} className="bg-brand-100 border border-brand-500 text-brand-900 px-2 py-1 text-[10px] font-bold uppercase flex items-center gap-1">
                    {d} <button onClick={() => setProfile(prev => ({ ...prev, likedDishes: prev.likedDishes.filter((_, idx) => idx !== i) }))}><X size={10} /></button>
                  </span>
                ))}
              </div>
            </div>

            <textarea
              className="w-full border-2 border-ink p-2 mb-6 bg-white font-mono text-xs h-20 resize-none focus:outline-none placeholder:text-gray-400"
              placeholder="Flavor notes (e.g. 'Love spicy', 'No cilantro', 'Prefer creamy textures')..."
              value={profile.cuisineNotes}
              onChange={(e) => setProfile({ ...profile, cuisineNotes: e.target.value })}
            />

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
              <Calculator className="w-6 h-6" strokeWidth={2.5} />
              Biometrics
            </h2>

            <p className="mb-2 text-sm font-medium text-gray-600">Dietary Type:</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {DIETARY_OPTIONS.map(opt => (
                <button
                  key={opt}
                  onClick={() => setProfile({ ...profile, dietaryPreference: opt })}
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
                <span className="font-black uppercase text-xs">Calorie Goals</span>
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
                <span className="font-mono text-xs uppercase text-blue-600">Calculated Daily Target:</span>
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
              onChange={(e) => setProfile({ ...profile, customNotes: e.target.value })}
            />

            <div className="flex gap-4">
              <button
                onClick={() => setStep(3)}
                className="flex-1 bg-white border-2 border-ink text-ink py-4 font-bold uppercase hover:bg-gray-100"
              >
                Back
              </button>
              <button
                onClick={handleFinish}
                className="flex-1 bg-brand-600 text-white border-2 border-ink py-4 font-black uppercase shadow-hard hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-2"
              >
                Start Cooking <ArrowRight size={18} strokeWidth={3} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Onboarding;
