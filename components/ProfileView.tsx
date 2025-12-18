import React, { useState } from 'react';
import { UserProfile, Allergen, HealthCondition, Cuisine } from '../types';
import { Save, User, Shield, Activity, Globe } from 'lucide-react';

interface Props {
  userProfile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
}

const CUISINE_OPTIONS: Cuisine[] = [
  'North Indian', 'South Indian', 'Italian', 'Mexican', 
  'Thai', 'Chinese', 'Mediterranean', 'American'
];

const ProfileView: React.FC<Props> = ({ userProfile, onUpdateProfile }) => {
  const [profile, setProfile] = useState<UserProfile>(userProfile);
  const [isSaved, setIsSaved] = useState(false);

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
             onChange={(e) => setProfile({...profile, name: e.target.value})}
             className="w-full border-2 border-gray-200 p-2 font-bold text-ink focus:border-ink focus:outline-none"
           />
        </div>

        {/* Cuisines */}
        <div className="bg-white border-2 border-ink p-4 shadow-hard-sm">
           <div className="flex items-center gap-2 mb-4 border-b-2 border-gray-100 pb-2">
              <Globe className="text-ink" size={20} />
              <h3 className="font-black uppercase text-sm">Cuisine Specialties</h3>
           </div>
           <div className="grid grid-cols-2 gap-2">
              {CUISINE_OPTIONS.map(c => (
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
        </div>

        {/* Safety */}
        <div className="bg-white border-2 border-ink p-4 shadow-hard-sm">
           <div className="flex items-center gap-2 mb-4 border-b-2 border-gray-100 pb-2">
              <Shield className="text-red-500" size={20} />
              <h3 className="font-black uppercase text-sm text-red-500">Allergen 86 List</h3>
           </div>
           <div className="flex flex-wrap gap-2">
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
        </div>

        {/* Health */}
        <div className="bg-white border-2 border-ink p-4 shadow-hard-sm">
           <div className="flex items-center gap-2 mb-4 border-b-2 border-gray-100 pb-2">
              <Activity className="text-blue-500" size={20} />
              <h3 className="font-black uppercase text-sm text-blue-500">Dietary Reqs</h3>
           </div>
           <div className="flex flex-col gap-2">
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
        </div>

      </div>
    </div>
  );
};

export default ProfileView;