import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface NotificationsModalProps {
    visible: boolean;
    onClose: () => void;
    pendingRequests: any[];
    onAccept: (requestId: string) => void;
    onReject: (requestId: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
    visible,
    onClose,
    pendingRequests,
    onAccept,
    onReject
}) => {
    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Friend Requests</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    {/* Requests List */}
                    <ScrollView style={{ maxHeight: '100%' }}>
                        {pendingRequests.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="mail-outline" size={64} color="#CBD5E1" />
                                <Text style={styles.emptyText}>
                                    No pending requests
                                </Text>
                            </View>
                        ) : (
                            pendingRequests.map((request) => (
                                <View key={request.id} style={styles.requestItem}>
                                    {/* Avatar */}
                                    {request.photoURL ? (
                                        <Image source={{ uri: request.photoURL }} style={styles.avatar} />
                                    ) : (
                                        <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                            <Text style={styles.avatarText}>
                                                {request.name?.charAt(0).toUpperCase() || 'U'}
                                            </Text>
                                        </View>
                                    )}

                                    {/* Info */}
                                    <View style={styles.infoContainer}>
                                        <Text style={styles.nameText}>{request.name || 'Unknown'}</Text>
                                        <Text style={styles.roleText}>{request.exam || 'Student'}</Text>
                                    </View>

                                    {/* Actions */}
                                    <View style={styles.actionsContainer}>
                                        <TouchableOpacity
                                            style={styles.acceptButton}
                                            onPress={() => onAccept(request.id)}
                                        >
                                            <Text style={styles.acceptButtonText}>Accept</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.rejectButton}
                                            onPress={() => onReject(request.id)}
                                        >
                                            <Text style={styles.rejectButtonText}>Reject</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
        paddingTop: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        fontWeight: '600',
        color: '#64748B',
    },
    requestItem: {
        flexDirection: 'row',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        alignItems: 'center',
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
    },
    avatarPlaceholder: {
        backgroundColor: '#4F46E5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: '700',
    },
    infoContainer: {
        flex: 1,
        marginLeft: 12,
    },
    nameText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
    },
    roleText: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 2,
    },
    actionsContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    acceptButton: {
        backgroundColor: '#4F46E5',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    acceptButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
    rejectButton: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    rejectButtonText: {
        color: '#64748B',
        fontSize: 14,
        fontWeight: '600',
    },
});
