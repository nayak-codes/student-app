import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    Platform,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useTheme } from '../../src/contexts/ThemeContext';
import { getLocalDocumentPath } from '../../src/services/downloadService';

const PdfViewerScreen = () => {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const params = useLocalSearchParams();

    const resourceId = params.resourceId as string;
    const title = params.title as string;
    const remoteUrl = params.url as string;
    const isOffline = params.isOffline === 'true';

    const [src, setSrc] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Track if we've auto-opened to prevent loop on back press
    const hasAutoOpened = React.useRef(false);

    useEffect(() => {
        const prepareDocument = async () => {
            try {
                setLoading(true);
                let uri = remoteUrl;

                if (isOffline) {
                    const localPath = await getLocalDocumentPath(resourceId);
                    if (localPath) {
                        uri = localPath;

                        // Android requires content URI for external intent
                        if (Platform.OS === 'android') {
                            try {
                                const contentUri = await FileSystem.getContentUriAsync(localPath);
                                uri = contentUri;
                            } catch (e) {
                                console.log('Could not get content URI, using file URI', e);
                            }
                        }
                    } else {
                        console.warn('Local file not found, falling back to remote URL');
                    }
                }

                setSrc(uri);
            } catch (err) {
                console.error('Error preparing document:', err);
                setError('Failed to load document');
            } finally {
                setLoading(false);
            }
        };

        prepareDocument();
    }, [resourceId, remoteUrl, isOffline]);

    // Auto-open on Android once src is ready
    useEffect(() => {
        if (Platform.OS === 'android' && src && !hasAutoOpened.current) {
            hasAutoOpened.current = true;
            openInAndroid();
        }
    }, [src]);

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out this document: ${title}`,
                url: remoteUrl,
                title: title
            });
        } catch (error: any) {
            console.error('Error sharing:', error.message);
        }
    };

    const openInAndroid = async () => {
        if (!src) return;
        try {
            await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                data: src,
                flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
                type: 'application/pdf',
            });
        } catch (e) {
            console.error('Failed to open intent:', e);
            Alert.alert('Error', 'No app found to open PDF');
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                    {title || 'Document Viewer'}
                </Text>
                <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
                    <Ionicons name="share-outline" size={24} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.contentContainer}>
                {loading && (
                    <View style={[styles.center, { backgroundColor: colors.background }]}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                )}

                {/* iOS: WebView */}
                {Platform.OS === 'ios' && src && (
                    <WebView
                        source={{ uri: src }}
                        originWhitelist={['*']}
                        style={{ flex: 1 }}
                        startInLoadingState={true}
                        renderLoading={() => (
                            <View style={[styles.center, { backgroundColor: colors.background }]}>
                                <ActivityIndicator size="large" color={colors.primary} />
                            </View>
                        )}
                        onError={() => setError('Failed to load PDF in WebView')}
                    />
                )}

                {/* Android: Intent Launcher */}
                {Platform.OS === 'android' && src && (
                    <View style={[styles.center, { backgroundColor: colors.background }]}>
                        <Ionicons name="document-text-outline" size={64} color={colors.primary} />
                        <Text style={[styles.infoText, { color: colors.text }]}>
                            Opened in external viewer
                        </Text>
                        <Text style={[styles.infoSubText, { color: colors.textSecondary }]}>
                            Tap below if it didn't open automatically
                        </Text>
                        <TouchableOpacity
                            style={[styles.openButton, { backgroundColor: colors.primary }]}
                            onPress={openInAndroid}
                        >
                            <Text style={styles.openButtonText}>Re-open PDF</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Web or Fallback */}
                {Platform.OS === 'web' && (
                    <View style={[styles.center, { backgroundColor: colors.background }]}>
                        <Text style={{ color: colors.text }}>PDF viewing not supported on web directly.</Text>
                        <TouchableOpacity
                            style={[styles.openButton, { backgroundColor: colors.primary, marginTop: 20 }]}
                            onPress={() => Linking.openURL(remoteUrl)}
                        >
                            <Text style={styles.openButtonText}>Download / Open</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {error && (
                    <View style={[styles.center, { backgroundColor: colors.background }]}>
                        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                        <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
                        <TouchableOpacity
                            style={[styles.retryButton, { backgroundColor: colors.primary }]}
                            onPress={() => setLoading(true)}
                        >
                            <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        zIndex: 10,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '700',
        marginHorizontal: 16,
        textAlign: 'center',
    },
    backButton: {
        padding: 8,
    },
    shareButton: {
        padding: 8,
    },
    contentContainer: {
        flex: 1,
        position: 'relative',
    },
    center: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20,
        padding: 20,
    },
    infoText: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8,
    },
    infoSubText: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
    },
    openButton: {
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 25,
        elevation: 2,
    },
    openButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
    errorText: {
        fontSize: 16,
        marginTop: 12,
        marginBottom: 20,
    },
    retryButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryText: {
        color: '#FFF',
        fontWeight: '600',
    },
});

export default PdfViewerScreen;
