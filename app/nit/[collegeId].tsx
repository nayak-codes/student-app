import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';


import { FontAwesome5 } from '@expo/vector-icons';



import React, { useState } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import colleges from '../data/colleges.json';


function getCourseIcon(course: string) {
  if (course.includes("Computer")) return <FontAwesome5 name="laptop-code" size={18} color="#479815ff" />;
  if (course.includes("Electrical")) return <MaterialIcons name="bolt" size={18} color="#159895" />;
  if (course.includes("Mechanical")) return <FontAwesome5 name="cogs" size={18} color="#611598ff" />;
  if (course.includes("Dual")) return <MaterialIcons name="sync-alt" size={18} color="#159895" />;
  if (course.includes("M.Tech")) return <MaterialIcons name="engineering" size={18} color="#983615ff" />;
  if (course.includes("MBA")) return <FontAwesome5 name="business-time" size={18} color="#98155fff" />;
  if (course.includes("M.Sc")) return <FontAwesome5 name="flask" size={18} color="#159895" />;
  if (course.includes("Ph.D")) return <FontAwesome5 name="user-graduate" size={18} color="#159895" />;
  return <MaterialIcons name="school" size={18} color="#159895" />;
}

function handleCoursePress(course: string) {
  // You can replace this with navigation or modal logic
  alert(`More details about: ${course}`);
}

const localImages: { [key: string]: any } = {
  iitb: require('@/assets/images/IIT-Bombay-main-building.webp'),
  

  


  // future lo vere colleges vunte ikkad add cheyyi:
  // iitd: require('@/assets/images/IIT-Delhi.webp')
}



const { width } = Dimensions.get('window');

const TABS = [
  { name: 'About', icon: 'info' },
  { name: 'Courses', icon: 'menu-book' },
  { name: 'Admissions', icon: 'school' },
  { name: 'Rankings', icon: 'star' },
  { name: 'Placements', icon: 'work' },
  { name: 'Facilities', icon: 'apartment' },
  { name: 'Gallery', icon: 'photo-library' },
  { name: 'Contact', icon: 'contact-mail' },
  { name: 'FAQs', icon: 'question-answer' },
];


export default function CollegeProfile() {
  const { collegeId } = useLocalSearchParams();
  const [selectedTab, setSelectedTab] = useState('About');
  const college = colleges.find((item) => item.id === collegeId);

  if (!college) {
    return (
      <View style={styles.center}>
        <MaterialIcons name="error-outline" size={40} color="#ff6b6b" />
        <Text style={styles.errorText}>College not found</Text>
      </View>
    );
  }
const renderAbout = () => (
  <View style={styles.aboutContainer}>
    {/* Header - Pulls from college.name/location */}
   <View>
    <Text style={styles.sectionHeaderWithIcon}>
      <MaterialIcons name="photo-library" size={20} color="#159895" /> Gallery
    </Text>
    <ScrollView horizontal>
      {(college.gallery || []).map((img, idx) => {
        const isUrl = img.startsWith?.("http");
        const source = isUrl ? { uri: img } : localImages[img];

        return (
          <Image
            key={idx}
            source={source}
            style={{
              width: 200,
              height: 120,
              marginRight: 10,
              borderRadius: 8,
              backgroundColor: "#ddd"
            }}
          />
        );
      })}
    </ScrollView>
  </View>

    {/* Key Facts - Dynamic */}
   <View style={styles.factsContainer}>
   

  <View style={styles.factCard}>
    <MaterialIcons name="calendar-today" size={20} color="#4CAF50" />
    <Text style={styles.factText}>Est: {college.established}</Text>
  </View>


  
  <View style={styles.factCard}>
    <MaterialIcons name="school" size={20} color="#1976D2" />
    <Text style={styles.factText}>NIRF: #{college.rank}</Text>
  </View>

   
  <View style={styles.factCard}>
    <MaterialIcons name="star" size={20} color="#FFD700" />
    <Text style={styles.factText}>Type : {college.type}</Text>
  </View>

  

  
  <View style={styles.factCard}>
    <MaterialIcons name="apartment" size={20} color="#9C27B0" />
    <Text style={styles.factText}>City: {college.city}</Text>
  </View>
</View>


    {/* Introduction - From JSON */}
    <Text style={styles.sectionTitle}>About:</Text>
    <Text style={styles.sectionText}>
      {college.about?.introduction || 'No description available.'}
    </Text>



    <Text style={styles.sectionTitle}>Student life:</Text>
    <Text style={styles.sectionText}>
      {college.about?.student_life || 'No description available.'}
    </Text>

    <Text style={styles.sectionTitle}>RANKS:</Text>
    <Text style={styles.sectionText}>
      {college.about?.accreditation_affiliation || 'No description available.'}
    </Text>


    <Text style={styles.sectionTitle}>Infrastucture:</Text>
    <Text style={styles.sectionText}>
      {college.about?.campus_infrastructure || 'No description available.'}
    </Text>

    <Text style={styles.sectionTitle}>excellence:</Text>
    <Text style={styles.sectionText}>
      {college.about?.excellence || 'No description available.'}
    </Text>


    <Text style={styles.sectionTitle}>mission:</Text>
    <Text style={styles.sectionText}>
      {college.about?.mission || 'No description available.'}
    </Text>

    <Text style={styles.sectionTitle}>location:</Text>
    <Text style={styles.sectionText}>
      {college.about?.location || 'No description available.'}
    </Text>

        {/* History - From JSON */}
    <Text style={styles.sectionTitle}>History</Text>
    <Text style={styles.sectionText}>
      {college.about?.history || 'No history available.'}
    </Text>

    <Text style={styles.sectionTitle}>website:</Text>
    <Text style={styles.sectionText}>
      {college.about?.website || 'No description available.'}
    </Text>


  </View>
);


const renderAdmissions = () => (
  <View style={styles.admissionContainer}>
    {/* Admission Process Section */}
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionHeaderWithIcon}>
        <MaterialIcons name="school" size={20} color="#159895" /> Admission Process
      </Text>
      <View style={styles.admissionCard}>
        <Text style={styles.admissionSubheader}>Undergraduate (UG):</Text>
        <Text style={styles.admissionContent}>
          • JEE Advanced rank + JoSAA counseling
        </Text>
        
        <Text style={styles.admissionSubheader}>Postgraduate (PG):</Text>
        <Text style={styles.admissionContent}>
          • GATE/CAT/IIT JAM + interview
        </Text>
      </View>
    </View>

    {/* Important Dates Section */}
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionHeaderWithIcon}>
        <MaterialIcons name="date-range" size={20} color="#159895" /> Important Dates
      </Text>
      <View style={styles.admissionCard}>
        <Text style={styles.admissionSubheader}>Undergraduate (UG):</Text>
        <Text style={styles.admissionContent}>
          • JEE Advanced: April-May{"\n"}
          • JoSAA counseling: June-July
        </Text>
        
        <Text style={styles.admissionSubheader}>Postgraduate (PG):</Text>
        <Text style={styles.admissionContent}>
          • Applications: December-January{"\n"}
          • Interviews: March-April
        </Text>
      </View>
    </View>
  </View>
);

const renderCourses = () => (
  <View>
    <Text style={styles.sectionHeaderWithIcon}>
      <MaterialIcons name="school" size={20} color="#159895" /> Undergraduate Programs
    </Text>
    <Text style={styles.sectionDescription}>
      Explore 4-year B.Tech and integrated dual degree programs.
    </Text>
    {(college.courses?.undergraduate || []).length === 0 ? (
      <Text style={styles.emptyState}>No undergraduate programs listed.</Text>
    ) : (
      (college.courses?.undergraduate || []).map((course, idx) => (
        <TouchableOpacity key={idx} style={styles.courseCard} onPress={() => handleCoursePress(course)}>
          <View style={styles.courseIcon}>{getCourseIcon(course)}</View>
          <Text style={styles.courseTitle}>{course}</Text>
        </TouchableOpacity>
      ))
    )}

    <Text style={styles.sectionHeaderWithIcon}>
      <MaterialIcons name="history-edu" size={20} color="#159895" /> Postgraduate Programs
    </Text>
    <Text style={styles.sectionDescription}>
      Advanced M.Tech, MBA, and research programs for graduates.
    </Text>
    {(college.courses?.postgraduate || []).length === 0 ? (
      <Text style={styles.emptyState}>No postgraduate programs listed.</Text>
    ) : (
      (college.courses?.postgraduate || []).map((course, idx) => (
        <TouchableOpacity key={idx} style={styles.courseCard} onPress={() => handleCoursePress(course)}>
          <View style={styles.courseIcon}>{getCourseIcon(course)}</View>
          <Text style={styles.courseTitle}>{course}</Text>
        </TouchableOpacity>
      ))
    )}
  </View>
);

const renderRankings = () => (
  <View style={styles.rankingContainer}>
    <Text style={styles.sectionHeaderWithIcon}>
      <MaterialIcons name="star" size={20} color="#159895" /> Rankings & Excellence
    </Text>
    
    <View style={styles.rankingCard}>
      <View style={styles.rankingBadge}>
        <Text style={styles.rankingPosition}>
          {college.rankings?.position || 'Rank'}
        </Text>
        <Text style={styles.rankingSource}>
          {college.rankings?.source || 'Source'}
        </Text>
      </View>
      
      <View style={styles.rankingContent}>
        <Text style={styles.rankingDescription}>
          {college.rankings?.description || 'Ranking description not available'}
        </Text>
        
        {college.rankings?.excellence_areas && (
          <View style={styles.excellenceSection}>
            <Text style={styles.excellenceTitle}>Centers of Excellence:</Text>
            <View style={styles.excellencePills}>
              {college.rankings.excellence_areas.map((area, index) => (
                <View style={styles.pill} key={index}>
                  <Text style={styles.pillText}>{area}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </View>
  </View>
);

const renderPlacements = () => (
  <View>
    <Text style={styles.sectionHeaderWithIcon}>
      <MaterialIcons name="work" size={20} color="#159895" /> Placements
    </Text>
    <Text style={styles.aboutCardContent}>
      Highest Package: {college.placement?.highest_package || 'N/A'}
    </Text>
    <Text style={styles.aboutCardContent}>
      Average Package: {college.placement?.average_package || 'N/A'}
    </Text>
    <Text style={styles.sectionHeaderWithIcon}>
      <MaterialIcons name="business" size={20} color="#159895" /> Top Recruiters
    </Text>
    {(college.placement?.top_recruiters || []).map((recruiter, idx) => (
      <Text key={idx} style={styles.aboutCardContent}>{recruiter}</Text>
    ))}
  </View>
);

const renderFacilities = () => (
  <View>
    <Text style={styles.sectionHeaderWithIcon}>
      <MaterialIcons name="apartment" size={20} color="#159895" /> Facilities
    </Text>
    {(college.facilities || []).map((facility, idx) => (
      <Text key={idx} style={styles.aboutCardContent}>{facility}</Text>
    ))}
  </View>
);

const renderGallery = () => (
  <View>
    <Text style={styles.sectionHeaderWithIcon}>
      <MaterialIcons name="photo-library" size={20} color="#159895" /> Gallery
    </Text>
    <ScrollView horizontal>
      {(college.gallery || []).map((img, idx) => {
        const isUrl = img.startsWith?.("http");
        const source = isUrl ? { uri: img } : localImages[img];

        return (
          <Image
            key={idx}
            source={source}
            style={{
              width: 200,
              height: 120,
              marginRight: 10,
              borderRadius: 8,
              backgroundColor: "#ddd"
            }}
          />
        );
      })}
    </ScrollView>
  </View>
);





const renderContact = () => (
  <View>
    <Text style={styles.sectionHeaderWithIcon}>
      <MaterialIcons name="contact-mail" size={20} color="#159895" /> Contact
    </Text>
    <Text style={styles.aboutCardContent}>Email: {college.contact?.email || 'N/A'}</Text>
    <Text style={styles.aboutCardContent}>Phone: {college.contact?.phone || 'N/A'}</Text>
    <Text style={styles.aboutCardContent}>Website: {college.contact?.website || 'N/A'}</Text>
    <Text style={styles.aboutCardContent}>Address: {college.contact?.address || 'N/A'}</Text>
  </View>
);


const renderFAQs = () => (
  <View>
    <Text style={styles.sectionHeaderWithIcon}>
      <MaterialIcons name="help-outline" size={20} color="#159895" /> FAQs
    </Text>
    {(college.faqs || []).map((faq, idx) => (
      <View key={idx} style={styles.faqCard}>
        <Text style={styles.faqQuestion}>Q: {faq.question}</Text>
        <Text style={styles.faqAnswer}>A: {faq.answer}</Text>
      </View>
    ))}
  </View>
);

  // ... Implement renderAdmissions, renderRankings, renderPlacements, renderFacilities, renderGallery, renderContact similarly ...

  // --- Main Render ---
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image
          source={{ uri: college.image }}
          style={styles.banner}
          resizeMode="cover"
        />
        <View style={styles.headerContent}>
          <Text style={styles.name}>{college.name}</Text>
          <View style={styles.locationRow}>
            <MaterialIcons name="location-on" size={16} color="#159895" style={{ marginRight: 5 }} />
            <Text style={styles.location}>{college.location}</Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer}>
          <View style={styles.tabs}>
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab.name}
                style={[styles.tab, selectedTab === tab.name && styles.tabActive]}
                onPress={() => setSelectedTab(tab.name)}
                activeOpacity={0.7}
              >
                <MaterialIcons name={tab.icon} size={18} color={selectedTab === tab.name ? '#fff' : '#1a5f7a'} style={{ marginRight: 6 }} />
                <Text style={[styles.tabText, selectedTab === tab.name && styles.tabTextActive]}>{tab.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
       <View style={styles.sectionBox}>
  {selectedTab === 'About' && renderAbout()}
  {selectedTab === 'Courses' && renderCourses()}
  {selectedTab === 'Admissions' && renderAdmissions()}
  {selectedTab === 'Rankings' && renderRankings()}
  {selectedTab === 'Placements' && renderPlacements()}
  {selectedTab === 'Facilities' && renderFacilities()}
  {selectedTab === 'Gallery' && renderGallery()}
  {selectedTab === 'Contact' && renderContact()}
  {selectedTab === 'FAQs' && renderFAQs()}
</View>
      </ScrollView>
      <View style={styles.bottomBar}>
        <Text style={styles.bottomBarText}>StudentVerse - Your Complete College Guide</Text>
      </View>
    </View>
  );
}
// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    position: 'relative',
    paddingBottom: 80,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#333',
    marginTop: 10,
    textAlign: 'center',
  },
  banner: {
    width: width,
    height: 220,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginBottom: 12,
  },
  headerContent: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  location: {
    fontSize: 16,
    color: '#444',
    textAlign: 'center',
  },
  tabsContainer: {
    marginVertical: 15,
    paddingHorizontal: 10,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 8,
  },


  tabText: {
    color: '#1a5f7a',
    fontWeight: '500',
    fontSize: 14,
  },
  tabTextActive: {
    color: '#fff',
  },

  sectionHeaderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },

  institutionHeader: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  institutionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 10,
  },
  institutionBadgeText: {
    color: '#1565c0',
    fontSize: 14,
    fontWeight: '500',
  },
  institutionName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a5f7a',
    marginVertical: 10,
    textAlign: 'center',
  },
  institutionAffiliation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  institutionAffiliationText: {
    color: '#666',
    fontSize: 15,
  },
  accreditationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    borderLeftWidth: 4,
    borderLeftColor: '#2e7d32',
    padding: 15,
    borderRadius: 8,
    marginVertical: 20,
  },
  accreditationTitle: {
    color: '#1b5e20',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 2,
  },
  accreditationDesc: {
    color: '#666',
    fontSize: 14,
  },
  aboutCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  aboutCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  aboutCardHeaderText: {
    color: '#1a5f7a',
    fontSize: 18,
    fontWeight: '700',
  },
  aboutCardContent: {
    marginBottom: 15,
    color: '#444',
    fontSize: 15,
    lineHeight: 22,
  },
  campusHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
    marginTop: 15,
  },
  campusHighlightText: {
    color: '#444',
    fontSize: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginVertical: 15,
    justifyContent: 'space-between',
  },
  statItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    width: '47%',
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#159895',
    position: 'relative',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a5f7a',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
  },
  statIcon: {
    fontSize: 24,
    position: 'absolute',
    right: 10,
    bottom: 10,
    opacity: 0.2,
  },
  highlightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff8e1',
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
    padding: 12,
    borderRadius: 8,
    marginVertical: 15,
  },
  highlightBoxText: {
    color: '#444',
    fontSize: 15,
    flex: 1,
  },
  featureList: {
    marginTop: 15,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 15,
    width: 30,
    textAlign: 'center',
  },
  featureText: {
    flex: 1,
    color: '#444',
    fontSize: 15,
  },

  courseTitle: {
    fontWeight: '600',
    color: '#1a5f7a',
    marginBottom: 5,
    flexDirection: 'row',
    alignItems: 'center',
    fontSize: 16,
  },
  emoji: {
    fontSize: 20,
    marginRight: 10,
  },
  courseMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 13,
    color: '#666',
  },
 
  admissionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 12,
  },
  admissionCardHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  admissionDetailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  admissionDetailText: {
    fontSize: 15,
    color: '#444',
    flex: 1,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    padding: 16,
    margin: 16,
    borderRadius: 8,
  },
  infoBoxText: {
    fontSize: 14,
    color: '#1565c0',
    flex: 1,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
    backgroundColor: '#1a5f7a',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    elevation: 8,
  },
  bottomBarText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingBottom: 80,
  },

  aboutMainCard: {
  backgroundColor: '#fff',
  borderRadius: 16,
  padding: 20,
  marginBottom: 16,
  alignItems: 'center',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 6,
  elevation: 3,
},
establishedRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 8,
},
establishedText: {
  marginLeft: 8,
  color: '#1976d2',
  fontWeight: '600',
},
collegeTitle: {
  fontSize: 22,
  fontWeight: 'bold',
  color: '#1a5f7a',
  textAlign: 'center',
  marginVertical: 8,
},
affiliationRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 8,
},
affiliationText: {
  marginLeft: 8,
  color: '#388e3c',
  fontSize: 15,
},
accreditationCard: {
  backgroundColor: '#e8f5e9',
  borderRadius: 12,
  padding: 16,
  marginBottom: 16,
  alignItems: 'center',
  flexDirection: 'row',
  gap: 10,
},


sectionCard: {
  backgroundColor: '#f5f7fa',
  borderRadius: 12,
  padding: 16,
  marginBottom: 16,
},

sectionContent: {
  color: '#444',
  fontSize: 15,
},



  aboutContainer: { padding: 16 },
  collegeHeader: { marginBottom: 20, alignItems: 'center' },
  collegeName: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: '#1a5f7a', 
    textAlign: 'center' 
  },
  collegeLocation: { 
    fontSize: 16, 
    color: '#666', 
    marginTop: 4 
  },
 factsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },

  factText: {
    fontSize: 14,
    color: '#333',
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: '#1a5f7a', 
    marginBottom: 12 
  },
  sectionText: { 
    fontSize: 15, 
    lineHeight: 22, 
    color: '#444', 
    marginBottom: 20 
  },


  sectionDescription: {
    fontSize: 13,
    color: '#555',
    marginBottom: 8,
    marginLeft: 4,
  },

  courseIcon: {
    marginRight: 10,
  },

  emptyState: {
    color: '#888',
    fontStyle: 'italic',
    marginLeft: 8,
    marginBottom: 8,
  },
  courseCard: {
  backgroundColor: '#f9f9f9',
  borderRadius: 8,
  padding: 15,
  marginBottom: 12,
  flexDirection: 'row',      // <-- Add this
  alignItems: 'center',      // <-- Add this
},

  // ... existing code ...

  // Card shadow enhancement
  sectionBox: {
    backgroundColor: '#fff',
    borderRadius: 16, // more rounded
    padding: 24,      // more padding
    margin: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },

  // Button/tab enhancement
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: '#e8f3f1',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#d1e7e4',
    // Add shadow for active tab
  },
  tabActive: {
    backgroundColor: '#159895',
    borderColor: '#159895',
    shadowColor: '#159895',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },

  // Add a pressable effect (for TouchableOpacity)
  tabPressable: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },

  // Fact card enhancement
  factCard: {
    width: '48%',
    backgroundColor: '#f0f4f8',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },

  // Add a modern font (if available)
  name: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1a5f7a',
    marginTop: 10,
    textAlign: 'center',
    fontFamily: 'Inter', // or your preferred font
  },

    admissionContainer: {
    marginBottom: 20,
  },
  sectionContainer: {
    marginBottom: 15,
  },
  admissionCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#159895',
  },
  admissionSubheader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 8,
    marginBottom: 4,
  },
  admissionContent: {
    fontSize: 14,
    color: '#34495e',
    lineHeight: 20,
    marginLeft: 8,
  },
  sectionHeaderWithIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },


   rankingContainer: {
    marginBottom: 20,
  },
  rankingCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: '#159895',
  },
  rankingBadge: {
    backgroundColor: '#159895',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  rankingPosition: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  rankingSource: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  rankingContent: {
    flex: 1,
  },
  rankingDescription: {
    fontSize: 14,
    color: '#34495e',
    lineHeight: 20,
    marginBottom: 12,
  },
  excellenceSection: {
    marginTop: 8,
  },
  excellenceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  excellencePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    backgroundColor: '#e0f7fa',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#b2ebf2',
  },
  pillText: {
    fontSize: 12,
    color: '#006064',
    fontWeight: '500',
  },

  faqCard: {
  marginVertical: 8,
  padding: 10,
  backgroundColor: '#f5f5f5',
  borderRadius: 8,
},
faqQuestion: {
  fontWeight: 'bold',
  marginBottom: 4,
},
faqAnswer: {
  color: '#333',
},



  // ... rest of your styles ...

});