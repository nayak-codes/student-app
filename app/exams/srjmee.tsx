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

// Mock Data for SRMJEEE
const srmjeeeData = {
  overview: {
    title: 'SRMJEEE 2025 - Ultimate Preparation Guide',
    description: "SRMJEEE (SRM Joint Engineering Entrance Examination) is the gateway to B.Tech programs at SRM Institute of Science and Technology. The exam is conducted in multiple phases and is known for its flexible pattern and wide range of specializations.",
    stats: [
      { label: 'Expected Applicants', value: '1.5L+' },
      { label: 'Campuses', value: '7' },
      { label: 'Total Seats', value: '10,000+' },
      { label: 'Exam Phases', value: '3' },
    ],
    highlights: "Remote proctored online exam, flexible slot booking, updated syllabus, and direct admission for top rankers.",
    importantDates: [
      { date: 'Nov 2024', event: 'Application Opens' },
      { date: 'Jan 2025', event: 'Phase 1 Exam' },
      { date: 'Apr 2025', event: 'Phase 2 Exam' },
      { date: 'Jun 2025', event: 'Phase 3 Exam' },
      { date: 'Jul 2025', event: 'Counselling' },
    ],
    topperTip: {
      tip: "Focus on NCERT for Physics, Chemistry, and Maths. Practice SRMJEEE mock tests and previous year papers for speed and accuracy.",
      name: 'Ananya Rao (SRMJEEE Topper 2024)',
    },
  },
  syllabus: [
    {
      subject: 'Physics',
      icon: '🧲',
      weightage: '',
      topics: [
        { title: 'Mechanics', details: 'Laws of Motion, Work, Energy, Power' },
        { title: 'Electrostatics', details: 'Coulomb’s Law, Electric Field' },
        { title: 'Current Electricity', details: '' },
        { title: 'Optics', details: '' },
        { title: 'Modern Physics', details: '' },
      ],
    },
    {
      subject: 'Chemistry',
      icon: '⚗️',
      weightage: '',
      topics: [
        { title: 'Physical Chemistry', details: 'Atomic Structure, Thermodynamics' },
        { title: 'Organic Chemistry', details: 'Hydrocarbons, Biomolecules' },
        { title: 'Inorganic Chemistry', details: 'Periodic Table, Coordination Compounds' },
      ],
    },
    {
      subject: 'Mathematics',
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
      subject: 'Biology (for Bio stream)',
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
        title: 'Phase 1: Foundation (Nov-Jan)',
        points: [
          'Revise all concepts from NCERT books',
          'Daily practice of MCQs for each subject',
          'Identify and strengthen weak areas',
        ],
      },
      {
        title: 'Phase 2: Practice & Mock Tests (Feb-Apr)',
        points: [
          'Solve previous year SRMJEEE papers',
          'Take weekly mock tests under timed conditions',
          'Analyze mistakes and improve speed',
        ],
      },
      {
        title: 'Phase 3: Final Revision (May-Jun)',
        points: [
          'Quick revision of formulas and key concepts',
          'Focus on high-weightage chapters',
          'Attempt full-length mock exams',
        ],
      },
    ],
    dailySchedule: '7:00-9:00 AM: Theory | 10:00-12:00 PM: Practice | 2:00-4:00 PM: Mock Tests | 6:00-8:00 PM: Revision',
    expertTip: {
      tip: 'Attempt easy questions first, then move to moderate and tough ones. Use OMR sheets for practice to avoid bubbling errors.',
      name: 'Rohit Menon (SRMJEEE Topper 2024)',
    },
  },
  pattern: {
    stats: [
      { label: 'Questions', value: '125' },
      { label: 'Marks', value: '125' },
      { label: 'Duration', value: '2.5h' },
      { label: 'Negative Marking', value: '0' },
    ],
    table: [
      { section: 'PCM', questions: '35+35+40+15', marks: '125', type: 'Maths, Physics, Chemistry, Aptitude', duration: '2.5 hours' },
      { section: 'PCB', questions: '35+35+40+15', marks: '125', type: 'Biology, Physics, Chemistry, Aptitude', duration: '2.5 hours' },
    ],
    marking: [
      'Correct Answer: +1 mark',
      'Incorrect/Unanswered: 0 marks (No negative marking)',
    ],
    expertTip: {
      tip: 'Attempt all questions as there is no negative marking. Manage time by allocating 1 minute per question and keep 10 minutes for review.',
      name: 'Priya Singh (SRMJEEE Topper 2024)',
    },
  },
  predictor: {
    colleges: [
      { name: 'SRM KTR - CSE', chance: '95% Chance' },
      { name: 'SRM NCR - ECE', chance: '90% Chance' },
      { name: 'SRM Ramapuram - Mechanical', chance: '80% Chance' },
      { name: 'SRM Vadapalani - EEE', chance: '75% Chance' },
      { name: 'SRM Amaravati - Civil', chance: '70% Chance' },
    ],
    note: 'This predictor provides estimates based on previous year trends. Actual cutoffs may vary depending on exam difficulty, number of applicants, and seat availability.',
  },
  resources: [
    { icon: '📚', title: 'NCERT Textbooks', desc: 'Base material for all subjects, highly recommended for concept clarity', link: '#' },
    { icon: '📄', title: 'Previous Year Papers', desc: 'Official question papers with solutions for practice', link: '#' },
    { icon: '🖥️', title: 'Online Mock Tests', desc: 'Simulate real exam environment and improve time management', link: '#' },
    { icon: '🏆', title: 'Topper Strategies', desc: "Learn from previous years' toppers and their preparation tips", link: '#' },
  ],
  platforms: [
    'SRM Official Portal: Practice tests and updates',
    'YouTube: Free video lectures',
    'Physics Wallah: SRMJEEE lectures',
    'Embibe: AI-powered practice and analysis',
    "BYJU'S: Comprehensive video lessons and tests",
  ],
  faqs: [
    {
      question: 'What is SRMJEEE?',
      answer: 'SRMJEEE is the SRM Joint Engineering Entrance Examination for admission to B.Tech programs at SRMIST campuses.',
    },
    {
      question: 'Who is eligible for SRMJEEE 2025?',
      answer: 'Candidates who have passed or appeared for 10+2 with relevant subjects from a recognized board are eligible. Minimum 50% aggregate required.',
    },
    {
      question: 'Is there negative marking in SRMJEEE?',
      answer: 'No, there is no negative marking in SRMJEEE. Attempt all questions for maximum score.',
    },
    {
      question: 'How to prepare for SRMJEEE?',
      answer: 'Focus on NCERT textbooks, solve previous year papers, take mock tests, and revise regularly. Time management and accuracy are key.',
    },
    {
      question: 'What are the top campuses through SRMJEEE?',
      answer: 'SRM Kattankulathur, SRM NCR, SRM Ramapuram, SRM Vadapalani, SRM Amaravati, and SRM Sonepat participate in SRMJEEE counseling.',
    },
    {
      question: 'How are seats allotted in SRMJEEE?',
      answer: 'Seats are allotted based on SRMJEEE rank, category, preferences, and seat availability through online counseling.',
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
  { label: 'SRM Campuses', icon: '🏛️' },
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

const SrmjeeeHeader: React.FC = () => (
  <View style={styles.headerContainer}>
    <View style={styles.headerGradient}>
      <Text style={styles.logo}>🎓 SRMJEEE Guide</Text>
      <Text style={styles.headerTitle}>{srmjeeeData.overview.title}</Text>
      <Text style={styles.headerSubtitle}>
        Your roadmap to cracking SRM’s premier engineering entrance examination
      </Text>
    </View>
  </View>
);

const SrmjeeeScreen: React.FC = () => {
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
    <View style={{ flex: 1, backgroundColor: '#f0f7fa' }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Professional Gradient Header */}
        <SrmjeeeHeader />
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
              <Text style={styles.title}>{srmjeeeData.overview.title}</Text>
              <Text style={styles.desc}>{srmjeeeData.overview.description}</Text>
              <View style={styles.statsRow}>
                {srmjeeeData.overview.stats.map(s => (
                  <View key={s.label} style={styles.statCard}>
                    <Text style={styles.statValue}>{s.value}</Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.highlightBox}>
                <Text style={styles.bold}>What's New in 2025:</Text>
                <Text>{srmjeeeData.overview.highlights}</Text>
              </View>
              <Text style={styles.sectionTitle}>Important Dates</Text>
              {srmjeeeData.overview.importantDates.map((d, i) => (
                <Text key={i} style={styles.dateRow}>{d.date}: {d.event}</Text>
              ))}
              <View style={styles.tipBox}>
                <Text style={styles.italic}>
                  "{srmjeeeData.overview.topperTip.tip}"
                </Text>
                <Text style={styles.tipName}>- {srmjeeeData.overview.topperTip.name}</Text>
              </View>
            </View>
          )}
          {tab === 'Syllabus' && (
            <View style={styles.card}>
              {srmjeeeData.syllabus.map(subj => (
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
              {srmjeeeData.preparation.phases.map((phase, i) => (
                <View key={i} style={styles.phaseCard}>
                  <Text style={styles.bold}>{phase.title}</Text>
                  {phase.points.map((p, j) => (
                    <Text key={j} style={styles.phasePoint}>- {p}</Text>
                  ))}
                </View>
              ))}
              <View style={styles.highlightBox}>
                <Text style={styles.bold}>Recommended Daily Schedule (8-10 hours):</Text>
                <Text>{srmjeeeData.preparation.dailySchedule}</Text>
              </View>
              <View style={styles.tipBox}>
                <Text style={styles.bold}>Time Management Strategy</Text>
                <Text style={styles.italic}>
                  "{srmjeeeData.preparation.expertTip.tip}"
                </Text>
                <Text style={styles.tipName}>- {srmjeeeData.preparation.expertTip.name}</Text>
              </View>
            </View>
          )}
          {tab === 'Pattern' && (
            <View style={styles.card}>
              <View style={styles.statsRow}>
                {srmjeeeData.pattern.stats.map(s => (
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
              {srmjeeeData.pattern.table.map((row, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{row.section}</Text>
                  <Text style={styles.tableCell}>{row.questions}</Text>
                  <Text style={styles.tableCell}>{row.marks}</Text>
                  <Text style={styles.tableCell}>{row.type}</Text>
                  <Text style={styles.tableCell}>{row.duration}</Text>
                </View>
              ))}
              <Text style={styles.sectionTitle}>Marking Scheme</Text>
              {srmjeeeData.pattern.marking.map((m, i) => (
                <Text key={i}>- {m}</Text>
              ))}
              <View style={styles.tipBox}>
                <Text style={styles.bold}>Exam Strategy</Text>
                <Text style={styles.italic}>
                  "{srmjeeeData.pattern.expertTip.tip}"
                </Text>
                <Text style={styles.tipName}>- {srmjeeeData.pattern.expertTip.name}</Text>
              </View>
            </View>
          )}
          {tab === 'Predictor' && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>College Predictor Tool</Text>
              <Text>Estimate your chances of getting into top SRM campuses based on your expected SRMJEEE rank:</Text>
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
                  {srmjeeeData.predictor.colleges.map((c, i) => (
                    <Text key={i}>{c.name} - {c.chance}</Text>
                  ))}
                  <Text style={{ marginTop: 8, fontSize: 13 }}>{srmjeeeData.predictor.note}</Text>
                </View>
              )}
            </View>
          )}
          {tab === 'Resources' && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Recommended Study Resources</Text>
              {srmjeeeData.resources.map((r, i) => (
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
              {srmjeeeData.platforms.map((p, i) => (
                <Text key={i}>- {p}</Text>
              ))}
            </View>
          )}
          {tab === 'FAQs' && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
              {srmjeeeData.faqs.map((f, i) => (
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

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: 'transparent',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    marginBottom: 8,
  },
  headerGradient: {
    backgroundColor: '#d32f2f',
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
    color: '#d32f2f',
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
    backgroundColor: '#d32f2f',
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
    color: '#d32f2f',
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
    backgroundColor: '#ffcdd2',
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
    color: '#d32f2f',
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
    backgroundColor: '#ffebee',
    borderLeftWidth: 4,
    borderLeftColor: '#d32f2f',
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
    color: '#d32f2f',
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
    backgroundColor: '#ffebee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderColor: '#d32f2f',
  },
  subjectTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#d32f2f',
    marginBottom: 6,
  },
  topicRow: {
    fontSize: 14,
    marginBottom: 2,
  },
  phaseCard: {
    backgroundColor: '#ffcdd2',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderColor: '#d32f2f',
  },
  phasePoint: {
    fontSize: 14,
    marginLeft: 6,
    marginBottom: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#ffebee',
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
    backgroundColor: '#d32f2f',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  predictionBox: {
    backgroundColor: '#ffebee',
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
    borderLeftColor: '#d32f2f',
  },
  resourceIconContainer: {
    backgroundColor: '#ffcdd2',
    borderRadius: 8,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  resourceIcon: {
    fontSize: 24,
    color: '#d32f2f',
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
    color: '#d32f2f',
    fontSize: 14,
    fontWeight: '500',
  },
  faqCard: {
    backgroundColor: '#ffcdd2',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderColor: '#d32f2f',
  },
});

export default SrmjeeeScreen; 