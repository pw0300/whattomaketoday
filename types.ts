
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

export type DietaryPreference = 'Vegetarian' | 'Non-Vegetarian' | 'Vegan' | 'Any' | 'Keto' | 'High Protein' | 'Gluten-Free' | 'Paleo';

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
  likedDishes?: string[]; // For seeding generation
  dislikedDishes?: string[]; // Track negative feedback // For seeding generation
  credits?: number;
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
  primaryIngredient?: string; // Made optional for starter recipes
  cuisine: string;
  type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  image: string;
  macros: Macros;
  sides?: Dish[]; // Auto-suggested sides for macro balancing
  ingredients: Ingredient[];
  instructions: string[];
  tags: string[];
  healthTags?: string[]; // New: For Diabetes, PCOS, etc.
  chefAdvice?: string;
  allergens: Allergen[];
  lastEaten?: number;
  isStaple?: boolean;
  userNotes?: string;
  servings?: number;
  prepTime?: number; // Minutes
  matchScore?: number; // 0-100 likelihood of user liking it
  generatedAt?: number; // Timestamp
  // New Sensory & Health Attributes
  flavorProfile?: 'Sweet' | 'Sour' | 'Salty' | 'Bitter' | 'Umami' | 'Spicy' | 'Savory' | 'Balanced';
  textureProfile?: 'Crunchy' | 'Soft' | 'Creamy' | 'Chewy' | 'Soup/Liquid' | 'Dry';
  glycemicIndex?: 'Low' | 'Medium' | 'High';
  lastCooked?: number; // BOUNTY FIX: Economy exploit prevention
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
  Intro = 'Intro',
  Onboarding = 'Onboarding',
  Curating = 'Curating', // NEW: Shows loading progress after onboarding
  Swipe = 'Swipe',
  Planner = 'Planner',
  Shopping = 'Shopping',
  Pantry = 'Pantry',
  Journal = 'Journal',
  Profile = 'Profile'
}

export type VibeMode = 'Strict' | 'Comfort' | 'Explorer' | 'Surprise';

export type ImageSize = '1K' | '2K' | '4K';

export interface AppState {
  profile: UserProfile | null;
  approvedDishes: Dish[];
  weeklyPlan: DayPlan[];
  pantryStock: PantryItem[];
}


export interface PantryItem {
  id: string;
  name: string;
  quantityType: 'discrete' | 'loose' | 'binary'; // 'discrete' = 3 units, 'loose' = levels, 'binary' = has/hasn't
  quantityLevel: number; // For loose: 1=Low, 2=Med, 3=High. For discrete: Integer count. For binary: 1=Has.
  unit?: string;
  addedAt: number;
  expiryDate?: number;
  category: string;
}
