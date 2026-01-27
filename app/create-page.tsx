import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../src/config/firebase';
import { useTheme } from '../src/contexts/ThemeContext';
import { createPage } from '../src/services/chatService';

export default function CreatePageScreen() {
    const router = useRouter();
    const { colors, isDark } = useTheme();

    const [pageName, setPageName] = useState('');
    const [pageDescription, setPageDescription] = useState('');
    const [pageIcon, setPageIcon] = useState('');
    const [loading, setLoading] = useState(false);

    const handlePickImage = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permissionResult.granted) {
                Alert.alert('Permission Required', 'Please allow access to your photos to set a page icon.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
            });

            if (!result.canceled && result.assets[0]) {
                setPageIcon(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const handleCreatePage = async () => {
        if (!pageName.trim()) {
            Alert.alert('Page Name Required', 'Please enter a name for your page');
            return;
        }

        if (!pageDescription.trim()) {
            Alert.alert('Description Required', 'Please add a description for your page');
            return;
        }

        try {
            setLoading(true);
            const currentUser = auth.currentUser;
            if (!currentUser) {
                Alert.alert('Error', 'You must be logged in to create a page');
                return;
            }

            // TODO: Upload page icon to Firebase Storage if local URI
            // For now, we'll use the URI directly or empty string

            const pageId = await createPage(
                pageName,
                pageDescription,
                pageIcon
            );

            Alert.alert(
                'Success',
                'Page created successfully! Start broadcasting to your audience.',
                [
                    {
                        text: 'OK',
                        onPress: () => router.replace({
                            pathname: '/page-chat',
                            params: {
                                conversationId: pageId,
                                pageName: pageName,
                                pageIcon: pageIcon,
                            }
                        })
                    }
                ]
            );
        } catch (error) {
            console.error('Error creating page:', error);
            Alert.alert('Error', 'Failed to create page. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="close" size={28} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Create Page</Text>
                <View style={{ width: 28 }} />
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Info Banner */}
                    <View style={[styles.banner, { backgroundColor: isDark ? '#2D1B4E' : '#F3E8FF' }]}>
                        <Ionicons name="megaphone" size={24} color="#8B5CF6" />
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.bannerTitle, { color: isDark ? '#E9D5FF' : '#6B21A8' }]}>
                                Broadcast to Your Audience
                            </Text>
                            <Text style={[styles.bannerText, { color: isDark ? '#C4B5FD' : '#7C3AED' }]}>
                                Pages let you broadcast updates to subscribers. Only admins can post.
                            </Text>
                        </View>
                    </View>

                    {/* Page Icon */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Page Icon</Text>
                        <TouchableOpacity
                            style={[styles.iconPicker, { backgroundColor: isDark ? colors.card : '#F8FAFC' }]}
                            onPress={handlePickImage}
                        >
                            {pageIcon ? (
                                <Image source={{ uri: pageIcon }} style={styles.iconImage} />
                            ) : (
                                <View style={styles.iconPlaceholder}>
                                    <Ionicons name="camera-outline" size={32} color={colors.textSecondary} />
                                    <Text style={[styles.iconPlaceholderText, { color: colors.textSecondary }]}>
                                        Add Icon
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Page Name */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Page Name *</Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: isDark ? colors.card : '#F8FAFC',
                                    color: colors.text,
                                    borderColor: colors.border
                                }
                            ]}
                            placeholder="Enter page name"
                            placeholderTextColor={colors.textSecondary}
                            value={pageName}
                            onChangeText={setPageName}
                            maxLength={50}
                        />
                    </View>

                    {/* Page Description */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Description *</Text>
                        <TextInput
                            style={[
                                styles.textArea,
                                {
                                    backgroundColor: isDark ? colors.card : '#F8FAFC',
                                    color: colors.text,
                                    borderColor: colors.border
                                }
                            ]}
                            placeholder="What will you broadcast about?"
                            placeholderTextColor={colors.textSecondary}
                            value={pageDescription}
                            onChangeText={setPageDescription}
                            multiline
                            numberOfLines={4}
                            maxLength={300}
                        />
                        <Text style={[styles.charCount, { color: colors.textSecondary }]}>
                            {pageDescription.length}/300
                        </Text>
                    </View>

                    {/* Features List */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Page Features</Text>

                        <View style={styles.featureItem}>
                            <Ionicons name="megaphone-outline" size={20} color="#8B5CF6" />
                            <Text style={[styles.featureText, { color: colors.text }]}>
                                Broadcast updates to unlimited subscribers
                            </Text>
                        </View>

                        <View style={styles.featureItem}>
                            <Ionicons name="lock-closed-outline" size={20} color="#8B5CF6" />
                            <Text style={[styles.featureText, { color: colors.text }]}>
                                Admin-only posting for quality control
                            </Text>
                        </View>

                        <View style={styles.featureItem}>
                            <Ionicons name="notifications-outline" size={20} color="#8B5CF6" />
                            <Text style={[styles.featureText, { color: colors.text }]}>
                                Subscribers get notified of broadcasts
                            </Text>
                        </View>

                        <View style={styles.featureItem}>
                            <Ionicons name="analytics-outline" size={20} color="#8B5CF6" />
                            <Text style={[styles.featureText, { color: colors.text }]}>
                                Track subscriber count and engagement
                            </Text>
                        </View>
                    </View>

                    {/* Privacy Note */}
                    <View style={[styles.infoBox, { backgroundColor: isDark ? '#1E3A5F' : '#EFF6FF' }]}>
                        <Ionicons name="information-circle" size={20} color="#3B82F6" />
                        <Text style={[styles.infoText, { color: isDark ? '#93C5FD' : '#1E40AF' }]}>
                            Your page will be public and discoverable. Anyone can subscribe to receive broadcasts.
                        </Text>
                    </View>
                </ScrollView>

                {/* Create Button */}
                <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                    <TouchableOpacity
                        style={[
                            styles.createButton,
                            {
                                backgroundColor: '#8B5CF6',
                                opacity: (!pageName.trim() || !pageDescription.trim() || loading) ? 0.5 : 1
                            }
                        ]}
                        onPress={handleCreatePage}
                        disabled={!pageName.trim() || !pageDescription.trim() || loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <>
                                <Ionicons name="megaphone" size={24} color="#FFF" />
                                <Text style={styles.createButtonText}>Create Page</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

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
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    banner: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        gap: 12,
    },
    bannerTitle: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 4,
    },
    bannerText: {
        fontSize: 13,
        lineHeight: 18,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 12,
    },
    iconPicker: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignSelf: 'center',
        overflow: 'hidden',
    },
    iconImage: {
        width: '100%',
        height: '100%',
    },
    iconPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconPlaceholderText: {
        fontSize: 14,
        marginTop: 8,
    },
    input: {
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        borderWidth: 1,
    },
    textArea: {
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        borderWidth: 1,
        minHeight: 100,
        textAlignVertical: 'top',
    },
    charCount: {
        fontSize: 12,
        textAlign: 'right',
        marginTop: 4,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 12,
    },
    featureText: {
        flex: 1,
        fontSize: 14,
    },
    infoBox: {
        flexDirection: 'row',
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    createButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
