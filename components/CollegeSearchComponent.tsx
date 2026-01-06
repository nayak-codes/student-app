import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// ✅ Define props type
type Props = {
  id: number;
  name: string;
  location: string;
};

const CollegeSearchComponent: React.FC<Props> = ({ id, name, location }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.location}>{location}</Text>
    </View>
  );
};

export default CollegeSearchComponent;

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 10,
    elevation: 2,
  },
  name: { fontSize: 16, fontWeight: '600' },
  location: { fontSize: 14, color: '#666' },
});
