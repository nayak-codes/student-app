// app/(tabs)/index.tsx
import { useRouter } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Image, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FeedList from '../../src/components/feed/FeedList';
import ProfileDrawer from '../../src/components/ProfileDrawer';
import { useAuth } from '../../src/contexts/AuthContext';
import { testFirebaseConnection } from '../../src/utils/testFirebase';

export default function HomeScreen() {
  const router = useRouter();
  const { user, userProfile, loading } = useAuth();
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);

  // Test Firebase connection on mount
  useEffect(() => {
    testFirebaseConnection();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Standard App Header */}
      <View style={styles.header}>
        <View style={styles.brandContainer}>
          <Text style={styles.brandText}>StudentVerse</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/search')}
          >
            <Ionicons name="search-outline" size={26} color="#0F172A" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="notifications-outline" size={26} color="#0F172A" />
            <View style={styles.notificationDot} />
          </TouchableOpacity>

          {/* Profile Icon for Drawer - Moved to right side or kept? 
               User asked for "like framework web site header".
               Usually profile is on the right in web, but in mobile apps (Instagram) it's often a tab.
               Since we removed the profile tab, we must keep access.
               Let's put the profile avatar on the far right.
           */}
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => setShowProfileDrawer(true)}
          >
            {userProfile?.photoURL ? (
              <Image source={{ uri: userProfile.photoURL }} style={styles.smallAvatar} />
            ) : (
              <View style={styles.smallAvatarPlaceholder}>
                <Text style={styles.avatarText}>{userProfile?.name?.charAt(0).toUpperCase() || 'S'}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Feed Content */}
      <FeedList />

      {/* Profile Drawer */}
      <ProfileDrawer
        visible={showProfileDrawer}
        onClose={() => setShowProfileDrawer(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandText: {
    fontSize: 24, // Larger for brand
    fontWeight: '800', // Extra bold
    color: '#3F51B5', // Primary brand color
    fontFamily: 'System', // Use default system font or custom if available
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionButton: {
    padding: 4,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  profileButton: {
    marginLeft: 4,
  },
  smallAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  smallAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3F51B5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
