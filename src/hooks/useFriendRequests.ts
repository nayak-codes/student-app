import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import {
    acceptFriendRequest,
    getPendingFriendRequests,
    rejectFriendRequest
} from '../services/connectionService';

export const useFriendRequests = () => {
    const { user } = useAuth();
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const loadRequests = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const requests = await getPendingFriendRequests(user.uid);
            setPendingRequests(requests);
        } catch (error) {
            console.error('Error loading friend requests:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Initial load
    useEffect(() => {
        loadRequests();
    }, [loadRequests]);

    const handleAccept = async (requestId: string) => {
        try {
            await acceptFriendRequest(requestId);
            Alert.alert('Success', 'Friend request accepted!');
            loadRequests(); // Refresh list
        } catch (error) {
            console.error('Error accepting request:', error);
            Alert.alert('Error', 'Failed to accept request');
        }
    };

    const handleReject = async (requestId: string) => {
        try {
            await rejectFriendRequest(requestId);
            // Alert.alert('Success', 'Friend request rejected'); // Optional
            loadRequests(); // Refresh list
        } catch (error) {
            console.error('Error rejecting request:', error);
            Alert.alert('Error', 'Failed to reject request');
        }
    };

    return {
        pendingRequests,
        loading,
        loadRequests,
        handleAccept,
        handleReject,
        count: pendingRequests.length
    };
};
