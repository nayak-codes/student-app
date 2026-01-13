
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { getSuggestedConnections, sendFriendRequest, SuggestedUser } from '../services/connectionService';

const SuggestedUserCard: React.FC<{
    suggestion: SuggestedUser;
    onConnect: (userId: string) => void;
    onIgnore: (userId: string) => void;
}> = ({ suggestion, onConnect, onIgnore }) => {
    const router = useRouter();


    const handleProfilePress = () => {
        router.push({
            pathname: '/profile-details',
            params: {
                userId: suggestion.user.id,
                userName: suggestion.user.name,
            },
        });
    };

    return (
        <View style={styles.card}>
            <TouchableOpacity style={styles.closeButton} onPress={() => onIgnore(suggestion.user.id)}>
                <Ionicons name="close" size={16} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleProfilePress} style={styles.avatarContainer}>
                {suggestion.user.profilePhoto ? (
                    <Image source={{ uri: suggestion.user.profilePhoto }} style={styles.avatar} />
                ) : (
                    <View style={[styles.avatar, styles.placeholderAvatar]}>
                        <Text style={styles.avatarText}>
                            {suggestion.user.name.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>

            <TouchableOpacity onPress={handleProfilePress}>
                <Text style={styles.name} numberOfLines={1}>{suggestion.user.name}</Text>
                <Text style={styles.role} numberOfLines={1}>{suggestion.user.exam || 'Student'}</Text>
            </TouchableOpacity>

            {suggestion.mutualFriendsCount > 0 && (
                <View style={styles.mutualContainer}>
                    <Ionicons name="people" size={12} color="#666" />
                    <Text style={styles.mutualText}>{suggestion.mutualFriendsCount} mutual friends</Text>
                </View>
            )}

            <TouchableOpacity style={styles.connectButton} onPress={() => onConnect(suggestion.user.id)}>
                <Text style={styles.connectButtonText}>Connect</Text>
            </TouchableOpacity>
        </View>
    );
};

export const SuggestedConnectionsList: React.FC = () => {
    const { user } = useAuth();
    const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadSuggestions();
        }
    }, [user]);

    const loadSuggestions = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const result = await getSuggestedConnections(user.uid);
            setSuggestions(result);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async (userId: string) => {
        if (!user) return;

        // Optimistic update
        setSuggestions(prev => prev.filter(s => s.user.id !== userId));

        try {
            await sendFriendRequest(userId);
        } catch (error) {
            console.error("Failed to connect", error);
            // Ideally revert state here, but simple alert ok for now
        }
    };

    const handleIgnore = (userId: string) => {
        setSuggestions(prev => prev.filter(s => s.user.id !== userId));
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#3F51B5" />
            </View>
        );
    }

    if (suggestions.length === 0) return null;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>People you may know</Text>
            </View>
            <FlatList
                data={suggestions}
                renderItem={({ item }) => (
                    <SuggestedUserCard
                        suggestion={item}
                        onConnect={handleConnect}
                        onIgnore={handleIgnore}
                    />
                )}
                keyExtractor={(item) => item.user.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        backgroundColor: '#fff',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    loadingContainer: {
        padding: 20,
        alignItems: 'center',
    },
    header: {
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
    },
    listContent: {
        paddingHorizontal: 12,
    },
    card: {
        width: 140,
        padding: 12,
        marginHorizontal: 4,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        position: 'relative',
    },
    closeButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 1,
        opacity: 0.5,
    },
    avatarContainer: {
        marginBottom: 8,
        marginTop: 4,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    placeholderAvatar: {
        backgroundColor: '#E0E7FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 24,
        fontWeight: '700',
        color: '#3F51B5',
    },
    name: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
        textAlign: 'center',
        marginBottom: 2,
    },
    role: {
        fontSize: 12,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 8,
    },
    mutualContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 12,
    },
    mutualText: {
        fontSize: 11,
        color: '#64748B',
    },
    connectButton: {
        width: '100%',
        paddingVertical: 6,
        backgroundColor: '#3F51B5', // Primary
        borderRadius: 6,
        alignItems: 'center',
    },
    connectButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
