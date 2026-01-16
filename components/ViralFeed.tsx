import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dish, ViralVideo } from '../types';
import { Heart, Plus, Share2, MoreHorizontal, Play, Flame, Loader2, AlertCircle, RefreshCw, Volume2, VolumeX, Youtube } from 'lucide-react';
import { fetchViralFeed, searchRecipeVideos } from '../services/viralContentService';

interface Props {
    onAddToDeck: (dish: Dish) => void;
}

// Loading skeleton component
const VideoSkeleton: React.FC = () => (
    <div className="h-full w-full relative snap-start shrink-0 flex items-center justify-center bg-gray-900 animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-800 via-gray-900 to-gray-800" />
        <div className="absolute bottom-0 left-0 w-full p-4 pb-24">
            <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-full bg-gray-700" />
                <div className="space-y-2">
                    <div className="h-4 w-24 bg-gray-700 rounded" />
                    <div className="h-3 w-16 bg-gray-700 rounded" />
                </div>
            </div>
            <div className="h-4 w-3/4 bg-gray-700 rounded mb-2" />
            <div className="h-4 w-1/2 bg-gray-700 rounded" />
        </div>
    </div>
);

// Error state component
const ErrorState: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
    <div className="h-full w-full flex flex-col items-center justify-center bg-gray-900 text-white p-8">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h3 className="text-lg font-bold mb-2">Oops! Something went wrong</h3>
        <p className="text-gray-400 text-center mb-6">{message}</p>
        <button
            onClick={onRetry}
            className="flex items-center gap-2 px-6 py-3 bg-brand-500 rounded-full font-bold hover:bg-brand-600 transition"
        >
            <RefreshCw size={18} />
            Try Again
        </button>
    </div>
);

// Empty state component
const EmptyState: React.FC<{ onRefresh: () => void }> = ({ onRefresh }) => (
    <div className="h-full w-full flex flex-col items-center justify-center bg-gray-900 text-white p-8">
        <Youtube size={48} className="text-red-500 mb-4" />
        <h3 className="text-lg font-bold mb-2">No Videos Found</h3>
        <p className="text-gray-400 text-center mb-6">
            We couldn't find any trending recipe videos right now.
        </p>
        <button
            onClick={onRefresh}
            className="flex items-center gap-2 px-6 py-3 bg-brand-500 rounded-full font-bold hover:bg-brand-600 transition"
        >
            <RefreshCw size={18} />
            Refresh Feed
        </button>
    </div>
);

const ViralFeed: React.FC<Props> = ({ onAddToDeck }) => {
    const [videos, setVideos] = useState<ViralVideo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [nextPageToken, setNextPageToken] = useState<string | undefined>();
    const [hasMore, setHasMore] = useState(true);
    const [activeVideoIndex, setActiveVideoIndex] = useState(0);
    const [isMuted, setIsMuted] = useState(true);

    const containerRef = useRef<HTMLDivElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const videoRefs = useRef<Map<string, HTMLIFrameElement>>(new Map());

    // Initial load
    const loadInitialVideos = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await fetchViralFeed(undefined, 10);
            setVideos(result.videos);
            setNextPageToken(result.nextPageToken);
            setHasMore(result.hasMore);
        } catch (err) {
            setError('Failed to load videos. Please check your connection and try again.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Load more videos
    const loadMoreVideos = useCallback(async () => {
        if (isLoadingMore || !hasMore || !nextPageToken) return;

        setIsLoadingMore(true);

        try {
            const result = await searchRecipeVideos(undefined, nextPageToken, 10);
            setVideos(prev => [...prev, ...result.videos]);
            setNextPageToken(result.nextPageToken);
            setHasMore(result.hasMore);
        } catch (err) {
            console.error('Error loading more videos:', err);
        } finally {
            setIsLoadingMore(false);
        }
    }, [isLoadingMore, hasMore, nextPageToken]);

    // Initial load on mount
    useEffect(() => {
        loadInitialVideos();
    }, [loadInitialVideos]);

    // Infinite scroll observer
    useEffect(() => {
        if (!sentinelRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
                    loadMoreVideos();
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, [hasMore, isLoadingMore, loadMoreVideos]);

    // Track active video for auto-play
    useEffect(() => {
        if (!containerRef.current || videos.length === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const index = parseInt(entry.target.getAttribute('data-index') || '0', 10);
                        setActiveVideoIndex(index);
                    }
                });
            },
            { threshold: 0.6, root: containerRef.current }
        );

        const items = containerRef.current.querySelectorAll('[data-video-item]');
        items.forEach((item) => observer.observe(item));

        return () => observer.disconnect();
    }, [videos]);

    // Toggle mute
    const toggleMute = () => {
        setIsMuted(!isMuted);
        // Post message to iframes to toggle mute
        videoRefs.current.forEach((iframe) => {
            iframe.contentWindow?.postMessage(
                JSON.stringify({ event: 'command', func: isMuted ? 'unMute' : 'mute' }),
                '*'
            );
        });
    };

    // Handle adding video as recipe inspiration
    const handleAddToDeck = (video: ViralVideo) => {
        // Create a placeholder dish from the video
        const placeholderDish: Dish = {
            id: `viral_${video.videoId}`,
            name: video.title.substring(0, 50),
            localName: video.title.substring(0, 50),
            description: video.description || `Recipe inspired by ${video.creator}`,
            primaryIngredient: 'Various',
            cuisine: 'Mixed',
            type: 'Dinner',
            image: video.thumbnailUrl,
            macros: { protein: 0, carbs: 0, fat: 0, calories: 0 },
            ingredients: [],
            instructions: [`Watch the original video: https://youtube.com/watch?v=${video.videoId}`],
            tags: ['viral', 'youtube'],
            allergens: [],
        };

        onAddToDeck(placeholderDish);
    };

    // Share video
    const handleShare = async (video: ViralVideo) => {
        const shareUrl = `https://youtube.com/watch?v=${video.videoId}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: video.title,
                    text: `Check out this recipe: ${video.title}`,
                    url: shareUrl,
                });
            } catch (err) {
                // User cancelled or error
            }
        } else {
            // Fallback: copy to clipboard
            await navigator.clipboard.writeText(shareUrl);
            alert('Link copied to clipboard!');
        }
    };

    // Render states
    if (isLoading) {
        return (
            <div className="h-full bg-black text-white relative overflow-y-scroll snap-y snap-mandatory no-scrollbar">
                {[1, 2, 3].map((i) => <VideoSkeleton key={i} />)}
            </div>
        );
    }

    if (error) {
        return <ErrorState message={error} onRetry={loadInitialVideos} />;
    }

    if (videos.length === 0) {
        return <EmptyState onRefresh={loadInitialVideos} />;
    }

    return (
        <div
            ref={containerRef}
            className="h-full bg-black text-white relative overflow-y-scroll snap-y snap-mandatory no-scrollbar"
        >
            {/* Mute toggle button */}
            <button
                onClick={toggleMute}
                className="fixed top-20 right-4 z-30 p-3 bg-black/50 backdrop-blur rounded-full"
            >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>

            {videos.map((video, index) => (
                <div
                    key={video.id}
                    data-video-item
                    data-index={index}
                    className="h-full w-full relative snap-start shrink-0 flex items-center justify-center bg-gray-900 group"
                >
                    {/* Video/Thumbnail */}
                    <div className="absolute inset-0">
                        {index === activeVideoIndex ? (
                            // Active video: show embed
                            <iframe
                                ref={(el) => {
                                    if (el) videoRefs.current.set(video.id, el);
                                }}
                                src={`${video.videoUrl}&mute=${isMuted ? 1 : 0}&enablejsapi=1`}
                                className="w-full h-full object-cover"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                loading="lazy"
                            />
                        ) : (
                            // Inactive: show thumbnail
                            <>
                                <img
                                    src={video.thumbnailUrl}
                                    className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity"
                                    alt={video.title}
                                />
                                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Play size={64} fill="rgba(255,255,255,0.8)" className="text-transparent scale-110" />
                                </div>
                            </>
                        )}
                    </div>

                    {/* Duration badge */}
                    <div className="absolute top-4 left-4 px-2 py-1 bg-black/70 rounded text-xs font-mono z-20">
                        {video.duration}
                    </div>

                    {/* YouTube badge */}
                    <div className="absolute top-4 right-16 flex items-center gap-1 px-2 py-1 bg-red-600/90 rounded text-xs font-bold z-20">
                        <Youtube size={12} />
                        YouTube
                    </div>

                    {/* Right Sidebar Actions */}
                    <div className="absolute right-4 bottom-28 flex flex-col gap-6 items-center z-20">
                        <button className="flex flex-col items-center gap-1 group">
                            <div className="p-3 bg-gray-800/50 rounded-full group-hover:bg-red-500/20 transition">
                                <Heart size={28} className="text-white group-hover:text-red-500 transition-colors" />
                            </div>
                            <span className="text-xs font-bold drop-shadow-md">{video.likes}</span>
                        </button>

                        <button
                            onClick={() => handleAddToDeck(video)}
                            className="flex flex-col items-center gap-1 group"
                        >
                            <div className="p-3 bg-gray-800/50 rounded-full group-hover:bg-brand-500/20 transition">
                                <Plus size={32} className="text-white group-hover:text-brand-500 transition-colors" />
                            </div>
                            <span className="text-xs font-bold drop-shadow-md">Add</span>
                        </button>

                        <button
                            onClick={() => handleShare(video)}
                            className="flex flex-col items-center gap-1"
                        >
                            <div className="p-3 bg-gray-800/50 rounded-full">
                                <Share2 size={24} className="text-white" />
                            </div>
                            <span className="text-xs font-bold drop-shadow-md">Share</span>
                        </button>

                        <button className="p-3 bg-gray-800/50 rounded-full">
                            <MoreHorizontal size={24} className="text-white" />
                        </button>
                    </div>

                    {/* Bottom Info */}
                    <div className="absolute bottom-0 left-0 w-full p-4 pb-24 bg-gradient-to-t from-black/90 to-transparent pt-20 z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-400 to-purple-500 p-0.5">
                                <img
                                    src={video.creatorAvatar}
                                    className="w-full h-full rounded-full bg-black object-cover"
                                    alt={video.creator}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${video.creator}`;
                                    }}
                                />
                            </div>
                            <div>
                                <h3 className="font-bold text-shadow-sm">{video.creator}</h3>
                                <p className="text-[10px] text-gray-300 font-mono uppercase tracking-wider flex items-center gap-1">
                                    <Flame size={10} className="text-orange-500 fill-orange-500" />
                                    Trending • {video.views} Views • {video.publishedAt}
                                </p>
                            </div>
                        </div>
                        <p className="text-sm leading-snug text-gray-100 max-w-[80%] mb-2 line-clamp-2">
                            {video.title}
                        </p>

                        {/* Open in YouTube */}
                        <a
                            href={`https://youtube.com/watch?v=${video.videoId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
                        >
                            <Youtube size={12} />
                            Watch on YouTube
                        </a>
                    </div>
                </div>
            ))}

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-20 flex items-center justify-center">
                {isLoadingMore && (
                    <div className="flex items-center gap-2 text-gray-400">
                        <Loader2 size={20} className="animate-spin" />
                        <span>Loading more...</span>
                    </div>
                )}
                {!hasMore && videos.length > 0 && (
                    <p className="text-gray-500 text-sm">You've seen all the trending videos!</p>
                )}
            </div>
        </div>
    );
};

export default ViralFeed;
