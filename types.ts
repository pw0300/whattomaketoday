
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

// Changed from union type to string to allow custom user inputs
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
  weight: number; // kg
  height: number; // cm
  activityLevel: 'Sedentary' | 'Light' | 'Moderate' | 'Active';
  goal: 'Lose' | 'Maintain' | 'Gain';
}

export interface UserProfile {
  name: string;
  allergens: Allergen[];
  allergenNotes: string;
  conditions: HealthCondition[];
  conditionNotes: string;
  healthReportSummary?: string; // NEW: AI extracted insights from lab reports
  cuisines: Cuisine[];
  cuisineNotes: string;
  dietaryPreference: DietaryPreference;
  customNotes: string; // Free text for AI context
  biometrics?: Biometrics; // NEW: For auto-calc
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
  localName: string; // For the cook (e.g., "Palak Paneer")
  description: string;
  primaryIngredient: string;
  cuisine: string;
  type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  image: string;
  macros: Macros;
  ingredients: Ingredient[];
  instructions: string[]; // Recipe steps
  tags: string[]; // e.g. "Creamy", "Spicy"
  chefAdvice?: string; // NEW: Specific pro-tip from the AI
  allergens: Allergen[];
  lastEaten?: number; // Timestamp
  isStaple?: boolean;
  userNotes?: string; // Persistent modifications
  servings?: number; // NEW: Persist the batch scale (Default 1)
}

export enum SwipeDirection {
  Left = 'Left',   // Reject
  Right = 'Right', // Add to rotation
  Up = 'Up'        // Staple
}

export interface DayPlan {
  day: string;
  lunch: Dish | null;
  dinner: Dish | null;
  isLocked?: boolean; // NEW: Prevents regeneration
}

export enum AppView {
  Onboarding = 'Onboarding',
  Swipe = 'Swipe',
  Planner = 'Planner',
  Shopping = 'Shopping', // Renamed from Grocery
  Pantry = 'Pantry',     // New
  Profile = 'Profile'
}

export type VibeMode = 'Strict' | 'Comfort' | 'Explorer';

export type ImageSize = '1K' | '2K' | '4K';
