# Gamification System

## Core Concept
Cooking is hard work. TadkaSync rewards the "Home Manager" for every completed meal cycle, turning household chores into a rewarding game.

## The Economy

### Currency: "Credits" (₹)
- **Visual**: Displayed as a Wallet Balance in the Profile.
- **Value**: Currently abstract points, planned for future redemption.

### Earning Rules
| Action | Reward | Implementation Status |
| :--- | :--- | :--- |
| **Cook a Meal** | +3 Credits | ✅ Implemented (`onCook`) |
| **Streak Bonus** | +10 (7 days) | ⏳ Planned |
| **Share Recipe** | +5 Credits | ⏳ Planned |

## UI Representation
- **Profile View**: Prominent "Wallet" card showing total balance.
- **Feedback**: Immediate toast/notification upon `onCook` completion ("+3 Credits Added!").

## Future Roadmap (Redemption)
1.  **Level System**: "Novice" -> "Home Chef" -> "Maharaj".
2.  **Unlockables**: Premium Recipe Packs (e.g., "Restaurant Style").
3.  **Real Value**: Discounts on Quick Commerce partners (future integration).
