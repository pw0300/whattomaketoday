/**
 * Analytics Service
 * Lightweight analytics abstraction that can be connected to various providers.
 * Currently implements console logging for development; can be extended to GA, Mixpanel, etc.
 */

type EventName =
    | 'page_view'
    | 'onboarding_started'
    | 'onboarding_completed'
    | 'dish_swiped'
    | 'dish_approved'
    | 'dish_rejected'
    | 'chef_mode_started'
    | 'chef_mode_completed'
    | 'grocery_list_viewed'
    | 'commerce_link_clicked'
    | 'auth_sign_in'
    | 'auth_sign_out'
    | 'error_boundary_triggered';

interface AnalyticsEvent {
    name: EventName;
    properties?: Record<string, string | number | boolean>;
    timestamp?: number;
}

class Analytics {
    private isEnabled: boolean;
    private userId: string | null = null;

    constructor() {
        // Enable analytics only in production
        this.isEnabled = import.meta.env.PROD;
    }

    identify(userId: string) {
        this.userId = userId;
        this.log('identify', { userId });
    }

    reset() {
        this.userId = null;
    }

    track(name: EventName, properties?: Record<string, string | number | boolean>) {
        const event: AnalyticsEvent = {
            name,
            properties,
            timestamp: Date.now(),
        };

        this.log('track', event);

        // TODO: Send to analytics provider
        // Example: mixpanel.track(name, properties);
        // Example: gtag('event', name, properties);
    }

    page(pageName: string) {
        this.track('page_view', { page: pageName });
    }

    private log(type: string, data: any) {
        if (!this.isEnabled) {
            console.debug(`[Analytics:${type}]`, data);
        }
    }
}

export const analytics = new Analytics();

// Hook for React components
export function useAnalytics() {
    return analytics;
}
