import { Link } from 'expo-router';
import { useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import colleges from '../data/colleges.json';

export default function NITList() {
  const [searchQuery, setSearchQuery] = useState('');

  const nitColleges = colleges.filter((c) => c.id.startsWith('nit'));

  const filteredColleges = nitColleges.filter((college) =>
    college.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    college.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.wrapper}>
      <TextInput
        style={styles.searchInput}
        placeholder="🔍 Search NIT by name or location..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        clearButtonMode="while-editing"
      />

      <FlatList
        data={filteredColleges}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.noResults}>😕 No NIT found matching your search.</Text>
        }
      renderItem={({ item }) => (
  <Link href={`/nit/${item.id}`} asChild>
    <TouchableOpacity style={styles.card} activeOpacity={0.85}>
      <Image source={{ uri: item.image }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.location}>📍 {item.location}</Text>
      </View>
    </TouchableOpacity>
  </Link>
)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  container: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  searchInput: {
    margin: 16,
    padding: 12,
    borderColor: '#d1d5db',
    borderWidth: 1,
    borderRadius: 10,
    fontSize: 16,
    backgroundColor: '#fff',
    elevation: 2,
  },
  card: {
    marginBottom: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: Dimensions.get('window').width * 0.5,
    resizeMode: 'cover',
  },
  info: {
    padding: 14,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  location: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  noResults: {
    marginTop: 40,
    textAlign: 'center',
    fontSize: 16,
    color: '#9ca3af',
  },
});
