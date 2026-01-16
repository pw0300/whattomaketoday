import React, { useState, useEffect } from 'react';
import { UserProfile, Macros } from '../types';

// Step Components
import AllergenStep from './onboarding/AllergenStep';
import HealthStep from './onboarding/HealthStep';
import CuisineStep from './onboarding/CuisineStep';
import BiometricStep from './onboarding/BiometricStep';

interface Props {
  onComplete: (profile: UserProfile) => void;
}

const Onboarding: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState(1);

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

      const multipliers: Record<string, number> = {
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
  }, [profile.biometrics]);

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
        <h1 className="text-4xl font-black text-ink mb-1 uppercase tracking-tight">TadkaSync</h1>
        <p className="font-mono text-sm text-gray-500 mb-8 border-b-2 border-ink pb-4">Let's get setup</p>

        {step === 1 && (
          <AllergenStep
            profile={profile}
            onProfileChange={setProfile}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <HealthStep
            profile={profile}
            onProfileChange={setProfile}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && (
          <CuisineStep
            profile={profile}
            onProfileChange={setProfile}
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
          />
        )}

        {step === 4 && (
          <BiometricStep
            profile={profile}
            onProfileChange={setProfile}
            onFinish={handleFinish}
            onBack={() => setStep(3)}
          />
        )}
      </div>
    </div>
  );
};

export default Onboarding;
