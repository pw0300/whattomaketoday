import React, { useState, useEffect } from 'react';
import { UserProfile, Macros } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

// Step Components
import WelcomeStep from './onboarding/WelcomeStep';
import AllergenStep from './onboarding/AllergenStep';
import HealthStep from './onboarding/HealthStep';
import CuisineStep from './onboarding/CuisineStep';
import BiometricStep from './onboarding/BiometricStep';

interface Props {
  onComplete: (profile: UserProfile) => void;
}

const TOTAL_STEPS = 5;

const Onboarding: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1); // 1 = right, -1 = left

  const [profile, setProfile] = useState<UserProfile>({
    name: '',
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

  const handleNext = () => {
    setDirection(1);
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setDirection(-1);
    setStep(prev => prev - 1);
  };

  const handleFinish = () => {
    const finalProfile = {
      ...profile,
      cuisines: profile.cuisines.length > 0 ? profile.cuisines : ['North Indian', 'Italian'],
      isOnboarded: true
    };

    // Start background pre-warming for instant first-load experience
    // This runs async and doesn't block the onComplete callback
    if (finalProfile.uid) {
      import('../services/preWarmService').then(({ preWarmService }) => {
        preWarmService.startPreWarming(finalProfile.uid!, finalProfile);
      }).catch(console.warn);
    }

    onComplete(finalProfile);
  };

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 50 : -50,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 50 : -50,
      opacity: 0
    })
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F5F2] items-center justify-center text-[#1A4D2E] p-6 font-sans">

      {/* Progress Header */}
      <div className="w-full max-w-xl mb-10 flex flex-col gap-2">
        <div className="flex justify-between text-xs font-mono uppercase tracking-widest opacity-60">
          <span>Progress</span>
          <span>{step} / {TOTAL_STEPS}</span>
        </div>
        <div className="h-1 w-full bg-[#1A4D2E]/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#F9C74F]"
            initial={{ width: 0 }}
            animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            transition={{ ease: "circOut", duration: 0.5 }}
          />
        </div>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-xl bg-white p-8 md:p-12 rounded-[2rem] shadow-xl border border-[#1A4D2E]/5 relative overflow-hidden min-h-[500px] flex flex-col">
        {/* Decorative Background Blob */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-[#1A4D2E]/5 rounded-full blur-3xl pointer-events-none" />

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col"
          >
            {step === 1 && (
              <WelcomeStep
                profile={profile}
                onProfileChange={setProfile}
                onNext={handleNext}
              />
            )}
            {step === 2 && (
              <AllergenStep
                profile={profile}
                onProfileChange={setProfile}
                onNext={handleNext}
              />
            )}
            {step === 3 && (
              <HealthStep
                profile={profile}
                onProfileChange={setProfile}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            {step === 4 && (
              <CuisineStep
                profile={profile}
                onProfileChange={setProfile}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            {step === 5 && (
              <BiometricStep
                profile={profile}
                onProfileChange={setProfile}
                onFinish={handleFinish}
                onBack={handleBack}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Note */}
      <div className="mt-8 text-center opacity-40 font-mono text-[10px] uppercase tracking-widest">
        TadkaSync • Intelligent Kitchen OS
      </div>
    </div>
  );
};

export default Onboarding;
