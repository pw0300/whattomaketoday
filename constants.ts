
import { Dish, Allergen } from './types';

export const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const STORAGE_KEYS = {
  PROFILE: 'tadkaSync_profile',
  PANTRY: 'tadkaSync_pantryStock',
  PLAN: 'tadkaSync_weeklyPlan',
  INTRO: 'tadkaSync_introSeen'
};

export const INITIAL_DISHES: Dish[] = [
  {
    id: '1',
    name: 'Spinach Cottage Cheese Curry',
    localName: 'Palak Paneer',
    description: 'Creamy spinach gravy with soft cottage cheese cubes.',
    primaryIngredient: 'Paneer',
    cuisine: 'North Indian',
    type: 'Dinner',
    image: 'https://picsum.photos/400/400?random=1',
    macros: { protein: 20, carbs: 12, fat: 25, calories: 350 },
    ingredients: [
      { name: 'Spinach', quantity: '500g', category: 'Produce' },
      { name: 'Paneer', quantity: '200g', category: 'Dairy' },
      { name: 'Cream', quantity: '2 tbsp', category: 'Dairy' },
      { name: 'Garlic', quantity: '4 cloves', category: 'Produce' }
    ],
    instructions: [
      'Blanch spinach leaves in boiling water for 2 mins, then plunge in ice water.',
      'Blend spinach with ginger and green chilies to a smooth paste.',
      'Sauté chopped garlic and cumin in ghee until fragrant.',
      'Add spinach puree, salt, and garam masala. Cook for 5 mins.',
      'Stir in paneer cubes and fresh cream. Simmer for 2 mins and serve.'
    ],
    tags: ['Creamy', 'Vegetarian'],
    allergens: [Allergen.Dairy]
  },
  {
    id: '2',
    name: 'Spiced Okra Stir Fry',
    localName: 'Bhindi Masala',
    description: 'Crispy ladyfingers tossed in aromatic spices.',
    primaryIngredient: 'Okra',
    cuisine: 'Indian',
    type: 'Lunch',
    image: 'https://picsum.photos/400/400?random=2',
    macros: { protein: 5, carbs: 18, fat: 12, calories: 200 },
    ingredients: [
      { name: 'Okra', quantity: '500g', category: 'Produce' },
      { name: 'Onion', quantity: '2 medium', category: 'Produce' },
      { name: 'Amchur (Mango Powder)', quantity: '1 tsp', category: 'Spices' }
    ],
    instructions: [
      'Wash okra and dry completely before chopping to avoid slime.',
      'Heat oil in a pan, add cumin seeds and sliced onions.',
      'Add okra and cook on medium heat without covering the pan.',
      'Once tender, add turmeric, chili powder, coriander powder, and salt.',
      'Finish with dry mango powder (amchur) for tanginess.'
    ],
    tags: ['Dry', 'Vegetarian', 'Vegan'],
    allergens: []
  },
  {
    id: '3',
    name: 'Grilled Chicken Salad',
    localName: 'Grilled Chicken Salad',
    description: 'Herb marinated chicken breast with fresh greens.',
    primaryIngredient: 'Chicken',
    cuisine: 'Continental',
    type: 'Lunch',
    image: 'https://picsum.photos/400/400?random=3',
    macros: { protein: 35, carbs: 8, fat: 10, calories: 320 },
    ingredients: [
      { name: 'Chicken Breast', quantity: '200g', category: 'Protein' },
      { name: 'Lettuce', quantity: '1 head', category: 'Produce' },
      { name: 'Olive Oil', quantity: '1 tbsp', category: 'Pantry' }
    ],
    instructions: [
      'Marinate chicken breast with lemon juice, olive oil, dried herbs, and salt for 20 mins.',
      'Grill on medium-high heat for 6-7 mins per side until fully cooked.',
      'Rest chicken for 5 mins before slicing.',
      'Toss lettuce, cherry tomatoes, and cucumber in a light vinaigrette.',
      'Top salad with sliced chicken.'
    ],
    tags: ['Healthy', 'Low Carb'],
    allergens: []
  },
  {
    id: '4',
    name: 'Lentil Soup with Rice',
    localName: 'Dal Fry & Jeera Rice',
    description: 'Yellow lentils tempered with cumin and garlic.',
    primaryIngredient: 'Lentils',
    cuisine: 'Indian',
    type: 'Dinner',
    image: 'https://picsum.photos/400/400?random=4',
    macros: { protein: 18, carbs: 60, fat: 12, calories: 450 },
    ingredients: [
      { name: 'Toor Dal', quantity: '1 cup', category: 'Pantry' },
      { name: 'Basmati Rice', quantity: '1 cup', category: 'Pantry' },
      { name: 'Ghee', quantity: '1 tbsp', category: 'Dairy' }
    ],
    instructions: [
      'Pressure cook toor dal with turmeric and salt until soft.',
      'In a separate pan, heat ghee and add cumin seeds, dried red chilies, and garlic.',
      'Pour tempering over the cooked dal and mix well.',
      'Cook basmati rice with a pinch of cumin seeds.',
      'Serve hot garnished with coriander.'
    ],
    tags: ['Comfort', 'Vegetarian'],
    allergens: []
  },
  {
    id: '5',
    name: 'Chickpea Curry',
    localName: 'Chana Masala',
    description: 'Spicy white chickpeas in tomato gravy.',
    primaryIngredient: 'Chickpeas',
    cuisine: 'Indian',
    type: 'Lunch',
    image: 'https://picsum.photos/400/400?random=5',
    macros: { protein: 15, carbs: 45, fat: 10, calories: 380 },
    ingredients: [
      { name: 'Chickpeas', quantity: '1 cup', category: 'Pantry' },
      { name: 'Tomatoes', quantity: '3', category: 'Produce' },
      { name: 'Chana Masala Spice', quantity: '1 tbsp', category: 'Spices' }
    ],
    instructions: [
      'Soak chickpeas overnight and pressure cook until tender.',
      'Sauté onion ginger garlic paste in oil until golden brown.',
      'Add tomato puree and cook until oil separates.',
      'Add chana masala powder, turmeric, and salt.',
      'Add cooked chickpeas and simmer for 15 mins to thicken gravy.'
    ],
    tags: ['Spicy', 'Vegan'],
    allergens: []
  },
];
