export interface CreatorSource {
    name: string;
    type: 'Indian' | 'Global' | 'Specialty';
    blogUrl: string; // The specific index page to crawl (legacy/blog mode)
    youtubeUrl?: string; // NEW: The 'Videos' tab of their channel
    selectorHint?: string;
}

export const TOP_CREATORS: CreatorSource[] = [
    // --- INDIAN TITANS ---
    { name: "Hebbars Kitchen", type: 'Indian', blogUrl: "https://hebbarskitchen.com/recipes/curry-recipes-rasam-sambar-dal-kootu/", youtubeUrl: "https://www.youtube.com/@HebbarsKitchen/videos" },
    { name: "Swasthi's Recipes", type: 'Indian', blogUrl: "https://www.indianhealthyrecipes.com/recipes/veg-curry-recipes/", youtubeUrl: "https://www.youtube.com/@SwasthisRecipes/videos" },
    { name: "Dassana's Veg Recipes", type: 'Indian', blogUrl: "https://www.vegrecipesofindia.com/recipes/indian-curry-recipes/", youtubeUrl: "https://www.youtube.com/@DassanasVegRecipes/videos" },
    { name: "Manjula's Kitchen", type: 'Indian', blogUrl: "https://manjulaskitchen.com/category/curry-dal/", youtubeUrl: "https://www.youtube.com/@ManjulaKitchen/videos" },
    { name: "Kunal Kapur", type: 'Indian', blogUrl: "https://www.chefkunalkapur.com/category/recipes/veg/", youtubeUrl: "https://www.youtube.com/@KunalKapur/videos" },
    { name: "Ranveer Brar", type: 'Indian', blogUrl: "https://ranveerbrar.com/recipes/", youtubeUrl: "https://www.youtube.com/@RanveerBrar/videos" },
    { name: "Sanjeev Kapoor", type: 'Indian', blogUrl: "https://www.sanjeevkapoor.com/All-recipes", youtubeUrl: "https://www.youtube.com/@sanjeevkapoorkhazana/videos" },
    { name: "Tarla Dalal", type: 'Indian', blogUrl: "https://www.tarladalal.com/recipes-for-indian-veg-recipes-2", youtubeUrl: "https://www.youtube.com/@TarlaDalal/videos" },
    { name: "Archana's Kitchen", type: 'Indian', blogUrl: "https://www.archanaskitchen.com/recipes/indian-main-course-recipes", youtubeUrl: "https://www.youtube.com/@archanaskitchen/videos" },
    { name: "Nisha Madhulika", type: 'Indian', blogUrl: "https://nishamadhulika.com/category/424.html", youtubeUrl: "https://www.youtube.com/@nishamadhulika/videos" },

    // --- SOUTH INDIAN SPECIALISTS ---
    { name: "Sharmis Passions", type: 'Indian', blogUrl: "https://www.sharmispassions.com/category/recipes/south-indian-recipes/", youtubeUrl: "https://www.youtube.com/@SharmisPassions/videos" },
    { name: "Chitra's Food Book", type: 'Indian', blogUrl: "https://www.chitrasfoodbook.com/2014/05/south-indian-recipes.html", youtubeUrl: "https://www.youtube.com/@chitrasfoodbook/videos" },
    { name: "Kannamma Cooks", type: 'Indian', blogUrl: "https://www.kannammacooks.com/category/recipes/south-indian/", youtubeUrl: "https://www.youtube.com/@kannammacooks/videos" },

    // --- NICHE INDIAN REGIONAL ---
    { name: "Bong Eats", type: 'Indian', blogUrl: "https://www.bongeats.com/recipes", youtubeUrl: "https://www.youtube.com/@BongEats/videos" }, // Bengali
    { name: "Kabita's Kitchen", type: 'Indian', blogUrl: "https://www.kabitaskitchen.com/category/recipes/", youtubeUrl: "https://www.youtube.com/@KabitasKitchen/videos" }, // North Indian
    { name: "Your Food Lab", type: 'Indian', blogUrl: "https://www.yourfoodlab.com/category/recipes/", youtubeUrl: "https://www.youtube.com/@YourFoodLab/videos" }, // Maharashtrian
    { name: "Get Curried", type: 'Indian', blogUrl: "https://getcurried.com/recipes/", youtubeUrl: "https://www.youtube.com/@getcurried/videos" }, // Street Food
    { name: "Rajshri Food", type: 'Indian', blogUrl: "https://food.rajshri.com/recipes", youtubeUrl: "https://www.youtube.com/@RajshriFoodofficial/videos" }, // Traditional

    // --- GLOBAL HEAVYWEIGHTS (YouTube Stars) ---
    { name: "Joshua Weissman", type: 'Global', blogUrl: "https://www.joshuaweissman.com/all-recipes", youtubeUrl: "https://www.youtube.com/@JoshuaWeissman/videos" },
    { name: "Binging with Babish", type: 'Global', blogUrl: "https://www.bingingwithbabish.com/recipes", youtubeUrl: "https://www.youtube.com/@babishculinaryuniverse/videos" },
    { name: "Serious Eats (Kenji)", type: 'Global', blogUrl: "https://www.seriouseats.com/j-kenji-lopez-alt-recipes-5118022", youtubeUrl: "https://www.youtube.com/@kenjilopezalt/videos" },
    { name: "Maangchi", type: 'Global', blogUrl: "https://www.maangchi.com/recipes", youtubeUrl: "https://www.youtube.com/@Maangchi/videos" }, // Korean
    { name: "Just One Cookbook", type: 'Global', blogUrl: "https://www.justonecookbook.com/recipes/", youtubeUrl: "https://www.youtube.com/@justonecookbook/videos" }, // Japanese
    { name: "Recipetineats", type: 'Global', blogUrl: "https://www.recipetineats.com/recipes/", youtubeUrl: "https://www.youtube.com/@recipetineats/videos" },

    // --- NICHE GLOBAL (Cuisine-Specific) ---
    { name: "Pailin's Kitchen", type: 'Global', blogUrl: "https://hot-thai-kitchen.com/recipes/", youtubeUrl: "https://www.youtube.com/@PailinsKitchen/videos" }, // Thai
    { name: "Middle Eats", type: 'Global', blogUrl: "https://www.middleeasternplate.com/recipes/", youtubeUrl: "https://www.youtube.com/@MiddleEats/videos" }, // Middle Eastern
    { name: "The Mediterranean Dish", type: 'Global', blogUrl: "https://www.themediterraneandish.com/recipes/", youtubeUrl: "https://www.youtube.com/@themediterraneandish/videos" }, // Mediterranean
    { name: "Gennaro Contaldo", type: 'Global', blogUrl: "https://www.gennarocontaldo.com/recipes/", youtubeUrl: "https://www.youtube.com/@genaborog/videos" }, // Italian
    { name: "Rick Bayless", type: 'Global', blogUrl: "https://www.rickbayless.com/category/recipes/", youtubeUrl: "https://www.youtube.com/@rickbayless/videos" }, // Mexican
    { name: "Chinese Cooking Demystified", type: 'Global', blogUrl: "https://www.reddit.com/r/ChineseCookingDemystified/", youtubeUrl: "https://www.youtube.com/@ChineseCookingDemystified/videos" }, // Chinese

    // --- HEALTHY / MODERN ---
    { name: "Minimalist Baker", type: 'Specialty', blogUrl: "https://minimalistbaker.com/recipe-index/", youtubeUrl: "https://www.youtube.com/@MinimalistBaker/videos" },
    { name: "FitMenCook", type: 'Specialty', blogUrl: "https://fitmencook.com/recipes/", youtubeUrl: "https://www.youtube.com/@FitMenCook/videos" },
    { name: "SkinnyTaste", type: 'Specialty', blogUrl: "https://www.skinnytaste.com/recipes/", youtubeUrl: "https://www.youtube.com/@skinnytaste/videos" },
    { name: "Pick Up Limes", type: 'Specialty', blogUrl: "https://www.pickuplimes.com/recipes", youtubeUrl: "https://www.youtube.com/@PickUpLimes/videos" }, // Vegan
    { name: "Rainbow Plant Life", type: 'Specialty', blogUrl: "https://rainbowplantlife.com/recipes/", youtubeUrl: "https://www.youtube.com/@RainbowPlantLife/videos" }, // Vegan

    // --- OTHERS ---
    { name: "Damn Delicious", type: 'Global', blogUrl: "https://damndelicious.net/recipe-index/", youtubeUrl: "https://www.youtube.com/@damndelicious/videos" },
    { name: "Pinch of Yum", type: 'Global', blogUrl: "https://pinchofyum.com/recipes", youtubeUrl: "https://www.youtube.com/@PinchofYum/videos" },
    { name: "Tasty", type: 'Global', blogUrl: "https://tasty.co/recipes", youtubeUrl: "https://www.youtube.com/@buzzfeedtasty/videos" }, // Viral Recipes
    { name: "Bon Appetit", type: 'Global', blogUrl: "https://www.bonappetit.com/recipes", youtubeUrl: "https://www.youtube.com/@bonappetit/videos" } // Professional
];
