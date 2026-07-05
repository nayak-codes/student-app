import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { auth } from '../config/firebase';
import {
    createGroupEvent,
    deleteGroupEvent,
    GroupEvent,
    rsvpGroupEvent,
    subscribeToGroupEvents,
} from '../services/chatService';

interface Props {
    visible: boolean;
    onClose: () => void;
    groupId: string;
    isAdmin: boolean;
    colors: any;
    isDark: boolean;
}

export default function GroupEventsSheet({ visible, onClose, groupId, isAdmin, colors, isDark }: Props) {
    const [events, setEvents] = useState<GroupEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);

    // Create form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (!visible) return;
        setLoading(true);
        const unsub = subscribeToGroupEvents(groupId, (evs) => {
            setEvents(evs);
            setLoading(false);
        });
        return () => unsub();
    }, [visible, groupId]);

    const handleCreate = async () => {
        if (!title.trim()) {
            Alert.alert('Event Title Required', 'Please enter a title for the event');
            return;
        }
        setCreating(true);
        try {
            // Store date as a Firestore Timestamp-compatible object
            await createGroupEvent(groupId, {
                title: title.trim(),
                description: description.trim(),
                date: { seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0 } as any,
                createdBy: auth.currentUser?.uid || '',
                creatorName: auth.currentUser?.displayName || 'User',
            });
            setTitle('');
            setDescription('');
            setDate(new Date());
            setShowCreate(false);
        } catch {
            Alert.alert('Error', 'Failed to create event');
        } finally {
            setCreating(false);
        }
    };

    const handleRSVP = async (eventId: string, status: 'going' | 'notGoing' | 'maybe') => {
        try {
            await rsvpGroupEvent(groupId, eventId, auth.currentUser?.uid || '', status);
        } catch {
            Alert.alert('Error', 'Failed to update RSVP');
        }
    };

    const handleDelete = (event: GroupEvent) => {
        Alert.alert('Delete Event', `Delete "${event.title}"?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => deleteGroupEvent(groupId, event.id) },
        ]);
    };

    const formatEventDate = (event: GroupEvent) => {
        try {
            const d = (event.date as any)?.toDate ? (event.date as any).toDate() : new Date((event.date as any).seconds * 1000);
            return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) +
                ' · ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        } catch {
            return 'Date TBD';
        }
    };

    const isPast = (event: GroupEvent) => {
        try {
            const d = (event.date as any)?.toDate ? (event.date as any).toDate() : new Date((event.date as any).seconds * 1000);
            return d < new Date();
        } catch { return false; }
    };

    const renderEvent = ({ item }: { item: GroupEvent }) => {
        const uid = auth.currentUser?.uid || '';
        const myStatus = item.rsvp?.going?.includes(uid) ? 'going'
            : item.rsvp?.notGoing?.includes(uid) ? 'notGoing'
                : item.rsvp?.maybe?.includes(uid) ? 'maybe' : null;
        const past = isPast(item);

        return (
            <View style={[styles.eventCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: past ? 0.7 : 1 }]}>
                {past && (
                    <View style={styles.pastBadge}>
                        <Text style={styles.pastText}>Past</Text>
                    </View>
                )}
                <View style={styles.eventHeader}>
                    <View style={[styles.calIcon, { backgroundColor: colors.primary + '20' }]}>
                        <Ionicons name="calendar" size={22} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.eventTitle, { color: colors.text }]}>{item.title}</Text>
                        <Text style={[styles.eventDate, { color: colors.primary }]}>📅 {formatEventDate(item)}</Text>
                    </View>
                    {(isAdmin || item.createdBy === uid) && !past && (
                        <TouchableOpacity onPress={() => handleDelete(item)}>
                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                        </TouchableOpacity>
                    )}
                </View>

                {!!item.description && (
                    <Text style={[styles.eventDesc, { color: colors.textSecondary }]}>{item.description}</Text>
                )}

                {/* RSVP Counts */}
                <View style={styles.rsvpCounts}>
                    <Text style={[styles.countText, { color: colors.textSecondary }]}>
                        ✅ {item.rsvp?.going?.length || 0} Going  ·  ❓ {item.rsvp?.maybe?.length || 0} Maybe  ·  ❌ {item.rsvp?.notGoing?.length || 0} Not Going
                    </Text>
                </View>

                {/* RSVP Buttons */}
                {!past && (
                    <View style={styles.rsvpRow}>
                        {(['going', 'maybe', 'notGoing'] as const).map((status) => {
                            const labels = { going: '✅ Going', maybe: '❓ Maybe', notGoing: '❌ Not Going' };
                            const colors2 = { going: '#10B981', maybe: '#F59E0B', notGoing: '#EF4444' };
                            const selected = myStatus === status;
                            return (
                                <TouchableOpacity
                                    key={status}
                                    style={[styles.rsvpBtn, {
                                        backgroundColor: selected ? colors2[status] : (isDark ? '#1E293B' : '#F1F5F9'),
                                        borderColor: selected ? colors2[status] : colors.border,
                                    }]}
                                    onPress={() => handleRSVP(item.id, status)}
                                >
                                    <Text style={{ color: selected ? '#FFF' : colors.text, fontSize: 11, fontWeight: '600' }}>
                                        {labels[status]}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
                <Text style={[styles.creator, { color: colors.textSecondary }]}>Created by {item.creatorName}</Text>
            </View>
        );
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>📅 Group Events</Text>
                    {isAdmin && (
                        <TouchableOpacity onPress={() => setShowCreate(!showCreate)} style={styles.addBtn}>
                            <Ionicons name={showCreate ? 'close' : 'add'} size={22} color="#FFF" />
                        </TouchableOpacity>
                    )}
                    {!isAdmin && <View style={{ width: 32 }} />}
                </View>

                {/* Create Event Form */}
                {showCreate && (
                    <View style={[styles.createForm, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.formTitle, { color: colors.text }]}>New Event</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}
                            placeholder="Event title *"
                            placeholderTextColor={colors.textSecondary}
                            value={title}
                            onChangeText={setTitle}
                        />
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}
                            placeholder="Description (optional)"
                            placeholderTextColor={colors.textSecondary}
                            value={description}
                            onChangeText={setDescription}
                            multiline
                        />
                        <TouchableOpacity
                            style={[styles.datePickerBtn, { borderColor: colors.border, backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                            <Text style={{ color: colors.text, marginLeft: 8 }}>
                                {date.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })} · {date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                            </Text>
                        </TouchableOpacity>
                        {showDatePicker && (
                            <DateTimePicker
                                value={date}
                                mode="datetime"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                minimumDate={new Date()}
                                onChange={(_, selectedDate) => {
                                    setShowDatePicker(Platform.OS === 'ios');
                                    if (selectedDate) setDate(selectedDate);
                                }}
                            />
                        )}
                        <TouchableOpacity
                            style={[styles.createBtn, { backgroundColor: creating ? '#94A3B8' : colors.primary }]}
                            onPress={handleCreate}
                            disabled={creating}
                        >
                            {creating ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.createBtnText}>Create Event</Text>}
                        </TouchableOpacity>
                    </View>
                )}

                {/* Events List */}
                {loading ? (
                    <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
                ) : events.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={{ fontSize: 48 }}>📅</Text>
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            No events yet{'\n'}{isAdmin ? 'Tap + to create an event' : 'Admin will create events here'}
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={events}
                        keyExtractor={e => e.id}
                        renderItem={renderEvent}
                        contentContainerStyle={{ padding: 16, gap: 12 }}
                    />
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
    },
    closeBtn: { padding: 4 },
    headerTitle: { fontSize: 17, fontWeight: '700' },
    addBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
    createForm: { margin: 16, padding: 16, borderRadius: 12, borderWidth: 1, gap: 10 },
    formTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
    input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
    datePickerBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12 },
    createBtn: { paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    createBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
    eventCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
    pastBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: '#94A3B8', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    pastText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
    eventHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    calIcon: { width: 44, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    eventTitle: { fontSize: 15, fontWeight: '700' },
    eventDate: { fontSize: 12, fontWeight: '600', marginTop: 2 },
    eventDesc: { fontSize: 13, lineHeight: 18 },
    rsvpCounts: { paddingVertical: 4 },
    countText: { fontSize: 12 },
    rsvpRow: { flexDirection: 'row', gap: 8 },
    rsvpBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', borderWidth: 1.5 },
    creator: { fontSize: 11, marginTop: 2 },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 },
    emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
