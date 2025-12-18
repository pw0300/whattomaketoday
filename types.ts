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

export enum DietType {
  Vegetarian = 'Vegetarian',
  NonVegetarian = 'Non-Vegetarian',
  Eggetarian = 'Eggetarian'
}

export type Cuisine = 'North Indian' | 'South Indian' | 'Italian' | 'Mexican' | 'Thai' | 'Chinese' | 'Mediterranean' | 'American';

export interface Macros {
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
}

export interface UserProfile {
  name: string;
  allergens: Allergen[];
  conditions: HealthCondition[];
  cuisines: string[]; // Changed to string[] for custom cuisines
  dietType: DietType;
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
  tags: string[]; // e.g. "Creamy", "Spicy", "Vegetarian", "Quick"
  allergens: Allergen[];
  dietType: DietType; // Added to dish type
  lastEaten?: number; // Timestamp
  isStaple?: boolean;
  userNotes?: string; // Persistent modifications
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
}

export enum AppView {
  Onboarding = 'Onboarding',
  Swipe = 'Swipe',
  Planner = 'Planner',
  Grocery = 'Grocery',
  Profile = 'Profile'
}

export type VibeMode = 'Strict' | 'Comfort' | 'Explorer';

export type ImageSize = '1K' | '2K' | '4K';