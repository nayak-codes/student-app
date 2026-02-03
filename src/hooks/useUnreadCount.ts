import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Conversation, subscribeToConversations } from '../services/chatService';

export const useUnreadCount = () => {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!user) {
            setUnreadCount(0);
            return;
        }

        const unsubscribe = subscribeToConversations(user.uid, (conversations: Conversation[]) => {
            const count = conversations.reduce((sum, conversation) => {
                const userUnread = conversation.unreadCount?.[user.uid] || 0;
                return sum + userUnread;
            }, 0);
            setUnreadCount(count);
        });

        return () => unsubscribe();
    }, [user]);

    return unreadCount;
};
