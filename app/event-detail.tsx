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
    }, [params.event]);

    // Setup video player if direct link
    const videoSource = event?.videoLink && !event.videoLink.includes('youtube') && !event.videoLink.includes('youtu.be')
        ? event.videoLink
        : null;

    const player = useVideoPlayer(videoSource, player => {
        player.loop = true;
    });

    // Fix YouTube ID extraction to support Shorts
    const getYouTubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
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

    const getDaysLeft = () => {
        if (!event?.date) return null;
        try {
            const currentYear = new Date().getFullYear();
            const dateStr = `${event.date} ${currentYear}`;
            const eventDate = new Date(dateStr);
            if (isNaN(eventDate.getTime())) return null;

            const now = new Date();
            const diffTime = eventDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays < 0) return 'Ended';
            if (diffDays === 0) return 'Today';
            return `${diffDays} Days`;
        } catch (e) {
            return null;
        }
    };

    const daysLeft = getDaysLeft();

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
        <View style={[
            styles.infoCard,
            {
                backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FFF',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                borderWidth: 1
            }
        ]}>
            <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.1)' : '#EEF2FF' }]}>
                <Ionicons name={icon} size={18} color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
                <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={2}>{value}</Text>
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
                                        domStorageEnabled={true}
                                        source={{ uri: `https://www.youtube.com/embed/${getYouTubeId(event.videoLink)}?rel=0&autoplay=0&showinfo=0&controls=1` }}
                                        userAgent="Mozilla/5.0 (Linux; Android 10; Android SDK built for x86) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36"
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
                <View style={[styles.mainContent, { backgroundColor: colors.background, paddingBottom: 150 }]}>

                    {/* 1. TITLE & LOCATION SECTION */}
                    <View style={styles.headerSection}>
                        <Text style={[styles.title, { color: colors.text }]}>{event.title}</Text>

                        <TouchableOpacity
                            style={styles.locationRow}
                            onPress={() => {
                                const query = encodeURIComponent(event.location);
                                Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
                            }}
                        >
                            <View style={[styles.locationIconBox, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF' }]}>
                                <Ionicons name="location" size={18} color="#6366F1" />
                            </View>
                            <Text style={[styles.locationText, { color: colors.textSecondary }]}>
                                {event.location}
                            </Text>
                            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} style={{ opacity: 0.5 }} />
                        </TouchableOpacity>
                    </View>

                    {/* 2. TAGS: Category | Org | Days Left */}
                    <View style={styles.metaTagsRow}>
                        <View style={[styles.categoryChip, { backgroundColor: colors.primary }]}>
                            <Text style={styles.categoryText}>{event.category}</Text>
                        </View>
                        <View style={[styles.orgChip, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9' }]}>
                            <Ionicons name="business" size={14} color={colors.textSecondary} />
                            <Text style={[styles.orgText, { color: colors.text }]}>{event.organization}</Text>
                        </View>
                        {/* Days Left Chip */}
                        {daysLeft && daysLeft !== 'Ended' && (
                            <View style={[styles.orgChip, { borderColor: '#F59E0B', backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                                <Ionicons name="hourglass-outline" size={14} color="#F59E0B" />
                                <Text style={[styles.orgText, { color: '#F59E0B' }]}>{daysLeft} Left</Text>
                            </View>
                        )}
                    </View>

                    {/* Divider */}
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    {/* 3. IMPORTANT INFO GRID */}
                    <Text style={[styles.sectionHeaderLabel, { color: colors.textSecondary }]}>EVENT DETAILS</Text>
                    <View style={styles.gridContainer}>
                        <InfoCard icon="calendar-outline" label="Date" value={event.date} />

                        {event.dynamicFields?.teamSize && (
                            <InfoCard icon="people-outline" label="Team Size" value={event.dynamicFields.teamSize} />
                        )}
                        {event.dynamicFields?.prizePool ? (
                            <InfoCard icon="trophy-outline" label="Prize Pool" value={event.dynamicFields.prizePool} />
                        ) : (
                            <InfoCard icon="gift-outline" label="Prize" value="Goodies" />
                        )}
                        {event.dynamicFields?.entryFee ? (
                            <InfoCard icon="cash-outline" label="Entry Fee" value={event.dynamicFields.entryFee} />
                        ) : (
                            <InfoCard icon="wallet-outline" label="Entry Fee" value="Free" />
                        )}
                        {event.dynamicFields?.deadline && (
                            <InfoCard icon="timer-outline" label="Deadline" value={event.dynamicFields.deadline} />
                        )}
                        <InfoCard icon={event.isOnline ? "globe-outline" : "business-outline"} label="Mode" value={event.isOnline ? 'Online' : 'Offline'} />
                        {/* Extra fields if available */}
                        {event.dynamicFields?.eligibility && (
                            <InfoCard icon="school-outline" label="Eligibility" value={String(event.dynamicFields.eligibility)} />
                        )}
                        {event.dynamicFields?.type && (
                            <InfoCard icon="layers-outline" label="Type" value={event.dynamicFields.type} />
                        )}
                    </View>

                    {/* 4. ABOUT SECTION */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionHeader, { color: colors.text }]}>About Event</Text>
                        <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={isDescriptionExpanded ? undefined : 6}>
                            {event.description}
                        </Text>
                        {event.description.length > 200 && (
                            <TouchableOpacity onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}>
                                <Text style={[styles.readMore, { color: colors.primary }]}>
                                    {isDescriptionExpanded ? 'Show Less' : 'Read More'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Other Details List */}
                    {event.dynamicFields && Object.keys(event.dynamicFields).length > 0 && (() => {
                        const shownFields = ['teamSize', 'prizePool', 'deadline', 'entryFee', 'eligibility', 'type'];
                        const otherFields = Object.entries(event.dynamicFields).filter(([key]) => !shownFields.includes(key));
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
                </View>
            </ScrollView>

            {/* Bottom Floating Action Bar */}
            <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border, display: event.link ? 'flex' : 'none' }]}>
                {event.link && (
                    <TouchableOpacity
                        style={[styles.registerButton, { backgroundColor: colors.primary }]}
                        onPress={handleOpenLink}
                    >
                        <Text style={styles.registerButtonText}>Register Now</Text>
                        <View style={styles.btnIconBg}>
                            <Ionicons name="arrow-forward" size={20} color={colors.primary} />
                        </View>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

// STYLES: Black Theme & Professional Layout
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000', // Deepest Black
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#000',
    },
    errorText: {
        fontSize: 18,
        marginBottom: 20,
        color: '#FFF',
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
        backgroundColor: 'rgba(0,0,0,0.5)', // Darker overlay for better contrast
        justifyContent: 'center',
        alignItems: 'center',
        backdropFilter: 'blur(10px)',
    },
    content: {
        flex: 1,
    },
    mediaHeader: {
        width: '100%',
        height: 380,
        backgroundColor: '#000',
        position: 'relative',
        justifyContent: 'center',
    },
    headerImage: {
        width: '100%',
        height: '100%',
        zIndex: 2,
    },
    backgroundImage: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.6,
    },
    videoContainer: {
        width: '100%',
        height: '100%',
        backgroundColor: '#000',
        justifyContent: 'center',
    },
    webview: {
        flex: 1,
        backgroundColor: '#000',
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
        backgroundColor: '#18181B', // Zinc-900 fallback
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 150,
        zIndex: 3,
    },
    mainContent: {
        flex: 1,
        marginTop: -32,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingHorizontal: 24,
        paddingTop: 32,
        paddingBottom: 120,
        minHeight: 600,
        backgroundColor: '#000000', // Ensure pure black
    },
    // HEADER SECTION
    headerSection: {
        marginBottom: 20,
    },
    title: {
        fontSize: 30, // Impactful title
        fontWeight: '800',
        lineHeight: 38,
        marginBottom: 8,
        letterSpacing: -0.5,
        color: '#FFFFFF',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    locationIconBox: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(99, 102, 241, 0.2)', // Indigo tint
    },
    locationText: {
        fontSize: 15,
        fontWeight: '500',
        flex: 1,
        lineHeight: 22,
        color: '#A1A1AA', // Zinc-400
    },
    metaTagsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 24,
    },
    categoryChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    categoryText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    orgChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderColor: 'rgba(255,255,255,0.1)',
    },
    orgText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#E4E4E7',
    },
    divider: {
        height: 1,
        width: '100%',
        marginBottom: 24,
        opacity: 0.1,
    },
    sectionHeaderLabel: {
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 16,
        opacity: 0.6,
        textTransform: 'uppercase',
        letterSpacing: 1,
        color: '#71717A', // Zinc-500
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 36,
    },
    infoCard: {
        width: '48%',
        padding: 16,
        borderRadius: 24, // Softer corners
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        gap: 12,
        minHeight: 110,
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(79, 70, 229, 0.15)', // Subtle accent bg
        marginBottom: 2,
    },
    infoContent: {
        width: '100%',
    },
    infoLabel: {
        fontSize: 11,
        marginBottom: 3,
        opacity: 0.6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        fontWeight: '700',
        color: '#A1A1AA',
    },
    infoValue: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFF',
    },
    section: {
        marginBottom: 36,
    },
    sectionHeader: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 12,
        letterSpacing: -0.3,
        color: '#FFF',
    },
    description: {
        fontSize: 16,
        lineHeight: 26,
        fontWeight: '400',
        opacity: 0.9,
    },
    readMore: {
        marginTop: 8,
        fontSize: 15,
        fontWeight: '600',
    },
    detailsBox: {
        marginTop: 12,
        padding: 8,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 14,
        alignItems: 'center',
        paddingHorizontal: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    detailLabel: {
        fontSize: 15,
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 15,
        fontWeight: '600',
        textAlign: 'right',
        maxWidth: '65%',
    },
    bottomBar: {
        position: 'absolute',
        bottom: 24,
        left: 20,
        right: 20,
        backgroundColor: 'transparent',
    },
    registerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 30, // Pill shape
        gap: 12,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    registerButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700',
    },
    btnIconBg: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
