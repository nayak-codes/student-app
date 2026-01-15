import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/contexts/ThemeContext';

export default function ContentScreen() {
    const router = useRouter();
    const { type } = useLocalSearchParams<{ type: string }>();
    const { colors } = useTheme();

    const getContent = () => {
        switch (type) {
            case 'privacy':
                return {
                    title: 'Privacy & Security',
                    text: `Privacy Policy for Vidhyarthi\n\nLast updated: January 2026\n\nAt Vidhyarthi, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclosure, and safeguard your information when you visit our mobile application.\n\n1. Collection of Data\nWe collect personal data that you voluntarily provide to us when registering, such as your name, email address, and educational details. We also collect data related to your interactions with the app, such as your progress and preferences.\n\n2. Use of Data\nWe use the collected data to provide, maintain, and improve our services, including personalizing your learning experience and tracking your progress.\n\n3. Security\nWe use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable.`
                };
            case 'terms':
                return {
                    title: 'Terms of Service',
                    text: `Terms of Service for Vidhyarthi\n\n1. Acceptance of Terms\nBy accessing and using our app, you accept and agree to be bound by the terms and provision of this agreement.\n\n2. Use License\nPermission is granted to temporarily download one copy of the materials (information or software) on Vidhyarthi's app for personal, non-commercial transitory viewing only.\n\n3. Disclaimer\nThe materials on Vidhyarthi's app are provided on an 'as is' basis. Vidhyarthi makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.`
                };
            case 'about':
                return {
                    title: 'About App',
                    text: `Vidhyarthi App v1.0.0\n\nVidhyarthi is your ultimate companion for competitive exam preparation. Whether you are aiming for JEE, NEET, or other entrance exams, we provide the tools and resources you need to succeed.\n\nDeveloped with ❤️ by the Vidhyarthi Team.\n\nContact us: support@vidhyarthi.com`
                };
            default:
                return {
                    title: 'Information',
                    text: 'Content not found.'
                };
        }
    };

    const content = getContent();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{content.title}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.text, { color: colors.textSecondary }]}>{content.text}</Text>
            </ScrollView>
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
        padding: 16,
        borderBottomWidth: 1,
    },
    backBtn: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    content: {
        padding: 24,
    },
    text: {
        fontSize: 16,
        lineHeight: 26,
    },
});

