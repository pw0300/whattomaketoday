/**
 * Feature Flags System
 * Simple feature flag implementation for controlled rollouts.
 * Can be extended to use remote config services like Firebase Remote Config or LaunchDarkly.
 */

type FeatureFlag =
    | 'viral_feed'
    | 'chef_mode_v2'
    | 'ai_image_generation'
    | 'social_sharing'
    | 'dark_mode'
    | 'premium_features';

interface FeatureConfig {
    enabled: boolean;
    rolloutPercentage?: number; // 0-100
    allowedUserIds?: string[];
}

// Default feature flag configuration
const defaultConfig: Record<FeatureFlag, FeatureConfig> = {
    viral_feed: { enabled: true },
    chef_mode_v2: { enabled: true },
    ai_image_generation: { enabled: false, rolloutPercentage: 10 },
    social_sharing: { enabled: true },
    dark_mode: { enabled: false },
    premium_features: { enabled: false },
};

class FeatureFlags {
    private config: Record<FeatureFlag, FeatureConfig>;
    private userId: string | null = null;

    constructor() {
        // Load from localStorage or use defaults
        const stored = localStorage.getItem('feature_flags');
        this.config = stored ? { ...defaultConfig, ...JSON.parse(stored) } : defaultConfig;
    }

    setUserId(userId: string) {
        this.userId = userId;
    }

    isEnabled(flag: FeatureFlag): boolean {
        const config = this.config[flag];
        if (!config) return false;
        if (!config.enabled) return false;

        // Check user allowlist
        if (config.allowedUserIds && this.userId) {
            if (config.allowedUserIds.includes(this.userId)) return true;
        }

        // Check rollout percentage
        if (config.rolloutPercentage !== undefined && this.userId) {
            const hash = this.hashUserId(this.userId + flag);
            return hash < config.rolloutPercentage;
        }

        return config.enabled;
    }

    // Override a flag locally (for testing/debugging)
    override(flag: FeatureFlag, enabled: boolean) {
        this.config[flag] = { ...this.config[flag], enabled };
        localStorage.setItem('feature_flags', JSON.stringify(this.config));
    }

    // Simple hash function for consistent rollout
    private hashUserId(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash % 100);
    }
}

export const featureFlags = new FeatureFlags();

// React hook for feature flags
export function useFeatureFlag(flag: FeatureFlag): boolean {
    return featureFlags.isEnabled(flag);
}
