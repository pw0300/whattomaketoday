
export interface BlogPost {
    slug: string;
    title: string;
    excerpt: string;
    date: string;
    readTime: string;
    tags: string[];
    content: string; // Markdown supported
}

export const BLOG_POSTS: BlogPost[] = [
    {
        slug: 'pcos-diet-indian-vegetarian',
        title: 'The Ultimate Indian Vegetarian Guide to PCOS Management',
        excerpt: 'How to balance blood sugar without giving up your favorite dals and rotis. A science-backed approach.',
        date: 'Oct 12, 2025',
        readTime: '6 min read',
        tags: ['Health', 'PCOS', 'Guide'],
        content: `
# Managing PCOS as an Indian Vegetarian

It's a common myth that you need to eat meat to get enough protein for PCOS management. The truth is, the Indian kitchen is a powerhouse of hormonal health... **if** you know how to hack it.

## The Carb Problem
Our traditional thali is 80% carbs (Rice + Roti + Aloo). For PCOS (Insulin Resistance), this is a spike waiting to happen.

### The Fix: The 50-25-25 Rule
Instead of banning rice, change the ratio:
- 50% Vegetables (Sabzi, Salad)
- 25% Protein (Dal, Paneer, Chana - make this THICK)
- 25% Carbs (Roti/Rice)

## Top 5 PCOS Superfoods in your Kitchen
1. **Methi (Fenugreek)**: Soaked seeds water in the morning.
2. **Besan (Chickpea Flour)**: Higher protein than wheat. Swap your Roti.
3. **Flax Seeds**: Ground into your atta.
    `
    },
    {
        slug: 'decision-fatigue-dinner',
        title: 'Why "What to Cook?" is the Hardest Question of the Day',
        excerpt: 'Decision fatigue is ruining your evenings. Here is why automating your meal plan is the ultimate form of self-care.',
        date: 'Nov 04, 2025',
        readTime: '4 min read',
        tags: ['Lifestyle', 'Mental Health'],
        content: `
# The 6 PM Panic

You wrap up work. You're exhausted. You walk into the kitchen. And you freeze.
"What should I make?"

This question carries the weight of:
- What ingredients do I have? (Supply Chain)
- What is healthy? (Compliance)
- What will everyone eat? (Stakeholder Management)
- How much time do I have? (Resource Allocation)

You are practically running a small manufacturing plant, yet you treat it like an afterthought.

## Automate to Liberate
By deciding your menu on Sunday (or letting AI do it), you reclaim nearly 5 hours of mental energy per week.
    `
    },
    {
        slug: 'vegetarian-protein-hacks',
        title: '5 Ways to Double Protein in Indian Vegetarian Food',
        excerpt: 'Beyond just paneer. How to hit 60g of protein daily without supplements.',
        date: 'Jan 02, 2026',
        readTime: '5 min read',
        tags: ['Nutrition', 'Muscle', 'Vegetarian'],
        content: `
# The "Where do you get your protein?" Question

If every Indian vegetarian had a rupee for every time they heard this, we'd be millionaires. But frankly, the critics aren't entirely wrong. A bowl of standard tur dal is mostly water and carbs.

## Hack 1: The "Secret" Flour
Stop using 100% wheat flour. Mix in 30% Sattu or Besan.
- **Wheat Roti**: ~3g protein
- **Sattu Mix Roti**: ~6g protein

## Hack 2: Greek Yogurt Marinade
Dahi is good. Hung curd (Greek Yogurt) is elite. Use it to marinate your paneer or soya chunks. It adds a probitoic protein punch.

## Hack 3: Green Peas matter
A cup of green peas has more protein than an egg. Add them to your Poha, Upma, and even your Aloo Gobi.
    `
    },
    {
        slug: 'grocery-bill-audit',
        title: 'We Audited 50 Indian Kitchens. Here is Why You Are Overspending.',
        excerpt: 'The hidden cost of "Aspirational Buying" vs. "Reality Cooking".',
        date: 'Jan 10, 2026',
        readTime: '7 min read',
        tags: ['Finance', 'Savings', 'Minimalism'],
        content: `
# The Rotting Coriander Index

The fastest way to judge a kitchen's efficiency? Check the crisper drawer. If there's a bunch of rotting coriander or a half-cut capsicum turning slimy, you are losing money.

## The 3 Culprits
1.  **Improper Inventory Tracking**: Buying Jeera when you already have 2 packets hiding in the back.
2.  **The "Fantasy Chef" Syndrome**: Buying Zucchini and Broccoli because you *plan* to be healthy, then ordering Biryani on Wednesday.
3.  **Lack of FIFO (First In, First Out)**: Using the new milk packet while the old one expires.

## The Solution?
A digital pantry. If your phone knows what's in your fridge, it won't let you buy duplicates. It will suggest recipes to use up that Capsicum *today*.
    `
    },
    {
        slug: 'iron-deficiency-trap',
        title: 'The Silent Energy Killer: Iron Deficiency in Indian Women',
        excerpt: 'Why drinking Chai with your meal is stealing your energy.',
        date: 'Jan 14, 2026',
        readTime: '4 min read',
        tags: ['Health', 'Women', 'Wellness'],
        content: `
# Feeling tired at 3 PM?

It might not be lack of sleep. It might be your lunch.
For Indian vegetarians, getting iron is hard (plant iron is harder to absorb). But we make it harder.

## The Enemy: Tannins
Do you have a cup of Chai or Coffee immediately after lunch?
**Stop.**
The tannins in tea block iron absorption by up to 60%.

## The Hero: Vitamin C
Squeeze a lemon on your Poha. Eat an orange with your lunch. Vitamin C *triples* iron absorption. This one habit can change your energy levels in a week.
    `
    },
    {
        slug: 'meal-prep-indian-style',
        title: 'Indian Meal Prep is NOT just freezing curries',
        excerpt: 'How to prep for the week without eating stale food. The "Base Gravy" method.',
        date: 'Dec 15, 2025',
        readTime: '8 min read',
        tags: ['Productivity', 'Cooking', 'Guide'],
        content: `
# We don't like "Leftovers"

The western concept of "Meal Prep" (cooking 5 chicken breasts on Sunday) doesn't fly in most Indian homes. We want *fresh* Tadka.

## The "Bhuna Masala" Technique
Restaurants don't cook every dish from scratch. They have a "Mother Sauce" (Onion, Tomato, Ginger, Garlic paste cooked down until oil separates).

### Sunday Task: Make 1kg of Mother Sauce
Freeze it in ice cube trays.
**Wednesday Night**:
1. Throw 2 cubes in a pan.
2. Add fresh Paneer and cream.
3. Done in 5 minutes. Tastes fresh.

## Pre-chopping Vegetables
Buying pre-cut veggies is expensive. Spending 1 hour on Sunday chopping Bhendi, Gobi, and beans saves you 15 minutes *every single night*.
    `
    }
];
