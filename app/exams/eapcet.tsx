import React, { useState } from 'react';
import { Dimensions, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

// Types
interface Stat {
  label: string;
  value: string;
}
interface DateEvent {
  date: string;
  event: string;
}
interface TopperTip {
  tip: string;
  name: string;
}
interface SyllabusTopic {
  title: string;
  details: string;
}
interface SyllabusSubject {
  subject: string;
  icon: string;
  weightage: string;
  topics: SyllabusTopic[];
}
interface PrepPhase {
  title: string;
  points: string[];
}
interface ExpertTip {
  tip: string;
  name: string;
}
interface PatternStat {
  label: string;
  value: string;
}
interface PatternTableRow {
  section: string;
  questions: string;
  marks: string;
  type: string;
  duration: string;
}
interface PredictorCollege {
  name: string;
  chance: string;
}
interface Resource {
  icon: string;
  title: string;
  desc: string;
  link: string;
}
interface Faq {
  question: string;
  answer: string;
}

// Mock Data (from your original)
const eapcetData = {
  overview: {
    title: 'TS EAPCET 2026 - Ultimate Preparation Guide',
    description: "The Telangana State Engineering, Agriculture & Pharmacy Common Entrance Test (TS EAPCET) 2026, conducted by JNTU Hyderabad, is the gateway to top engineering, agriculture, and pharmacy colleges in Telangana. The exam tests students on core concepts in Mathematics, Physics, Chemistry, Biology, and Agriculture, depending on the stream.",
    stats: [
      { label: 'Expected Applicants', value: '2L+' },
      { label: 'Participating Colleges', value: '250+' },
      { label: 'Total Seats', value: '1,20,000' },
      { label: 'Total Questions', value: '160' },
    ],
    highlights: "Updated syllabus as per NEP guidelines, more application-based questions, digital OMR sheets, and revised counseling process.",
    importantDates: [
      { date: 'March 2026', event: 'Registration Begins' },
      { date: 'April 2026', event: 'Hall Ticket Release' },
      { date: 'May 2026', event: 'Exam Date' },
      { date: 'June 2026', event: 'Results' },
      { date: 'June 2026', event: 'Counselling Begins' },
    ],
    topperTip: {
      tip: "Focus on NCERT textbooks for all subjects. Practice previous years' EAPCET papers and take mock tests to improve speed and accuracy.",
      name: 'Sravani Reddy (TS EAPCET Topper 2025)',
    },
  },
  syllabus: [
    {
      subject: 'Mathematics (Engineering)',
      icon: '🧮',
      weightage: '',
      topics: [
        { title: 'Algebra', details: 'Quadratic Equations, Progressions, Binomial Theorem' },
        { title: 'Trigonometry', details: 'Identities, Equations, Properties' },
        { title: 'Coordinate Geometry', details: 'Straight Lines, Circles, Parabola' },
        { title: 'Calculus', details: 'Limits, Differentiation, Integration' },
        { title: 'Vectors & 3D Geometry', details: '' },
      ],
    },
    {
      subject: 'Physics',
      icon: '🧲',
      weightage: '',
      topics: [
        { title: 'Mechanics', details: 'Laws of Motion, Work, Energy, Power' },
        { title: 'Waves & Oscillations', details: '' },
        { title: 'Thermodynamics', details: '' },
        { title: 'Electricity & Magnetism', details: '' },
        { title: 'Optics & Modern Physics', details: '' },
      ],
    },
    {
      subject: 'Chemistry',
      icon: '⚗️',
      weightage: '',
      topics: [
        { title: 'Physical Chemistry', details: 'Atomic Structure, Thermodynamics' },
        { title: 'Inorganic Chemistry', details: 'Periodic Table, Coordination Compounds' },
        { title: 'Organic Chemistry', details: 'Hydrocarbons, Biomolecules' },
      ],
    },
    {
      subject: 'Biology (for Agriculture/Pharmacy)',
      icon: '🌱',
      weightage: '',
      topics: [
        { title: 'Botany', details: 'Plant Physiology, Genetics, Ecology' },
        { title: 'Zoology', details: 'Human Physiology, Reproduction, Evolution' },
      ],
    },
  ],
  preparation: {
    phases: [
      {
        title: 'Phase 1: Foundation Building (Jan-Feb)',
        points: [
          'Revise all Intermediate concepts from NCERT/TS Board books',
          'Daily practice of MCQs for each subject',
          'Identify and strengthen weak areas',
        ],
      },
      {
        title: 'Phase 2: Practice & Mock Tests (Mar-Apr)',
        points: [
          "Solve previous 10 years' EAPCET papers",
          'Take weekly mock tests under timed conditions',
          'Analyze mistakes and improve speed',
        ],
      },
      {
        title: 'Phase 3: Final Revision (May)',
        points: [
          'Quick revision of formulas and key concepts',
          'Focus on high-weightage chapters',
          'Attempt full-length mock exams',
        ],
      },
    ],
    dailySchedule: '6:00-9:00 AM: Theory | 10:00-1:00 PM: Practice | 2:00-5:00 PM: Mock Tests | 6:00-8:00 PM: Revision',
    expertTip: {
      tip: 'Attempt easy questions first, then move to moderate and tough ones. Use OMR sheets for practice to avoid bubbling errors.',
      name: 'Ajay Kumar (TS EAPCET Topper 2025)',
    },
  },
  pattern: {
    stats: [
      { label: 'Questions', value: '160' },
      { label: 'Marks', value: '160' },
      { label: 'Duration', value: '3h' },
      { label: 'Negative Marking', value: '0' },
    ],
    table: [
      { section: 'Engineering', questions: '80+40+40', marks: '160', type: 'Maths, Physics, Chemistry', duration: '3 hours' },
      { section: 'Agriculture/Pharmacy', questions: '80+40+40', marks: '160', type: 'Biology, Physics, Chemistry', duration: '3 hours' },
    ],
    marking: [
      'Correct Answer: +1 mark',
      'Incorrect/Unanswered: 0 marks (No negative marking)',
    ],
    expertTip: {
      tip: 'Attempt all questions as there is no negative marking. Manage time by allocating 1 minute per question and keep 10 minutes for review.',
      name: 'Priya Singh (TS EAPCET Topper 2025)',
    },
  },
  predictor: {
    colleges: [
      { name: 'OU College of Engineering, Hyderabad - CSE', chance: '95% Chance' },
      { name: 'JNTU Hyderabad - ECE', chance: '90% Chance' },
      { name: 'CBIT Hyderabad - Mechanical', chance: '80% Chance' },
      { name: 'Vasavi College - EEE', chance: '75% Chance' },
      { name: 'MGIT Hyderabad - Civil', chance: '70% Chance' },
    ],
    note: 'This predictor provides estimates based on previous year trends. Actual cutoffs may vary depending on exam difficulty, number of applicants, and seat availability.',
  },
  resources: [
    { icon: '📚', title: 'NCERT/TS Board Textbooks', desc: 'Base material for all subjects, highly recommended for concept clarity', link: '#' },
    { icon: '📄', title: 'Previous Year Papers', desc: 'Official question papers with solutions for practice', link: '#' },
    { icon: '🖥️', title: 'Online Mock Tests', desc: 'Simulate real exam environment and improve time management', link: '#' },
    { icon: '🏆', title: 'Topper Strategies', desc: "Learn from previous years' toppers and their preparation tips", link: '#' },
  ],
  platforms: [
    'TS EAPCET Official Portal: Practice tests and updates',
    'Telangana State Board e-Learning: Free video lectures',
    'Physics Wallah EAPCET: YouTube lectures for all subjects',
    'Embibe EAPCET: AI-powered practice and analysis',
    "BYJU'S EAPCET: Comprehensive video lessons and tests",
  ],
  faqs: [
    {
      question: 'What is TS EAPCET?',
      answer: 'TS EAPCET is the Telangana State Engineering, Agriculture & Pharmacy Common Entrance Test for admission to professional courses in Telangana colleges.',
    },
    {
      question: 'Who is eligible for TS EAPCET 2026?',
      answer: 'Candidates who have passed or appeared for Intermediate (10+2) with relevant subjects from a recognized board are eligible. There is no age limit for Engineering, but for Agriculture/Pharmacy, minimum age is 17 years.',
    },
    {
      question: 'Is there negative marking in TS EAPCET?',
      answer: 'No, there is no negative marking in TS EAPCET. Attempt all questions for maximum score.',
    },
    {
      question: 'How to prepare for TS EAPCET?',
      answer: 'Focus on NCERT/TS Board textbooks, solve previous year papers, take mock tests, and revise regularly. Time management and accuracy are key.',
    },
    {
      question: 'What are the top colleges through TS EAPCET?',
      answer: 'OU College of Engineering, JNTU Hyderabad, CBIT, Vasavi, MGIT, and top government/private colleges in Telangana participate in EAPCET counseling.',
    },
    {
      question: 'How are seats allotted in TS EAPCET?',
      answer: 'Seats are allotted based on EAPCET rank, category, preferences, and seat availability through web-based counseling.',
    },
  ],
};

const quickLinks = [
  { label: 'Complete Syllabus', icon: '📚' },
  { label: 'Previous Papers', icon: '📄' },
  { label: 'College Predictor', icon: '📈' },
  { label: 'Cutoff Analysis', icon: '✂' },
  { label: 'Mock Tests', icon: '📝' },
  { label: 'Study Notes', icon: '🗒' },
  { label: 'Topper Strategies', icon: '🏆' },
  { label: 'Telangana Colleges', icon: '🏛️' },
];

const tabs = [
  'Overview',
  'Syllabus',
  'Preparation',
  'Pattern',
  'Predictor',
  'Resources',
  'FAQs',
];

const EapcetHeader: React.FC = () => (
  <View style={styles.headerContainer}>
    <View style={styles.headerGradient}>
      <Text style={styles.logo}>🎓 TSEAPCETGuide</Text>
      <Text style={styles.headerTitle}>{eapcetData.overview.title}</Text>
      <Text style={styles.headerSubtitle}>
        Your complete roadmap to cracking Telangana's premier entrance for Engineering, Agriculture & Pharmacy admissions
      </Text>
    </View>
  </View>
);

const EapcetScreen: React.FC = () => {
  const [tab, setTab] = useState<string>('Overview');
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [rank, setRank] = useState<string>('');
  const [showPrediction, setShowPrediction] = useState(false);
  const [search, setSearch] = useState('');

  // Quick links as grid (2 columns)
  const renderQuickLinks = () => {
    const rows = [];
    for (let i = 0; i < quickLinks.length; i += 2) {
      rows.push(
        <View style={styles.quickLinksRow} key={i}>
          {[0, 1].map(j => {
            const q = quickLinks[i + j];
            if (!q) return <View style={[styles.quickLinkCard, { backgroundColor: 'transparent', elevation: 0 }]} key={j} />;
            return (
              <TouchableOpacity key={j} style={styles.quickLinkCard}>
                <Text style={styles.quickLinkIcon}>{q.icon}</Text>
                <Text style={styles.quickLinkLabel}>{q.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    }
    return rows;
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#e0f7fa' }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Professional Gradient Header */}
        <EapcetHeader />
        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search syllabus, resources, colleges..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#aaa"
          />
        </View>
        {/* Quick Access Grid */}
        <View style={styles.quickLinksGrid}>{renderQuickLinks()}</View>
        {/* Tab Bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={{ paddingHorizontal: 8 }}>
          {tabs.map(t => (
            <TouchableOpacity
              key={t}
              onPress={() => { setTab(t); setShowPrediction(false); }}
              style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={{ paddingHorizontal: 12, marginTop: 12 }}>
          {tab === 'Overview' && (
            <View style={styles.card}>
              <Text style={styles.title}>{eapcetData.overview.title}</Text>
              <Text style={styles.desc}>{eapcetData.overview.description}</Text>
              <View style={styles.statsRow}>
                {eapcetData.overview.stats.map(s => (
                  <View key={s.label} style={styles.statCard}>
                    <Text style={styles.statValue}>{s.value}</Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.highlightBox}>
                <Text style={styles.bold}>What's New in 2026:</Text>
                <Text>{eapcetData.overview.highlights}</Text>
              </View>
              <Text style={styles.sectionTitle}>Important Dates</Text>
              {eapcetData.overview.importantDates.map((d, i) => (
                <Text key={i} style={styles.dateRow}>{d.date}: {d.event}</Text>
              ))}
              <View style={styles.tipBox}>
                <Text style={styles.italic}>
                  "{eapcetData.overview.topperTip.tip}"
                </Text>
                <Text style={styles.tipName}>- {eapcetData.overview.topperTip.name}</Text>
              </View>
            </View>
          )}
          {tab === 'Syllabus' && (
            <View style={styles.card}>
              {eapcetData.syllabus.map(subj => (
                <View key={subj.subject} style={styles.subjectCard}>
                  <Text style={styles.subjectTitle}>{subj.icon} {subj.subject}</Text>
                  {subj.topics.map((t, i) => (
                    <Text key={i} style={styles.topicRow}>• <Text style={styles.bold}>{t.title}</Text>{t.details ? `: ${t.details}` : ''}</Text>
                  ))}
                </View>
              ))}
            </View>
          )}
          {tab === 'Preparation' && (
            <View style={styles.card}>
              {eapcetData.preparation.phases.map((phase, i) => (
                <View key={i} style={styles.phaseCard}>
                  <Text style={styles.bold}>{phase.title}</Text>
                  {phase.points.map((p, j) => (
                    <Text key={j} style={styles.phasePoint}>- {p}</Text>
                  ))}
                </View>
              ))}
              <View style={styles.highlightBox}>
                <Text style={styles.bold}>Recommended Daily Schedule (8-10 hours):</Text>
                <Text>{eapcetData.preparation.dailySchedule}</Text>
              </View>
              <View style={styles.tipBox}>
                <Text style={styles.bold}>Time Management Strategy</Text>
                <Text style={styles.italic}>
                  "{eapcetData.preparation.expertTip.tip}"
                </Text>
                <Text style={styles.tipName}>- {eapcetData.preparation.expertTip.name}</Text>
              </View>
            </View>
          )}
          {tab === 'Pattern' && (
            <View style={styles.card}>
              <View style={styles.statsRow}>
                {eapcetData.pattern.stats.map(s => (
                  <View key={s.label} style={styles.statCard}>
                    <Text style={styles.statValue}>{s.value}</Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.sectionTitle}>Exam Structure</Text>
              <View style={styles.tableHeader}>
                <Text style={styles.tableCell}>Stream</Text>
                <Text style={styles.tableCell}>Questions</Text>
                <Text style={styles.tableCell}>Marks</Text>
                <Text style={styles.tableCell}>Subjects</Text>
                <Text style={styles.tableCell}>Duration</Text>
              </View>
              {eapcetData.pattern.table.map((row, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{row.section}</Text>
                  <Text style={styles.tableCell}>{row.questions}</Text>
                  <Text style={styles.tableCell}>{row.marks}</Text>
                  <Text style={styles.tableCell}>{row.type}</Text>
                  <Text style={styles.tableCell}>{row.duration}</Text>
                </View>
              ))}
              <Text style={styles.sectionTitle}>Marking Scheme</Text>
              {eapcetData.pattern.marking.map((m, i) => (
                <Text key={i}>- {m}</Text>
              ))}
              <View style={styles.tipBox}>
                <Text style={styles.bold}>Exam Strategy</Text>
                <Text style={styles.italic}>
                  "{eapcetData.pattern.expertTip.tip}"
                </Text>
                <Text style={styles.tipName}>- {eapcetData.pattern.expertTip.name}</Text>
              </View>
            </View>
          )}
          {tab === 'Predictor' && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>College Predictor Tool</Text>
              <Text>Estimate your chances of getting into top Telangana colleges based on your expected EAPCET rank:</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your expected rank (1-100000)"
                keyboardType="numeric"
                value={rank}
                onChangeText={setRank}
                maxLength={6}
              />
              <TouchableOpacity
                style={styles.predictBtn}
                onPress={() => setShowPrediction(true)}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Predict My Colleges</Text>
              </TouchableOpacity>
              {showPrediction && (
                <View style={styles.predictionBox}>
                  <Text style={styles.bold}>Your College Predictions</Text>
                  {eapcetData.predictor.colleges.map((c, i) => (
                    <Text key={i}>{c.name} - {c.chance}</Text>
                  ))}
                  <Text style={{ marginTop: 8, fontSize: 13 }}>{eapcetData.predictor.note}</Text>
                </View>
              )}
            </View>
          )}
          {tab === 'Resources' && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Recommended Study Resources</Text>
              {eapcetData.resources.map((r, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.resourceCard}
                  onPress={() => r.link && Linking.openURL(r.link)}
                >
                  <View style={styles.resourceIconContainer}>
                    <Text style={styles.resourceIcon}>{r.icon}</Text>
                  </View>
                  <View style={styles.resourceContent}>
                    <Text style={styles.resourceTitle}>{r.title}</Text>
                    <Text style={styles.resourceDescription}>{r.desc}</Text>
                    <Text style={styles.resourceAction}>🔗 Open Resource</Text>
                  </View>
                </TouchableOpacity>
              ))}
              <Text style={styles.sectionTitle}>Online Learning Platforms</Text>
              {eapcetData.platforms.map((p, i) => (
                <Text key={i}>- {p}</Text>
              ))}
            </View>
          )}
          {tab === 'FAQs' && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
              {eapcetData.faqs.map((f, i) => (
                <TouchableOpacity key={i} onPress={() => setFaqOpen(faqOpen === i ? null : i)} style={styles.faqCard}>
                  <Text style={styles.bold}>{f.question}</Text>
                  {faqOpen === i && <Text style={{ marginTop: 6 }}>{f.answer}</Text>}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

// Use the same styles as JeeMainScreen, but you can adjust colors for EAPCET theme if you want
const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: 'transparent',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    marginBottom: 8,
  },
  headerGradient: {
    backgroundColor: '#00897b',
    paddingTop: 40,
    paddingBottom: 28,
    paddingHorizontal: 18,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  logo: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 8,
  },
  headerTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 6,
  },
  headerSubtitle: {
    color: '#e0e0e0',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -22,
    marginHorizontal: 18,
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingVertical: 4,
    paddingHorizontal: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  searchIcon: {
    fontSize: 18,
    color: '#888',
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 7,
    fontSize: 15,
    borderRadius: 30,
    color: '#222',
  },
  quickLinksGrid: {
    marginTop: 18,
    marginHorizontal: 8,
  },
  quickLinksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  quickLinkCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    minWidth: (width - 48) / 2.2,
    maxWidth: (width - 48) / 2,
  },
  quickLinkIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  quickLinkLabel: {
    fontSize: 14,
    color: '#00897b',
    fontWeight: '500',
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 18,
    marginTop: 10,
    marginHorizontal: 4,
    elevation: 1,
    minHeight: 44,
  },
  tabBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 16,
    marginHorizontal: 2,
  },
  tabBtnActive: {
    backgroundColor: '#00897b',
  },
  tabText: {
    color: '#000',
    fontWeight: '500',
    fontSize: 15,
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#00897b',
  },
  desc: {
    marginBottom: 12,
    color: '#333',
    fontSize: 15,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 10,
    gap: 8,
  },
  statCard: {
    backgroundColor: '#b2dfdb',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    flexBasis: '48%',
    elevation: 2,
    shadowColor: '#00000020',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#00897b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
    letterSpacing: 0.3,
  },
  highlightBox: {
    backgroundColor: '#e0f2f1',
    borderLeftWidth: 4,
    borderLeftColor: '#00897b',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginVertical: 14,
    elevation: 1,
    shadowColor: '#00000010',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 18,
    marginTop: 20,
    marginBottom: 10,
    color: '#00897b',
    letterSpacing: 0.3,
  },
  dateRow: {
    fontSize: 14,
    color: '#444',
    marginBottom: 4,
    lineHeight: 20,
  },
  tipBox: {
    backgroundColor: '#fffde7',
    borderLeftWidth: 5,
    borderLeftColor: '#fbc02d',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginVertical: 16,
    shadowColor: '#00000010',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  bold: {
    fontWeight: 'bold',
    color: '#4e342e',
  },
  italic: {
    fontStyle: 'italic',
    color: '#6d4c41',
  },
  tipName: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#5d4037',
    textAlign: 'right',
  },
  subjectCard: {
    backgroundColor: '#e0f2f1',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderColor: '#00897b',
  },
  subjectTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#00897b',
    marginBottom: 6,
  },
  topicRow: {
    fontSize: 14,
    marginBottom: 2,
  },
  phaseCard: {
    backgroundColor: '#b2dfdb',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderColor: '#00897b',
  },
  phasePoint: {
    fontSize: 14,
    marginLeft: 6,
    marginBottom: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e0f2f1',
    paddingVertical: 6,
    borderRadius: 4,
    marginTop: 8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  tableCell: {
    flex: 1,
    fontSize: 13,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
    backgroundColor: '#fff',
  },
  predictBtn: {
    backgroundColor: '#00897b',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  predictionBox: {
    backgroundColor: '#e0f2f1',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  resourceCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#00000020',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#00897b',
  },
  resourceIconContainer: {
    backgroundColor: '#b2dfdb',
    borderRadius: 8,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  resourceIcon: {
    fontSize: 24,
    color: '#00897b',
  },
  resourceContent: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  resourceDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  resourceAction: {
    color: '#00897b',
    fontSize: 14,
    fontWeight: '500',
  },
  faqCard: {
    backgroundColor: '#b2dfdb',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderColor: '#00897b',
  },
});

export default EapcetScreen; 