import { Dish, Allergen, DietaryPreference } from '../types';

/**
 * STARTER RECIPES - Pre-validated, type-safe recipe bundle
 * 50+ instant-load recipes for zero-latency first experience
 */
export const STARTER_RECIPES: Dish[] = [
    // ========================
    // VEGETARIAN - North Indian
    // ========================
    {
        id: 'veg-paneer-tikka', name: 'Paneer Tikka', localName: 'पनीर टिक्का',
        description: 'Grilled cottage cheese marinated in spices', cuisine: 'North Indian', type: 'Lunch',
        image: 'https://picsum.photos/400/400?random=1', tags: ['Vegetarian', 'High-Protein'],
        allergens: [Allergen.Dairy], macros: { calories: 320, protein: 18, carbs: 12, fat: 22 },
        ingredients: [{ name: 'Paneer', quantity: '250g', category: 'Dairy' }], instructions: [],
        healthTags: ['High-Protein', 'Low-Carb']
    },
    {
        id: 'veg-dal-tadka', name: 'Dal Tadka', localName: 'दाल तड़का',
        description: 'Yellow lentils tempered with cumin and garlic', cuisine: 'North Indian', type: 'Dinner',
        image: 'https://picsum.photos/400/400?random=2', tags: ['Vegetarian', 'Vegan', 'Comfort-Food'],
        allergens: [], macros: { calories: 180, protein: 12, carbs: 28, fat: 4 },
        ingredients: [{ name: 'Yellow Lentils', quantity: '1 cup', category: 'Pantry' }], instructions: [],
        healthTags: ['High-Fiber', 'Heart-Healthy', 'Diabetic-Friendly']
    },
    {
        id: 'veg-palak-paneer', name: 'Palak Paneer', localName: 'पालक पनीर',
        description: 'Cottage cheese in creamy spinach gravy', cuisine: 'North Indian', type: 'Lunch',
        image: 'https://picsum.photos/400/400?random=3', tags: ['Vegetarian', 'Iron-Rich'],
        allergens: [Allergen.Dairy], macros: { calories: 280, protein: 16, carbs: 15, fat: 18 },
        ingredients: [{ name: 'Spinach', quantity: '2 cups', category: 'Produce' }], instructions: [],
        healthTags: ['Iron-Rich', 'High-Protein']
    },
    {
        id: 'veg-chole', name: 'Chole', localName: 'छोले',
        description: 'Spiced chickpea curry', cuisine: 'North Indian', type: 'Lunch',
        image: 'https://picsum.photos/400/400?random=6', tags: ['Vegetarian', 'Vegan'],
        allergens: [], macros: { calories: 220, protein: 10, carbs: 35, fat: 6 },
        ingredients: [{ name: 'Chickpeas', quantity: '2 cups', category: 'Pantry' }], instructions: [],
        healthTags: ['High-Fiber', 'Heart-Healthy']
    },
    {
        id: 'veg-rajma', name: 'Rajma', localName: 'राजमा',
        description: 'Red kidney beans in thick tomato gravy', cuisine: 'North Indian', type: 'Dinner',
        image: 'https://picsum.photos/400/400?random=7', tags: ['Vegetarian', 'Vegan', 'Comfort-Food'],
        allergens: [], macros: { calories: 240, protein: 12, carbs: 38, fat: 5 },
        ingredients: [{ name: 'Kidney Beans', quantity: '2 cups', category: 'Pantry' }], instructions: [],
        healthTags: ['High-Fiber', 'High-Protein']
    },
    {
        id: 'veg-aloo-gobi', name: 'Aloo Gobi', localName: 'आलू गोभी',
        description: 'Potato and cauliflower dry curry', cuisine: 'North Indian', type: 'Lunch',
        image: 'https://picsum.photos/400/400?random=8', tags: ['Vegetarian', 'Vegan'],
        allergens: [], macros: { calories: 180, protein: 4, carbs: 28, fat: 7 },
        ingredients: [{ name: 'Potato', quantity: '2 medium', category: 'Produce' }], instructions: [],
        healthTags: ['Gluten-Free']
    },
    {
        id: 'veg-bhindi-masala', name: 'Bhindi Masala', localName: 'भिंडी मसाला',
        description: 'Spiced okra stir-fry', cuisine: 'North Indian', type: 'Dinner',
        image: 'https://picsum.photos/400/400?random=9', tags: ['Vegetarian', 'Vegan'],
        allergens: [], macros: { calories: 120, protein: 3, carbs: 15, fat: 6 },
        ingredients: [{ name: 'Okra', quantity: '250g', category: 'Produce' }], instructions: [],
        healthTags: ['Low-Carb', 'Diabetic-Friendly']
    },
    {
        id: 'veg-kadhi-pakora', name: 'Kadhi Pakora', localName: 'कढ़ी पकोड़ा',
        description: 'Yogurt-based curry with fritters', cuisine: 'North Indian', type: 'Lunch',
        image: 'https://picsum.photos/400/400?random=10', tags: ['Vegetarian', 'Comfort-Food'],
        allergens: [Allergen.Dairy, Allergen.Gluten], macros: { calories: 280, protein: 8, carbs: 30, fat: 14 },
        ingredients: [{ name: 'Yogurt', quantity: '2 cups', category: 'Dairy' }], instructions: [],
        healthTags: []
    },
    // ========================
    // VEGETARIAN - South Indian
    // ========================
    {
        id: 'veg-masala-dosa', name: 'Masala Dosa', localName: 'मसाला डोसा',
        description: 'Crispy rice crepe with spiced potato filling', cuisine: 'South Indian', type: 'Breakfast',
        image: 'https://picsum.photos/400/400?random=11', tags: ['Vegetarian', 'Vegan'],
        allergens: [], macros: { calories: 250, protein: 6, carbs: 40, fat: 8 },
        ingredients: [{ name: 'Dosa Batter', quantity: '1 cup', category: 'Pantry' }], instructions: [],
        healthTags: ['Gluten-Free']
    },
    {
        id: 'veg-sambar', name: 'Sambar', localName: 'सांभर',
        description: 'Lentil stew with vegetables', cuisine: 'South Indian', type: 'Lunch',
        image: 'https://picsum.photos/400/400?random=12', tags: ['Vegetarian', 'Vegan'],
        allergens: [], macros: { calories: 150, protein: 8, carbs: 25, fat: 3 },
        ingredients: [{ name: 'Toor Dal', quantity: '1 cup', category: 'Pantry' }], instructions: [],
        healthTags: ['High-Fiber', 'Diabetic-Friendly']
    },
    {
        id: 'veg-idli', name: 'Idli', localName: 'इडली',
        description: 'Steamed rice cakes', cuisine: 'South Indian', type: 'Breakfast',
        image: 'https://picsum.photos/400/400?random=13', tags: ['Vegetarian', 'Vegan', 'Light'],
        allergens: [], macros: { calories: 80, protein: 2, carbs: 15, fat: 0.5 },
        ingredients: [{ name: 'Idli Batter', quantity: '1 cup', category: 'Pantry' }], instructions: [],
        healthTags: ['Low-Fat', 'Gluten-Free', 'Diabetic-Friendly']
    },
    {
        id: 'veg-rasam', name: 'Rasam', localName: 'रसम',
        description: 'Tangy tomato-tamarind soup', cuisine: 'South Indian', type: 'Dinner',
        image: 'https://picsum.photos/400/400?random=14', tags: ['Vegetarian', 'Vegan', 'Light'],
        allergens: [], macros: { calories: 60, protein: 2, carbs: 10, fat: 1 },
        ingredients: [{ name: 'Tomato', quantity: '2 medium', category: 'Produce' }], instructions: [],
        healthTags: ['Low-Calorie', 'Heart-Healthy']
    },
    {
        id: 'veg-upma', name: 'Upma', localName: 'उपमा',
        description: 'Savory semolina breakfast', cuisine: 'South Indian', type: 'Breakfast',
        image: 'https://picsum.photos/400/400?random=15', tags: ['Vegetarian'],
        allergens: [Allergen.Gluten], macros: { calories: 200, protein: 5, carbs: 35, fat: 5 },
        ingredients: [{ name: 'Semolina', quantity: '1 cup', category: 'Pantry' }], instructions: [],
        healthTags: []
    },
    // ========================
    // VEGAN SPECIALS
    // ========================
    {
        id: 'vegan-chana-masala', name: 'Chana Masala', localName: 'चना मसाला',
        description: 'Spicy chickpeas in tomato sauce', cuisine: 'North Indian', type: 'Lunch',
        image: 'https://picsum.photos/400/400?random=16', tags: ['Vegetarian', 'Vegan', 'High-Protein'],
        allergens: [], macros: { calories: 210, protein: 11, carbs: 32, fat: 5 },
        ingredients: [{ name: 'Chickpeas', quantity: '2 cups', category: 'Pantry' }], instructions: [],
        healthTags: ['High-Fiber', 'Heart-Healthy', 'Diabetic-Friendly']
    },
    {
        id: 'vegan-baingan-bharta', name: 'Baingan Bharta', localName: 'बैंगन भर्ता',
        description: 'Smoky mashed eggplant', cuisine: 'North Indian', type: 'Dinner',
        image: 'https://picsum.photos/400/400?random=17', tags: ['Vegetarian', 'Vegan'],
        allergens: [], macros: { calories: 130, protein: 3, carbs: 18, fat: 6 },
        ingredients: [{ name: 'Eggplant', quantity: '1 large', category: 'Produce' }], instructions: [],
        healthTags: ['Low-Carb', 'Keto']
    },
    {
        id: 'vegan-aloo-methi', name: 'Aloo Methi', localName: 'आलू मेथी',
        description: 'Potatoes with fenugreek leaves', cuisine: 'North Indian', type: 'Lunch',
        image: 'https://picsum.photos/400/400?random=18', tags: ['Vegetarian', 'Vegan'],
        allergens: [], macros: { calories: 160, protein: 4, carbs: 25, fat: 6 },
        ingredients: [{ name: 'Fenugreek Leaves', quantity: '1 bunch', category: 'Produce' }], instructions: [],
        healthTags: ['Diabetic-Friendly']
    },
    // ========================
    // HIGH-PROTEIN / KETO
    // ========================
    {
        id: 'keto-paneer-bhurji', name: 'Paneer Bhurji', localName: 'पनीर भुर्जी',
        description: 'Scrambled cottage cheese with spices', cuisine: 'North Indian', type: 'Breakfast',
        image: 'https://picsum.photos/400/400?random=19', tags: ['Vegetarian', 'High-Protein', 'Keto'],
        allergens: [Allergen.Dairy], macros: { calories: 280, protein: 20, carbs: 6, fat: 20 },
        ingredients: [{ name: 'Paneer', quantity: '200g', category: 'Dairy' }], instructions: [],
        healthTags: ['High-Protein', 'Low-Carb', 'Keto']
    },
    {
        id: 'keto-cauliflower-rice', name: 'Cauliflower Rice', localName: 'गोभी चावल',
        description: 'Low-carb rice alternative', cuisine: 'Continental', type: 'Dinner',
        image: 'https://picsum.photos/400/400?random=20', tags: ['Vegetarian', 'Vegan', 'Keto'],
        allergens: [], macros: { calories: 60, protein: 3, carbs: 8, fat: 2 },
        ingredients: [{ name: 'Cauliflower', quantity: '1 head', category: 'Produce' }], instructions: [],
        healthTags: ['Low-Carb', 'Keto', 'Diabetic-Friendly']
    },
    {
        id: 'keto-egg-omelette', name: 'Masala Omelette', localName: 'मसाला ऑमलेट',
        description: 'Spiced Indian-style omelette', cuisine: 'Indian', type: 'Breakfast',
        image: 'https://picsum.photos/400/400?random=21', tags: ['Non-Veg', 'High-Protein', 'Keto'],
        allergens: [Allergen.Eggs], macros: { calories: 220, protein: 14, carbs: 2, fat: 18 },
        ingredients: [{ name: 'Eggs', quantity: '3', category: 'Protein' }], instructions: [],
        healthTags: ['High-Protein', 'Low-Carb', 'Keto']
    },
    // ========================
    // NON-VEGETARIAN - Indian
    // ========================
    {
        id: 'nonveg-butter-chicken', name: 'Butter Chicken', localName: 'बटर चिकन',
        description: 'Creamy tomato-based chicken curry', cuisine: 'North Indian', type: 'Dinner',
        image: 'https://picsum.photos/400/400?random=4', tags: ['Non-Veg', 'Comfort-Food'],
        allergens: [Allergen.Dairy], macros: { calories: 420, protein: 32, carbs: 18, fat: 26 },
        ingredients: [{ name: 'Chicken Breast', quantity: '500g', category: 'Protein' }], instructions: [],
        healthTags: ['High-Protein']
    },
    {
        id: 'nonveg-fish-curry', name: 'Fish Curry', localName: 'मछली करी',
        description: 'Coastal-style fish in coconut gravy', cuisine: 'South Indian', type: 'Lunch',
        image: 'https://picsum.photos/400/400?random=5', tags: ['Non-Veg', 'Omega-3'],
        allergens: [], macros: { calories: 250, protein: 28, carbs: 12, fat: 10 },
        ingredients: [{ name: 'Fish Fillet', quantity: '400g', category: 'Protein' }], instructions: [],
        healthTags: ['Heart-Healthy', 'High-Protein']
    },
    {
        id: 'nonveg-chicken-tikka', name: 'Chicken Tikka', localName: 'चिकन टिक्का',
        description: 'Grilled marinated chicken chunks', cuisine: 'North Indian', type: 'Dinner',
        image: 'https://picsum.photos/400/400?random=22', tags: ['Non-Veg', 'High-Protein'],
        allergens: [Allergen.Dairy], macros: { calories: 280, protein: 35, carbs: 5, fat: 14 },
        ingredients: [{ name: 'Chicken', quantity: '500g', category: 'Protein' }], instructions: [],
        healthTags: ['High-Protein', 'Low-Carb', 'Keto']
    },
    {
        id: 'nonveg-keema-matar', name: 'Keema Matar', localName: 'कीमा मटर',
        description: 'Minced meat with green peas', cuisine: 'North Indian', type: 'Dinner',
        image: 'https://picsum.photos/400/400?random=23', tags: ['Non-Veg'],
        allergens: [], macros: { calories: 320, protein: 28, carbs: 15, fat: 18 },
        ingredients: [{ name: 'Mutton Mince', quantity: '400g', category: 'Protein' }], instructions: [],
        healthTags: ['High-Protein']
    },
    {
        id: 'nonveg-egg-curry', name: 'Egg Curry', localName: 'अंडा करी',
        description: 'Boiled eggs in spiced onion-tomato gravy', cuisine: 'North Indian', type: 'Lunch',
        image: 'https://picsum.photos/400/400?random=24', tags: ['Non-Veg'],
        allergens: [Allergen.Eggs], macros: { calories: 240, protein: 16, carbs: 12, fat: 16 },
        ingredients: [{ name: 'Eggs', quantity: '4', category: 'Protein' }], instructions: [],
        healthTags: ['High-Protein']
    },
    {
        id: 'nonveg-prawn-masala', name: 'Prawn Masala', localName: 'प्रॉन मसाला',
        description: 'Spicy prawns in rich gravy', cuisine: 'Coastal', type: 'Dinner',
        image: 'https://picsum.photos/400/400?random=25', tags: ['Non-Veg', 'Seafood'],
        allergens: [Allergen.Shellfish], macros: { calories: 220, protein: 25, carbs: 10, fat: 10 },
        ingredients: [{ name: 'Prawns', quantity: '300g', category: 'Protein' }], instructions: [],
        healthTags: ['High-Protein', 'Low-Carb']
    },
    {
        id: 'nonveg-tandoori-chicken', name: 'Tandoori Chicken', localName: 'तंदूरी चिकन',
        description: 'Yogurt-marinated grilled chicken', cuisine: 'North Indian', type: 'Dinner',
        image: 'https://picsum.photos/400/400?random=26', tags: ['Non-Veg', 'High-Protein'],
        allergens: [Allergen.Dairy], macros: { calories: 260, protein: 32, carbs: 6, fat: 12 },
        ingredients: [{ name: 'Chicken Legs', quantity: '500g', category: 'Protein' }], instructions: [],
        healthTags: ['High-Protein', 'Low-Carb', 'Keto']
    },
    // ========================
    // CONTINENTAL / INTERNATIONAL
    // ========================
    {
        id: 'continental-pasta', name: 'Pasta Arrabiata', localName: 'पास्ता',
        description: 'Spicy tomato pasta', cuisine: 'Italian', type: 'Dinner',
        image: 'https://picsum.photos/400/400?random=27', tags: ['Vegetarian', 'Vegan'],
        allergens: [Allergen.Gluten], macros: { calories: 380, protein: 12, carbs: 65, fat: 8 },
        ingredients: [{ name: 'Penne Pasta', quantity: '200g', category: 'Pantry' }], instructions: [],
        healthTags: []
    },
    {
        id: 'continental-stir-fry', name: 'Veggie Stir Fry', localName: 'स्टर फ्राई',
        description: 'Asian-style mixed vegetables', cuisine: 'Asian', type: 'Dinner',
        image: 'https://picsum.photos/400/400?random=28', tags: ['Vegetarian', 'Vegan', 'Quick'],
        allergens: [Allergen.Soy], macros: { calories: 150, protein: 5, carbs: 20, fat: 6 },
        ingredients: [{ name: 'Mixed Vegetables', quantity: '2 cups', category: 'Produce' }], instructions: [],
        healthTags: ['Low-Calorie', 'Diabetic-Friendly']
    },
    {
        id: 'continental-fried-rice', name: 'Vegetable Fried Rice', localName: 'फ्राइड राइस',
        description: 'Wok-tossed rice with vegetables', cuisine: 'Chinese', type: 'Lunch',
        image: 'https://picsum.photos/400/400?random=29', tags: ['Vegetarian', 'Vegan'],
        allergens: [Allergen.Soy], macros: { calories: 320, protein: 8, carbs: 55, fat: 8 },
        ingredients: [{ name: 'Cooked Rice', quantity: '2 cups', category: 'Pantry' }], instructions: [],
        healthTags: []
    },
    {
        id: 'continental-salad', name: 'Greek Salad', localName: 'ग्रीक सलाद',
        description: 'Fresh vegetables with feta cheese', cuisine: 'Mediterranean', type: 'Lunch',
        image: 'https://picsum.photos/400/400?random=30', tags: ['Vegetarian', 'Light', 'Fresh'],
        allergens: [Allergen.Dairy], macros: { calories: 180, protein: 8, carbs: 12, fat: 12 },
        ingredients: [{ name: 'Cucumber', quantity: '1 medium', category: 'Produce' }], instructions: [],
        healthTags: ['Low-Carb', 'Keto', 'Heart-Healthy']
    },
    {
        id: 'continental-soup', name: 'Tomato Soup', localName: 'टमाटर सूप',
        description: 'Creamy classic tomato soup', cuisine: 'Continental', type: 'Dinner',
        image: 'https://picsum.photos/400/400?random=31', tags: ['Vegetarian', 'Comfort-Food'],
        allergens: [Allergen.Dairy], macros: { calories: 120, protein: 3, carbs: 18, fat: 5 },
        ingredients: [{ name: 'Tomatoes', quantity: '4 medium', category: 'Produce' }], instructions: [],
        healthTags: ['Low-Calorie']
    },
    // ========================
    // DIABETIC-FRIENDLY
    // ========================
    {
        id: 'diabetic-moong-dal', name: 'Moong Dal Cheela', localName: 'मूंग दाल चीला',
        description: 'Savory lentil pancakes', cuisine: 'North Indian', type: 'Breakfast',
        image: 'https://picsum.photos/400/400?random=32', tags: ['Vegetarian', 'Vegan', 'Light'],
        allergens: [], macros: { calories: 140, protein: 10, carbs: 18, fat: 3 },
        ingredients: [{ name: 'Moong Dal', quantity: '1 cup', category: 'Pantry' }], instructions: [],
        healthTags: ['High-Protein', 'Diabetic-Friendly', 'Gluten-Free']
    },
    {
        id: 'diabetic-lauki-curry', name: 'Lauki Sabzi', localName: 'लौकी सब्जी',
        description: 'Bottle gourd curry', cuisine: 'North Indian', type: 'Dinner',
        image: 'https://picsum.photos/400/400?random=33', tags: ['Vegetarian', 'Vegan', 'Light'],
        allergens: [], macros: { calories: 80, protein: 2, carbs: 12, fat: 3 },
        ingredients: [{ name: 'Bottle Gourd', quantity: '1 medium', category: 'Produce' }], instructions: [],
        healthTags: ['Low-Calorie', 'Diabetic-Friendly', 'Heart-Healthy']
    },
    {
        id: 'diabetic-karela', name: 'Karela Fry', localName: 'करेला फ्राई',
        description: 'Crispy bitter gourd', cuisine: 'North Indian', type: 'Lunch',
        image: 'https://picsum.photos/400/400?random=34', tags: ['Vegetarian', 'Vegan'],
        allergens: [], macros: { calories: 100, protein: 3, carbs: 8, fat: 7 },
        ingredients: [{ name: 'Bitter Gourd', quantity: '2 medium', category: 'Produce' }], instructions: [],
        healthTags: ['Diabetic-Friendly', 'Low-Carb']
    },
    // ========================
    // SNACKS & QUICK BITES
    // ========================
    {
        id: 'snack-poha', name: 'Poha', localName: 'पोहा',
        description: 'Flattened rice with peanuts', cuisine: 'Central Indian', type: 'Breakfast',
        image: 'https://picsum.photos/400/400?random=35', tags: ['Vegetarian', 'Vegan', 'Quick'],
        allergens: [Allergen.Nuts], macros: { calories: 180, protein: 4, carbs: 32, fat: 5 },
        ingredients: [{ name: 'Poha', quantity: '1 cup', category: 'Pantry' }], instructions: [],
        healthTags: ['Gluten-Free']
    },
    {
        id: 'snack-sprouts', name: 'Sprouts Chaat', localName: 'अंकुरित चाट',
        description: 'Tangy sprouted lentil salad', cuisine: 'Indian', type: 'Snack',
        image: 'https://picsum.photos/400/400?random=36', tags: ['Vegetarian', 'Vegan', 'Light'],
        allergens: [], macros: { calories: 120, protein: 8, carbs: 18, fat: 2 },
        ingredients: [{ name: 'Mixed Sprouts', quantity: '1 cup', category: 'Produce' }], instructions: [],
        healthTags: ['High-Fiber', 'Diabetic-Friendly']
    },
    {
        id: 'snack-dhokla', name: 'Dhokla', localName: 'ढोकला',
        description: 'Steamed savory gram flour cake', cuisine: 'Gujarati', type: 'Snack',
        image: 'https://picsum.photos/400/400?random=37', tags: ['Vegetarian', 'Light'],
        allergens: [], macros: { calories: 150, protein: 6, carbs: 20, fat: 5 },
        ingredients: [{ name: 'Besan', quantity: '1 cup', category: 'Pantry' }], instructions: [],
        healthTags: ['Gluten-Free', 'Low-Fat']
    },
    // ========================
    // PCOS-FRIENDLY
    // ========================
    {
        id: 'pcos-quinoa-salad', name: 'Quinoa Salad', localName: 'क्विनोआ सलाद',
        description: 'Protein-rich grain bowl', cuisine: 'Continental', type: 'Lunch',
        image: 'https://picsum.photos/400/400?random=38', tags: ['Vegetarian', 'Vegan', 'Superfood'],
        allergens: [], macros: { calories: 220, protein: 10, carbs: 30, fat: 7 },
        ingredients: [{ name: 'Quinoa', quantity: '1 cup', category: 'Pantry' }], instructions: [],
        healthTags: ['High-Protein', 'PCOS-Friendly', 'Gluten-Free']
    },
    {
        id: 'pcos-dal-palak', name: 'Dal Palak', localName: 'दाल पालक',
        description: 'Spinach lentils', cuisine: 'North Indian', type: 'Dinner',
        image: 'https://picsum.photos/400/400?random=39', tags: ['Vegetarian', 'Vegan'],
        allergens: [], macros: { calories: 170, protein: 12, carbs: 22, fat: 4 },
        ingredients: [{ name: 'Spinach', quantity: '2 cups', category: 'Produce' }], instructions: [],
        healthTags: ['High-Fiber', 'PCOS-Friendly', 'Iron-Rich']
    },
    // ========================
    // HEART-HEALTHY
    // ========================
    {
        id: 'heart-oats-porridge', name: 'Masala Oats', localName: 'मसाला ओट्स',
        description: 'Savory spiced oatmeal', cuisine: 'Indian Fusion', type: 'Breakfast',
        image: 'https://picsum.photos/400/400?random=40', tags: ['Vegetarian', 'Heart-Healthy'],
        allergens: [Allergen.Gluten], macros: { calories: 180, protein: 7, carbs: 30, fat: 4 },
        ingredients: [{ name: 'Rolled Oats', quantity: '1 cup', category: 'Pantry' }], instructions: [],
        healthTags: ['High-Fiber', 'Heart-Healthy', 'Diabetic-Friendly']
    },
    {
        id: 'heart-grilled-fish', name: 'Grilled Fish', localName: 'ग्रिल्ड फिश',
        description: 'Lemon herb grilled fish', cuisine: 'Continental', type: 'Dinner',
        image: 'https://picsum.photos/400/400?random=41', tags: ['Non-Veg', 'Light'],
        allergens: [], macros: { calories: 200, protein: 30, carbs: 2, fat: 8 },
        ingredients: [{ name: 'Fish Fillet', quantity: '200g', category: 'Protein' }], instructions: [],
        healthTags: ['High-Protein', 'Heart-Healthy', 'Low-Carb']
    },
    // ========================
    // MORE VARIETY
    // ========================
    {
        id: 'variety-khichdi', name: 'Dal Khichdi', localName: 'दाल खिचड़ी',
        description: 'Comfort rice and lentils', cuisine: 'North Indian', type: 'Dinner',
        image: 'https://picsum.photos/400/400?random=42', tags: ['Vegetarian', 'Vegan', 'Comfort-Food'],
        allergens: [], macros: { calories: 280, protein: 10, carbs: 45, fat: 6 },
        ingredients: [{ name: 'Rice', quantity: '1 cup', category: 'Pantry' }], instructions: [],
        healthTags: ['Easy-to-Digest', 'Gluten-Free']
    },
    {
        id: 'variety-pulao', name: 'Vegetable Pulao', localName: 'वेज पुलाव',
        description: 'Fragrant rice with vegetables', cuisine: 'North Indian', type: 'Lunch',
        image: 'https://picsum.photos/400/400?random=43', tags: ['Vegetarian', 'Vegan'],
        allergens: [], macros: { calories: 300, protein: 6, carbs: 50, fat: 8 },
        ingredients: [{ name: 'Basmati Rice', quantity: '1.5 cups', category: 'Pantry' }], instructions: [],
        healthTags: ['Gluten-Free']
    },
    {
        id: 'variety-biryani-veg', name: 'Vegetable Biryani', localName: 'वेज बिरयानी',
        description: 'Layered spiced rice with vegetables', cuisine: 'Hyderabadi', type: 'Lunch',
        image: 'https://picsum.photos/400/400?random=44', tags: ['Vegetarian'],
        allergens: [Allergen.Dairy], macros: { calories: 380, protein: 8, carbs: 55, fat: 14 },
        ingredients: [{ name: 'Basmati Rice', quantity: '2 cups', category: 'Pantry' }], instructions: [],
        healthTags: []
    },
    {
        id: 'variety-thali', name: 'Mini Thali', localName: 'थाली',
        description: 'Complete balanced meal plate', cuisine: 'Indian', type: 'Lunch',
        image: 'https://picsum.photos/400/400?random=45', tags: ['Vegetarian', 'Balanced'],
        allergens: [Allergen.Dairy, Allergen.Gluten], macros: { calories: 550, protein: 18, carbs: 75, fat: 18 },
        ingredients: [{ name: 'Rice', quantity: '1 cup', category: 'Pantry' }], instructions: [],
        healthTags: []
    },
    {
        id: 'variety-paratha', name: 'Aloo Paratha', localName: 'आलू पराठा',
        description: 'Stuffed potato flatbread', cuisine: 'Punjabi', type: 'Breakfast',
        image: 'https://picsum.photos/400/400?random=46', tags: ['Vegetarian', 'Comfort-Food'],
        allergens: [Allergen.Gluten, Allergen.Dairy], macros: { calories: 320, protein: 8, carbs: 45, fat: 12 },
        ingredients: [{ name: 'Whole Wheat Flour', quantity: '2 cups', category: 'Pantry' }], instructions: [],
        healthTags: []
    },
    {
        id: 'variety-roti-sabzi', name: 'Roti with Sabzi', localName: 'रोटी सब्जी',
        description: 'Whole wheat bread with seasonal vegetables', cuisine: 'North Indian', type: 'Dinner',
        image: 'https://picsum.photos/400/400?random=47', tags: ['Vegetarian', 'Vegan', 'Traditional'],
        allergens: [Allergen.Gluten], macros: { calories: 250, protein: 8, carbs: 40, fat: 7 },
        ingredients: [{ name: 'Whole Wheat Flour', quantity: '1 cup', category: 'Pantry' }], instructions: [],
        healthTags: ['High-Fiber']
    },
    {
        id: 'variety-dahi-chawal', name: 'Dahi Chawal', localName: 'दही चावल',
        description: 'Cooling curd rice', cuisine: 'South Indian', type: 'Lunch',
        image: 'https://picsum.photos/400/400?random=48', tags: ['Vegetarian', 'Light', 'Cooling'],
        allergens: [Allergen.Dairy], macros: { calories: 220, protein: 6, carbs: 38, fat: 5 },
        ingredients: [{ name: 'Curd', quantity: '1 cup', category: 'Dairy' }], instructions: [],
        healthTags: ['Easy-to-Digest', 'Gluten-Free']
    },
    {
        id: 'variety-pav-bhaji', name: 'Pav Bhaji', localName: 'पाव भाजी',
        description: 'Spiced mashed vegetables with bread', cuisine: 'Mumbai', type: 'Dinner',
        image: 'https://picsum.photos/400/400?random=49', tags: ['Vegetarian', 'Street-Food'],
        allergens: [Allergen.Gluten, Allergen.Dairy], macros: { calories: 400, protein: 10, carbs: 55, fat: 16 },
        ingredients: [{ name: 'Mixed Vegetables', quantity: '2 cups', category: 'Produce' }], instructions: [],
        healthTags: []
    },
    {
        id: 'variety-mix-veg', name: 'Mix Veg Curry', localName: 'मिक्स वेज',
        description: 'Seasonal vegetables in mild gravy', cuisine: 'North Indian', type: 'Lunch',
        image: 'https://picsum.photos/400/400?random=50', tags: ['Vegetarian', 'Vegan', 'Balanced'],
        allergens: [], macros: { calories: 180, protein: 6, carbs: 22, fat: 8 },
        ingredients: [{ name: 'Mixed Vegetables', quantity: '3 cups', category: 'Produce' }], instructions: [],
        healthTags: ['High-Fiber', 'Heart-Healthy']
    }
];

/**
 * Filter starter recipes based on user profile
 * @param profile User dietary preferences and allergens
 * @returns Safe, relevant recipes
 */
export function filterStarterRecipes(profile: { dietaryPreference: DietaryPreference; allergens: Allergen[]; cuisines?: string[] }): Dish[] {
    return STARTER_RECIPES.filter(dish => {
        // Check allergens - dish must NOT contain user's allergens
        const hasUnsafeAllergen = profile.allergens.some(allergen => dish.allergens.includes(allergen));
        if (hasUnsafeAllergen) return false;

        // Check dietary preference
        if (profile.dietaryPreference === 'Vegetarian' && dish.tags.includes('Non-Veg')) return false;
        if (profile.dietaryPreference === 'Vegan' && (dish.tags.includes('Non-Veg') || dish.allergens.includes(Allergen.Dairy))) return false;

        // Check cuisine preference (if any selected)
        if (profile.cuisines && profile.cuisines.length > 0) {
            const matchesCuisine = profile.cuisines.some(c =>
                dish.cuisine.toLowerCase().includes(c.toLowerCase()) ||
                c.toLowerCase().includes(dish.cuisine.toLowerCase())
            );
            if (!matchesCuisine) return false;
        }

        return true;
    });
}
