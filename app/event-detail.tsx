import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    Linking,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import ShareModal from '../src/components/ShareModal';
import { useTheme } from '../src/contexts/ThemeContext';
import { EventItem } from '../src/services/eventService';

const { width } = Dimensions.get('window');

export default function EventDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { colors, isDark } = useTheme();
    const [event, setEvent] = useState<EventItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [shareModalVisible, setShareModalVisible] = useState(false);

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
        setShareModalVisible(true);
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
            <View style={[styles.loadingContainer, { backgroundColor: '#09090B' }]}>
                <ActivityIndicator size="large" color="#6366F1" />
            </View>
        );
    }

    if (!event) {
        return (
            <View style={[styles.errorContainer, { backgroundColor: '#09090B' }]}>
                <Text style={[styles.errorText, { color: '#A1A1AA' }]}>Event not found</Text>
                <TouchableOpacity style={[styles.backButton, { backgroundColor: '#6366F1' }]} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const InfoCard = ({ icon, label, value, highlight = false }: { icon: any; label: string; value: string; highlight?: boolean }) => {
        // Special styling for Prize Pool value (Gold)
        const isPrizePool = label === "Prize Pool";
        const displayValue = value;
        const valueColor = isPrizePool ? '#FFD700' : '#FFF'; // Gold for Prize Pool, White for others

        return (
            <View style={[
                styles.infoCard,
                {
                    backgroundColor: '#1E293B',
                    borderRadius: 16, // Matching gridItem radius roughly
                    padding: 12, // Compact padding
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                    elevation: 2,
                    borderWidth: 0,
                    flexDirection: 'row', // Horizontal Layout
                    alignItems: 'center',
                    gap: 12,
                }
            ]}>
                {/* Left: Icon Circle */}
                <View style={[styles.iconCircle, {
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    width: 36, height: 36, borderRadius: 18
                }]}>
                    <Ionicons name={icon} size={20} color={highlight ? '#818CF8' : '#cbd5e1'} />
                </View>

                {/* Right: Text Column */}
                <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[styles.infoLabel, { color: '#94a3b8', fontSize: 10, letterSpacing: 0.5, marginBottom: 0 }]}>{label}</Text>
                    <Text style={[styles.infoValue, { color: valueColor, fontSize: 14 }]} numberOfLines={1}>{displayValue}</Text>
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: '#09090B' }]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* Share Modal */}
            <ShareModal
                visible={shareModalVisible}
                onClose={() => setShareModalVisible(false)}
                shareType="event"
                shareData={{
                    id: event.id,
                    title: event.title,
                    date: event.date,
                    location: event.location,
                    description: event.description,
                    content: event.title // Fallback
                }}
            />

            {/* 1. SEPARATE HEADER SPACE (No Overlap) */}
            <SafeAreaView style={{ backgroundColor: '#000', zIndex: 50 }} edges={['top']}>
                <View style={styles.headerButtonsRow}>
                    <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
                        {/* No blur needed on black bg, just clean icon */}
                        <View style={styles.simpleNavButton}>
                            <Ionicons name="arrow-back" size={24} color="#FFF" />
                        </View>
                    </TouchableOpacity>

                    {/* CENTER: Category Text (No Box) */}
                    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>{event.category}</Text>
                    </View>

                    <TouchableOpacity onPress={handleShare} activeOpacity={0.8}>
                        <View style={styles.simpleNavButton}>
                            <Ionicons name="share-outline" size={22} color="#FFF" />
                        </View>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                bounces={false}
                contentContainerStyle={{ paddingBottom: 140 }}
            >
                {/* 1. IMMERSIVE HERO SECTION */}
                <View style={styles.heroSection}>
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
                            {/* Blurred Background for ambiance (YouTube Style) */}
                            <Image
                                source={{ uri: event.image || 'https://via.placeholder.com/800x450' }}
                                style={styles.heroImageBlur}
                                blurRadius={50}
                            />
                            {/* Main Image - Contained (Like YouTube Thumbnail) */}
                            <Image
                                source={{ uri: event.image || 'https://via.placeholder.com/800x450' }}
                                style={styles.heroImage}
                                resizeMode="contain"
                            />
                            {/* Cinematic Gradient Overlay */}
                            <LinearGradient
                                colors={['transparent', 'rgba(9,9,11,0.6)', '#09090B']}
                                style={styles.heroGradient}
                                locations={[0, 0.7, 1]}
                            />
                        </View>
                    )}
                </View>

                {/* 2. MAIN CONTENT LAYER */}
                <View style={styles.mainContent}>
                    {/* Title & Status */}
                    <View style={styles.titleRow}>
                        {/* Category removed from here */}
                        {daysLeft && daysLeft !== 'Ended' && (
                            <View style={[styles.statusPill, { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: '#F59E0B' }]}>
                                <Ionicons name="time-outline" size={12} color="#F59E0B" />
                                <Text style={[styles.statusText, { color: '#F59E0B' }]}>{daysLeft}</Text>
                            </View>
                        )}
                    </View>

                    <Text style={styles.eventTitle}>{event.title}</Text>

                    {/* Organization Row */}
                    <View style={styles.orgRow}>
                        <View style={styles.orgIconBg}>
                            <Ionicons name="business" size={16} color="#A1A1AA" />
                        </View>
                        <Text style={styles.orgName}>{event.organization}</Text>
                        <View style={styles.verifiedBadge}>
                            <Ionicons name="checkmark-circle" size={14} color="#6366F1" />
                        </View>
                    </View>

                    {/* Location Link */}
                    <TouchableOpacity
                        style={styles.locationButton}
                        onPress={() => {
                            const query = encodeURIComponent(event.location);
                            Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
                        }}
                    >
                        <Ionicons name="location" size={18} color="#A1A1AA" />
                        <Text style={styles.locationText} numberOfLines={1}>{event.location}</Text>
                        <Ionicons name="chevron-forward" size={16} color="#52525B" />
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* 3. INFO GRID */}
                    <Text style={styles.sectionTitle}>Event Highlights</Text>
                    <View style={styles.gridContainer}>
                        <InfoCard icon="calendar-outline" label="Date" value={event.date} highlight />
                        <InfoCard icon="people-outline" label="Team Size" value={event.dynamicFields?.teamSize || 'Individual'} />
                        <InfoCard
                            icon="trophy-outline"
                            label="Prize Pool"
                            value={event.dynamicFields?.prizePool ? event.dynamicFields.prizePool : 'Goodies'}
                            highlight
                        />
                        <InfoCard
                            icon={event.dynamicFields?.entryFee ? "card-outline" : "ticket-outline"}
                            label="Entry Fee"
                            value={event.dynamicFields?.entryFee ? event.dynamicFields.entryFee : 'Free'}
                        />
                    </View>

                    {/* 4. DESCRIPTION */}
                    <Text style={styles.sectionTitle}>About</Text>
                    <Text style={styles.descriptionText} numberOfLines={isDescriptionExpanded ? undefined : 4}>
                        {event.description}
                    </Text>
                    {event.description.length > 150 && (
                        <TouchableOpacity onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}>
                            <Text style={[styles.readMoreText, { color: colors.primary }]}>
                                {isDescriptionExpanded ? 'Read Less' : 'Read More'}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* 5. ADDITIONAL DETAILS */}
                    {event.dynamicFields && Object.keys(event.dynamicFields).length > 0 && (() => {
                        const shownFields = ['teamSize', 'prizePool', 'entryFee'];
                        const otherFields = Object.entries(event.dynamicFields).filter(([key]) => !shownFields.includes(key));
                        if (otherFields.length === 0) return null;

                        return (
                            <View style={styles.extraDetailsContainer}>
                                <Text style={styles.sectionTitle}>More Info</Text>
                                <View style={styles.detailsBox}>
                                    {otherFields.map(([key, value], index) => (
                                        <View key={key} style={[
                                            styles.detailRow,
                                            index === otherFields.length - 1 && { borderBottomWidth: 0 }
                                        ]}>
                                            <Text style={styles.detailLabel}>
                                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                            </Text>
                                            <Text style={styles.detailValue}>{String(value)}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        );
                    })()}

                </View>
            </ScrollView>

            {/* STICKY FOOTER */}
            <View style={[styles.stickyFooter, { backgroundColor: '#09090B' }]}>
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)', '#09090B']}
                    style={styles.footerGradient}
                    pointerEvents="none"
                />
                <View style={styles.footerContent}>
                    <View style={styles.priceContainer}>
                        <Text style={styles.priceLabel}>Entry via Link</Text>
                        <Text style={styles.priceValue}>
                            {event.dynamicFields?.entryFee ? event.dynamicFields.entryFee : 'Free Registration'}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.registerButton, { backgroundColor: event.link ? colors.primary : '#3f3f46' }]}
                        onPress={handleOpenLink}
                        activeOpacity={0.9}
                        disabled={!event.link}
                    >
                        <Text style={styles.registerBtnText}>{event.link ? 'Register Now' : 'No Link'}</Text>
                        {event.link && <Ionicons name="arrow-forward" size={20} color="#FFF" />}
                    </TouchableOpacity>
                </View>
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
        padding: 24,
    },
    errorText: {
        fontSize: 16,
        marginBottom: 16,
    },
    backButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    backButtonText: {
        color: '#FFF',
        fontWeight: '600',
    },
    headerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        pointerEvents: 'box-none',
    },
    headerButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 0, // Minimal space
        alignItems: 'center', // Ensure vertical centering
        height: 50, // Fixed height for consistency
    },
    simpleNavButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    glassButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)', // Fallback opacity
    },
    content: {
        flex: 1,
    },
    heroSection: {
        height: width * 9 / 16, // YouTube Standard Aspect Ratio (16:9)
        width: '100%',
        backgroundColor: '#000', // Matches app theme
    },
    videoContainer: {
        width: '100%',
        height: '100%',
        backgroundColor: '#000',
    },
    webview: {
        flex: 1,
        opacity: 0.99,
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
        backgroundColor: '#000',
    },
    heroImage: {
        width: '100%',
        height: '100%',
        zIndex: 2,
        backgroundColor: '#000',
    },
    heroImageBlur: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.3,
    },
    heroGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 80, // Reduced gradient height for shorter banner
    },
    mainContent: {
        marginTop: -24, // Pull up to overlap slightly ("move that card up")
        paddingHorizontal: 24,
        paddingTop: 24,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        backgroundColor: '#09090B', // Ensure it covers the image
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
    },
    categoryPill: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 100,
    },
    categoryText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 100,
        borderWidth: 1,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
    },
    eventTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#FFF',
        marginBottom: 12,
        lineHeight: 40,
        letterSpacing: -0.5,
    },
    orgRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    orgIconBg: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    orgName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#E4E4E7', // Zinc-200
        marginRight: 6,
    },
    verifiedBadge: {
        opacity: 0.8,
    },
    locationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 12,
        borderRadius: 12,
        alignSelf: 'flex-start',
        paddingRight: 16,
        marginBottom: 24,
    },
    locationText: {
        color: '#D4D4D8',
        fontSize: 14,
        fontWeight: '500',
        maxWidth: width - 120,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#F4F4F5',
        marginBottom: 16,
        letterSpacing: -0.2,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 32,
    },
    infoCard: {
        width: '48%',
        padding: 16,
        borderRadius: 20,
        gap: 12,
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoValue: {
        fontSize: 15,
        fontWeight: '700',
    },
    descriptionText: {
        fontSize: 15,
        color: '#D4D4D8',
        lineHeight: 24,
    },
    readMoreText: {
        marginTop: 8,
        fontSize: 14,
        fontWeight: '600',
    },
    extraDetailsContainer: {
        marginTop: 32,
    },
    detailsBox: {
        backgroundColor: '#1E293B', // Darker, consistent background
        borderRadius: 16,
        padding: 16, // Increased padding
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.08)',
    },
    detailLabel: {
        color: '#94a3b8',
        fontSize: 14,
        fontWeight: '500',
    },
    detailValue: {
        color: '#F4F4F5',
        fontSize: 14,
        fontWeight: '600',
        maxWidth: '60%',
        textAlign: 'right',
    },
    stickyFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: Platform.OS === 'ios' ? 34 : 24,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.08)',
    },
    footerGradient: {
        position: 'absolute',
        top: -40,
        left: 0,
        right: 0,
        height: 40,
    },
    footerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
    },
    priceContainer: {
        flex: 1,
    },
    priceLabel: {
        color: '#A1A1AA',
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 2,
    },
    priceValue: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
    registerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 100,
        gap: 8,
    },
    registerBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
