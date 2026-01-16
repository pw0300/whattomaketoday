import React, { useState, useEffect } from 'react';
import { UserProfile, Allergen, HealthCondition, Cuisine, DietaryPreference, Macros, Biometrics } from '../types';
import { analyzeHealthReport } from '../services/geminiService';
import { Save, User, Shield, Activity, Globe, Utensils, Target, FileText, Plus, X, AlertTriangle, Upload, Loader2 } from 'lucide-react';

interface Props {
  userProfile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onFactoryReset?: () => void;
}

const CUISINE_SUGGESTIONS: string[] = [
  'North Indian', 'South Indian', 'Italian', 'Mexican',
  'Thai', 'Chinese', 'Mediterranean', 'American'
];

const DIETARY_OPTIONS: DietaryPreference[] = ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Any'];

const ProfileView: React.FC<Props> = ({ userProfile, onUpdateProfile, onFactoryReset }) => {
  // Ensure default values for new fields if loading from old profile data
  const [profile, setProfile] = useState<UserProfile>({
    ...userProfile,
    allergens: userProfile.allergens || [],
    conditions: userProfile.conditions || [],
    cuisines: userProfile.cuisines || [],
    dailyTargets: userProfile.dailyTargets || { calories: 2000, protein: 150, carbs: 250, fat: 70 },
    allergenNotes: userProfile.allergenNotes || '',
    conditionNotes: userProfile.conditionNotes || '',
    cuisineNotes: userProfile.cuisineNotes || '',
    healthReportSummary: userProfile.healthReportSummary || '',
    biometrics: userProfile.biometrics || {
      age: 30,
      gender: 'Other',
      weight: 70,
      height: 170,
      activityLevel: 'Moderate',
      goal: 'Maintain'
    }
  });
  const [isSaved, setIsSaved] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [customCuisineInput, setCustomCuisineInput] = useState('');

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

  const updateMacro = (key: keyof Macros, value: string) => {
    const num = parseInt(value) || 0;
    setProfile(prev => ({
      ...prev,
      dailyTargets: { ...prev.dailyTargets, [key]: num }
    }));
  };

  const updateBiometric = (key: keyof Biometrics, value: any) => {
    setProfile(prev => ({
      ...prev,
      biometrics: { ...prev.biometrics!, [key]: value }
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsAnalyzing(true);
      try {
        const summary = await analyzeHealthReport(e.target.files[0]);
        setProfile(prev => ({ ...prev, healthReportSummary: summary }));
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const handleSave = () => {
    onUpdateProfile(profile);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-paper">
      {/* Header */}
      <div className="p-4 border-b-2 border-ink bg-paper sticky top-0 z-10 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black uppercase text-ink">My Profile</h2>
          <p className="font-mono text-xs text-gray-600">Settings</p>
        </div>
        <button
          onClick={handleSave}
          className={`px-4 py-2 font-bold uppercase border-2 border-ink shadow-hard hover:shadow-none hover:translate-y-1 transition flex items-center gap-2 text-xs ${isSaved ? 'bg-green-500 text-white' : 'bg-ink text-white'}`}
        >
          <Save size={16} />
          {isSaved ? 'Saved' : 'Save'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-8 pb-24">

        {/* --- GAMIFICATION WALLET (New) --- */}
        <div className="bg-ink text-white p-6 rounded-2xl shadow-hard mb-8 relative overflow-hidden">
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <h3 className="font-mono text-[10px] uppercase opacity-60 mb-1">Credits</h3>
              <div className="text-4xl font-black tracking-tighter flex items-baseline gap-1">
                {profile.credits || 0}<span className="text-sm font-bold text-brand-500">CR</span>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-1 bg-white/10 px-2 py-1 rounded text-[9px] font-bold uppercase mb-2">
                <Activity size={10} /> Balance
              </div>
            </div>
          </div>

          {/* Earning Rules */}
          <div className="mt-6 grid grid-cols-2 gap-2">
            <div className="bg-white/5 p-2 rounded flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-brand-500 text-ink flex items-center justify-center font-black text-xs">+3</div>
              <div>
                <p className="font-bold text-[10px] uppercase">Cook Dish</p>
                <p className="text-[8px] opacity-60">Log a completed meal</p>
              </div>
            </div>
            <div className="bg-white/5 p-2 rounded flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white text-ink flex items-center justify-center font-black text-xs border-2 border-ink">-1</div>
              <div>
                <p className="font-bold text-[10px] uppercase">View Recipe</p>
                <p className="text-[8px] opacity-60">Reveal full recipe</p>
              </div>
            </div>
          </div>
        </div>

        {/* Name Section */}
        <div className="bg-white border-2 border-ink p-4 shadow-hard-sm">
          <div className="flex items-center gap-2 mb-4 border-b-2 border-gray-100 pb-2">
            <User className="text-ink" size={20} />
            <h3 className="font-black uppercase text-sm">Name</h3>
          </div>
          <label className="font-mono text-xs uppercase text-gray-500 block mb-1">Display Name</label>
          <input
            type="text"
            value={profile.name}
            maxLength={40}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            className="w-full border-2 border-gray-200 p-2 font-bold text-ink focus:border-ink focus:outline-none"
          />
        </div>

        {/* Biometrics Section (New) */}
        <div className="bg-white border-2 border-ink p-4 shadow-hard-sm">
          <div className="flex items-center gap-2 mb-4 border-b-2 border-gray-100 pb-2">
            <Activity className="text-orange-500" size={20} />
            <h3 className="font-black uppercase text-sm text-orange-500">Body Details</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-[10px] font-mono uppercase text-gray-500 block mb-1">Age</label>
              <input type="number" value={profile.biometrics?.age} onChange={(e) => updateBiometric('age', parseInt(e.target.value))} className="w-full border-2 border-gray-200 p-2 font-mono text-sm focus:border-ink focus:outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-gray-500 block mb-1">Gender</label>
              <select value={profile.biometrics?.gender} onChange={(e) => updateBiometric('gender', e.target.value)} className="w-full border-2 border-gray-200 p-2 font-mono text-sm focus:border-ink focus:outline-none bg-white">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-gray-500 block mb-1">Weight (kg)</label>
              <input type="number" value={profile.biometrics?.weight} onChange={(e) => updateBiometric('weight', parseInt(e.target.value))} className="w-full border-2 border-gray-200 p-2 font-mono text-sm focus:border-ink focus:outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-gray-500 block mb-1">Height (cm)</label>
              <input type="number" value={profile.biometrics?.height} onChange={(e) => updateBiometric('height', parseInt(e.target.value))} className="w-full border-2 border-gray-200 p-2 font-mono text-sm focus:border-ink focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="text-[10px] font-mono uppercase text-gray-500 block mb-1">Activity Level</label>
              <select value={profile.biometrics?.activityLevel} onChange={(e) => updateBiometric('activityLevel', e.target.value)} className="w-full border-2 border-gray-200 p-2 font-mono text-sm focus:border-ink focus:outline-none bg-white">
                <option value="Sedentary">Sedentary (Office Job)</option>
                <option value="Light">Light (1-2 days/week)</option>
                <option value="Moderate">Moderate (3-5 days/week)</option>
                <option value="Active">Active (6-7 days/week)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-gray-500 block mb-1">Goal</label>
              <div className="flex gap-2">
                {['Lose', 'Maintain', 'Gain'].map(g => (
                  <button
                    key={g}
                    onClick={() => updateBiometric('goal', g)}
                    className={`flex-1 py-2 text-xs font-bold uppercase border-2 transition ${profile.biometrics?.goal === g ? 'bg-orange-500 text-white border-orange-700' : 'bg-white border-gray-200 text-gray-400'}`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Dietary & Context */}
        <div className="bg-white border-2 border-ink p-4 shadow-hard-sm">
          <div className="flex items-center gap-2 mb-4 border-b-2 border-gray-100 pb-2">
            <Utensils className="text-ink" size={20} />
            <h3 className="font-black uppercase text-sm">Dietary Preferences</h3>
          </div>

          <div className="mb-4">
            <label className="font-mono text-xs uppercase text-gray-500 block mb-2">Type</label>
            <div className="flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map(opt => (
                <button
                  key={opt}
                  onClick={() => setProfile({ ...profile, dietaryPreference: opt })}
                  className={`px-3 py-1 text-xs font-bold uppercase border-2 rounded-full transition ${profile.dietaryPreference === opt
                    ? 'bg-ink text-white border-ink'
                    : 'bg-white border-gray-200 text-gray-400'
                    }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-mono text-xs uppercase text-gray-500 block mb-2">Always remember</label>
            <textarea
              value={profile.customNotes}
              maxLength={300}
              onChange={(e) => setProfile({ ...profile, customNotes: e.target.value })}
              className="w-full border-2 border-gray-200 p-2 font-mono text-xs focus:border-ink focus:outline-none min-h-[80px]"
              placeholder="Enter permanent constraints (e.g. 'Use olive oil', 'Meal prep on Sundays')..."
            />
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white border-2 border-ink p-4 shadow-hard-sm">
          <div className="flex items-center gap-2 mb-4 border-b-2 border-gray-100 pb-2">
            <Target className="text-purple-600" size={20} />
            <h3 className="font-black uppercase text-sm text-purple-600">Nutrition Goals</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono uppercase text-gray-500 block mb-1">Calories</label>
              <input
                type="number"
                value={profile.dailyTargets.calories}
                onChange={(e) => updateMacro('calories', e.target.value)}
                className="w-full border-2 border-gray-200 p-2 font-mono text-sm focus:border-ink focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-gray-500 block mb-1">Protein (g)</label>
              <input
                type="number"
                value={profile.dailyTargets.protein}
                onChange={(e) => updateMacro('protein', e.target.value)}
                className="w-full border-2 border-gray-200 p-2 font-mono text-sm focus:border-ink focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-gray-500 block mb-1">Carbs (g)</label>
              <input
                type="number"
                value={profile.dailyTargets.carbs}
                onChange={(e) => updateMacro('carbs', e.target.value)}
                className="w-full border-2 border-gray-200 p-2 font-mono text-sm focus:border-ink focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-gray-500 block mb-1">Fat (g)</label>
              <input
                type="number"
                value={profile.dailyTargets.fat}
                onChange={(e) => updateMacro('fat', e.target.value)}
                className="w-full border-2 border-gray-200 p-2 font-mono text-sm focus:border-ink focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Cuisines */}
        <div className="bg-white border-2 border-ink p-4 shadow-hard-sm">
          <div className="flex items-center gap-2 mb-4 border-b-2 border-gray-100 pb-2">
            <Globe className="text-ink" size={20} />
            <h3 className="font-black uppercase text-sm">Favorite Cuisines</h3>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {CUISINE_SUGGESTIONS.map(c => (
              <button
                key={c}
                onClick={() => toggleCuisine(c)}
                className={`p-2 text-xs font-bold uppercase border-2 transition ${profile.cuisines.includes(c)
                  ? 'bg-yellow-300 border-ink text-ink'
                  : 'bg-white border-gray-200 text-gray-400 hover:border-gray-400'
                  }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Custom Cuisine Adder */}
          <div className="mb-4 border-t border-gray-100 pt-3">
            <label className="text-[10px] font-mono uppercase text-gray-500 mb-2 block">Add Custom Cuisines</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={customCuisineInput}
                maxLength={25}
                onChange={(e) => setCustomCuisineInput(e.target.value)}
                placeholder="e.g. Ethiopian..."
                className="flex-1 border-2 border-gray-200 p-2 font-mono text-xs focus:border-ink focus:outline-none"
                onKeyDown={(e) => e.key === 'Enter' && addCustomCuisine()}
              />
              <button
                onClick={addCustomCuisine}
                className="bg-ink text-white px-3 border-2 border-ink hover:bg-gray-800"
              >
                <Plus size={16} />
              </button>
            </div>
            {/* Active Chips Display for Custom */}
            <div className="flex flex-wrap gap-2">
              {profile.cuisines.filter(c => !CUISINE_SUGGESTIONS.includes(c)).map(c => (
                <span key={c} className="bg-yellow-100 border border-ink px-2 py-1 text-[10px] font-bold uppercase flex items-center gap-1">
                  {c} <button onClick={() => toggleCuisine(c)}><X size={10} /></button>
                </span>
              ))}
            </div>
          </div>

          <textarea
            value={profile.cuisineNotes}
            maxLength={300}
            onChange={(e) => setProfile({ ...profile, cuisineNotes: e.target.value })}
            className="w-full border-2 border-gray-200 p-2 font-mono text-xs focus:border-ink focus:outline-none min-h-[60px]"
            placeholder="Taste nuances (e.g. 'Love spicy', 'Crispy textures')..."
          />
        </div>

        {/* Safety */}
        <div className="bg-white border-2 border-ink p-4 shadow-hard-sm">
          <div className="flex items-center gap-2 mb-4 border-b-2 border-gray-100 pb-2">
            <Shield className="text-red-500" size={20} />
            <h3 className="font-black uppercase text-sm text-red-500">Allergies</h3>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.values(Allergen).map(a => (
              <button
                key={a}
                onClick={() => toggleAllergen(a)}
                className={`px-3 py-1 text-xs font-bold uppercase border-2 rounded-full transition ${profile.allergens.includes(a)
                  ? 'bg-red-500 border-red-700 text-white'
                  : 'bg-white border-gray-200 text-gray-400'
                  }`}
              >
                {a}
              </button>
            ))}
          </div>
          <textarea
            value={profile.allergenNotes}
            maxLength={300}
            onChange={(e) => setProfile({ ...profile, allergenNotes: e.target.value })}
            className="w-full border-2 border-gray-200 p-2 font-mono text-xs focus:border-ink focus:outline-none min-h-[60px]"
            placeholder="Specific allergy details (e.g. 'Peanut traces ok', 'Severe shellfish')..."
          />
        </div>

        {/* Health */}
        <div className="bg-white border-2 border-ink p-4 shadow-hard-sm">
          <div className="flex items-center gap-2 mb-4 border-b-2 border-gray-100 pb-2">
            <Activity className="text-blue-500" size={20} />
            <h3 className="font-black uppercase text-sm text-blue-500">Health Conditions</h3>
          </div>
          <div className="flex flex-col gap-2 mb-4">
            {Object.values(HealthCondition).filter(x => x !== 'None').map(c => (
              <button
                key={c}
                onClick={() => toggleCondition(c)}
                className={`p-3 text-xs font-bold uppercase border-2 flex justify-between items-center transition ${profile.conditions.includes(c)
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'bg-white border-gray-200 text-gray-400'
                  }`}
              >
                {c}
                {profile.conditions.includes(c) && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
              </button>
            ))}
          </div>
          <textarea
            value={profile.conditionNotes}
            maxLength={300}
            onChange={(e) => setProfile({ ...profile, conditionNotes: e.target.value })}
            className="w-full border-2 border-gray-200 p-2 font-mono text-xs focus:border-ink focus:outline-none min-h-[60px]"
            placeholder="Condition specifics (e.g. 'Insulin resistance', 'Low sodium')..."
          />

          {/* Lab Report Edit Field */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <label className="text-[10px] font-bold uppercase text-gray-500 mb-2 block flex items-center gap-1">
              <FileText size={12} /> Health Report
            </label>
            {isAnalyzing ? (
              <div className="flex items-center gap-2 text-xs font-mono text-ink animate-pulse p-2">
                <Loader2 className="animate-spin" size={14} /> ANALYZING REPORT...
              </div>
            ) : (
              <div className="flex gap-2">
                <label className="cursor-pointer bg-white border-2 border-gray-200 px-3 py-2 flex items-center gap-2 hover:border-ink transition active:translate-y-0.5">
                  <Upload size={14} />
                  <span className="text-[10px] font-bold uppercase">Upload Report</span>
                  <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileUpload} />
                </label>
              </div>
            )}

            {profile.healthReportSummary ? (
              <div className="bg-green-50 border border-green-200 p-2 text-xs font-mono text-green-800 mt-2">
                <div className="font-bold uppercase text-[10px] mb-1 opacity-50">Analysis Result:</div>
                {profile.healthReportSummary}
              </div>
            ) : (
              <div className="text-xs text-gray-400 font-mono italic mt-2">No data. Upload a fake medical report (image) to test.</div>
            )}
          </div>
        </div>



        {/* DANGER ZONE */}
        <div className="border-2 border-red-200 bg-red-50 p-4 mt-4">
          <div className="flex items-center gap-2 mb-2 text-red-600">
            <AlertTriangle size={20} />
            <h3 className="font-black uppercase text-sm">Advanced</h3>
          </div>
          <p className="text-[10px] text-red-600 mb-4 font-mono">
            Factory reset will wipe all local data including preferences, pantry stock, and meal plans.
          </p>
          <button
            onClick={onFactoryReset}
            className="w-full bg-white border-2 border-red-500 text-red-500 font-bold uppercase py-3 text-xs hover:bg-red-500 hover:text-white transition-colors"
          >
            Factory Reset
          </button>
        </div>

      </div>
    </div>
  );
};

export default ProfileView;