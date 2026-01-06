import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

type College = {
  id: number;
  name: string;
  location: string;
};

const colleges: College[] = [
  { id: 1, name: 'IIT Madras', location: 'Chennai' },
  { id: 2, name: 'IIT Bombay', location: 'Mumbai' },
  { id: 3, name: 'IIT Delhi', location: 'Delhi' },
  { id: 4, name: 'IIT Patna', location: 'Patna' },
];

const SearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredColleges, setFilteredColleges] = useState<College[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredColleges([]);
      return;
    }

    const results = colleges.filter(
      (college) =>
        college.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        college.location.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setFilteredColleges(results);
  }, [searchQuery]);

  const handleCollegePress = (id: number) => {
    router.push(`/college/${id}`);
    // You can use the id in /college/[id].tsx to fetch college details.
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <TextInput
          placeholder="🔍 Search IITs, NITs..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.input}
          clearButtonMode="while-editing"
        />

        <FlatList
          data={filteredColleges}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={
            searchQuery ? (
              <Text style={styles.noResults}>😕 No colleges match your search.</Text>
            ) : null
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => handleCollegePress(item.id)}
            >
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.location}>📍 {item.location}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </TouchableWithoutFeedback>
  );
};

export default SearchScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9fafb',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    elevation: 2,
  },
  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  name: {
    fontWeight: '700',
    fontSize: 16,
    color: '#111827',
  },
  location: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  noResults: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 30,
    color: '#9ca3af',
  },
});
