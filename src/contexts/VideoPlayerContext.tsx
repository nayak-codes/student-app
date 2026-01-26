import React, { createContext, useCallback, useContext, useState } from 'react';
import { Post } from '../services/postsService';

interface VideoPlayerContextType {
    currentVideo: Post | null;
    isMinimized: boolean;
    isPlaying: boolean;
    playVideo: (video: Post) => void;
    minimizeVideo: () => void;
    expandVideo: () => void;
    closeVideo: () => void;
    togglePlayPause: () => void;
}

const VideoPlayerContext = createContext<VideoPlayerContextType | undefined>(undefined);

export const VideoPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentVideo, setCurrentVideo] = useState<Post | null>(null);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    const playVideo = useCallback((video: Post) => {
        // If it's a different video, reset state
        // If it's the same video, just ensure it's playing and expanded? 
        // YouTube behavior: Clicking same video usually restarts or resumes.
        // We'll replace it for now.
        setCurrentVideo(video);
        setIsMinimized(false);
        setIsPlaying(true);
    }, []);

    const minimizeVideo = useCallback(() => {
        setIsMinimized(true);
    }, []);

    const expandVideo = useCallback(() => {
        setIsMinimized(false);
    }, []);

    const closeVideo = useCallback(() => {
        setCurrentVideo(null);
        setIsMinimized(false);
        setIsPlaying(false);
    }, []);

    const togglePlayPause = useCallback(() => {
        setIsPlaying(prev => !prev);
    }, []);

    return (
        <VideoPlayerContext.Provider
            value={{
                currentVideo,
                isMinimized,
                isPlaying,
                playVideo,
                minimizeVideo,
                expandVideo,
                closeVideo,
                togglePlayPause
            }}
        >
            {children}
        </VideoPlayerContext.Provider>
    );
};

export const useVideoPlayerContext = () => {
    const context = useContext(VideoPlayerContext);
    if (!context) {
        throw new Error('useVideoPlayerContext must be used within a VideoPlayerProvider');
    }
    return context;
};
