import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Linking,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../src/contexts/ThemeContext';

export default function HelpFeedbackScreen() {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const [feedback, setFeedback] = useState('');
    const [sending, setSending] = useState(false);
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

    const faqs = [
        {
            question: "How do I create a new playlist?",
            answer: "Go to your Profile, tap on 'Playlists', and then select '+ New' or 'Create one'. Give it a name and you're good to go!",
        },
        {
            question: "Can I download study materials?",
            answer: "Yes! Look for documents in the Library section. You can save them for offline access in the 'Downloads' section.",
        },
        {
            question: "How do I change my profile picture?",
            answer: "Navigate to your full profile page, tap 'Edit Profile', and verify your details.",
        },
    ];

    const toggleFaq = (index: number) => {
        setExpandedFaq(expandedFaq === index ? null : index);
    };

    const handleSendFeedback = async () => {
        if (!feedback.trim()) return;

        setSending(true);
        try {
            const email = 'vidhyardhi.network@gmail.com';
            const subject = 'App Feedback - Vidhyardhi';
            const body = feedback;
            const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

            const supported = await Linking.canOpenURL(url);

            if (supported) {
                await Linking.openURL(url);
                setFeedback('');
                // Alert.alert('Thank You', 'Opening your email app...');
            } else {
                Alert.alert('Error', 'No email app found to send feedback.');
            }
        } catch (error) {
            Alert.alert('Error', 'Could not open email client.');
        } finally {
            setSending(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Help & Feedback</Text>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}
            >
                <ScrollView
                    contentContainerStyle={[styles.content, { paddingBottom: 150 }]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Frequently Asked Questions</Text>
                        {faqs.map((faq, index) => (
                            <View key={index} style={[styles.faqItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                <TouchableOpacity
                                    style={styles.faqHeader}
                                    onPress={() => toggleFaq(index)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.faqQuestion, { color: colors.text }]}>{faq.question}</Text>
                                    <Ionicons
                                        name={expandedFaq === index ? "chevron-up" : "chevron-down"}
                                        size={20}
                                        color={colors.textSecondary}
                                    />
                                </TouchableOpacity>
                                {expandedFaq === index && (
                                    <View style={[styles.faqBody, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#F8FAFC' }]}>
                                        <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>{faq.answer}</Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Us</Text>
                        <TouchableOpacity style={[styles.contactItem, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => Linking.openURL('mailto:vidhyardhi.network@gmail.com')}>
                            <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(79, 70, 229, 0.1)' : '#EEF2FF' }]}>
                                <Ionicons name="mail-outline" size={24} color={colors.primary} />
                            </View>
                            <View>
                                <Text style={[styles.contactLabel, { color: colors.text }]}>Email Support</Text>
                                <Text style={[styles.contactSub, { color: colors.textSecondary }]}>vidhyardhi.network@gmail.com</Text>
                            </View>
                            <Ionicons name="open-outline" size={20} color={colors.textSecondary} style={{ marginLeft: 'auto' }} />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.feedbackSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Send Feedback</Text>
                        <Text style={[styles.feedbackDesc, { color: colors.textSecondary }]}>
                            Tell us what you love or what we could improve.
                        </Text>
                        <TextInput
                            style={[styles.input, {
                                backgroundColor: isDark ? colors.background : '#F8FAFC',
                                borderColor: colors.border,
                                color: colors.text
                            }]}
                            placeholder="Write your feedback here..."
                            placeholderTextColor={colors.textSecondary}
                            multiline
                            numberOfLines={4}
                            value={feedback}
                            onChangeText={setFeedback}
                            textAlignVertical="top"
                        />
                        <TouchableOpacity
                            style={[
                                styles.sendButton,
                                { backgroundColor: colors.primary },
                                (!feedback.trim() || sending) && styles.disabledButton
                            ]}
                            onPress={handleSendFeedback}
                            disabled={!feedback.trim() || sending}
                        >
                            {sending ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.sendButtonText}>Submit Feedback</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        // backgroundColor: '#FFF',
        borderBottomWidth: 1,
        // borderBottomColor: '#F1F5F9',
    },
    backBtn: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        // color: '#0F172A',
    },
    content: {
        padding: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        // color: '#1E293B',
        marginBottom: 12,
    },
    faqItem: {
        // backgroundColor: '#FFF',
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        // borderColor: '#F1F5F9',
        overflow: 'hidden',
    },
    faqHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    faqQuestion: {
        fontSize: 15,
        fontWeight: '600',
        // color: '#334155',
        flex: 1,
        marginRight: 8,
    },
    faqBody: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        // backgroundColor: '#F8FAFC',
    },
    faqAnswer: {
        fontSize: 14,
        // color: '#64748B',
        lineHeight: 20,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        // backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        // borderColor: '#F1F5F9',
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        // backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    contactLabel: {
        fontSize: 16,
        fontWeight: '600',
        // color: '#1E293B',
    },
    contactSub: {
        fontSize: 14,
        // color: '#64748B',
    },
    feedbackSection: {
        // backgroundColor: '#FFF',
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        // borderColor: '#E2E8F0',
    },
    feedbackDesc: {
        fontSize: 14,
        // color: '#64748B',
        marginBottom: 16,
    },
    input: {
        // backgroundColor: '#F8FAFC',
        borderWidth: 1,
        // borderColor: '#E2E8F0',
        borderRadius: 12,
        padding: 12,
        height: 120,
        fontSize: 15,
        // color: '#1E293B',
        marginBottom: 16,
    },
    sendButton: {
        // backgroundColor: '#4F46E5',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    disabledButton: {
        backgroundColor: '#94A3B8',
        opacity: 0.7,
    },
    sendButtonText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 16,
    },
});
