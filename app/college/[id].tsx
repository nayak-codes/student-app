// Ultra-Professional College Detail Page with Comprehensive Information
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AdmissionCalculator from '../../src/components/AdmissionCalculator';
import {
  AlumniSection,
  FAQSection,
  FeeStructureSection,
  ScholarshipsSection,
  TestimonialsSection,
} from '../../src/components/PremiumSections';
import { College, getCollegeById } from '../../src/services/collegeService';

const { width } = Dimensions.get('window');

export default function CollegeProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const collegeId = params.id as string;

  const [college, setCollege] = useState<College | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'admissions' | 'placements' | 'campus'>('overview');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  useEffect(() => {
    loadCollege();
  }, [collegeId]);

  const loadCollege = async () => {
    try {
      const data = await getCollegeById(collegeId);
      setCollege(data);
    } catch (error) {
      console.error('Error loading college:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading college details...</Text>
      </View>
    );
  }

  if (!college) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text style={styles.errorText}>College not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const selectedCourseData = college.courses[selectedCourse];
  const latestPlacement = college.placements[0];
  const latestCutoff = selectedCourseData?.cutoffs?.[0];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <ImageBackground
        source={{ uri: college.images?.[0] || 'https://images.unsplash.com/photo-1562774053-701939374585?w=800' }}
        style={styles.hero}
        imageStyle={styles.heroImage}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
          style={styles.heroOverlay}
        >
          <View style={styles.heroHeader}>
            <TouchableOpacity onPress={() => router.back()} style={styles.heroButton}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.heroActions}>
              <TouchableOpacity style={styles.heroButton}>
                <Ionicons name="share-outline" size={22} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.heroButton}
                onPress={() => setIsBookmarked(!isBookmarked)}
              >
                <Ionicons
                  name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                  size={22}
                  color="#FFF"
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.heroContent}>
            <View style={styles.heroBadges}>
              {college.category && (
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>{college.category}</Text>
                </View>
              )}
              {college.type && (
                <View style={[styles.heroBadge, { backgroundColor: 'rgba(147,51,234,0.9)' }]}>
                  <Text style={styles.heroBadgeText}>{college.type}</Text>
                </View>
              )}
              {college.ranking?.nirf && (
                <View style={[styles.heroBadge, styles.rankBadge]}>
                  <Ionicons name="trophy" size={14} color="#FFF" />
                  <Text style={styles.heroBadgeText}>NIRF #{college.ranking.nirf}</Text>
                </View>
              )}
            </View>

            <Text style={styles.heroTitle}>{college.name}</Text>
            <View style={styles.heroLocation}>
              <Ionicons name="location" size={16} color="rgba(255,255,255,0.9)" />
              <Text style={styles.heroLocationText}>
                {college.location}, {college.state}
              </Text>
            </View>
            <Text style={styles.heroTagline}>
              Est. {college.established} • Excellence in Education
            </Text>
          </View>
        </LinearGradient>
      </ImageBackground>

      {/* Verification Badge */}
      <View style={styles.verificationBanner}>
        <Ionicons name="shield-checkmark" size={20} color="#10B981" />
        <Text style={styles.verificationText}>
          Verified Institution • NAAC Accredited • Approved by AICTE
        </Text>
      </View>

      {/* Key Highlights */}
      <View style={styles.highlightsSection}>
        <View style={styles.highlightCard}>
          <View style={[styles.highlightIcon, { backgroundColor: '#EEF2FF' }]}>
            <Ionicons name="school-outline" size={28} color="#4F46E5" />
          </View>
          <Text style={styles.highlightValue}>{college.established}</Text>
          <Text style={styles.highlightLabel}>Established</Text>
        </View>

        <View style={styles.highlightCard}>
          <View style={[styles.highlightIcon, { backgroundColor: '#F0FDF4' }]}>
            <Ionicons name="people-outline" size={28} color="#10B981" />
          </View>
          <Text style={styles.highlightValue}>{college.courses.length}+</Text>
          <Text style={styles.highlightLabel}>Programs</Text>
        </View>

        <View style={styles.highlightCard}>
          <View style={[styles.highlightIcon, { backgroundColor: '#FFF7ED' }]}>
            <Ionicons name="trophy-outline" size={28} color="#F59E0B" />
          </View>
          <Text style={styles.highlightValue}>{latestPlacement?.placementPercentage || 0}%</Text>
          <Text style={styles.highlightLabel}>Placed</Text>
        </View>

        <View style={styles.highlightCard}>
          <View style={[styles.highlightIcon, { backgroundColor: '#FEF2F2' }]}>
            <MaterialIcons name="star-rate" size={28} color="#EF4444" />
          </View>
          <Text style={styles.highlightValue}>{college.ranking?.nirf || 'N/A'}</Text>
          <Text style={styles.highlightLabel}>NIRF Rank</Text>
        </View>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
          onPress={() => setActiveTab('overview')}
        >
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={activeTab === 'overview' ? '#FFF' : '#64748B'}
          />
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
            Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'admissions' && styles.tabActive]}
          onPress={() => setActiveTab('admissions')}
        >
          <Ionicons
            name="school-outline"
            size={20}
            color={activeTab === 'admissions' ? '#FFF' : '#64748B'}
          />
          <Text style={[styles.tabText, activeTab === 'admissions' && styles.tabTextActive]}>
            Admissions
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'placements' && styles.tabActive]}
          onPress={() => setActiveTab('placements')}
        >
          <Ionicons
            name="briefcase-outline"
            size={20}
            color={activeTab === 'placements' ? '#FFF' : '#64748B'}
          />
          <Text style={[styles.tabText, activeTab === 'placements' && styles.tabTextActive]}>
            Placements
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'campus' && styles.tabActive]}
          onPress={() => setActiveTab('campus')}
        >
          <MaterialIcons
            name="location-city"
            size={20}
            color={activeTab === 'campus' ? '#FFF' : '#64748B'}
          />
          <Text style={[styles.tabText, activeTab === 'campus' && styles.tabTextActive]}>
            Campus Life
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Tab Content */}
      <View style={styles.tabContent}>
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <>
            {/* About */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="info-outline" size={24} color="#4F46E5" />
                <Text style={styles.sectionTitle}>About the Institution</Text>
              </View>
              <View style={styles.aboutCard}>
                <Text style={styles.description}>{college.description}</Text>
              </View>
            </View>

            {/* Rankings & Accreditations */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="workspace-premium" size={24} color="#4F46E5" />
                <Text style={styles.sectionTitle}>Rankings & Accreditations</Text>
              </View>
              <View style={styles.rankingsGrid}>
                {college.ranking?.nirf && (
                  <View style={styles.rankingCard}>
                    <Text style={styles.rankingBadge}>NIRF</Text>
                    <Text style={styles.rankingValue}>#{college.ranking.nirf}</Text>
                    <Text style={styles.rankingLabel}>India Ranking 2024</Text>
                  </View>
                )}
                {college.ranking?.qs && (
                  <View style={styles.rankingCard}>
                    <Text style={styles.rankingBadge}>QS</Text>
                    <Text style={styles.rankingValue}>#{college.ranking.qs}</Text>
                    <Text style={styles.rankingLabel}>World Ranking</Text>
                  </View>
                )}
                <View style={styles.rankingCard}>
                  <Text style={styles.rankingBadge}>NAAC</Text>
                  <Text style={styles.rankingValue}>A++</Text>
                  <Text style={styles.rankingLabel}>Accreditation</Text>
                </View>
                <View style={styles.rankingCard}>
                  <Text style={styles.rankingBadge}>NBA</Text>
                  <Text style={styles.rankingValue}>✓</Text>
                  <Text style={styles.rankingLabel}>Accredited</Text>
                </View>
              </View>
            </View>

            {/* Facilities */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="business" size={24} color="#4F46E5" />
                <Text style={styles.sectionTitle}>World-Class Facilities</Text>
              </View>
              <View style={styles.facilitiesGrid}>
                {college.facilities.map((facility, index) => (
                  <View key={index} style={styles.facilityItem}>
                    <View style={styles.facilityIconContainer}>
                      <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                    </View>
                    <Text style={styles.facilityText}>{facility}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Why Choose This College */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="star-outline" size={24} color="#4F46E5" />
                <Text style={styles.sectionTitle}>Why Choose {college.name}?</Text>
              </View>
              <View style={styles.whyChooseGrid}>
                <View style={styles.whyChooseCard}>
                  <View style={styles.whyChooseIcon}>
                    <MaterialIcons name="verified" size={24} color="#10B981" />
                  </View>
                  <Text style={styles.whyChooseTitle}>Quality Education</Text>
                  <Text style={styles.whyChooseText}>
                    Top-tier faculty and industry-aligned curriculum
                  </Text>
                </View>

                <View style={styles.whyChooseCard}>
                  <View style={styles.whyChooseIcon}>
                    <MaterialIcons name="trending-up" size={24} color="#3B82F6" />
                  </View>
                  <Text style={styles.whyChooseTitle}>Excellent ROI</Text>
                  <Text style={styles.whyChooseText}>
                    High placement rates with top packages
                  </Text>
                </View>

                <View style={styles.whyChooseCard}>
                  <View style={styles.whyChooseIcon}>
                    <MaterialIcons name="science" size={24} color="#F59E0B" />
                  </View>
                  <Text style={styles.whyChooseTitle}>Research Focus</Text>
                  <Text style={styles.whyChooseText}>
                    State-of-the-art labs and research centers
                  </Text>
                </View>

                <View style={styles.whyChooseCard}>
                  <View style={styles.whyChooseIcon}>
                    <MaterialIcons name="groups" size={24} color="#EF4444" />
                  </View>
                  <Text style={styles.whyChooseTitle}>Global Network</Text>
                  <Text style={styles.whyChooseText}>
                    Strong alumni network across the world
                  </Text>
                </View>
              </View>
            </View>

            {/* Premium Sections */}
            <AlumniSection collegeName={college.name} />
            <TestimonialsSection />
            <FAQSection expandedFAQ={expandedFAQ} setExpandedFAQ={setExpandedFAQ} />
            <FeeStructureSection />
            <ScholarshipsSection />
          </>
        )}

        {/* ADMISSIONS TAB */}
        {activeTab === 'admissions' && (
          <>
            {/* Admission Process */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="school" size={24} color="#4F46E5" />
                <Text style={styles.sectionTitle}>Admission Process</Text>
              </View>
              <View style={styles.processCard}>
                <View style={styles.processStep}>
                  <View style={styles.processNumber}>
                    <Text style={styles.processNumberText}>1</Text>
                  </View>
                  <View style={styles.processContent}>
                    <Text style={styles.processTitle}>Entrance Exam</Text>
                    <Text style={styles.processText}>
                      Appear for JEE Advanced / NEET / State CET
                    </Text>
                  </View>
                </View>

                <View style={styles.processStep}>
                  <View style={styles.processNumber}>
                    <Text style={styles.processNumberText}>2</Text>
                  </View>
                  <View style={styles.processContent}>
                    <Text style={styles.processTitle}>Counseling</Text>
                    <Text style={styles.processText}>
                      Participate in JoSAA / State counseling rounds
                    </Text>
                  </View>
                </View>

                <View style={styles.processStep}>
                  <View style={styles.processNumber}>
                    <Text style={styles.processNumberText}>3</Text>
                  </View>
                  <View style={styles.processContent}>
                    <Text style={styles.processTitle}>Document Verification</Text>
                    <Text style={styles.processText}>
                      Submit required documents for verification
                    </Text>
                  </View>
                </View>

                <View style={styles.processStep}>
                  <View style={styles.processNumber}>
                    <Text style={styles.processNumberText}>4</Text>
                  </View>
                  <View style={styles.processContent}>
                    <Text style={styles.processTitle}>Fee Payment & Admission</Text>
                    <Text style={styles.processText}>
                      Pay fees and confirm your admission
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Courses */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="menu-book" size={24} color="#4F46E5" />
                <Text style={styles.sectionTitle}>Programs Offered</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.courseTabs}>
                {college.courses.map((course, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.courseTab, selectedCourse === index && styles.courseTabActive]}
                    onPress={() => setSelectedCourse(index)}
                  >
                    <Text style={[styles.courseTabText, selectedCourse === index && styles.courseTabTextActive]}>
                      {course.branchCode}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.courseDetailsCard}>
                <Text style={styles.courseName}>{selectedCourseData.name}</Text>
                <View style={styles.courseInfoGrid}>
                  <View style={styles.courseInfoItem}>
                    <Ionicons name="people" size={20} color="#4F46E5" />
                    <Text style={styles.courseInfoLabel}>Total Seats</Text>
                    <Text style={styles.courseInfoValue}>{selectedCourseData.seats}</Text>
                  </View>
                  <View style={styles.courseInfoItem}>
                    <Ionicons name="time" size={20} color="#10B981" />
                    <Text style={styles.courseInfoLabel}>Duration</Text>
                    <Text style={styles.courseInfoValue}>{selectedCourseData.duration}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Admission Calculator */}
            {latestCutoff && (
              <AdmissionCalculator
                cutoff={latestCutoff.general}
                branchName={selectedCourseData.name}
              />
            )}

            {/* Cutoff Trends */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="trending-up" size={24} color="#4F46E5" />
                <Text style={styles.sectionTitle}>Cutoff Trends & Analysis</Text>
              </View>
              {selectedCourseData.cutoffs && selectedCourseData.cutoffs.length > 0 ? (
                <View style={styles.cutoffContainer}>
                  {selectedCourseData.cutoffs.map((cutoff, index) => (
                    <View key={index} style={styles.cutoffCard}>
                      <View style={styles.cutoffHeader}>
                        <Text style={styles.cutoffYear}>Year {cutoff.year}</Text>
                        {index === 0 && (
                          <View style={styles.latestBadge}>
                            <Text style={styles.latestBadgeText}>Latest</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.cutoffGrid}>
                        <View style={styles.cutoffItem}>
                          <Text style={styles.cutoffLabel}>General</Text>
                          <Text style={[styles.cutoffValue, { color: '#4F46E5' }]}>{cutoff.general}</Text>
                        </View>
                        <View style={styles.cutoffItem}>
                          <Text style={styles.cutoffLabel}>EWS</Text>
                          <Text style={[styles.cutoffValue, { color: '#10B981' }]}>{cutoff.ews}</Text>
                        </View>
                        <View style={styles.cutoffItem}>
                          <Text style={styles.cutoffLabel}>OBC</Text>
                          <Text style={[styles.cutoffValue, { color: '#F59E0B' }]}>{cutoff.obc}</Text>
                        </View>
                        <View style={styles.cutoffItem}>
                          <Text style={styles.cutoffLabel}>SC</Text>
                          <Text style={[styles.cutoffValue, { color: '#EF4444' }]}>{cutoff.sc}</Text>
                        </View>
                        <View style={styles.cutoffItem}>
                          <Text style={styles.cutoffLabel}>ST</Text>
                          <Text style={[styles.cutoffValue, { color: '#8B5CF6' }]}>{cutoff.st}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.noDataCard}>
                  <Ionicons name="alert-circle-outline" size={48} color="#CBD5E1" />
                  <Text style={styles.noDataText}>Cutoff data not available</Text>
                </View>
              )}
            </View>

            {/* Important Dates */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="event" size={24} color="#4F46E5" />
                <Text style={styles.sectionTitle}>Important Dates 2024-25</Text>
              </View>
              <View style={styles.datesCard}>
                <View style={styles.dateItem}>
                  <View style={styles.dateIcon}>
                    <Ionicons name="calendar-outline" size={20} color="#4F46E5" />
                  </View>
                  <View style={styles.dateContent}>
                    <Text style={styles.dateLabel}>Application Start</Text>
                    <Text style={styles.dateValue}>April 2025</Text>
                  </View>
                </View>

                <View style={styles.dateItem}>
                  <View style={styles.dateIcon}>
                    <Ionicons name="calendar-outline" size={20} color="#10B981" />
                  </View>
                  <View style={styles.dateContent}>
                    <Text style={styles.dateLabel}>Entrance Exam</Text>
                    <Text style={styles.dateValue}>May 2025</Text>
                  </View>
                </View>

                <View style={styles.dateItem}>
                  <View style={styles.dateIcon}>
                    <Ionicons name="calendar-outline" size={20} color="#F59E0B" />
                  </View>
                  <View style={styles.dateContent}>
                    <Text style={styles.dateLabel}>Counseling</Text>
                    <Text style={styles.dateValue}>June-July 2025</Text>
                  </View>
                </View>

                <View style={styles.dateItem}>
                  <View style={styles.dateIcon}>
                    <Ionicons name="calendar-outline" size={20} color="#EF4444" />
                  </View>
                  <View style={styles.dateContent}>
                    <Text style={styles.dateLabel}>Classes Begin</Text>
                    <Text style={styles.dateValue}>August 2025</Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        )}

        {/* PLACEMENTS TAB */}
        {activeTab === 'placements' && (
          <>
            {/* Placement Highlights */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="work-outline" size={24} color="#4F46E5" />
                <Text style={styles.sectionTitle}>Placement Highlights {latestPlacement?.year}</Text>
              </View>

              <View style={styles.placementHighlights}>
                <View style={[styles.placementHighlightCard, { backgroundColor: '#EEF2FF' }]}>
                  <Ionicons name="cash" size={32} color="#4F46E5" />
                  <Text style={styles.placementValue}>{latestPlacement?.averagePackage || 'N/A'}</Text>
                  <Text style={styles.placementLabel}>Average Package</Text>
                  <View style={styles.placementTrend}>
                    <Ionicons name="trending-up" size={14} color="#10B981" />
                    <Text style={styles.placementTrendText}>+12% from last year</Text>
                  </View>
                </View>

                <View style={[styles.placementHighlightCard, { backgroundColor: '#F0FDF4' }]}>
                  <Ionicons name="trophy" size={32} color="#10B981" />
                  <Text style={styles.placementValue}>{latestPlacement?.highestPackage || 'N/A'}</Text>
                  <Text style={styles.placementLabel}>Highest Package</Text>
                  <View style={styles.placementTrend}>
                    <Ionicons name="trending-up" size={14} color="#10B981" />
                    <Text style={styles.placementTrendText}>International Offer</Text>
                  </View>
                </View>

                <View style={[styles.placementHighlightCard, { backgroundColor: '#FFF7ED' }]}>
                  <Ionicons name="stats-chart" size={32} color="#F59E0B" />
                  <Text style={styles.placementValue}>{latestPlacement?.medianPackage || 'N/A'}</Text>
                  <Text style={styles.placementLabel}>Median Package</Text>
                  <View style={styles.placementTrend}>
                    <Text style={styles.placementTrendText}>Most reliable metric</Text>
                  </View>
                </View>

                <View style={[styles.placementHighlightCard, { backgroundColor: '#FEF2F2' }]}>
                  <Ionicons name="people" size={32} color="#EF4444" />
                  <Text style={styles.placementValue}>{latestPlacement?.placementPercentage || 0}%</Text>
                  <Text style={styles.placementLabel}>Students Placed</Text>
                  <View style={styles.placementTrend}>
                    <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                    <Text style={styles.placementTrendText}>Industry leading</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Top Recruiters */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="business-center" size={24} color="#4F46E5" />
                <Text style={styles.sectionTitle}>Top Recruiting Companies</Text>
              </View>
              <View style={styles.recruitersGrid}>
                {latestPlacement?.topRecruiters?.map((company, index) => (
                  <View key={index} style={styles.recruiterCard}>
                    {/* Placeholder for company logo */}
                    <View style={styles.recruiterLogo}>
                      <MaterialIcons name="business" size={24} color="#4F46E5" />
                    </View>
                    <Text style={styles.recruiterName}>{company}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Placement by Role */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="pie-chart" size={24} color="#4F46E5" />
                <Text style={styles.sectionTitle}>Placements by Role</Text>
              </View>
              <View style={styles.roleCards}>
                <View style={styles.roleCard}>
                  <View style={[styles.roleIcon, { backgroundColor: '#EEF2FF' }]}>
                    <MaterialIcons name="computer" size={24} color="#4F46E5" />
                  </View>
                  <Text style={styles.roleLabel}>Software Development</Text>
                  <Text style={styles.rolePercentage}>60%</Text>
                </View>

                <View style={styles.roleCard}>
                  <View style={[styles.roleIcon, { backgroundColor: '#F0FDF4' }]}>
                    <MaterialIcons name="analytics" size={24} color="#10B981" />
                  </View>
                  <Text style={styles.roleLabel}>Data Science & Analytics</Text>
                  <Text style={styles.rolePercentage}>20%</Text>
                </View>

                <View style={styles.roleCard}>
                  <View style={[styles.roleIcon, { backgroundColor: '#FFF7ED' }]}>
                    <MaterialIcons name="settings" size={24} color="#F59E0B" />
                  </View>
                  <Text style={styles.roleLabel}>Core Engineering</Text>
                  <Text style={styles.rolePercentage}>15%</Text>
                </View>

                <View style={styles.roleCard}>
                  <View style={[styles.roleIcon, { backgroundColor: '#FEF2F2' }]}>
                    <MaterialIcons name="trending-up" size={24} color="#EF4444" />
                  </View>
                  <Text style={styles.roleLabel}>Consulting & Finance</Text>
                  <Text style={styles.rolePercentage}>5%</Text>
                </View>
              </View>
            </View>
          </>
        )}

        {/* CAMPUS LIFE TAB */}
        {activeTab === 'campus' && (
          <>
            {/* Campus Overview */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="location-city" size={24} color="#4F46E5" />
                <Text style={styles.sectionTitle}>Campus Life</Text>
              </View>
              <View style={styles.campusCard}>
                <Text style={styles.campusDescription}>
                  Experience vibrant campus life with state-of-the-art facilities, diverse student community,
                  and numerous opportunities for personal and professional growth.
                </Text>
              </View>
            </View>

            {/* Student Activities */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="celebration" size={24} color="#4F46E5" />
                <Text style={styles.sectionTitle}>Student Activities & Clubs</Text>
              </View>
              <View style={styles.activitiesGrid}>
                <View style={styles.activityCard}>
                  <Ionicons name="code-slash" size={28} color="#4F46E5" />
                  <Text style={styles.activityTitle}>Technical Clubs</Text>
                  <Text style={styles.activityText}>Coding, Robotics, AI/ML</Text>
                </View>

                <View style={styles.activityCard}>
                  <Ionicons name="musical-notes" size={28} color="#10B981" />
                  <Text style={styles.activityTitle}>Cultural Events</Text>
                  <Text style={styles.activityText}>Music, Dance, Drama</Text>
                </View>

                <View style={styles.activityCard}>
                  <Ionicons name="fitness" size={28} color="#F59E0B" />
                  <Text style={styles.activityTitle}>Sports</Text>
                  <Text style={styles.activityText}>Cricket, Football, Athletics</Text>
                </View>

                <View style={styles.activityCard}>
                  <Ionicons name="bulb" size={28} color="#EF4444" />
                  <Text style={styles.activityTitle}>Entrepreneurship</Text>
                  <Text style={styles.activityText}>Startups, E-Cell</Text>
                </View>
              </View>
            </View>

            {/* Annual Events */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="event-available" size={24} color="#4F46E5" />
                <Text style={styles.sectionTitle}>Major Annual Events</Text>
              </View>
              <View style={styles.eventsContainer}>
                <View style={styles.eventCard}>
                  <View style={styles.eventHeader}>
                    <MaterialIcons name="science" size={24} color="#4F46E5" />
                    <Text style={styles.eventTitle}>TechFest</Text>
                  </View>
                  <Text style={styles.eventDescription}>
                    Asia's largest science and technology festival with competitions, workshops, and exhibitions
                  </Text>
                  <Text style={styles.eventFootnote}>50,000+ participants annually</Text>
                </View>

                <View style={styles.eventCard}>
                  <View style={styles.eventHeader}>
                    <MaterialIcons name="music-note" size={24} color="#10B981" />
                    <Text style={styles.eventTitle}>Cultural Fest</Text>
                  </View>
                  <Text style={styles.eventDescription}>
                    Grand cultural celebration with music, dance, drama, and celebrity performances
                  </Text>
                  <Text style={styles.eventFootnote}>30,000+ footfall</Text>
                </View>
              </View>
            </View>

            {/* Hostel Facilities */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="hotel" size={24} color="#4F46E5" />
                <Text style={styles.sectionTitle}>Hostel & Accommodation</Text>
              </View>
              <View style={styles.hostelCard}>
                <View style={styles.hostelFeature}>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  <Text style={styles.hostelFeatureText}>Separate hostels for boys and girls</Text>
                </View>
                <View style={styles.hostelFeature}>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  <Text style={styles.hostelFeatureText}>24x7 security and medical facilities</Text>
                </View>
                <View style={styles.hostelFeature}>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  <Text style={styles.hostelFeatureText}>Wi-Fi enabled rooms with study areas</Text>
                </View>
                <View style={styles.hostelFeature}>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  <Text style={styles.hostelFeatureText}>Hygienic mess with varied menu</Text>
                </View>
                <View style={styles.hostelFeature}>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  <Text style={styles.hostelFeatureText}>Sports and recreation facilities</Text>
                </View>
              </View>
            </View>
          </>
        )}
      </View>

      {/* Contact & Apply */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.websiteButton}>
          <Ionicons name="globe-outline" size={20} color="#4F46E5" />
          <Text style={styles.websiteButtonText}>Visit Official Website</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.applyButton}>
          <Text style={styles.applyButtonText}>Apply Now</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
  },
  backButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#4F46E5',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Hero Section
  hero: {
    height: 300,
    width: '100%',
  },
  heroImage: {
    resizeMode: 'cover',
  },
  heroOverlay: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  heroButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroActions: {
    flexDirection: 'row',
    gap: 12,
  },
  heroContent: {
    marginBottom: 20,
  },
  heroBadges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(79,70,229,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  rankBadge: {
    backgroundColor: 'rgba(245,158,11,0.95)',
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    lineHeight: 32,
  },
  heroLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  heroLocationText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '500',
  },
  heroTagline: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },

  // Verification Banner
  verificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#D1FAE5',
  },
  verificationText: {
    fontSize: 13,
    color: '#047857',
    fontWeight: '600',
  },

  // Highlights Section
  highlightsSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  highlightCard: {
    flex: 1,
    alignItems: 'center',
  },
  highlightIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  highlightValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  highlightLabel: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Tabs
  tabsContainer: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFF',
  },

  // Content
  tabContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#1E293B',
  },

  // About
  aboutCard: {
    backgroundColor: '#FFF',
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  description: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
  },

  // Rankings
  rankingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  rankingCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rankingBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  rankingValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  rankingLabel: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },

  // Facilities
  facilitiesGrid: {
    gap: 10,
  },
  facilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  facilityIconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  facilityText: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },

  // Why Choose
  whyChooseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  whyChooseCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  whyChooseIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  whyChooseTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  whyChooseText: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
  },

  // Process
  processCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  processStep: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  processNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  processNumberText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  processContent: {
    flex: 1,
  },
  processTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  processText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },

  // Courses
  courseTabs: {
    marginBottom: 16,
  },
  courseTab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  courseTabActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  courseTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  courseTabTextActive: {
    color: '#FFF',
  },
  courseDetailsCard: {
    backgroundColor: '#FFF',
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  courseName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  courseInfoGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  courseInfoItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
  },
  courseInfoLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
    marginBottom: 4,
  },
  courseInfoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },

  // Cutoffs
  cutoffContainer: {
    gap: 12,
  },
  cutoffCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cutoffHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cutoffYear: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  latestBadge: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  latestBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFF',
  },
  cutoffGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  cutoffItem: {
    flex: 1,
    minWidth: '30%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
  },
  cutoffLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 6,
    fontWeight: '500',
  },
  cutoffValue: {
    fontSize: 19,
    fontWeight: '700',
  },

  // Dates
  datesCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  dateContent: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },

  // Placements
  placementHighlights: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  placementHighlightCard: {
    flex: 1,
    minWidth: '47%',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  placementValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 10,
    marginBottom: 4,
  },
  placementLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
    fontWeight: '500',
  },
  placementTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  placementTrendText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '500',
  },

  // Recruiters
  recruitersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  recruiterCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  recruiterLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  recruiterName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },

  // Roles
  roleCards: {
    gap: 12,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  roleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  roleLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  rolePercentage: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4F46E5',
  },

  // Campus
  campusCard: {
    backgroundColor: '#FFF',
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  campusDescription: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
  },

  // Activities
  activitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  activityCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 10,
    marginBottom: 4,
  },
  activityText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },

  // Events
  eventsContainer: {
    gap: 12,
  },
  eventCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  eventDescription: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 21,
    marginBottom: 8,
  },
  eventFootnote: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '600',
  },

  // Hostel
  hostelCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  hostelFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  hostelFeatureText: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
  },

  // No Data
  noDataCard: {
    backgroundColor: '#FFF',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  noDataText: {
    fontSize: 15,
    color: '#94A3B8',
    marginTop: 12,
  },

  // Bottom Actions
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 12,
  },
  websiteButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4F46E5',
    gap: 8,
  },
  websiteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4F46E5',
  },
  applyButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    gap: 8,
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
});
