import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function CollegeProfileScreen() {
  const { collegeProfile } = useLocalSearchParams();
  const college = JSON.parse(decodeURIComponent(collegeProfile as string));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.name}>{college.name}</Text>
      <Text style={styles.location}>{college.location}</Text>

      <Text style={styles.sectionTitle}>About:</Text>
      {Object.entries(college.about).map(([key, value]) => (
  <View key={key} style={styles.sectionBlock}>
    <Text style={styles.subHeading}>{formatKey(key)}</Text>
    <Text style={styles.description}>{String(value)}</Text>
  </View>
))}


      {/* You can expand this with gallery, rankings, etc. */}
    </ScrollView>
  );
}

// Helper function to format keys like 'student_life' => 'Student Life'
function formatKey(key: string) {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  location: {
    fontSize: 16,
    color: 'gray',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    color: '#222',
  },
  sectionBlock: {
    marginBottom: 14,
  },
  subHeading: {
    fontSize: 17,
    fontWeight: '500',
    marginBottom: 4,
    color: '#333',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#444',
  },
});
