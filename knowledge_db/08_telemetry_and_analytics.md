# Telemetry & Analytics Strategy

## Philosophy
We track **system performance and feature usage**, not invasive user data. The goal is to optimize the AI and Knowledge Graph engines.

## Key Metrics

### 1. Performance (AI & Cache)
| Metric | Description | Goal |
| :--- | :--- | :--- |
| `cache_hit_rate` | % of dishes served from Local Store vs Gemini API | > 80% |
| `api_latency` | Time taken for `generateNewDishes` to return | < 4s |
| `cold_start_time` | Time from Onboarding -> First Card visible | < 100ms |

### 2. Feature Utilization
| Metric | Description | Goal |
| :--- | :--- | :--- |
| `starter_pack_usage` | % of sessions using bundled recipes | > 90% (New Users) |
| `kg_validation_rate` | % of pantry items recognized by Knowledge Graph | > 95% |
| `cook_mode_conversion` | % of planned meals that result in "Sharable WhatsApp Link" | > 40% |

### 3. Engagement (Product Loops)
| Metric | Description | Goal |
| :--- | :--- | :--- |
| `swipe_ratio` | Right Swipes / Total Swipes (Quality Proxy) | > 30% |
| `pantry_add_rate` | Items added from Shopping List / Total Checked | 100% |

## Implementation
Currently implemented via `console.log` with `[Telemetry]` prefix in:
- `services/geminiService.ts`
- `services/knowledgeGraphService.ts`
