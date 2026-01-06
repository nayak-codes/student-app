// app/(tabs)/index.tsx
import { useRouter } from 'expo-router';

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ProfileDrawer from '../../src/components/ProfileDrawer';
import { useAuth } from '../../src/contexts/AuthContext';
import { logout } from '../../src/services/authService';
import { testFirebaseConnection } from '../../src/utils/testFirebase';
import { uploadSampleColleges } from '../../src/utils/uploadColleges';

export default function HomeScreen() {
  const router = useRouter();
  const { user, userProfile, loading } = useAuth();
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);

  // Test Firebase connection on mount
  useEffect(() => {
    testFirebaseConnection();

    // Upload sample colleges (run once, then comment out)
    // uploadSampleColleges(); // ✅ 10 colleges uploaded!
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/login');
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const handleUploadColleges = async () => {
    Alert.alert(
      'Upload College Data',
      'This will upload 5 sample colleges to Firestore. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Upload',
          onPress: async () => {
            try {
              console.log('🔥 Starting upload...');
              await uploadSampleColleges();
              Alert.alert('Success', 'College data uploaded successfully!');
            } catch (error: any) {
              console.error('Upload error:', error);
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Personalized Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <TouchableOpacity
            style={styles.userBadge}
            onPress={() => setShowProfileDrawer(true)}
          >
            <Ionicons name="person" size={24} color="#fff" />
          </TouchableOpacity>
          <View>
            <Text style={styles.greeting}>
              Hello, {userProfile?.name || 'Balaji'}!
            </Text>
            <Text style={styles.subtitle}>Ready to learn today?</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#3F51B5" />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>18/50</Text>
          <Text style={styles.statLabel}>Topics</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>7</Text>
          <Text style={styles.statLabel}>Mock Tests</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>5</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
      </View>


      <View style={styles.categoryGrid}>
        <TouchableOpacity
          style={[styles.categoryBox, { backgroundColor: '#FFF9C4' }]}
          onPress={() => router.push('/exams/jee-main')}
        >
          <MaterialCommunityIcons name="atom" size={24} color="#F57C00" />
          <Text style={styles.categoryText}>JEE Main</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.categoryBox, { backgroundColor: '#FFF9C4' }]}
          onPress={() => router.push('/exams/jee-advance')}
        >
          <MaterialCommunityIcons name="atom" size={24} color="#F57C00" />
          <Text style={styles.categoryText}>JEE ADVANCE</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.categoryBox, { backgroundColor: '#FFF9C4' }]}
          onPress={() => router.push('/exams/eapcet')}
        >
          <MaterialCommunityIcons name="atom" size={24} color="#F57C00" />
          <Text style={styles.categoryText}>EAPCET</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.categoryBox, { backgroundColor: '#FFF9C4' }]}
          onPress={() => router.push('/exams/srjmee')}
        >
          <MaterialCommunityIcons name="atom" size={24} color="#F57C00" />
          <Text style={styles.categoryText}>SRMJEEE</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={{
          backgroundColor: '#e3f2fd',
          paddingVertical: 10,
          borderRadius: 8,
          alignItems: 'center',
          marginTop: 12,
          marginBottom: 24,
        }}
        onPress={() => router.push('/exams/all')} // <-- navigate to /exams/all.tsx
      >
        <Text style={{ color: '#1565c0', fontWeight: '600', fontSize: 15 }}>
          📚 View All Entrance Exams
        </Text>
      </TouchableOpacity>




      {/* Indian Colleges Grid Section */}

      <View style={styles.collegeBox}>
        <Text style={styles.sectionTitle}>🎓 Indian Colleges</Text>
        <View style={styles.collegeGrid}>
          {
            [
              { label: 'IIT', icon: 'school-outline', path: '/iit' },               // 🎓 academic
              { label: 'NIT', icon: 'office-building-outline', path: '/nit' },     // 🏢 institute
              { label: 'IIIT', icon: 'library-outline', path: '/iiit' },            // 💻 student + tech
              { label: 'GFTI', icon: 'domain', path: '/gfti' },                    // 🏛️ gov college
              { label: 'Universities', icon: 'shield-checkmark-outline', path: '/universities' },// 🎓 higher edu
              { label: 'Deemed University', icon: 'school', path: '/deemed' }      // 🎓 generic




            ].map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.circleCollege}
                onPress={() => router.push(item.path as any)}

              >
                <View style={styles.circleCollegeIcon}>
                  <MaterialCommunityIcons name={item.icon as any} size={24} color="#4a148c" />
                </View>
                <Text style={styles.circleCollegeLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
        </View>
      </View>

      {/* Quick Actions - Circular Grid Style */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionsGrid}>
        {[
          { icon: 'calendar-check', label: 'Daily Quiz' },
          { icon: 'calendar-clock', label: 'Study Plan' },
          { icon: 'robot-outline', label: 'Ask Anju' },
          { icon: 'file-document-outline', label: 'Mock Tests' },
          { icon: 'file-document-outline', label: 'Mock Tests' },
          { icon: 'file-document-outline', label: 'Mock Tests' },
        ].map((item, index) => (
          <TouchableOpacity key={index} style={styles.circleAction}>
            <View style={styles.circleIcon}>
              <MaterialCommunityIcons name={item.icon as any} size={24} color="#0022e3ff" />

            </View>
            <Text style={styles.circleLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>





      {/* Continue Learning */}
      <Text style={styles.sectionTitle}>Continue Learning</Text>
      <View style={styles.resourcesContainer}>
        <TouchableOpacity style={[styles.resourceCard, { backgroundColor: '#FFF9C4' }]}>
          <View>
            <Text style={styles.resourceTitle}>Algebra Basics</Text>
            <Text style={styles.resourceSubject}>Math</Text>
          </View>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '75%' }]} />
            </View>
            <Text style={styles.progressText}>75%</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.resourceCard, { backgroundColor: '#FFF9C4' }]}>
          <View>
            <Text style={styles.resourceTitle}>Chemical Bonds</Text>
            <Text style={styles.resourceSubject}>Chemistry</Text>
          </View>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '40%' }]} />
            </View>
            <Text style={styles.progressText}>40%</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Profile Drawer */}
      <ProfileDrawer
        visible={showProfileDrawer}
        onClose={() => setShowProfileDrawer(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3F51B5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  notificationButton: {
    position: 'relative',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoutButton: {
    padding: 8,
  },
  notificationDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '30%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a237e',
    marginBottom: 12,
    marginLeft: 8,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryBox: {
    width: '48%',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginLeft: 12,
  },
  featureContainer: {
    marginBottom: 16,
  },
  featureBox: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },




  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 20,
    columnGap: 12,
    marginBottom: 24,
  },
  circleAction: {
    width: '30%',
    alignItems: 'center',
  },
  circleIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#98b9e4ff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  circleLabel: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    color: '#19332fff',
  },
  resourcesContainer: {
    marginBottom: 24,
  },




  resourceCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  resourceSubject: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3F51B5',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },

  link: {
    color: '#3F51B5',
    textDecorationLine: 'underline',
    textDecorationStyle: 'solid',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',

  },

  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
    marginBottom: 24,
  },

  categoryItem: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },

  collegeBox: {
    backgroundColor: '#e8e6e6ff',
    padding: 16,
    borderRadius: 14,
    marginBottom: 24,
    shadowColor: '#00000015',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },

  collegeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 18,
    marginTop: 12,
  },

  circleCollege: {
    width: '30%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },


  circleCollegeIcon: {
    backgroundColor: '#d1c4e9',
    padding: 12,
    borderRadius: 30,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },

  circleCollegeLabel: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    color: '#4a148c',
  },

  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C63FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },

  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});