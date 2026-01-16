# Data Models & Schemas

## Core TypeScript Interfaces
Defined in `types.ts`.

### 1. UserProfile
The central object defining the user's preferences and constraints.
| Field | Type | Description |
| :--- | :--- | :--- |
| `uid` | string | Firebase User ID (optional for guests) |
| `dietaryPreference` | string | Vegetarian, Non-Veg, Vegan, Any |
| `allergens` | string[] | List of allergens to exclude |
| `conditions` | string[] | Health conditions (Diabetes, PCOS, etc.) |
| `likedDishes` | string[] | Array of dish names for seed generation |
| `dislikedDishes` | string[] | Track negative feedback for AI |
| `credits` | number | Gamification score (+3 per cook) |
| `pantryStock` | string[] | *Managed via Store, not Profile directly* |

### 2. Dish
Represent a single recipe/meal item.
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | string | UUID |
| `name` | string | English name (e.g., "Butter Chicken") |
| `localName` | string | Cultural name (e.g., "Murgh Makhani") |
| `primaryIngredient` | string? | Optional main ingredient |
| `macros` | object | { protein, carbs, fat, calories } |
| `ingredients` | Ingredient[] | List of required items |
| `instructions` | string[] | Step-by-step guide |
| `tags` | string[] | Searchable tags |
| `healthTags` | string[] | For Diabetes, PCOS, etc. |
| `isStaple` | boolean | If true, always available (e.g., Rice, Roti) |

### 3. DayPlan (Weekly Planner)
| Field | Type | Description |
| :--- | :--- | :--- |
| `day` | string | "Monday", "Tuesday", etc. |
| `lunch` | Dish \| null | Selected Lunch |
| `dinner` | Dish \| null | Selected Dinner |
| `isLocked` | boolean | If true, this day won't be auto-regenerated |

### 4. Knowledge Graph Models
Defined in `services/knowledgeGraphService.ts`.

#### IngredientNode
| Field | Type | Description |
| :--- | :--- | :--- |
| `displayName` | string | UI specific name |
| `category` | string | Produce, Protein, Dairy, etc. |
| `tier` | string | Common | Exotic |
| `allergens` | string[] | List of allergens this ingredient contains |
| `substitutes` | string[] | Keys of substitute ingredients |
| `seasonality` | string | Best season to use |

#### DishTemplate
| Field | Type | Description |
| :--- | :--- | :--- |
| `displayName` | string | Name of the dish |
| `essentialIngredients` | string[] | Keys of must-have ingredients |
| `dietaryTags` | string[] | Vegetarian, Vegan, etc. |

## Firestore Collections

### `users/{uid}`
Stores the `UserProfile` and `AppState` backup.
- **Rules**: Users can only read/write their own document.

### `cached_dishes`
A public, read-heavy collection of generated dishes.
- **Purpose**: Deduplication and cost-saving on AI calls.
- **Structure**: Flat list of `Dish` objects.
- **Integrity**: Objects are passed through `sanitizeForFirestore()` to remove `undefined` values before write.
- **Rules**: Public Read, Write only via Server/Admin (currently client-side allowed for beta).
