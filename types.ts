
export enum Allergen {
  Gluten = 'Gluten',
  Dairy = 'Dairy',
  Nuts = 'Nuts',
  Shellfish = 'Shellfish',
  Eggs = 'Eggs',
  Soy = 'Soy'
}

export enum HealthCondition {
  None = 'None',
  Diabetes = 'Diabetes',
  Hypertension = 'Hypertension',
  PCOS = 'PCOS'
}

export type Cuisine = string; 

export type DietaryPreference = 'Vegetarian' | 'Non-Vegetarian' | 'Vegan' | 'Any';

export interface Macros {
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
}

export interface Biometrics {
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  weight: number; 
  height: number; 
  activityLevel: 'Sedentary' | 'Light' | 'Moderate' | 'Active';
  goal: 'Lose' | 'Maintain' | 'Gain';
}

export interface UserProfile {
  uid?: string; // Firebase UID
  name: string;
  allergens: Allergen[];
  allergenNotes: string;
  conditions: HealthCondition[];
  conditionNotes: string;
  healthReportSummary?: string; 
  cuisines: Cuisine[];
  cuisineNotes: string;
  dietaryPreference: DietaryPreference;
  customNotes: string; 
  biometrics?: Biometrics; 
  dailyTargets: Macros;
  isOnboarded: boolean;
}

export interface Ingredient {
  name: string;
  quantity: string;
  category: 'Produce' | 'Protein' | 'Dairy' | 'Pantry' | 'Spices';
}

export interface Dish {
  id: string;
  name: string;
  localName: string; 
  description: string;
  primaryIngredient: string;
  cuisine: string;
  type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  image: string;
  macros: Macros;
  ingredients: Ingredient[];
  instructions: string[]; 
  tags: string[]; 
  chefAdvice?: string; 
  allergens: Allergen[];
  lastEaten?: number; 
  isStaple?: boolean;
  userNotes?: string; 
  servings?: number; 
}

export enum SwipeDirection {
  Left = 'Left',   
  Right = 'Right', 
  Up = 'Up'        
}

export interface DayPlan {
  day: string;
  lunch: Dish | null;
  dinner: Dish | null;
  isLocked?: boolean; 
}

export enum AppView {
  Onboarding = 'Onboarding',
  Swipe = 'Swipe',
  Planner = 'Planner',
  Shopping = 'Shopping', 
  Pantry = 'Pantry',     
  Profile = 'Profile'
}

export type VibeMode = 'Strict' | 'Comfort' | 'Explorer';

export type ImageSize = '1K' | '2K' | '4K';

export interface AppState {
    profile: UserProfile | null;
    approvedDishes: Dish[];
    weeklyPlan: DayPlan[];
    pantryStock: string[];
}
