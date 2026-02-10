// Document Viewer Component
// Full-screen viewer for images and PDFs with zoom, pan, and download

import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { getPdfHtml } from '../utils/pdfHtml';

interface DocumentViewerProps {
    visible: boolean;
    onClose: () => void;
    documentUrl: string;
    documentName: string;
    documentType: string;
}

const { width, height } = Dimensions.get('window');

const DocumentViewer: React.FC<DocumentViewerProps> = ({
    visible,
    onClose,
    documentUrl,
    documentName,
    documentType,
}) => {
    const [imageLoading, setImageLoading] = useState(true);
    const [webViewLoading, setWebViewLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);

    const isImage = documentType.includes('image');
    const isPDF = documentType.includes('pdf') || documentUrl.toLowerCase().endsWith('.pdf') || documentUrl.toLowerCase().includes('.pdf');

    const handleSaveToGallery = async () => {
        if (!isImage) {
            Alert.alert('Not Supported', 'Only images can be saved to gallery');
            return;
        }

        try {
            setDownloading(true);

            // Request permission
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Please allow access to save images');
                return;
            }

            // Download image to local file system
            const fs = FileSystem as any;
            const dir = fs.documentDirectory || fs.cacheDirectory;
            const fileUri = `${dir}${documentName}`;
            const downloadResult = await FileSystem.downloadAsync(documentUrl, fileUri);

            // Save to media library
            await MediaLibrary.createAssetAsync(downloadResult.uri);

            Alert.alert(
                '✅ Saved to Gallery',
                `"${documentName}" has been saved to your Photos.`
            );
        } catch (error) {
            console.error('Save error:', error);
            Alert.alert('Error', 'Failed to save image. Please try again.');
        } finally {
            setDownloading(false);
        }
    };

    const handleOpenInBrowser = async () => {
        try {
            const { Linking } = await import('react-native');
            await Linking.openURL(documentUrl);
        } catch (error) {
            console.error('Open error:', error);
            Alert.alert('Error', 'Failed to open document');
        }
    };

    return (
        <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={onClose}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Ionicons name="close" size={28} color="#FFF" />
                    </TouchableOpacity>
                    <View style={styles.headerInfo}>
                        <Text style={styles.headerTitle} numberOfLines={1}>
                            {documentName}
                        </Text>
                        <Text style={styles.headerSubtitle}>
                            {isImage ? 'Image' : isPDF ? 'PDF Document' : 'Document'}
                        </Text>
                    </View>
                    <View style={styles.headerActions}>
                        {isImage && (
                            <TouchableOpacity
                                style={[styles.headerButton, downloading && styles.headerButtonDisabled]}
                                onPress={handleSaveToGallery}
                                disabled={downloading}
                            >
                                {downloading ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <Ionicons name="download" size={22} color="#FFF" />
                                )}
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={handleOpenInBrowser}
                        >
                            <Ionicons name="open-outline" size={22} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {isImage ? (
                        <ScrollView
                            contentContainerStyle={styles.imageContainer}
                            maximumZoomScale={3}
                            minimumZoomScale={1}
                            showsVerticalScrollIndicator={false}
                            showsHorizontalScrollIndicator={false}
                        >
                            {imageLoading && (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color="#4F46E5" />
                                    <Text style={styles.loadingText}>Loading image...</Text>
                                </View>
                            )}
                            <Image
                                source={{ uri: documentUrl }}
                                style={styles.image}
                                resizeMode="contain"
                                onLoadStart={() => setImageLoading(true)}
                                onLoadEnd={() => setImageLoading(false)}
                                onError={() => setImageLoading(false)}
                            />
                        </ScrollView>
                    ) : isPDF ? (
                        <View style={styles.webViewContainer}>
                            {webViewLoading && (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color="#4F46E5" />
                                    <Text style={styles.loadingText}>Loading PDF...</Text>
                                </View>
                            )}
                            {Platform.OS === 'web' ? (
                                <iframe
                                    src={documentUrl}
                                    style={styles.iframe as any}
                                    title="PDF Viewer"
                                />
                            ) : (
                                <WebView
                                    source={{ html: getPdfHtml(documentUrl) }}
                                    style={styles.webView}
                                    originWhitelist={['*']}
                                    onLoadStart={() => setWebViewLoading(true)}
                                    onLoadEnd={() => setWebViewLoading(false)}
                                    onError={() => setWebViewLoading(false)}
                                />
                            )}
                        </View>
                    ) : (
                        <View style={styles.unsupportedContainer}>
                            <Ionicons name="document-text-outline" size={80} color="#94A3B8" />
                            <Text style={styles.unsupportedTitle}>Preview Not Available</Text>
                            <Text style={styles.unsupportedSubtitle}>
                                Open this document in your browser to view it
                            </Text>
                            <TouchableOpacity
                                style={styles.openBrowserButton}
                                onPress={handleOpenInBrowser}
                            >
                                <Ionicons name="open" size={20} color="#FFF" />
                                <Text style={styles.openBrowserButtonText}>Open in Browser</Text>
                            </TouchableOpacity>
                        </View>
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
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
        paddingTop: 0, // Removed extra padding
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
    },
    closeButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerInfo: {
        flex: 1,
        marginHorizontal: 12,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
        marginBottom: 2,
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#94A3B8',
    },
    headerActions: {
        flexDirection: 'row',
        gap: 8,
    },
    headerButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(79, 70, 229, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerButtonDisabled: {
        backgroundColor: 'rgba(79, 70, 229, 0.5)',
    },
    content: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    imageContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: height - 100,
    },
    image: {
        width: width,
        height: height - 100,
    },
    webViewContainer: {
        flex: 1,
    },
    webView: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    iframe: {
        width: '100%',
        height: '100%',
        borderWidth: 0,
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0F172A',
        zIndex: 10,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#94A3B8',
    },
    unsupportedContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    unsupportedTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFF',
        marginTop: 16,
        marginBottom: 8,
    },
    unsupportedSubtitle: {
        fontSize: 14,
        color: '#94A3B8',
        textAlign: 'center',
        marginBottom: 24,
    },
    openBrowserButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#4F46E5',
        borderRadius: 12,
        gap: 8,
    },
    openBrowserButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFF',
    },

});

export default DocumentViewer;
