import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';

interface College {
  id: string;
  name: string;
  location: string;
  established: number;
  affiliated?: string;
  image: string;
  about: {
    overview: string;
    vision?: string;
    mission?: string;
  };
  courses: {
    undergraduate: string[];
    postgraduate: string[];
  };
  cutoffs?: {
    [key: string]: {
      [branch: string]: string;
    };
  };
  placement?: {
    highest_package: string;
    average_package: string;
    top_recruiters: string[];
  };
  contact?: {
    email: string;
    phone: string;
    website: string;
    address: string;
  };
}

export default function CollegeProfile() {
  const { collegeId } = useLocalSearchParams<{ collegeId: string }>();
  const [college, setCollege] = useState<College | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCollege = async () => {
      try {
        const response = await fetch(
          `http://10.147.72.110:8000/colleges/${collegeId}` // ✅ fetch by slug/id
        );
        const data = await response.json();
        setCollege(data);
      } catch (error) {
        console.error('Error fetching college:', error);
      } finally {
        setLoading(false);
      }
    };

    if (collegeId) {
      fetchCollege();
    }
  }, [collegeId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  if (!college) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 18 }}>College not found</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Banner Image */}
      <Image source={{ uri: college.image }} style={styles.banner} />

      {/* Name & Location */}
      <Text style={styles.name}>{college.name}</Text>
      <Text style={styles.location}>📍 {college.location}</Text>

      {/* General Info */}
      <Text style={styles.sectionLabel}>
        Established: <Text style={styles.sectionValue}>{college.established}</Text>
      </Text>
      {college.affiliated && (
        <Text style={styles.sectionLabel}>
          Affiliated: <Text style={styles.sectionValue}>{college.affiliated}</Text>
        </Text>
      )}

      {/* About */}
      <Text style={styles.sectionLabel}>About</Text>
      <Text style={styles.sectionValue}>{college.about?.overview}</Text>
      {college.about?.vision && (
        <Text style={styles.sectionValue}>✨ Vision: {college.about.vision}</Text>
      )}
      {college.about?.mission && (
        <Text style={styles.sectionValue}>🎯 Mission: {college.about.mission}</Text>
      )}

      {/* Courses */}
      <Text style={styles.sectionLabel}>Undergraduate Courses</Text>
      <Text style={styles.sectionValue}>
        {college.courses.undergraduate.join(', ')}
      </Text>

      <Text style={styles.sectionLabel}>Postgraduate Courses</Text>
      <Text style={styles.sectionValue}>
        {college.courses.postgraduate.join(', ')}
      </Text>

      {/* Cutoffs */}
      {college.cutoffs && (
        <>
          <Text style={styles.sectionLabel}>Cutoffs</Text>
          {Object.entries(college.cutoffs).map(([exam, branches]) => (
            <View key={exam}>
              <Text style={[styles.sectionLabel, { fontSize: 15 }]}>{exam}</Text>
              {Object.entries(branches).map(([branch, rank]) => (
                <Text key={branch} style={styles.sectionValue}>
                  {branch}: {rank}
                </Text>
              ))}
            </View>
          ))}
        </>
      )}

      {/* Placements */}
      {college.placement && (
        <>
          <Text style={styles.sectionLabel}>Placements</Text>
          <Text style={styles.sectionValue}>
            Highest Package: {college.placement.highest_package}
          </Text>
          <Text style={styles.sectionValue}>
            Average Package: {college.placement.average_package}
          </Text>
          <Text style={styles.sectionValue}>
            Top Recruiters: {college.placement.top_recruiters.join(', ')}
          </Text>
        </>
      )}

      {/* Contact */}
      {college.contact && (
        <>
          <Text style={styles.sectionLabel}>Contact</Text>
          <Text style={styles.sectionValue}>📧 {college.contact.email}</Text>
          <Text style={styles.sectionValue}>📞 {college.contact.phone}</Text>
          <Text style={styles.sectionValue}>🌐 {college.contact.website}</Text>
          <Text style={styles.sectionValue}>🏫 {college.contact.address}</Text>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  banner: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  location: {
    fontSize: 16,
    color: 'gray',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
    color: '#333',
  },
  sectionValue: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
    marginBottom: 6,
  },
});
