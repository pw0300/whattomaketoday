import React, { useState, useEffect } from 'react';
import { UserProfile, Allergen, HealthCondition, Cuisine, DietaryPreference, Macros } from '../types';
import { Save, User, Shield, Activity, Globe, Utensils, Target, FileText, Plus, X, AlertTriangle, HardDrive, Wifi } from 'lucide-react';

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
      allergenNotes: userProfile.allergenNotes || '',
      conditionNotes: userProfile.conditionNotes || '',
      cuisineNotes: userProfile.cuisineNotes || '',
      healthReportSummary: userProfile.healthReportSummary || ''
  });
  const [isSaved, setIsSaved] = useState(false);
  const [customCuisineInput, setCustomCuisineInput] = useState('');
  
  // Diagnostic State
  const [storageUsage, setStorageUsage] = useState<string>('0 KB');

  useEffect(() => {
    // Calculate local storage usage
    let _lsTotal = 0, _xLen, _x;
    for (_x in localStorage) {
        if (!localStorage.hasOwnProperty(_x)) {
            continue;
        }
        _xLen = ((localStorage[_x].length + _x.length) * 2);
        _lsTotal += _xLen;
    }
    setStorageUsage((_lsTotal / 1024).toFixed(2) + " KB");
  }, []);

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
           <h2 className="text-2xl font-black uppercase text-ink">Back Office</h2>
           <p className="font-mono text-xs text-gray-600">House Rules & Config</p>
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
        
        {/* Name Section */}
        <div className="bg-white border-2 border-ink p-4 shadow-hard-sm">
           <div className="flex items-center gap-2 mb-4 border-b-2 border-gray-100 pb-2">
              <User className="text-ink" size={20} />
              <h3 className="font-black uppercase text-sm">Executive Chef</h3>
           </div>
           <label className="font-mono text-xs uppercase text-gray-500 block mb-1">Display Name</label>
           <input 
             type="text" 
             value={profile.name}
             maxLength={40}
             onChange={(e) => setProfile({...profile, name: e.target.value})}
             className="w-full border-2 border-gray-200 p-2 font-bold text-ink focus:border-ink focus:outline-none"
           />
        </div>

        {/* Dietary & Context */}
        <div className="bg-white border-2 border-ink p-4 shadow-hard-sm">
           <div className="flex items-center gap-2 mb-4 border-b-2 border-gray-100 pb-2">
              <Utensils className="text-ink" size={20} />
              <h3 className="font-black uppercase text-sm">Dietary Logic</h3>
           </div>
           
           <div className="mb-4">
              <label className="font-mono text-xs uppercase text-gray-500 block mb-2">Type</label>
              <div className="flex flex-wrap gap-2">
                 {DIETARY_OPTIONS.map(opt => (
                   <button
                     key={opt}
                     onClick={() => setProfile({...profile, dietaryPreference: opt})}
                     className={`px-3 py-1 text-xs font-bold uppercase border-2 rounded-full transition ${
                       profile.dietaryPreference === opt
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
              <label className="font-mono text-xs uppercase text-gray-500 block mb-2">Global AI Context</label>
              <textarea
                 value={profile.customNotes}
                 maxLength={300}
                 onChange={(e) => setProfile({...profile, customNotes: e.target.value})}
                 className="w-full border-2 border-gray-200 p-2 font-mono text-xs focus:border-ink focus:outline-none min-h-[80px]"
                 placeholder="Enter permanent constraints (e.g. 'Use olive oil', 'Meal prep on Sundays')..."
              />
           </div>
        </div>

        {/* Performance Metrics (New) */}
        <div className="bg-white border-2 border-ink p-4 shadow-hard-sm">
           <div className="flex items-center gap-2 mb-4 border-b-2 border-gray-100 pb-2">
              <Target className="text-purple-600" size={20} />
              <h3 className="font-black uppercase text-sm text-purple-600">Performance Metrics</h3>
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
              <h3 className="font-black uppercase text-sm">Cuisine Specialties</h3>
           </div>
           
           <div className="grid grid-cols-2 gap-2 mb-4">
              {CUISINE_SUGGESTIONS.map(c => (
                 <button
                   key={c}
                   onClick={() => toggleCuisine(c)}
                   className={`p-2 text-xs font-bold uppercase border-2 transition ${
                     profile.cuisines.includes(c) 
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
                            {c} <button onClick={() => toggleCuisine(c)}><X size={10}/></button>
                        </span>
                    ))}
                </div>
            </div>

           <textarea
             value={profile.cuisineNotes}
             maxLength={300}
             onChange={(e) => setProfile({...profile, cuisineNotes: e.target.value})}
             className="w-full border-2 border-gray-200 p-2 font-mono text-xs focus:border-ink focus:outline-none min-h-[60px]"
             placeholder="Taste nuances (e.g. 'Love spicy', 'Crispy textures')..."
           />
        </div>

        {/* Safety */}
        <div className="bg-white border-2 border-ink p-4 shadow-hard-sm">
           <div className="flex items-center gap-2 mb-4 border-b-2 border-gray-100 pb-2">
              <Shield className="text-red-500" size={20} />
              <h3 className="font-black uppercase text-sm text-red-500">Allergen 86 List</h3>
           </div>
           <div className="flex flex-wrap gap-2 mb-4">
              {Object.values(Allergen).map(a => (
                 <button
                   key={a}
                   onClick={() => toggleAllergen(a)}
                   className={`px-3 py-1 text-xs font-bold uppercase border-2 rounded-full transition ${
                     profile.allergens.includes(a) 
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
             onChange={(e) => setProfile({...profile, allergenNotes: e.target.value})}
             className="w-full border-2 border-gray-200 p-2 font-mono text-xs focus:border-ink focus:outline-none min-h-[60px]"
             placeholder="Specific allergy details (e.g. 'Peanut traces ok', 'Severe shellfish')..."
           />
        </div>

        {/* Health */}
        <div className="bg-white border-2 border-ink p-4 shadow-hard-sm">
           <div className="flex items-center gap-2 mb-4 border-b-2 border-gray-100 pb-2">
              <Activity className="text-blue-500" size={20} />
              <h3 className="font-black uppercase text-sm text-blue-500">Dietary Reqs</h3>
           </div>
           <div className="flex flex-col gap-2 mb-4">
              {Object.values(HealthCondition).filter(x => x !== 'None').map(c => (
                 <button
                   key={c}
                   onClick={() => toggleCondition(c)}
                   className={`p-3 text-xs font-bold uppercase border-2 flex justify-between items-center transition ${
                     profile.conditions.includes(c) 
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
             onChange={(e) => setProfile({...profile, conditionNotes: e.target.value})}
             className="w-full border-2 border-gray-200 p-2 font-mono text-xs focus:border-ink focus:outline-none min-h-[60px]"
             placeholder="Condition specifics (e.g. 'Insulin resistance', 'Low sodium')..."
           />
           
           {/* Lab Report Edit Field */}
           <div className="mt-4 pt-4 border-t border-gray-200">
               <label className="text-[10px] font-bold uppercase text-gray-500 mb-2 block flex items-center gap-1">
                   <FileText size={12} /> Biometric Analysis (Read-Only)
               </label>
               {profile.healthReportSummary ? (
                   <div className="bg-green-50 border border-green-200 p-2 text-xs font-mono text-green-800">
                       {profile.healthReportSummary}
                   </div>
               ) : (
                   <div className="text-xs text-gray-400 font-mono italic">No biometric data ingested.</div>
               )}
           </div>
        </div>

        {/* DIAGNOSTICS PANEL (New) */}
        <div className="bg-gray-100 border-2 border-gray-400 p-4 mt-8">
           <h3 className="font-black uppercase text-sm text-gray-600 mb-3 flex items-center gap-2">
              <Activity size={16}/> System Diagnostics
           </h3>
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-2 border border-gray-300">
                 <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-gray-500 mb-1">
                    <HardDrive size={12} /> Local Storage
                 </div>
                 <div className="text-sm font-mono">{storageUsage}</div>
              </div>
              <div className="bg-white p-2 border border-gray-300">
                 <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-gray-500 mb-1">
                    <Wifi size={12} /> API Status
                 </div>
                 <div className={`text-sm font-mono ${process.env.API_KEY ? 'text-green-600' : 'text-red-500'}`}>
                    {process.env.API_KEY ? 'CONNECTED' : 'MISSING KEY'}
                 </div>
              </div>
           </div>
        </div>

        {/* DANGER ZONE */}
        <div className="border-2 border-red-200 bg-red-50 p-4 mt-4">
           <div className="flex items-center gap-2 mb-2 text-red-600">
              <AlertTriangle size={20} />
              <h3 className="font-black uppercase text-sm">Danger Zone</h3>
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