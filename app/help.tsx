import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HelpFeedbackScreen() {
    const router = useRouter();
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

    const handleSendFeedback = () => {
        if (!feedback.trim()) return;

        setSending(true);
        // Simulate API call
        setTimeout(() => {
            setSending(false);
            setFeedback('');
            Alert.alert('Thank You', 'Your feedback has been received!');
        }, 1500);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Help & Feedback</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
                    {faqs.map((faq, index) => (
                        <View key={index} style={styles.faqItem}>
                            <TouchableOpacity
                                style={styles.faqHeader}
                                onPress={() => toggleFaq(index)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.faqQuestion}>{faq.question}</Text>
                                <Ionicons
                                    name={expandedFaq === index ? "chevron-up" : "chevron-down"}
                                    size={20}
                                    color="#64748B"
                                />
                            </TouchableOpacity>
                            {expandedFaq === index && (
                                <View style={styles.faqBody}>
                                    <Text style={styles.faqAnswer}>{faq.answer}</Text>
                                </View>
                            )}
                        </View>
                    ))}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Contact Us</Text>
                    <TouchableOpacity style={styles.contactItem} onPress={() => { }}>
                        <View style={styles.iconBox}>
                            <Ionicons name="mail-outline" size={24} color="#4F46E5" />
                        </View>
                        <View>
                            <Text style={styles.contactLabel}>Email Support</Text>
                            <Text style={styles.contactSub}>support@vidhyarthi.com</Text>
                        </View>
                        <Ionicons name="open-outline" size={20} color="#CBD5E1" style={{ marginLeft: 'auto' }} />
                    </TouchableOpacity>
                </View>

                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <View style={styles.feedbackSection}>
                        <Text style={styles.sectionTitle}>Send Feedback</Text>
                        <Text style={styles.feedbackDesc}>
                            Tell us what you love or what we could improve.
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Write your feedback here..."
                            multiline
                            numberOfLines={4}
                            value={feedback}
                            onChangeText={setFeedback}
                            textAlignVertical="top"
                        />
                        <TouchableOpacity
                            style={[
                                styles.sendButton,
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
                </KeyboardAvoidingView>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    backBtn: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
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
        color: '#1E293B',
        marginBottom: 12,
    },
    faqItem: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#F1F5F9',
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
        color: '#334155',
        flex: 1,
        marginRight: 8,
    },
    faqBody: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: '#F8FAFC',
    },
    faqAnswer: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 20,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    contactLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
    },
    contactSub: {
        fontSize: 14,
        color: '#64748B',
    },
    feedbackSection: {
        backgroundColor: '#FFF',
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    feedbackDesc: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 16,
    },
    input: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        padding: 12,
        height: 120,
        fontSize: 15,
        color: '#1E293B',
        marginBottom: 16,
    },
    sendButton: {
        backgroundColor: '#4F46E5',
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
