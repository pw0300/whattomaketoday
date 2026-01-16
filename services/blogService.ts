import { UserProfile } from '../types';

export interface BlogPost {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    content: string; // HTML or Markdown
    coverImage: string;
    author: {
        name: string;
        avatar: string;
    };
    date: string;
    readTime: string;
    tags: string[];
    views: number;
}

const AUTHOR_CHEF = {
    name: "Chef Diya",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop"
};

const SAMPLE_POSTS: BlogPost[] = [
    {
        id: '1',
        slug: 'high-protein-vegetarian-indian-diet',
        title: "The Protein Myth: How to Hit 30g Per Meal as an Indian Vegetarian",
        excerpt: "Tired of hearing 'Indian food is just carbs'? Here is the science-backed guide to building muscle without eating chicken.",
        coverImage: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=60",
        author: AUTHOR_CHEF,
        date: "2024-03-20",
        readTime: "7 min read",
        tags: ["Health", "Protein", "Vegetarian"],
        views: 34200,
        content: `
            <p><strong>Topic:</strong> High Protein Vegetarian Nutrition</p>
            <p><strong>Audience:</strong> Fitness-conscious vegetarians who struggle to hit macronutrient goals.</p>
            <p><strong>Goal:</strong> Provide realistic, non-boring ways to increase protein intake without supplements.</p>
            <hr />

            <h3>The Problem: The 'Carb-Heavy' Default</h3>
            <p>A standard Indian thali is delicious, but often unbalanced: Rice (Carbs), Roti (Carbs), Aloo Gobi (Carbs + Fat), and a watery Dal (mostly water + negligible protein). If you are trying to build muscle or manage insulin, this ratio works against you.</p>

            <h3>The Solution: The 'Protein First' Plate</h3>
            <p>You don't need to eat boiled tofu. You need to prioritize these three ingredients:</p>

            <h4>1. Soya Chunks (The Vegetarian Meat)</h4>
            <p><strong>52g Protein per 100g.</strong> This is the king. It has more protein than chicken breast. The secret? Boil them with salt, squeeze ALL the water out, then roast them until crispy before adding to your gravy. It changes the texture from 'sponge' to 'meat'.</p>

            <h4>2. Paneer (Casein Power)</h4>
            <p><strong>18g Protein per 100g.</strong> Paneer is slow-digesting casein protein, perfect for keeping you full. Stop frying it deep-brown; lightly pan-sear it to keep the protein structure intact. <em>Swap: Use Low-fat milk to make paneer if calories are a concern.</em></p>

            <h4>3. Greek Yogurt / Hung Curd</h4>
            <p><strong>10g Protein per 100g.</strong> Dahi keeps your gut healthy, but Hung Curd packs a protein punch. Use it as a marinade for 'Tandoori Gobi' or mix it into your dal to make it creamy without cream.</p>

            <h3>Action Step: The Breakfast Swap</h3>
            <p>Tomorrow morning, do not eat Poha or Upma (mostly carbs). Eat <strong>Paneer Bhurji</strong> or a <strong>Besan Chilla (Chickpea Flour Pancake)</strong> with added grated tofu. You will start your day with 20g of protein instead of 5g.</p>
        `
    },
    {
        id: '2',
        slug: 'why-your-curry-tastes-bland',
        title: "5 Reasons Your Homemade Curry Tastes 'Flat' (And How to Fix It)",
        excerpt: "You used all the spices, but it still tastes like spiced water. Here is the restaurant chemistry you are missing.",
        coverImage: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=60",
        author: AUTHOR_CHEF,
        date: "2024-03-18",
        readTime: "6 min read",
        tags: ["Cooking Technique", "Flavor", "Troubleshooting"],
        views: 28900,
        content: `
            <p><strong>Topic:</strong> Flavor Development in Indian Curries</p>
            <p><strong>Audience:</strong> Home cooks frustrated by the gap between their food and restaurant food.</p>
            <p><strong>Goal:</strong> Diagnose and fix the most common flavor mistakes.</p>
            <hr />

            <h3>The Problem: The 'Raw' Spice Taste</h3>
            <p>Nothing ruins a dish faster than the dusty, raw taste of coriander powder that hasn't been cooked out. If your curry tastes 'powdery' or 'flat', you likely skipped the most crucial step: <strong>Bhunai</strong> (Sautéing).</p>

            <h3>The 3 Fixes</h3>

            <h4>1. The Oil Separation Rule</h4>
            <p>When you cook your onion-tomato masala, you cannot stop when it 'looks cooked'. You must cook it until the oil visibly separates from the paste and oozes out the sides. This visual cue tells you the water is gone and the flavors have concentrated. If you don't see oil, keep cooking.</p>

            <h4>2. Salt Timing is Everything</h4>
            <p>Add salt <strong>when you add the tomatoes</strong>. Salt draws moisture out of the vegetable cells, helping them break down into a sauce rather than staying as chopped chunks. This creates that thick, luscious gravy texture.</p>

            <h4>3. The 'Tadka' Finish</h4>
            <p>Restaurants often do a 'double tadka'. They cook the dish, and then right before serving, they pour almost-smoking oil with chili and cumin over the top. This hits your nose before the food hits your tongue.</p>

            <h3>Action Step: The 'Oil Test'</h3>
            <p>Next time you make a base gravy, do not add a drop of water until you see the oil separate from the masala. It might take 7-10 minutes longer than you think. Wait for it. The flavor difference is worth the wait.</p>
        `
    },
    {
        id: '3',
        slug: 'indian-meal-prep-guide',
        title: "The 'Bhuna Masala' Hack: Cook 5 Dinners in 1 Hour",
        excerpt: "Restaurants don't cook everything from scratch when you order. They use a master gravy. Now, so can you.",
        coverImage: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800&auto=format&fit=crop&q=60",
        author: AUTHOR_CHEF,
        date: "2024-03-15",
        readTime: "8 min read",
        tags: ["Meal Prep", "Time Saving", "Hacks"],
        views: 41000,
        content: `
            <p><strong>Topic:</strong> Efficient Indian Meal Prep</p>
            <p><strong>Audience:</strong> Busy professionals who order takeout because cooking takes too long.</p>
            <p><strong>Goal:</strong> Teach the restaurant 'Master Gravy' technique.</p>
            <hr />

            <h3>The Problem: The Cutting Board Bottleneck</h3>
            <p>Peeling garlic, chopping onions, and reducing tomatoes takes 20 minutes for every single meal. If you cook 5 nights a week, that's 100 minutes just spent chopping onions.</p>

            <h3>The Solution: One Gravy to Rule Them All</h3>
            <p>Restaurants make huge pots of 'Bhuna Masala' (Onion-Tomato Paste) in the morning. When you order Chana Masala, they take a scoop of paste, add chickpeas and water, and it's done in 5 minutes. When you order Paneer Butter Masala, they take the same paste, add cream and paneer.</p>

            <h4>The Master Ratio</h4>
            <ul>
                <li>4 Cups Chopped Onions</li>
                <li>2 Cups Chopped Tomatoes</li>
                <li>1/2 Cup Ginger-Garlic Paste</li>
                <li>SPICES: Turmeric, Coriander, Chili Powder, Garam Masala.</li>
            </ul>
            <p>Cook this down until it is a dark, thick paste (remember the oil separation rule!). Cool it. Store it in a jar.</p>

            <h3>Action Step: Sunday 1-Hour Prep</h3>
            <p>This Sunday, make a triple batch of Bhuna Masala. Freeze it in an ice cube tray. On Tuesday night at 7 PM, pop 3 cubes into a pan, throw in a can of chickpeas and some water. You will have a slow-cooked tasting dinner in 8 minutes flat.</p>
        `
    },
    {
        id: '4',
        slug: 'air-fryer-indian-snacks-mistakes',
        title: "Why Your Air Fryer Samosas Taste Dry (And How to Fix It)",
        excerpt: "The air fryer promises guilt-free snacking, but often delivers cardboard. Here is the hydration secret to getting that deep-fried crunch.",
        coverImage: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=60",
        author: AUTHOR_CHEF,
        date: "2024-03-25",
        readTime: "9 min read",
        tags: ["Healthy Comfort", "Air Fryer", "Technique"],
        views: 45600,
        content: `
            <p><strong>Topic:</strong> Mastering Indian Snacks in the Air Fryer</p>
            <p><strong>Audience:</strong> Health-conscious cooks wishing to enjoy traditional snacks without the deep-frying guilt.</p>
            <p><strong>Goal:</strong> Replicate the texture of deep-frying using convection technology.</p>
            <hr />

            <h3>The Problem: The 'Cardboard' Effect</h3>
            <p>You bought an air fryer to make healthy Samosas and Pakoras. But when they come out, the crust is pale, dry, and tastes like baked flour, while the filling is scorching hot. You miss the blisters, the golden sheen, and that specific 'shatter' when you bite in.</p>
            <p>This happens because an air fryer is essentially a powerful convection oven. It dehydrates food to make it crisp. Deep frying, ironically, adds moisture (fat) while removing water. If you just throw raw dough into hot air, you are baking bread, not frying a snack.</p>

            <h3>The Solution: Artificial Hydration & Fat Emulation</h3>
            <p>To trick your tongue, you need to simulate the environment of hot oil.</p>

            <h4>1. The Detergent-Style Dough</h4>
            <p>Your samosa dough needs more fat <em>inside</em> it (Moyen). In deep frying, the oil penetrates from the outside. In air frying, the fat must buble from within. Increase the ghee in your flour kneading stage by 20%. It sounds counter-intuitive to add fat to a 'low fat' recipe, but it ensures the shell flakes instead of hardening.</p>

            <h4>2. The 'Oil-Brush-Oil' Sandwich</h4>
            <p><strong>Step A:</strong> Brush the raw samosas generously with oil. <br/><strong>Step B:</strong> Air fry at 180°C for 10 minutes. <br/><strong>Step C:</strong> (The Secret) Open the basket. They will look dry. Brush them <em>again</em> with oil and crank the heat to 200°C for the final 4 minutes. This second coating hits the hot surface and mimics the 'flash fry' finish.</p>

            <h4>3. For Pakoras: Pre-Toast the Besan</h4>
            <p>Raw chickpea flour (Besan) tastes bitter if not cooked thoroughly. Deep frying cooks it fast. Air frying sometimes leaves the inside raw. Lightly dry-roast your besan in a pan for 5 minutes before mixing your batter. This ensures the nutty flavor is already unlocked before it hits the basket.</p>

            <h3>Action Step: The Onion Bhaji Test</h3>
            <p>Tonight, slice onions thinly. Mix with pre-roasted besan, salt, turmeric, and ajwain. Instead of water, use a tablespoon of hot oil to bind it. Air fry at 180°C for 12 minutes, flipping halfway. You will never go back to deep frying.</p>
        `
    },
    {
        id: '5',
        slug: 'gut-health-indian-fermented-foods',
        title: "Beyond Yogurt: The Ancient Indian Probiotics You Aren't Eating",
        excerpt: "Dahi is great, but it's just the beginning. Discover the gut-healing power of Kanji, fermented rice, and traditional pickles.",
        coverImage: "https://images.unsplash.com/photo-1606914502288-5c4e85764d26?w=800&auto=format&fit=crop&q=60",
        author: AUTHOR_CHEF,
        date: "2024-03-22",
        readTime: "10 min read",
        tags: ["Wellness", "Gut Health", "Fermentation"],
        views: 21300,
        content: `
            <p><strong>Topic:</strong> Traditional Indian Fermentation for Gut Health</p>
            <p><strong>Audience:</strong> Wellness seekers dealing with bloating, digestion issues, or low immunity.</p>
            <p><strong>Goal:</strong> Reintroduce lost traditional fermented foods into the modern diet.</p>
            <hr />

            <h3>The Problem: The Sanitized Diet</h3>
            <p>Modern hygiene is great for preventing disease, but bad for our microbiome. We sanitize perfectly, we refrigerate immediately, and we eat sterile, processed food. Our ancestors didn't just preserve food to keep it from spoiling; they fermented it to pre-digest it. If you feel heavy or bloated after meals, your gut might lack the diverse bacteria needed to break down complex Indian spices and legumes.</p>

            <h3>The Solution: Wild Fermentation</h3>
            <p>Indian cuisine has a "Probiotic Super-League" that puts store-bought kombucha to shame.</p>

            <h4>1. Gajar ki Kanji (The Winter Elixir)</h4>
            <p>Made from dark purple carrots (Kali Gajar), mustard seeds, and water, this drink ferments in the sun for 3-4 days. It is packed with Lactobacillus bacteria. The mustard acts as a heater for the body, while the bacteria populate the gut. It keeps for weeks and aids digestion of heavy winter meals.</p>

            <h4>2. Panta Bhat / Pazhaya Sadam (The Breakfast of Champions)</h4>
            <p>This is simply leftover cooked rice soaked in water overnight in a clay pot. By morning, the starch breaks down, nutrient availability (Iron, Potassium) spikes by up to 60%, and it becomes rich in B-vitamins. It is cooling, hydrating, and widely eaten by farmers for sustained energy. It is the original 'overnight oats' but better.</p>

            <h4>3. Classical Achar (Pickles without Vinegar)</h4>
            <p>Most commercial pickles are preserved with vinegar and preservatives. Real Indian Manga or Nimbu Achar is lacto-fermented using just salt, spices, oil, and sun. A tiny piece of this pickle with your meal isn't just a condiment; it's a digestive enzyme supplement.</p>

            <h3>Action Step: Start a 'Kanji' Jar</h3>
            <p>You don't need purple carrots. Take normal orange carrots and a small beet for color. Slice them. Add 1 tbsp crushed mustard seeds, 1 tsp salt, and water in a glass jar. Cover with a cloth. Leave it in a sunny window for 3 days. When it tastes sour and tangy, put it in the fridge. Drink a shot glass before dinner.</p>
        `
    },
    {
        id: '6',
        slug: 'south-indian-breakfast-protein',
        title: "Breakfast Beyond Idli: High-Protein Batters You Should Know",
        excerpt: "Idli and Dosa are heavy on rice. Switch to these Dal-based batters to double your protein without sacrificing the crunch.",
        coverImage: "https://images.unsplash.com/photo-1589301760014-d9296896fba8?w=800&auto=format&fit=crop&q=60",
        author: AUTHOR_CHEF,
        date: "2024-03-28",
        readTime: "8 min read",
        tags: ["Regional", "High Protein", "Breakfast"],
        views: 38900,
        content: `
            <p><strong>Topic:</strong> Diversifying the South Indian Breakfast</p>
            <p><strong>Audience:</strong> Breakfast lovers who are tired of the resulting carb-coma from heavy rice diets.</p>
            <p><strong>Goal:</strong> Introduce lentil-dominant pancakes (Dosai) for better macros.</p>
            <hr />

            <h3>The Problem: The '4:1' Rice Trap</h3>
            <p>The standard Idli/Dosa batter ratio is 4 cups of Rice to 1 cup of Urad Dal. That means your batter is 80% simple carbohydrate. While delicious, it spikes blood sugar and often leaves you hungry again by 11 AM. If you strictly eat vegetarian, this missed opportunity for morning protein is critical.</p>

            <h3>The Solution: The 'Dal-First' Batters</h3>
            <p>Andhra and Tamil Nadu cuisines have solved this problem centuries ago with batters that use no rice at all.</p>

            <h4>1. Pesarattu (The Green Mung Miracle)</h4>
            <p>Originating from Andhra Pradesh, this dosa is made from whole green moong dal (mung beans).
            <br/><strong>The Ratio:</strong> 100% Green Moong + Ginger + Green Chili.
            <br/><strong>The Win:</strong> It requires no fermentation. Soak for 4 hours, grind, and pour immediately. It creates a deeply savory, earthy crepe that pairs perfectly with ginger chutney. It packs huge fiber and protein.</p>

            <h4>2. Adai (The Multi-Lentil Powerhouse)</h4>
            <p>A thick, hearty pancake from Tamil Nadu.
            <br/><strong>The Ratio:</strong> Equal parts Chana Dal, Toor Dal, Urad Dal, and a little Rice.
            <br/><strong>The Win:</strong> It has bite. It has texture. It keeps you full for 6 hours. Because of the Chana Dal, it crisps up beautifully with a nutty aroma.</p>

            <h4>3. Ragi Dosa (The Calcium King)</h4>
            <p>Finger Millet (Ragi) is a supergrain. Mix Ragi flour with sour curd or leftover dosa batter. It has a low glycemic index and 3x the calcium of milk.</p>

            <h3>Action Step: The 'Green' Soak</h3>
            <p>Tonight, put 1 cup of whole green moong dal in a bowl of water. Just do it. Tomorrow morning, blend it with an inch of ginger, 2 green chilies, and salt. Pour it on your hot tawa. You just made the healthiest breakfast of your life.</p>
        `
    },
    {
        id: '7',
        slug: 'healthy-indian-desserts-sugar-free',
        title: "Kheer Without the Coma: How to Make Guilt-Free Indian Sweets",
        excerpt: "Indian desserts are notorious for their sugar content. Here is how to swap refined sugar for natural alternatives without ruining the taste.",
        coverImage: "https://images.unsplash.com/photo-1595861179836-3914948a27d1?w=800&auto=format&fit=crop&q=60",
        author: AUTHOR_CHEF,
        date: "2024-04-02",
        readTime: "7 min read",
        tags: ["Dessert", "Sugar Free", "Healthy"],
        views: 56200,
        content: `
            <p><strong>Topic:</strong> Healthier Traditional Indian Desserts</p>
            <p><strong>Audience:</strong> People with a sweet tooth who are watching their insulin or weight.</p>
            <p><strong>Goal:</strong> Provide a credible alternative to the '1 cup sugar' standard recipe.</p>
            <hr />

            <h3>The Problem: The 'White Poison' Default</h3>
            <p>Traditional Indian sweets are preservation methods. Gulab Jamun is fried dough soaked in syrup. Kheer is milk reduced with piles of white sugar. We associate 'celebration' with massive insulin spikes. But sweetness is a spectrum, not a binary switch.</p>

            <h3>The Solution: Whole Sweeteners & Fat</h3>
            <p>When you remove refined sugar, you remove 'body' and 'gloss'. To replace it, you need ingredients that bring their own texture.</p>

            <h4>1. Date Paste vs. Sugar</h4>
            <p>Soaking dates and blending them creates a caramel-like paste.
            <br/><strong>The Swap:</strong> 1 Cup Sugar = 1 Cup Date Paste.
            <br/><strong>Best For:</strong> Kheer, Halwa, and Laddoos. The date paste adds a toffee note that actually improves Gajar ka Halwa.</p>

            <h4>2. Jaggery (Gud) Chemistry</h4>
            <p>Jaggery is unrefined cane sugar. It creates a complex, molasses flavor.
            <br/><strong>Warning:</strong> Never boil milk with Jaggery; it will curdle.
            <br/><strong>Technique:</strong> Make your kheer with milk. Turn off the heat. Let it cool for 5 minutes. <em>Then</em> stir in the jaggery powder.</p>

            <h4>3. The Coconut Fat Trick</h4>
            <p>If you reduce sugar, increase healthy fat. Use full-fat coconut milk instead of dairy milk for Payasam. The natural sweetness of coconut means you need 50% less added sweetener.</p>

            <h3>Action Step: The 3-Ingredient Laddoo</h3>
            <p>Take 1 cup roasted peanuts, 1/2 cup soft dates, and a pinch of cardamom. Blitz in a food processor until sticky. Roll into balls. You just made a high-protein, zero-sugar dessert that tastes like peanut brittle.</p>
        `
    },
    {
        id: '8',
        slug: 'indian-lunchbox-hacks-kids',
        title: "The 15-Minute Tiffin: Lunchbox Ideas Your Kids Won't Bring Back",
        excerpt: "Stop waking up at 5 AM to make Rotis. These nutritious hacks use last night's leftovers to create fresh, exciting lunches.",
        coverImage: "https://images.unsplash.com/photo-1604152135912-04a022e23696?w=800&auto=format&fit=crop&q=60",
        author: AUTHOR_CHEF,
        date: "2024-04-05",
        readTime: "6 min read",
        tags: ["Kids", "Lunchbox", "Quick"],
        views: 31000,
        content: `
            <p><strong>Topic:</strong> Stress-Free School Lunches</p>
            <p><strong>Audience:</strong> Exhausted parents who want their kids to eat healthy but lack time in the morning.</p>
            <p><strong>Goal:</strong> Reduce morning prep time to 15 minutes max.</p>
            <hr />

            <h3>The Problem: Cold Roti Syndrome</h3>
            <p>Roti-Sabzi is great at 8 AM. By 1 PM, the roti is dry leather and the sabzi is cold oil. Kids bring it back uneaten because the texture is unappealing. You need food that stays soft at room temperature.</p>

            <h3>The Solution: The 'Frankie' Rebrand</h3>
            <p>Kids love 'wraps'. It's just psychology. A roll is fun; a chapati is a chore.</p>

            <h4>1. The Paneer Kathi Hack</h4>
            <p>Don't make fresh roti. Use a tortilla or leftover paratha.
            <br/><strong>The Filling:</strong> Crumble paneer, mix with ketchup, cumin, and turmeric. Sauté for 2 minutes (it cooks instantly).
            <br/><strong>The Glue:</strong> Spread mint chutney or mayonnaise on the wrap to keep it moist.</p>

            <h4>2. Mini-Uttapam Pizzas</h4>
            <p>Keep a jar of Dosa batter ready (store-bought is fine). Spoon tiny circles into the pan. Top with finely chopped capsicum, corn, and cheese. Cover for 2 minutes. They are soft, cheesy, and packed with lentils.</p>

            <h4>3. Vermicelli (Seviyan) Upma</h4>
            <p>Pasta is a hit with kids. Seviyan is basically thin Indian pasta. Stir fry roasted vermicelli with peas and carrots. It stays fluffy for hours, unlike Poha which can get dry.</p>

            <h3>Action Step: The 'Freezer Paratha' Prep</h3>
            <p>This weekend, make 10 parathas stuffed with spinach (Palak) and cheese. Half-cook them (just until set). Freeze them with parchment paper in between. In the morning, you just roast one fresh in 2 minutes.</p>
        `
    },
    {
        id: '9',
        slug: 'desi-masala-pasta-fusion',
        title: "The Masala Pasta Secret: How to Make 'Desi Pasta' That Actually Tastes Good",
        excerpt: "It's not Italian, and it's not trying to be. Here is how to embrace the chaos of the roadside Masala Pasta.",
        coverImage: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800&auto=format&fit=crop&q=60",
        author: AUTHOR_CHEF,
        date: "2024-04-10",
        readTime: "5 min read",
        tags: ["Fusion", "Street Food", "Comfort"],
        views: 67800,
        content: `
            <p><strong>Topic:</strong> Mastering Indian Street-Style Fusion</p>
            <p><strong>Audience:</strong> College students and comfort-food lovers who crave spicy carbs.</p>
            <p><strong>Goal:</strong> Elevate the humble 'macaroni' into a spicy masterpiece.</p>
            <hr />

            <h3>The Problem: Weak Sauce</h3>
            <p>People try to make Italian pasta and adding chili powder. It fails. The sauce is watery, the spices are raw, and the cheese clashes.</p>

            <h3>The Solution: Treat Pasta like Vegetables</h3>
            <p>In Desi Pasta, the pasta is just another vegetable in a heavy Curry. You don't boil it separately al-dente; you often cook it <em>in</em> the sauce or overcook it slightly to absorb flavor.</p>

            <h4>1. The 'Maggie Masala' Base</h4>
            <p>Start with butter, aromatics (garlic/chili), and a lot of finely chopped veggies (capsicum/onion). Sauté until soft. Add tomato puree and cook until oil separates. This is your Bhuna base.</p>

            <h4>2. The Spice Blend</h4>
            <p>Forget oregano. You need: Turmeric, Red Chili, Garam Masala, and—the secret weapon—<strong>Pav Bhaji Masala</strong>. This spice blend links the Italian tomato base with Indian street flavors perfectly.</p>

            <h4>3. The Creamy Finish</h4>
            <p>Don't use parmesan. Use processed Amul cheese or a splash of fresh cream (malai). It neutralizes the acidity of the tomatoes and binds the spices to the pasta shells.</p>

            <h3>Action Step: The One-Pot Method</h3>
            <p>Sauté your veggies and spices in a pressure cooker. Add dry uncooked macaroni. Add water (just enough to cover). Close lid. 2 Whistles. Open and stir in cheese. It is the ultimate late-night comfort bowl.</p>
        `
    },
    {
        id: '10',
        slug: 'dorm-room-cooking-rice-cooker',
        title: "No Kitchen? No Problem. The Rice Cooker Biryani Hack",
        excerpt: "Living in a dorm or small studio? If you have a cheap electric rice cooker, you can make a feast.",
        coverImage: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=60",
        author: AUTHOR_CHEF,
        date: "2024-04-12",
        readTime: "4 min read",
        tags: ["Student", "Budget", "Hacks"],
        views: 88900,
        content: `
            <p><strong>Topic:</strong> Cooking with Limited Equipment</p>
            <p><strong>Audience:</strong> Students and bachelors with zero kitchen space.</p>
            <p><strong>Goal:</strong> Cook a complete meal in one device.</p>
            <hr />

            <h3>The Problem: Instant Noodles Every Day</h3>
            <p>You think you can't cook because you don't have a stove. You settle for ramen. But your $20 rice cooker is actually just an electric pot.</p>

            <h3>The Solution: The 'Dump' Biryani</h3>
            <p>A rice cooker has two modes: 'Cook' (High Heat) and 'Warm' (Low Heat). That keeps it simple.</p>

            <h4>The Layering Technique</h4>
            <ol>
                <li><strong>Sauté (Cook Mode):</strong> Put oil in the pot. Add whole spices, onions, and marinated chicken (or paneer). Leave the lid open. It will sizzle just like a pan. Brown the meat.</li>
                <li><strong>The Rice (Cook Mode):</strong> Add washed basmati rice on top. Do not stir it too much.</li>
                <li><strong>The Liquid (Cook Mode):</strong> Pour in water (1.5 cups water for 1 cup rice). Season with salt.</li>
                <li><strong>The Steam (Cook Mode -> Warm):</strong> Close the lid. Let it run its cycle. When it clicks to 'Warm', <em>do not open it</em>. Let it sit for 10 minutes. This steaming fluff the rice.</li>
            </ol>

            <h3>Action Step: Buy a Bag of Frozen Veggies</h3>
            <p>Keep a bag of frozen mixed peas/carrots/corn. A handful of this added to your rice cooker instantly turns plain rice into Pulao. No chopping required. You have no excuse to eat cup noodles today.</p>
        `
    }
];

export const getBlogPosts = async (): Promise<BlogPost[]> => {
    // Simulate API delay
    return new Promise((resolve) => {
        setTimeout(() => resolve(SAMPLE_POSTS), 500);
    });
};

export const getBlogPostBySlug = async (slug: string): Promise<BlogPost | undefined> => {
    return new Promise((resolve) => {
        setTimeout(() => resolve(SAMPLE_POSTS.find(p => p.slug === slug)), 300);
    });
};
