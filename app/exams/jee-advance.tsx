import { FontAwesome5 } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Dimensions, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

// Types (reusing from JEE Main)
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

// Mock Data for JEE Advanced
const jeeAdvancedData = {
  overview: {
    title: "JEE Advanced 2025 - Ultimate Preparation Guide",
    description: "JEE Advanced is the second stage of the Joint Entrance Examination for admission to the prestigious Indian Institutes of Technology (IITs). Only the top 2.5 lakh JEE Main qualifiers are eligible. The exam tests deep conceptual understanding and advanced problem-solving skills.",
    stats: [
      { label: "Eligible Candidates", value: "2.5L" },
      { label: "IIT Seats", value: "16,598" },
      { label: "Papers", value: "2" },
      { label: "Total Marks", value: "360" }
    ],
    highlights: "New pattern changes expected in 2025 with more emphasis on application-based questions. Possible introduction of new question formats and increased weightage to Mathematics.",
    importantDates: [
      { date: "June 2025", event: "Registration Begins" },
      { date: "June 2025", event: "Admit Card Release" },
      { date: "July 2025", event: "Exam Day (Paper 1 & 2)" },
      { date: "August 2025", event: "Result Declaration" }
    ],
    topperTip: {
      tip: "JEE Advanced requires a different approach than JEE Mains. Focus on depth rather than breadth. Master 20-25 core topics extremely well rather than covering everything superficially. Develop the ability to solve unconventional problems.",
      name: "Aarav Patel (AIR 3, JEE Advanced 2024)"
    }
  },
  syllabus: [
    {
      subject: "Physics",
      weightage: "33-37%",
      topics: [
        { title: "Mechanics (35%)", details: "Advanced Rotation, Fluid Mechanics, Gravitation" },
        { title: "Electrodynamics (30%)", details: "Capacitors, Electromagnetic Waves, Maxwell's Equations" },
        { title: "Modern Physics (15%)", details: "Nuclear Physics, Quantum Mechanics" },
        { title: "Thermodynamics (10%)", details: "Heat Transfer, Kinetic Theory" },
        { title: "Waves & Optics (10%)", details: "Doppler Effect, Interference, Polarization" }
      ]
    },
    {
      subject: "Chemistry",
      weightage: "30-33%",
      topics: [
        { title: "Physical Chemistry (35%)", details: "Chemical Kinetics, Electrochemistry, Solid State" },
        { title: "Organic Chemistry (35%)", details: "Stereochemistry, Named Reactions, Spectroscopy" },
        { title: "Inorganic Chemistry (30%)", details: "Transition Elements, Coordination Chemistry" }
      ]
    },
    {
      subject: "Mathematics",
      weightage: "30-37%",
      topics: [
        { title: "Calculus (40%)", details: "Continuity, Definite Integrals, Differential Equations" },
        { title: "Algebra (30%)", details: "Matrices, Probability, Complex Numbers" },
        { title: "Coordinate Geometry (20%)", details: "3D Geometry, Conic Sections" },
        { title: "Vectors (10%)", details: "Vector Algebra, 3D Vectors" }
      ]
    }
  ],
  preparation: {
    phases: [
      {
        title: "Phase 1: Advanced Concept Building (Months 1-3)",
        points: [
          "Master NCERT concepts thoroughly as base knowledge",
          "Start with advanced reference books: IE Irodov (Physics), MS Chouhan (Organic), Cengage (Maths)",
          "Daily Problem Solving: 30-40 advanced problems across subjects",
          "Develop visualization skills for complex problems"
        ]
      },
      {
        title: "Phase 2: Paper Pattern Mastery (Months 4-6)",
        points: [
          "Solve all JEE Advanced papers from last 15 years",
          "Focus on developing multiple approaches to single problems",
          "Mock Tests: Weekly full-length tests under exam conditions",
          "Time Management: Section-wise strategy development"
        ]
      },
      {
        title: "Phase 3: Final Touches (Months 7-8)",
        points: [
          "Intensive revision of important theorems and formulas",
          "Focus on common mistakes and error analysis",
          "Speed and accuracy drills for numerical problems",
          "Mental preparation for exam day pressure"
        ]
      }
    ],
    dailySchedule: "5:00-7:00 AM: Theory Concepts | 8:00-11:00 AM: Problem Solving | 12:00-2:00 PM: Previous Year Papers | 3:00-5:00 PM: Mock Tests | 6:00-8:00 PM: Analysis & Revision",
    expertTip: {
      tip: "For Advanced, quality matters infinitely more than quantity. Solve each problem 3 ways: calculation-based, conceptually, and using shortcuts. This builds flexibility in thinking. Maintain an 'idea notebook' for innovative solutions you encounter.",
      name: "Ishaani Verma (AIR 8, JEE Advanced 2024)"
    }
  },
  pattern: {
    stats: [
      { label: "Papers", value: "2" },
      { label: "Duration Each", value: "3h" },
      { label: "Total Marks", value: "360" },
      { label: "Question Types", value: "5+" }
    ],
    table: [
      { section: "Paper 1", questions: "54", marks: "180", type: "MCQs, Numerical, Paragraph" },
      { section: "Paper 2", questions: "54", marks: "180", type: "Matrix Match, Integer, Comprehension" }
    ],
    marking: [
      "Full Marks: +4 for correct answer",
      "Partial Marks: +1 to +3 depending on question",
      "Negative Marks: -2 for wrong MCQ, -1 for wrong Integer",
      "No Negative Marks: For some question types"
    ],
    expertTip: {
      tip: "Attempt questions in this order: Single Correct → Integer → Paragraph → Matrix Match. Leave 5 minutes per section for review. For numerical answers, always check units and significant figures. Never leave easy marks on the table.",
      name: "Vedant Khanna (AIR 1, JEE Advanced 2024)"
    }
  },
  predictor: {
    colleges: [
      { name: "IIT Bombay - CSE", chance: "98% Chance (Top 50)" },
      { name: "IIT Delhi - Electrical", chance: "85% Chance (Top 300)" },
      { name: "IIT Madras - Mechanical", chance: "75% Chance (Top 800)" },
      { name: "IIT Kanpur - Aerospace", chance: "90% Chance (Top 500)" },
      { name: "IIT Kharagpur - Civil", chance: "80% Chance (Top 1000)" }
    ],
    note: "Predictions based on previous year opening and closing ranks. Actual chances depend on your category, preferred branch, and exam difficulty."
  },
  resources: [
    { icon: "book", title: "Concepts of Physics (Vol II) by HC Verma", desc: "Advanced problems with detailed solutions for JEE Advanced level Physics", link: "#" },
    { icon: "flask", title: "Problems in Physical Chemistry by Narendra Awasthi", desc: "Comprehensive problem book covering all Advanced level Physical Chemistry", link: "#" },
    { icon: "atom", title: "Problems in Calculus of One Variable by I.A. Maron", desc: "Must-have for mastering advanced calculus problems", link: "#" },
    { icon: "laptop-code", title: "IIT JEE Archives by Resonance", desc: "Collection of all previous year questions with solutions", link: "#" },
    { icon: "square-root-alt", title: "Advanced Problems in Mathematics by Vikas Gupta", desc: "For mastering toughest Mathematics problems", link: "#" }
  ],
  platforms: [
    "IIT PAL: Official video lectures by IIT Professors",
    "Unacademy JEE Advanced: Specialized courses for Advanced",
    "Vedantu JEE: Advanced level problem solving sessions",
    "Allen JEE: Intensive test series for Advanced pattern",
    "PW JEE: Free YouTube content for Advanced preparation"
  ],
  faqs: [
    {
      question: "How is JEE Advanced different from JEE Mains?",
      answer: "JEE Advanced tests deeper conceptual understanding and complex problem-solving at a much higher difficulty level. It has more varied question types (matrix match, paragraph-based, etc.), negative marking differs, and the competition is only among top 2.5 lakh JEE Main qualifiers."
    },
    {
      question: "What is a good rank in JEE Advanced?",
      answer: "Top 100: Old IITs CSE | Top 500: Old IITs Core | Top 1000: New IITs CSE | Top 2000: New IITs Core | Top 5000: Other IIT branches. Aim for at least top 2000 for good options."
    },
    {
      question: "How to prepare for JEE Advanced after qualifying Mains?",
      answer: "1. Analyze Mains performance 2. Shift focus to advanced concepts 3. Increase problem difficulty gradually 4. Practice previous 15 years Advanced papers 5. Develop multiple solution approaches 6. Work on time management for tougher problems."
    },
    {
      question: "Is coaching necessary for JEE Advanced?",
      answer: "While many toppers come from coaching, it's possible to clear Advanced through self-study with proper resources. The key is access to: 1) Quality study material 2) Mock tests 3) Solution discussion 4) Performance analysis. Many online platforms now provide these."
    },
    {
      question: "How to attempt the paper strategically?",
      answer: "1. First pass: Solve all sure-shot questions 2. Second pass: Attempt moderate questions 3. Leave difficult questions for end 4. For numerical answers, check units 5. Manage time per section strictly 6. Never leave easy marks due to hurry."
    },
    {
      question: "What to do in last month before Advanced?",
      answer: "1. Revise important formulas and concepts 2. Solve 2-3 full papers daily 3. Analyze mistakes thoroughly 4. Work on weak areas 5. Maintain health and sleep 6. Simulate exam conditions 7. Stay confident in your preparation."
    }
  ]
};

const quickLinks = [
  { label: 'Advanced Syllabus', icon: '📚' },
  { label: 'Past Papers', icon: '📄' },
  { label: 'IIT Predictor', icon: '📈' },
  { label: 'Branch Cutoffs', icon: '✂' },
  { label: 'Advanced Mocks', icon: '📝' },
  { label: 'Advanced Notes', icon: '🗒' },
  { label: 'AIR Strategies', icon: '🏆' },
  { label: 'Advanced Books', icon: '📖' },
];

const JeeAdvancedHeader: React.FC = () => (
  <View style={styles.headerContainer}>
    <View style={[styles.headerGradient, { backgroundColor: '#d50000' }]}>
      <Text style={styles.logo}>🎓 IITGuide</Text>
      <Text style={styles.headerTitle}>JEE Advanced 2025 - Ultimate Preparation Guide</Text>
      <Text style={styles.headerSubtitle}>
        Your comprehensive roadmap to cracking India's most challenging engineering entrance exam
      </Text>
    </View>
  </View>
);

const tabs = [
  'Overview',
  'Syllabus',
  'Preparation',
  'Pattern',
  'Predictor',
  'Resources',
  'FAQs',
];

const JeeAdvancedScreen: React.FC = () => {
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
              <TouchableOpacity key={j} style={[styles.quickLinkCard, { backgroundColor: '#ffebee' }]}>
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
    <View style={{ flex: 1, backgroundColor: '#f9f9f9' }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Professional Gradient Header */}
        <JeeAdvancedHeader />
        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search syllabus, resources, IIT branches..."
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
              <Text style={styles.title}>{jeeAdvancedData.overview.title}</Text>
              <Text style={styles.desc}>{jeeAdvancedData.overview.description}</Text>
              <View style={styles.statsRow}>
                {jeeAdvancedData.overview.stats.map(s => (
                  <View key={s.label} style={styles.statCard}>
                    <Text style={styles.statValue}>{s.value}</Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.highlightBox}>
                <Text style={styles.bold}>What's New in 2025:</Text>
                <Text>{jeeAdvancedData.overview.highlights}</Text>
              </View>
              <Text style={styles.sectionTitle}>Important Dates</Text>
              {jeeAdvancedData.overview.importantDates.map((d, i) => (
                <Text key={i} style={styles.dateRow}>{d.date}: {d.event}</Text>
              ))}
              <View style={styles.tipBox}>
                <Text style={styles.italic}>
                  "{jeeAdvancedData.overview.topperTip.tip}"
                </Text>
                <Text style={styles.tipName}>- {jeeAdvancedData.overview.topperTip.name}</Text>
              </View>
            </View>
          )}
          {tab === 'Syllabus' && (
            <View style={styles.card}>
              {jeeAdvancedData.syllabus.map(subj => (
                <View key={subj.subject} style={[styles.subjectCard, { borderColor: '#d50000' }]}>
                  <Text style={styles.subjectTitle}>{subj.subject} (Weightage: {subj.weightage})</Text>
                  {subj.topics.map((t, i) => (
                    <Text key={i} style={styles.topicRow}>• <Text style={styles.bold}>{t.title}</Text>: {t.details}</Text>
                  ))}
                </View>
              ))}
            </View>
          )}
          {tab === 'Preparation' && (
            <View style={styles.card}>
              {jeeAdvancedData.preparation.phases.map((phase, i) => (
                <View key={i} style={[styles.phaseCard, { borderColor: '#d50000' }]}>
                  <Text style={styles.bold}>{phase.title}</Text>
                  {phase.points.map((p, j) => (
                    <Text key={j} style={styles.phasePoint}>- {p}</Text>
                  ))}
                </View>
              ))}
              <View style={styles.highlightBox}>
                <Text style={styles.bold}>Recommended Daily Schedule (10-12 hours):</Text>
                <Text>{jeeAdvancedData.preparation.dailySchedule}</Text>
              </View>
              <View style={styles.tipBox}>
                <Text style={styles.bold}>Advanced Problem Solving Strategy</Text>
                <Text style={styles.italic}>
                  "{jeeAdvancedData.preparation.expertTip.tip}"
                </Text>
                <Text style={styles.tipName}>- {jeeAdvancedData.preparation.expertTip.name}</Text>
              </View>
            </View>
          )}
          {tab === 'Pattern' && (
            <View style={styles.card}>
              <View style={styles.statsRow}>
                {jeeAdvancedData.pattern.stats.map(s => (
                  <View key={s.label} style={styles.statCard}>
                    <Text style={styles.statValue}>{s.value}</Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.sectionTitle}>📘Exam Structure</Text>
              <View style={styles.tableHeader}>
                <Text style={styles.tableCell}>Paper</Text>
                <Text style={styles.tableCell}>Questions</Text>
                <Text style={styles.tableCell}>Marks</Text>
                <Text style={styles.tableCell}>Type</Text>
              </View>
              {jeeAdvancedData.pattern.table.map((row, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{row.section}</Text>
                  <Text style={styles.tableCell}>{row.questions}</Text>
                  <Text style={styles.tableCell}>{row.marks}</Text>
                  <Text style={styles.tableCell}>{row.type}</Text>
                </View>
              ))}
              <Text style={styles.sectionTitle}>Marking Scheme</Text>
              {jeeAdvancedData.pattern.marking.map((m, i) => (
                <Text key={i}>- {m}</Text>
              ))}
              <View style={styles.tipBox}>
                <Text style={styles.bold}>Exam Strategy</Text>
                <Text style={styles.italic}>
                  "{jeeAdvancedData.pattern.expertTip.tip}"
                </Text>
                <Text style={styles.tipName}>- {jeeAdvancedData.pattern.expertTip.name}</Text>
              </View>
            </View>
          )}
          {tab === 'Predictor' && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>IIT Branch Predictor Tool</Text>
              <Text>Estimate your chances of getting into IITs based on your expected JEE Advanced rank:</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your expected rank (1-10000)"
                keyboardType="numeric"
                value={rank}
                onChangeText={setRank}
                maxLength={5}
              />
              <TouchableOpacity
                style={[styles.predictBtn, { backgroundColor: '#d50000' }]}
                onPress={() => setShowPrediction(true)}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Predict My IIT Branches</Text>
              </TouchableOpacity>
              {showPrediction && (
                <View style={styles.predictionBox}>
                  <Text style={styles.bold}>Your IIT Branch Predictions</Text>
                  {jeeAdvancedData.predictor.colleges.map((c, i) => (
                    <Text key={i}>{c.name} - {c.chance}</Text>
                  ))}
                  <Text style={{ marginTop: 8, fontSize: 13 }}>{jeeAdvancedData.predictor.note}</Text>
                </View>
              )}
            </View>
          )}
          {tab === 'Resources' && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Advanced Level Study Resources</Text>
              {jeeAdvancedData.resources.map((r, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.resourceCard}
                  onPress={() => r.link && Linking.openURL(r.link)}
                >
                  <View style={styles.resourceIconContainer}>
                    <FontAwesome5 name={r.icon} size={20} color="#d50000" />
                  </View>
                  <View style={styles.resourceContent}>
                    <Text style={styles.resourceTitle}>{r.title}</Text>
                    <Text style={styles.resourceDescription}>{r.desc}</Text>
                    <Text style={styles.resourceAction}>🔗 Open Resource</Text>
                  </View>
                </TouchableOpacity>
              ))}
              <Text style={styles.sectionTitle}>Specialized Learning Platforms</Text>
              {jeeAdvancedData.platforms.map((p, i) => (
                <Text key={i}>- {p}</Text>
              ))}
            </View>
          )}
          {tab === 'FAQs' && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Advanced Level FAQs</Text>
              {jeeAdvancedData.faqs.map((f, i) => (
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

// Reuse styles from JEE Main with some color adjustments
const styles = StyleSheet.create({
  ...StyleSheet.create({
    // Header Styles
    headerContainer: {
      backgroundColor: 'transparent',
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32,
      overflow: 'hidden',
      marginBottom: 8,
    },
    headerGradient: {
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

    // Search Bar
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

    // Quick Links
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
      fontWeight: '500',
      textAlign: 'center',
    },

    // Tab Bar
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
      backgroundColor: '#ffcdd2',
    },
    tabText: {
      fontWeight: '500',
      fontSize: 15,
    },
    tabTextActive: {
      color: '#d50000',
      fontWeight: 'bold',
    },

    // Content Cards
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
      color: '#d50000',
    },
    desc: {
      marginBottom: 12,
      color: '#333',
      fontSize: 15,
    },

    // Stats Cards
    statsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 16,
      marginTop: 10,
    },
    statCard: {
      backgroundColor: '#ffebee',
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 12,
      alignItems: 'center',
      flexBasis: '48%',
      elevation: 2,
      marginBottom: 8,
    },
    statValue: {
      fontSize: 20,
      fontWeight: '700',
      color: '#d50000',
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 13,
      color: '#666',
      textAlign: 'center',
    },

    // Highlight Box
    highlightBox: {
      backgroundColor: '#ffebee',
      borderLeftWidth: 4,
      borderLeftColor: '#d50000',
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderRadius: 10,
      marginVertical: 14,
    },
    sectionTitle: {
      fontWeight: '700',
      fontSize: 18,
      marginTop: 20,
      marginBottom: 10,
      color: '#d50000',
    },
    dateRow: {
      fontSize: 14,
      color: '#444',
      marginBottom: 4,
    },

    // Tip Box
    tipBox: {
      backgroundColor: '#fff8e1',
      borderLeftWidth: 5,
      borderLeftColor: '#ffa000',
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderRadius: 10,
      marginVertical: 16,
    },
    bold: {
      fontWeight: 'bold',
    },
    italic: {
      fontStyle: 'italic',
    },
    tipName: {
      marginTop: 8,
      fontSize: 13,
      fontWeight: '600',
      textAlign: 'right',
    },

    // Subject Cards
    subjectCard: {
      backgroundColor: '#ffebee',
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      borderLeftWidth: 4,
    },
    subjectTitle: {
      fontWeight: 'bold',
      fontSize: 15,
      color: '#d50000',
      marginBottom: 6,
    },
    topicRow: {
      fontSize: 14,
      marginBottom: 2,
    },

    // Phase Cards
    phaseCard: {
      backgroundColor: '#ffebee',
      borderRadius: 8,
      padding: 10,
      marginBottom: 10,
      borderLeftWidth: 4,
    },
    phasePoint: {
      fontSize: 14,
      marginLeft: 6,
      marginBottom: 2,
    },

    // Table Styles
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: '#f5f5f5',
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

    // Input & Prediction
    input: {
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 8,
      padding: 10,
      marginVertical: 10,
      backgroundColor: '#fff',
    },
    predictBtn: {
      backgroundColor: '#4a148c',
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

    // Resource Cards
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
      borderLeftColor: '#d50000',
    },
    resourceIconContainer: {
      backgroundColor: '#ffebee',
      borderRadius: 8,
      width: 48,
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
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
      color: '#d50000',
      fontSize: 14,
      fontWeight: '500',
    },

    // FAQ Cards
    faqCard: {
      backgroundColor: '#ffebee',
      borderRadius: 8,
      padding: 10,
      marginBottom: 8,
      borderLeftWidth: 4,
      borderColor: '#d50000',
    },
  })
});

export default JeeAdvancedScreen;