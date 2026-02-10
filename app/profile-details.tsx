import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getUserProfile } from '../src/services/authService';

export default function ProfileDetailsScreen() {
    const router = useRouter();
    const { userId } = useLocalSearchParams();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!userId) return;
            try {
                const userDoc = await getUserProfile(userId as string);
                console.log('Fetched Profile Data:', JSON.stringify(userDoc, null, 2));
                if (userDoc) {
                    setProfile(userDoc);
                }
            } catch (error) {
                console.error('Error fetching profile details:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [userId]);

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                </View>
            </SafeAreaView>
        );
    }

    if (!profile) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <Text style={{ color: '#64748B' }}>User profile not found.</Text>
                    <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
                        <Text style={{ color: '#4F46E5', fontWeight: '600' }}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const formatDate = (date: any) => {
        if (!date) return 'Unknown';
        // Handle Firestore Timestamp or Date
        const d = date.toDate ? date.toDate() : new Date(date);
        return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{profile.displayName || profile.name}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Hero / ID Card */}
                <View style={styles.heroCard}>
                    <View style={styles.heroHeader}>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                            <Text style={styles.heroName}>{profile.displayName || profile.name}</Text>
                            <Text style={styles.heroHandle}>@{profile.username || 'user'}</Text>
                        </View>
                        <View style={styles.roleBadge}>
                            <Text style={styles.roleText}>{profile.role || 'Student'}</Text>
                        </View>
                    </View>

                    {profile.headline && (
                        <Text style={styles.heroHeadline}>{profile.headline}</Text>
                    )}

                    {profile.studentStatus && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
                            <Ionicons name="school" size={14} color="#8B5CF6" />
                            <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '600' }}>
                                {profile.studentStatus}
                            </Text>
                        </View>
                    )}

                    <View style={styles.heroDivider} />

                    <View style={{ gap: 8 }}>
                        <View style={styles.heroRow}>
                            <Ionicons name="calendar-outline" size={16} color="#64748B" />
                            <Text style={styles.heroInfo}>Joined {formatDate(profile.createdAt || new Date())}</Text>
                        </View>

                        {(profile.location?.city || profile.location?.state || profile.location?.country) && (
                            <View style={styles.heroRow}>
                                <Ionicons name="location-outline" size={16} color="#64748B" />
                                <Text style={styles.heroInfo}>
                                    {[profile.location?.city, profile.location?.state, profile.location?.country].filter(Boolean).join(', ')}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* About Section */}
                <View style={styles.contentCard}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="person-outline" size={20} color="#4F46E5" />
                        <Text style={styles.cardTitle}>About</Text>
                    </View>
                    <View style={styles.infoContainer}>
                        <Text style={styles.aboutText}>{profile.about || 'No bio available.'}</Text>
                    </View>
                </View>

                {/* Skills Section */}
                {(profile.skills?.technical?.length > 0 || profile.skills?.softSkills?.length > 0 || profile.skills?.languages?.length > 0) && (
                    <View style={styles.contentCard}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="flash-outline" size={20} color="#4F46E5" />
                            <Text style={styles.cardTitle}>Skills</Text>
                        </View>

                        {profile.skills?.technical?.length > 0 && (
                            <View style={styles.skillGroup}>
                                <Text style={styles.skillLabel}>Technical</Text>
                                <View style={styles.skillCloud}>
                                    {profile.skills.technical.map((skill: string, index: number) => (
                                        <View key={`tech-${index}`} style={styles.skillChip}>
                                            <Text style={styles.skillText}>{skill}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {profile.skills?.softSkills?.length > 0 && (
                            <View style={styles.skillGroup}>
                                <Text style={styles.skillLabel}>Soft Skills</Text>
                                <View style={styles.skillCloud}>
                                    {profile.skills.softSkills.map((skill: string, index: number) => (
                                        <View key={`soft-${index}`} style={[styles.skillChip, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }]}>
                                            <Text style={[styles.skillText, { color: '#0369A1' }]}>{skill}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {profile.skills?.languages?.length > 0 && (
                            <View style={styles.skillGroup}>
                                <Text style={styles.skillLabel}>Languages</Text>
                                <View style={styles.skillCloud}>
                                    {profile.skills.languages.map((skill: string, index: number) => (
                                        <View key={`lang-${index}`} style={[styles.skillChip, { backgroundColor: '#FDF2F8', borderColor: '#FBCFE8' }]}>
                                            <Text style={[styles.skillText, { color: '#BE185D' }]}>{skill}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}
                    </View>
                )}

                {/* Education Section */}
                {profile.education && profile.education.length > 0 && (
                    <View style={styles.contentCard}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="school-outline" size={20} color="#4F46E5" />
                            <Text style={styles.cardTitle}>Education</Text>
                        </View>
                        {profile.education.map((edu: any, index: number) => (
                            <View key={index} style={styles.eduItem}>
                                <View style={styles.eduTimeline}>
                                    <View style={styles.eduDot} />
                                    {index !== profile.education.length - 1 && <View style={styles.eduLine} />}
                                </View>
                                <View style={styles.eduContent}>
                                    <Text style={styles.eduSchool}>{edu.school || edu.institution}</Text>
                                    <Text style={styles.eduDegree}>{edu.degree} {edu.fieldOfStudy ? `• ${edu.fieldOfStudy}` : ''}</Text>
                                    <Text style={styles.eduDate}>
                                        {edu.startDate} - {edu.endDate || 'Present'}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Contact Section */}
                <View style={styles.contentCard}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="link-outline" size={20} color="#4F46E5" />
                        <Text style={styles.cardTitle}>Contact & Socials</Text>
                    </View>

                    {profile.email && (
                        <TouchableOpacity style={styles.contactRow}>
                            <View style={styles.contactIcon}>
                                <Ionicons name="mail" size={18} color="#64748B" />
                            </View>
                            <Text style={styles.contactText}>{profile.email}</Text>
                        </TouchableOpacity>
                    )}

                    {profile.website && (
                        <TouchableOpacity style={styles.contactRow}>
                            <View style={styles.contactIcon}>
                                <Ionicons name="globe" size={18} color="#64748B" />
                            </View>
                            <Text style={styles.contactText}>{profile.website}</Text>
                        </TouchableOpacity>
                    )}

                    {!profile.email && !profile.website && (
                        <Text style={{ color: '#94A3B8', fontStyle: 'italic', marginLeft: 4 }}>No contact info shared.</Text>
                    )}
                </View>


            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC', // Light gray background for contrast
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 0,
        paddingBottom: 6,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700', // Bolder title
        color: '#0F172A',
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    // Hero Card
    heroCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    heroHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    heroName: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1E293B',
    },
    heroHandle: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 2,
    },
    roleBadge: {
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    roleText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#4F46E5',
        textTransform: 'uppercase',
    },
    heroDivider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 16,
    },
    heroRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    heroInfo: {
        fontSize: 14,
        color: '#64748B',
    },
    // Content Cards
    contentCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },
    aboutText: {
        fontSize: 15,
        lineHeight: 24,
        color: '#334155',
    },
    // Education Item
    eduItem: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    eduTimeline: {
        alignItems: 'center',
    },
    eduDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#4F46E5',
        borderWidth: 2,
        borderColor: '#E0E7FF',
    },
    eduLine: {
        width: 2,
        flex: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: 4,
    },
    eduContent: {
        flex: 1,
        paddingBottom: 4,
    },
    eduSchool: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
    },
    eduDegree: {
        fontSize: 14,
        color: '#475569',
        marginTop: 2,
    },
    eduDate: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 4,
    },
    // Contact Rows
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
        padding: 12,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
    },
    contactIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    heroHeadline: {
        fontSize: 15,
        color: '#475569',
        marginTop: 8,
        lineHeight: 22,
    },
    skillGroup: {
        marginBottom: 16,
    },
    skillLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
        marginBottom: 8,
    },
    skillCloud: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    skillChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#F1F5F9', // Default tech color
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    skillText: {
        fontSize: 13,
        color: '#334155',
        fontWeight: '500',
    },
    contactText: {
        fontSize: 15,
        color: '#334155',
        fontWeight: '500',
    },
    infoContainer: {
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
});
