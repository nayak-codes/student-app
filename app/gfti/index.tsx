import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

// Enhanced mock data for IIT colleges
const iitColleges = [
  {
    id: 1,
    name: 'IIT Bombay',
    location: 'Mumbai, Maharashtra',
    image: 'https://images.collegedunia.com/public/image/iit_bombay_sign_angle_1__dfa638c534baead270684e71cb29be01.jpeg?tr=w-1310,h-480,c-force',
    description: 'Premier institute known for engineering and research with state-of-the-art facilities and strong industry connections.',
    established: 1958,
    rank: 1,
    website: 'https://www.iitb.ac.in/',
    phone: '+91-22-25722545',
    courses: ['B.Tech', 'M.Tech', 'Ph.D', 'Dual Degree'],
    notableAlumni: ['Nandan Nilekani', 'Arvind Kejriwal', 'Vinod Khosla']
  },
  {
    id: 2,
    name: 'IIT Delhi',
    location: 'New Delhi, Delhi',
    image: 'https://upload.wikimedia.org/wikipedia/en/1/12/IIT_Delhi_Logo.svg',
    description: 'Leading institute with a vibrant campus life and excellent placement records in core and IT sectors.',
    established: 1961,
    rank: 2,
    website: 'https://home.iitd.ac.in/',
    phone: '+91-11-26591753',
    courses: ['B.Tech', 'M.Tech', 'MBA', 'Ph.D'],
    notableAlumni: ['Chetan Bhagat', 'Manohar Parrikar', 'Vijay Kelkar']
  },
  {
    id: 3,
    name: 'IIT Madras',
    location: 'Chennai, Tamil Nadu',
    image: 'https://bl-i.thgim.com/public/news/xe4vo3/article66182896.ece/alternates/LANDSCAPE_1200/IIT%20Roorkee%20Campus.jpeg',
    description: 'Known for innovation and academic excellence with strong research output and startup culture.',
    established: 1959,
    rank: 3,
    website: 'https://www.iitm.ac.in/',
    phone: '+91-44-22578555',
    courses: ['B.Tech', 'M.Tech', 'MS', 'Ph.D'],
    notableAlumni: ['Kris Gopalakrishnan', 'Sachin Bansal', 'Vijay Chandru']
  },
  {
    id: 4,
    name: 'IIT Kanpur',
    location: 'Kanpur, Uttar Pradesh',
    image: 'https://upload.wikimedia.org/wikipedia/en/6/69/IIT_Kanpur_Logo.svg',
    description: 'Renowned for research and entrepreneurship with excellent aerospace and computer science programs.',
    established: 1959,
    rank: 4,
    website: 'https://www.iitk.ac.in/',
    phone: '+91-512-2590151',
    courses: ['B.Tech', 'M.Tech', 'M.Des', 'Ph.D'],
    notableAlumni: ['Narayana Murthy', 'Arvind Krishna', 'Sanjay Dhande']
  },
  {
    id: 5,
    name: 'IIT Kharagpur',
    location: 'Kharagpur, West Bengal',
    image: 'https://upload.wikimedia.org/wikipedia/en/6/69/IIT_Kharagpur_Logo.svg',
    description: 'The oldest IIT with the largest campus, famous for its metallurgy and mining engineering programs.',
    established: 1951,
    rank: 5,
    website: 'https://www.iitkgp.ac.in/',
    phone: '+91-3222-255221',
    courses: ['B.Tech', 'M.Tech', 'LLB', 'Ph.D'],
    notableAlumni: ['Sundar Pichai', 'Vinod Gupta', 'Arjun Malhotra']
  },
];

const IitCollegesScreen: React.FC = () => {
  const handleWebsitePress = (url: string) => {
    Linking.openURL(url).catch(err => console.error("Failed to open URL:", err));
  };

  const handleCallPress = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(err => console.error("Failed to make call:", err));
  };

  const handleSavePress = (collegeId: number) => {
    // Implement save functionality
    console.log(`Saved college with ID: ${collegeId}`);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.header}>Indian Institutes of Technology (IITs)</Text>
        <Text style={styles.subHeader}>Top Engineering Institutions in India</Text>
        
        {iitColleges.map((college) => (
          <View key={college.id} style={styles.card}>
            <View style={styles.imageContainer}>
              <Image 
                source={{ uri: college.image }} 
                style={styles.collegeImage} 
                resizeMode="contain" 
              />
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>#{college.rank}</Text>
              </View>
            </View>
            
            <View style={styles.cardContent}>
              <Text style={styles.collegeName}>{college.name}</Text>
              <View style={styles.locationContainer}>
                <MaterialIcons name="location-on" size={16} color="#6b7b8c" />
                <Text style={styles.collegeLocation}>{college.location}</Text>
              </View>
              
              <Text style={styles.collegeDesc}>{college.description}</Text>
              
              <View style={styles.detailsRow}>
                <Text style={styles.detailLabel}>Established:</Text>
                <Text style={styles.detailValue}>{college.established}</Text>
              </View>
              
              <View style={styles.detailsRow}>
                <Text style={styles.detailLabel}>Courses:</Text>
                <Text style={styles.detailValue}>{college.courses.join(', ')}</Text>
              </View>
              
              <View style={styles.actionBar}>
                <TouchableOpacity 
                  style={styles.iconButton}
                  onPress={() => handleWebsitePress(college.website)}
                >
                  <FontAwesome name="globe" size={20} color="#1a6d8f" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.iconButton}
                  onPress={() => handleCallPress(college.phone)}
                >
                  <MaterialIcons name="phone" size={20} color="#1a6d8f" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={() => handleSavePress(college.id)}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                  <MaterialIcons name="bookmark" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
    textAlign: 'center',
  },
  subHeader: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 24,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  imageContainer: {
    position: 'relative',
  },
  collegeImage: {
    width: '100%',
    height: width * 0.4,
    backgroundColor: '#f1f5f9',
  },
  rankBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  rankText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  cardContent: {
    padding: 16,
  },
  collegeName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 6,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  collegeLocation: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 4,
  },
  collegeDesc: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    width: 100,
  },
  detailValue: {
    fontSize: 14,
    color: '#475569',
    flex: 1,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  iconButton: {
    padding: 8,
  },
  saveButton: {
    backgroundColor: '#1e40af',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginRight: 6,
  },
});

export default IitCollegesScreen;