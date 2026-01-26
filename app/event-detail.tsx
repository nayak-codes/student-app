import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Linking,
    Platform,
    ScrollView,
    Share,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useTheme } from '../src/contexts/ThemeContext';
import { EventItem } from '../src/services/eventService';

export default function EventDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { colors, isDark } = useTheme();
    const [event, setEvent] = useState<EventItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

    useEffect(() => {
        if (params.event) {
            try {
                const eventData = JSON.parse(params.event as string);
                setEvent(eventData);
            } catch (error) {
                console.error('Error parsing event data:', error);
            }
        }
        setLoading(false);
    }, [params]);

    // Setup video player if direct link
    const videoSource = event?.videoLink && !event.videoLink.includes('youtube') && !event.videoLink.includes('youtu.be')
        ? event.videoLink
        : null;

    const player = useVideoPlayer(videoSource, player => {
        player.loop = true;
    });

    const getYouTubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const handleShare = async () => {
        if (!event) return;
        try {
            await Share.share({
                message: `Check out this event: ${event.title}\n${event.description}\n\nOrganized by: ${event.organization}`,
                title: event.title,
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const handleOpenLink = () => {
        if (event?.link) {
            Linking.openURL(event.link);
        }
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!event) {
        return (
            <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
                <Text style={[styles.errorText, { color: colors.textSecondary }]}>Event not found</Text>
                <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const InfoCard = ({ icon, label, value }: { icon: any; label: string; value: string }) => (
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
            <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(79, 70, 229, 0.2)' : '#EEF2FF' }]}>
                <Ionicons name={icon} size={20} color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
                <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>{value}</Text>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* Header Actions Overlay */}
            <SafeAreaView style={styles.headerOverlay} edges={['top']}>
                <TouchableOpacity onPress={() => router.back()} style={styles.excludeHeaderButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleShare} style={styles.excludeHeaderButton}>
                    <Ionicons name="share-outline" size={24} color="#FFF" />
                </TouchableOpacity>
            </SafeAreaView>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false} bounces={false}>
                {/* Media Header */}
                <View style={styles.mediaHeader}>
                    {event.videoLink ? (
                        event.videoLink.includes('youtube') || event.videoLink.includes('youtu.be') ? (
                            <View style={styles.videoContainer}>
                                {Platform.OS === 'web' ? (
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        src={`https://www.youtube.com/embed/${getYouTubeId(event.videoLink)}`}
                                        title="Event Video"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        style={styles.iframe as any}
                                    />
                                ) : (
                                    <WebView
                                        style={styles.webview}
                                        javaScriptEnabled={true}
                                        source={{ uri: `https://www.youtube.com/embed/${getYouTubeId(event.videoLink)}` }}
                                    />
                                )}
                            </View>
                        ) : (
                            <View style={styles.videoContainer}>
                                <VideoView
                                    style={styles.video}
                                    player={player}
                                    allowsFullscreen
                                    allowsPictureInPicture
                                />
                            </View>
                        )
                    ) : (
                        <View style={styles.imageContainer}>
                            {/* Blurred Background for Ambiance */}
                            <Image
                                source={{ uri: event.image || 'https://via.placeholder.com/800x450' }}
                                style={styles.backgroundImage}
                                blurRadius={30}
                                resizeMode="cover"
                            />

                            {/* Main Image - Fully Visible */}
                            <Image
                                source={{ uri: event.image || 'https://via.placeholder.com/800x450' }}
                                style={styles.headerImage}
                                resizeMode="contain"
                            />

                            {/* Gradient for seamless transition */}
                            <LinearGradient
                                colors={['transparent', 'rgba(0,0,0,0.9)', '#000']}
                                style={styles.imageOverlay}
                            />
                        </View>
                    )}
                </View>

                {/* Main Content Card */}
                <View style={[styles.mainContent, { backgroundColor: colors.background }]}>

                    {/* Floating Category Chip */}
                    <View style={styles.floatingMeta}>
                        <View style={[styles.categoryChip, { backgroundColor: colors.primary }]}>
                            <Text style={styles.categoryText}>{event.category}</Text>
                        </View>
                        <View style={[styles.orgChip, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                            <Ionicons name="business" size={14} color={colors.text} />
                            <Text style={[styles.orgText, { color: colors.text }]}>{event.organization}</Text>
                        </View>
                    </View>

                    {/* Title */}
                    <Text style={[styles.title, { color: colors.text }]}>{event.title}</Text>

                    {/* Divider */}
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    {/* Quick Info Grid */}
                    <Text style={[styles.sectionHeader, { color: colors.textSecondary, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }]}>Key Details</Text>
                    <View style={styles.gridContainer}>
                        <InfoCard icon="calendar" label="Date" value={event.date} />
                        <InfoCard icon={event.isOnline ? "globe" : "location"} label="Location" value={event.location} />
                        {event.dynamicFields?.teamSize && (
                            <InfoCard icon="people" label="Team Size" value={event.dynamicFields.teamSize} />
                        )}
                        {event.dynamicFields?.prizePool && (
                            <InfoCard icon="trophy" label="Prize Pool" value={event.dynamicFields.prizePool} />
                        )}
                        {event.dynamicFields?.deadline && (
                            <InfoCard icon="timer" label="Deadline" value={event.dynamicFields.deadline} />
                        )}
                        {event.dynamicFields?.entryFee && (
                            <InfoCard icon="cash" label="Entry Fee" value={event.dynamicFields.entryFee} />
                        )}
                    </View>

                    {/* About Section */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionHeader, { color: colors.text }]}>About Event</Text>
                        <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={isDescriptionExpanded ? undefined : 6}>
                            {event.description}
                        </Text>
                        {event.description.length > 200 && (
                            <TouchableOpacity onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}>
                                <Text style={[styles.readMore, { color: colors.primary }]}>
                                    {isDescriptionExpanded ? 'Show Less' : 'Read More...'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Other Details List */}
                    {event.dynamicFields && Object.keys(event.dynamicFields).length > 0 && (() => {
                        const otherFields = Object.entries(event.dynamicFields).filter(([key]) => !['teamSize', 'prizePool', 'deadline', 'entryFee'].includes(key));
                        if (otherFields.length === 0) return null;

                        return (
                            <View style={[styles.section, { paddingBottom: 20 }]}>
                                <Text style={[styles.sectionHeader, { color: colors.text }]}>Additional Info</Text>
                                <View style={[styles.detailsBox, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', padding: 16, borderRadius: 16 }]}>
                                    {otherFields.map(([key, value]) => {
                                        if (typeof value === 'boolean') {
                                            return (
                                                <View key={key} style={[styles.detailRow, { borderBottomColor: isDark ? '#334155' : '#E2E8F0', borderBottomWidth: 1 }]}>
                                                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                                                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                                    </Text>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                        <Ionicons name={value ? "checkmark-circle" : "close-circle"} size={18} color={value ? "#10B981" : "#EF4444"} />
                                                        <Text style={{ color: colors.text, fontWeight: '600' }}>{value ? 'Yes' : 'No'}</Text>
                                                    </View>
                                                </View>
                                            );
                                        }
                                        return (
                                            <View key={key} style={[styles.detailRow, { borderBottomColor: isDark ? '#334155' : '#E2E8F0', borderBottomWidth: 1 }]}>
                                                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                                                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                                </Text>
                                                <Text style={[styles.detailValue, { color: colors.text }]}>{String(value)}</Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>
                        );
                    })()}

                    <View style={{ height: 100 }} />
                </View>
            </ScrollView>

            {/* Bottom Floating Action Bar */}
            <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                {event.link ? (
                    <TouchableOpacity
                        style={[styles.registerButton, { backgroundColor: colors.primary }]}
                        onPress={handleOpenLink}
                    >
                        <Text style={styles.registerButtonText}>Register Now</Text>
                        <View style={styles.btnIconBg}>
                            <Ionicons name="arrow-forward" size={20} color={colors.primary} />
                        </View>
                    </TouchableOpacity>
                ) : (
                    <View style={[styles.registerButton, { backgroundColor: colors.textSecondary, opacity: 0.7 }]}>
                        <Text style={styles.registerButtonText}>No Registration Link</Text>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 18,
        marginBottom: 20,
    },
    backButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    backButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    headerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 10,
        zIndex: 50,
    },
    excludeHeaderButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
    },
    mediaHeader: {
        width: '100%',
        height: 420, // Taller header
        backgroundColor: '#000',
        position: 'relative',
        justifyContent: 'center', // Center image vertically
    },
    headerImage: {
        width: '100%',
        height: '100%',
        zIndex: 2,
    },
    backgroundImage: { // New style for the blurred background
        ...StyleSheet.absoluteFillObject,
        opacity: 0.5,
    },
    videoContainer: {
        width: '100%',
        height: '100%',
        backgroundColor: '#000',
    },
    webview: {
        flex: 1,
    },
    iframe: {
        borderWidth: 0,
    },
    video: {
        width: '100%',
        height: '100%',
    },
    imageContainer: {
        width: '100%',
        height: '100%',
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 150, // Higher gradient for smoother blend
        zIndex: 3,
    },
    gradientOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 100,
    },
    mainContent: {
        flex: 1,
        marginTop: -40,
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
        paddingHorizontal: 24,
        paddingTop: 36,
        paddingBottom: 120, // EXTRA padding for bottom bar
        minHeight: 500,
    },
    floatingMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 24,
    },
    categoryText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    orgChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 24,
    },
    orgText: {
        fontSize: 14,
        fontWeight: '600',
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        lineHeight: 36,
        marginBottom: 24,
        marginTop: 8,
    },
    divider: {
        height: 1,
        width: '100%',
        marginBottom: 28,
        opacity: 0.15,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 14, // Slightly more gap
        marginBottom: 36,
        marginTop: 8,
    },
    infoCard: {
        width: '47%', // Adjusted for gap
        padding: 16,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.08)', // Lighter, more visible
        // No border for clean look
        borderWidth: 0,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconCircle: {
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 11,
        marginBottom: 4,
        opacity: 0.6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        fontWeight: '600',
    },
    infoValue: {
        fontSize: 15,
        fontWeight: '700',
    },
    dynamicSection: {
        marginBottom: 32,
    },
    detailsBox: {
        marginTop: 16,
        padding: 4, // Inner padding visual fix
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 16,
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    detailLabel: {
        fontSize: 15,
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 15,
        fontWeight: '600',
        textAlign: 'right',
        maxWidth: '60%',
    },
    section: {
        marginBottom: 40,
    },
    sectionHeader: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    description: {
        fontSize: 16,
        lineHeight: 28,
        fontWeight: '400',
    },
    readMore: {
        marginTop: 12,
        fontSize: 15,
        fontWeight: '600',
    },
    bottomBar: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        paddingVertical: 0,
        paddingBottom: 0,
        borderTopWidth: 0,
        elevation: 0,
        shadowOpacity: 0,
        backgroundColor: 'transparent',
    },
    registerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        paddingHorizontal: 32,
        borderRadius: 30,
        gap: 12,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 10,
    },
    registerButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700',
    },
    btnIconBg: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

