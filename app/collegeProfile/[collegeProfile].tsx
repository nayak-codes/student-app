import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function CollegeProfileScreen() {
  const { collegeProfile } = useLocalSearchParams();
  const college = JSON.parse(decodeURIComponent(collegeProfile as string));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.name}>{college.name}</Text>
      <Text style={styles.location}>{college.location}</Text>

      {/* ABOUT SECTION */}
      <Text style={styles.sectionTitle}>About</Text>
      {Object.entries(college.about).map(([key, value]) => (
        <View key={key} style={styles.sectionBlock}>
          <Text style={styles.subHeading}>{formatKey(key)}</Text>
          <Text style={styles.description}>{String(value)}</Text>
        </View>
      ))}

      {/* COURSES SECTION */}
      <Text style={styles.sectionTitle}>Courses Offered</Text>
      {college.courses.map((course: string, index: number) => (
        <Text key={index} style={styles.description}>• {course}</Text>
      ))}

      {/* ADD MORE SECTIONS SIMILARLY: rankings, placements, etc */}
    </ScrollView>
  );
}

function formatKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  location: {
    fontSize: 16,
    color: 'gray',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
  },
  subHeading: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  description: {
    fontSize: 15,
    marginTop: 4,
    lineHeight: 22,
  },
  sectionBlock: {
    marginBottom: 10,
  },
});
