import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
    role: 'faculty' | 'cr' | 'student';
    size?: 'small' | 'medium';
}

export default function GroupRoleBadge({ role, size = 'small' }: Props) {
    if (role === 'student' || !role) return null;

    const getRoleConfig = () => {
        switch (role) {
            case 'faculty':
                return { label: 'Faculty', color: '#8B5CF6', bg: '#F3E8FF', icon: '🎓' };
            case 'cr':
                return { label: 'Class Rep', color: '#3B82F6', bg: '#EFF6FF', icon: '⭐' };
            default:
                return { label: '', color: '#94A3B8', bg: '#F1F5F9', icon: '' };
        }
    };

    const config = getRoleConfig();

    return (
        <View style={[styles.badge, { backgroundColor: config.bg }, size === 'medium' && styles.badgeMedium]}>
            <Text style={[styles.icon, size === 'medium' && styles.iconMedium]}>{config.icon}</Text>
            <Text style={[styles.text, { color: config.color }, size === 'medium' && styles.textMedium]}>
                {config.label}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        marginLeft: 6,
    },
    badgeMedium: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
    },
    icon: {
        fontSize: 10,
        marginRight: 2,
    },
    iconMedium: {
        fontSize: 12,
        marginRight: 4,
    },
    text: {
        fontSize: 10,
        fontWeight: '700',
    },
    textMedium: {
        fontSize: 12,
    },
});
