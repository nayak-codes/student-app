// screens/CollegeProfileScreen.js

import { StyleSheet, Text, View } from 'react-native';

export default function CollegeProfileScreen({ route }) {
  const { college } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{college.name}</Text>
      <Text style={styles.details}>📍 Location: {college.location}</Text>
      <Text style={styles.details}>🏫 Courses: {college.courses.join(', ')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#F7FAFC',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 16,
  },
  details: {
    fontSize: 16,
    color: '#4A5568',
    marginBottom: 12,
  },
});
