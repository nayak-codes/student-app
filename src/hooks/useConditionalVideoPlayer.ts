import { useVideoPlayer } from 'expo-video';
import { useEffect, useRef } from 'react';

/**
 * Conditionally creates a video player only when enabled.
 * Automatically disposes the player when disabled or component unmounts.
 * 
 * @param source - Video source URL
 * @param enabled - Whether the player should be active
 * @returns Video player instance or null
 */
export function useConditionalVideoPlayer(
    source: string | null,
    enabled: boolean
) {
    const playerRef = useRef<any>(null);

    // Only create player when both source and enabled are true
    const shouldCreate = enabled && !!source;

    // Use conditional logic to avoid creating player when valid source not present or disabled
    const player = useVideoPlayer(shouldCreate ? source : null, (player) => {
        if (shouldCreate) {
            player.loop = true;
            playerRef.current = player;
        }
    });

    // Cleanup effect
    useEffect(() => {
        return () => {
            // Dispose player on unmount or when disabled
            if (playerRef.current) {
                try {
                    playerRef.current.pause();
                    // Note: expo-video handles disposal automatically on unmount
                } catch (error) {
                    console.warn('Error cleaning up video player:', error);
                }
                playerRef.current = null;
            }
        };
    }, []);

    // Pause when disabled
    useEffect(() => {
        if (!enabled && playerRef.current) {
            try {
                playerRef.current.pause();
            } catch (error) {
                // Ignore errors during pause
            }
        }
    }, [enabled]);

    // Only return player if it should be created
    return shouldCreate ? player : null;
}
