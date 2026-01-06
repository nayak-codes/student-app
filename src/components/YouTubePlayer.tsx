// YouTube Video Player Component
// Professional embedded YouTube player with full-screen support

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { WebView } from 'react-native-webview';
import { getEmbedUrl, getWatchUrl } from '../utils/youtubeUtils';

interface YouTubePlayerProps {
    videoId: string;
    visible: boolean;
    onClose: () => void;
    title?: string;
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ videoId, visible, onClose, title }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const embedUrl = getEmbedUrl(videoId, false); // Don't autoplay - let user click play
    const watchUrl = getWatchUrl(videoId);

    console.log('YouTubePlayer - Video ID:', videoId);
    console.log('YouTubePlayer - Embed URL:', embedUrl);

    const handleOpenInYouTube = async () => {
        try {
            const canOpen = await Linking.canOpenURL(watchUrl);
            if (canOpen) {
                await Linking.openURL(watchUrl);
                onClose();
            } else {
                Alert.alert('Error', 'Cannot open YouTube');
            }
        } catch (error) {
            console.error('Error opening YouTube:', error);
            Alert.alert('Error', 'Failed to open YouTube');
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
            transparent={false}
        >
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={28} color="#FFF" />
                    </TouchableOpacity>
                    {title && (
                        <Text style={styles.title} numberOfLines={1}>
                            {title}
                        </Text>
                    )}
                </View>

                {/* Video Player */}
                <View style={styles.videoContainer}>
                    {isLoading && Platform.OS !== 'web' && (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#4F46E5" />
                            <Text style={styles.loadingText}>Loading video...</Text>
                        </View>
                    )}

                    {Platform.OS === 'web' ? (
                        // For web, use native iframe which works better with YouTube
                        <iframe
                            title="YouTube Video Player"
                            src={embedUrl}
                            style={styles.iframe as any}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            onLoad={() => setIsLoading(false)}
                        />
                    ) : (
                        // For native platforms, use WebView
                        <>
                            {hasError && (
                                <View style={styles.errorContainer}>
                                    <Ionicons name="alert-circle" size={48} color="#EF4444" />
                                    <Text style={styles.errorTitle}>Video Cannot Play</Text>
                                    <Text style={styles.errorMessage}>
                                        This video cannot be embedded in the app
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.youtubeButton}
                                        onPress={handleOpenInYouTube}
                                    >
                                        <Ionicons name="logo-youtube" size={24} color="#FFF" />
                                        <Text style={styles.youtubeButtonText}>Open in YouTube</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {!hasError && (
                                <WebView
                                    source={{ uri: embedUrl }}
                                    style={styles.webview}
                                    originWhitelist={['*']}
                                    allowsFullscreenVideo={true}
                                    allowsInlineMediaPlayback={true}
                                    mediaPlaybackRequiresUserAction={false}
                                    javaScriptEnabled={true}
                                    domStorageEnabled={true}
                                    startInLoadingState={true}
                                    scalesPageToFit={true}
                                    mixedContentMode="always"
                                    userAgent="Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36"
                                    onLoadStart={() => {
                                        console.log('WebView loading started:', embedUrl);
                                        setIsLoading(true);
                                        setHasError(false);
                                    }}
                                    onLoadEnd={() => {
                                        console.log('WebView loading ended');
                                        setIsLoading(false);
                                    }}
                                    onError={(syntheticEvent) => {
                                        const { nativeEvent } = syntheticEvent;
                                        console.error('WebView error:', nativeEvent);
                                        setIsLoading(false);
                                        setHasError(true);
                                    }}
                                    onHttpError={(syntheticEvent) => {
                                        const { nativeEvent } = syntheticEvent;
                                        console.error('WebView HTTP error:', nativeEvent);
                                        setHasError(true);
                                        setIsLoading(false);
                                    }}
                                />
                            )}
                        </>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
    },
    closeButton: {
        padding: 8,
        marginRight: 12,
    },
    title: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
    videoContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    webview: {
        flex: 1,
        backgroundColor: '#000',
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
        zIndex: 1,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#FFF',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#000',
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFF',
        marginTop: 16,
        marginBottom: 8,
    },
    errorMessage: {
        fontSize: 14,
        color: '#94A3B8',
        textAlign: 'center',
        marginBottom: 24,
    },
    youtubeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#FF0000',
        borderRadius: 8,
        gap: 8,
    },
    youtubeButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
    iframe: {
        width: '100%',
        height: '100%',
        border: 'none',
        backgroundColor: '#000',
    } as any, // TypeScript workaround for web-specific styles
});

export default YouTubePlayer;
