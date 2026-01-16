/**
 * Viral Content Service
 * Fetches trending recipe videos from YouTube Data API v3
 */

import { ViralVideo, ViralFeedResult } from '../types';

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

// Food & cooking related search queries for variety
const FOOD_QUERIES = [
    'indian recipe viral',
    'easy cooking recipe',
    'quick dinner recipe',
    'street food recipe',
    'homemade recipe trending',
    'desi food cooking',
    'healthy recipe easy',
    'viral food hack',
];

/**
 * Format view count to human readable format
 * e.g., 1234567 -> "1.2M"
 */
export function formatViewCount(count: number | string): string {
    const num = typeof count === 'string' ? parseInt(count, 10) : count;
    if (isNaN(num)) return '0';

    if (num >= 1_000_000) {
        return `${(num / 1_000_000).toFixed(1)}M`;
    } else if (num >= 1_000) {
        return `${(num / 1_000).toFixed(0)}K`;
    }
    return num.toString();
}

/**
 * Format ISO duration to readable format
 * e.g., "PT5M30S" -> "5:30"
 */
export function formatDuration(isoDuration: string): string {
    if (!isoDuration) return '0:00';

    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '0:00';

    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Format published date to relative time
 * e.g., "2024-01-10T12:00:00Z" -> "3 days ago"
 */
export function formatRelativeTime(isoDate: string): string {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
}

/**
 * Get channel thumbnail from channel ID
 */
async function getChannelThumbnail(channelId: string): Promise<string> {
    try {
        const response = await fetch(
            `${YOUTUBE_API_BASE}/channels?part=snippet&id=${channelId}&key=${YOUTUBE_API_KEY}`
        );
        const data = await response.json();
        return data.items?.[0]?.snippet?.thumbnails?.default?.url ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${channelId}`;
    } catch {
        return `https://api.dicebear.com/7.x/avataaars/svg?seed=${channelId}`;
    }
}

/**
 * Search for trending recipe videos
 */
export async function searchRecipeVideos(
    query?: string,
    pageToken?: string,
    maxResults: number = 10
): Promise<ViralFeedResult> {
    if (!YOUTUBE_API_KEY) {
        console.error('YouTube API key not configured');
        return { videos: [], hasMore: false };
    }

    const searchQuery = query || FOOD_QUERIES[Math.floor(Math.random() * FOOD_QUERIES.length)];

    try {
        // Step 1: Search for videos
        const searchUrl = new URL(`${YOUTUBE_API_BASE}/search`);
        searchUrl.searchParams.set('part', 'snippet');
        searchUrl.searchParams.set('q', searchQuery);
        searchUrl.searchParams.set('type', 'video');
        searchUrl.searchParams.set('videoDuration', 'short'); // Under 4 minutes for short-form feel
        searchUrl.searchParams.set('order', 'viewCount'); // Most viewed first
        searchUrl.searchParams.set('maxResults', maxResults.toString());
        searchUrl.searchParams.set('regionCode', 'IN');
        searchUrl.searchParams.set('key', YOUTUBE_API_KEY);
        if (pageToken) {
            searchUrl.searchParams.set('pageToken', pageToken);
        }

        const searchResponse = await fetch(searchUrl.toString());
        const searchData = await searchResponse.json();

        if (searchData.error) {
            console.error('YouTube API Error:', searchData.error);
            return { videos: [], hasMore: false };
        }

        if (!searchData.items || searchData.items.length === 0) {
            return { videos: [], hasMore: false };
        }

        // Step 2: Get video details (views, likes, duration)
        const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
        const detailsUrl = new URL(`${YOUTUBE_API_BASE}/videos`);
        detailsUrl.searchParams.set('part', 'statistics,contentDetails,snippet');
        detailsUrl.searchParams.set('id', videoIds);
        detailsUrl.searchParams.set('key', YOUTUBE_API_KEY);

        const detailsResponse = await fetch(detailsUrl.toString());
        const detailsData = await detailsResponse.json();

        // Step 3: Map to our ViralVideo format
        const videos: ViralVideo[] = await Promise.all(
            detailsData.items.map(async (item: any) => {
                const channelThumbnail = await getChannelThumbnail(item.snippet.channelId);

                return {
                    id: item.id,
                    videoId: item.id,
                    videoUrl: `https://www.youtube.com/embed/${item.id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${item.id}`,
                    thumbnailUrl: item.snippet.thumbnails?.maxres?.url ||
                        item.snippet.thumbnails?.high?.url ||
                        item.snippet.thumbnails?.medium?.url,
                    title: item.snippet.title,
                    creator: item.snippet.channelTitle,
                    creatorAvatar: channelThumbnail,
                    description: item.snippet.description?.substring(0, 200) || '',
                    views: formatViewCount(item.statistics?.viewCount || 0),
                    likes: formatViewCount(item.statistics?.likeCount || 0),
                    publishedAt: formatRelativeTime(item.snippet.publishedAt),
                    platform: 'youtube' as const,
                    duration: formatDuration(item.contentDetails?.duration || ''),
                };
            })
        );

        return {
            videos,
            nextPageToken: searchData.nextPageToken,
            hasMore: !!searchData.nextPageToken,
        };
    } catch (error) {
        console.error('Error fetching viral videos:', error);
        return { videos: [], hasMore: false };
    }
}

/**
 * Get popular/trending videos in the food category
 * Uses less API quota than search (1 unit vs 100 units)
 */
export async function getTrendingFoodVideos(
    pageToken?: string,
    maxResults: number = 10
): Promise<ViralFeedResult> {
    if (!YOUTUBE_API_KEY) {
        console.error('YouTube API key not configured');
        return { videos: [], hasMore: false };
    }

    try {
        // Get most popular videos in "Howto & Style" category (includes food)
        const url = new URL(`${YOUTUBE_API_BASE}/videos`);
        url.searchParams.set('part', 'snippet,statistics,contentDetails');
        url.searchParams.set('chart', 'mostPopular');
        url.searchParams.set('videoCategoryId', '26'); // Howto & Style
        url.searchParams.set('regionCode', 'IN');
        url.searchParams.set('maxResults', maxResults.toString());
        url.searchParams.set('key', YOUTUBE_API_KEY);
        if (pageToken) {
            url.searchParams.set('pageToken', pageToken);
        }

        const response = await fetch(url.toString());
        const data = await response.json();

        if (data.error) {
            console.error('YouTube API Error:', data.error);
            // Fallback to search if trending fails
            return searchRecipeVideos(undefined, pageToken, maxResults);
        }

        if (!data.items || data.items.length === 0) {
            // Fallback to search
            return searchRecipeVideos(undefined, pageToken, maxResults);
        }

        const videos: ViralVideo[] = await Promise.all(
            data.items.map(async (item: any) => {
                const channelThumbnail = await getChannelThumbnail(item.snippet.channelId);

                return {
                    id: item.id,
                    videoId: item.id,
                    videoUrl: `https://www.youtube.com/embed/${item.id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${item.id}`,
                    thumbnailUrl: item.snippet.thumbnails?.maxres?.url ||
                        item.snippet.thumbnails?.high?.url ||
                        item.snippet.thumbnails?.medium?.url,
                    title: item.snippet.title,
                    creator: item.snippet.channelTitle,
                    creatorAvatar: channelThumbnail,
                    description: item.snippet.description?.substring(0, 200) || '',
                    views: formatViewCount(item.statistics?.viewCount || 0),
                    likes: formatViewCount(item.statistics?.likeCount || 0),
                    publishedAt: formatRelativeTime(item.snippet.publishedAt),
                    platform: 'youtube' as const,
                    duration: formatDuration(item.contentDetails?.duration || ''),
                };
            })
        );

        return {
            videos,
            nextPageToken: data.nextPageToken,
            hasMore: !!data.nextPageToken,
        };
    } catch (error) {
        console.error('Error fetching trending videos:', error);
        return { videos: [], hasMore: false };
    }
}

/**
 * Main function to fetch viral feed content
 * Combines trending and search for variety
 */
export async function fetchViralFeed(
    pageToken?: string,
    maxResults: number = 10
): Promise<ViralFeedResult> {
    // First page: Try trending videos (cheaper API call)
    // Subsequent pages: Use search for more variety
    if (!pageToken) {
        const trending = await getTrendingFoodVideos(undefined, maxResults);
        if (trending.videos.length > 0) {
            return trending;
        }
    }

    // Fallback or subsequent pages: Use search
    return searchRecipeVideos(undefined, pageToken, maxResults);
}
