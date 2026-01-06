// app/IIT/index.tsx

import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function IITScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🎓 Indian Institutes of Technology (IITs)</Text>
      <Text style={styles.subtitle}>
        Explore top IIT colleges, cutoff trends, campus reviews, and more!
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Top IITs</Text>
        <Text style={styles.cardItem}>• IIT Bombay</Text>
        <Text style={styles.cardItem}>• IIT Delhi</Text>
        <Text style={styles.cardItem}>• IIT Madras</Text>
        <Text style={styles.cardItem}>• IIT Kanpur</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Useful Links</Text>
        <Text style={styles.cardItem}>• JoSAA Counseling</Text>
        <Text style={styles.cardItem}>• Official IIT Websites</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fdfdfd',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    color: '#1a237e',
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#e8eaf6',
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#303f9f',
  },
  cardItem: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
});
