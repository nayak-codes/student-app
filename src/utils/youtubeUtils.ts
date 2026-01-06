// YouTube Video Utilities
// Professional YouTube integration for video posts

export interface YouTubeVideoMetadata {
    videoId: string;
    title: string;
    authorName: string;
    thumbnailUrl: string;
    width: number;
    height: number;
}

/**
 * Extract YouTube video ID from various URL formats
 * Supports:
 * - youtube.com/watch?v=VIDEO_ID
 * - youtu.be/VIDEO_ID
 * - youtube.com/embed/VIDEO_ID
 * - youtube.com/shorts/VIDEO_ID
 * - m.youtube.com/watch?v=VIDEO_ID
 */
export function extractVideoId(url: string): string | null {
    if (!url) return null;

    // Remove whitespace
    url = url.trim();

    // Pattern 1: youtube.com/watch?v=VIDEO_ID
    let match = url.match(/(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/);
    if (match) return match[1];

    // Pattern 2: youtu.be/VIDEO_ID
    match = url.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (match) return match[1];

    // Pattern 3: youtube.com/embed/VIDEO_ID
    match = url.match(/(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (match) return match[1];

    // Pattern 4: youtube.com/shorts/VIDEO_ID
    match = url.match(/(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
    if (match) return match[1];

    // Pattern 5: m.youtube.com/watch?v=VIDEO_ID
    match = url.match(/(?:m\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/);
    if (match) return match[1];

    return null;
}

/**
 * Validate if URL is a YouTube link
 */
export function isYouTubeUrl(url: string): boolean {
    return extractVideoId(url) !== null;
}

/**
 * Fetch video metadata from YouTube oEmbed API
 * @param videoUrl - Full YouTube URL
 * @returns Video metadata including title, author, thumbnail
 */
export async function getVideoMetadata(videoUrl: string): Promise<YouTubeVideoMetadata | null> {
    try {
        const videoId = extractVideoId(videoUrl);
        if (!videoId) {
            throw new Error('Invalid YouTube URL');
        }

        // Use YouTube oEmbed API (no API key needed!)
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`;

        const response = await fetch(oembedUrl);

        if (!response.ok) {
            throw new Error('Failed to fetch video metadata');
        }

        const data = await response.json();

        return {
            videoId,
            title: data.title || 'Untitled Video',
            authorName: data.author_name || 'Unknown Channel',
            thumbnailUrl: data.thumbnail_url || getThumbnailUrl(videoId),
            width: data.width || 1280,
            height: data.height || 720,
        };
    } catch (error) {
        console.error('Error fetching YouTube metadata:', error);

        // Fallback: return basic data with video ID
        const videoId = extractVideoId(videoUrl);
        if (videoId) {
            return {
                videoId,
                title: 'YouTube Video',
                authorName: 'YouTube',
                thumbnailUrl: getThumbnailUrl(videoId),
                width: 1280,
                height: 720,
            };
        }

        return null;
    }
}

/**
 * Generate YouTube thumbnail URL
 * @param videoId - YouTube video ID
 * @param quality - Thumbnail quality (default: maxresdefault)
 * @returns Thumbnail URL
 */
export function getThumbnailUrl(
    videoId: string,
    quality: 'maxresdefault' | 'hqdefault' | 'mqdefault' | 'sddefault' = 'maxresdefault'
): string {
    return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}

/**
 * Generate YouTube embed URL for iframe player
 * @param videoId - YouTube video ID
 * @param autoplay - Auto-play video (default: false)
 * @returns Embed URL
 */
export function getEmbedUrl(videoId: string, autoplay: boolean = false): string {
    const params = new URLSearchParams({
        rel: '0', // Don't show related videos
        modestbranding: '1', // Minimal YouTube branding
        playsinline: '1', // Play inline on iOS
        fs: '1', // Enable fullscreen button
        // Note: Origin parameter removed - it must exactly match the page origin
        // which is hard to predict in dev environments and causes Error 153
    });

    if (autoplay) {
        params.append('autoplay', '1');
        params.append('mute', '1'); // Mute is required for autoplay
    }

    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

/**
 * Generate standard YouTube watch URL
 * @param videoId - YouTube video ID
 * @returns Watch URL
 */
export function getWatchUrl(videoId: string): string {
    return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Format duration from seconds to MM:SS or HH:MM:SS
 * @param seconds - Duration in seconds
 * @returns Formatted duration string
 */
export function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
