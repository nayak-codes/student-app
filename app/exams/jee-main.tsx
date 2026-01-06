import React, { useState } from 'react';
import { Dimensions, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { FontAwesome5 } from '@expo/vector-icons';

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

// Mock Data
const jeeMainData = {
  overview: {
    title: "JEE Mains 2025 - Ultimate Preparation Guide",
    description: "The Joint Entrance Examination (JEE) Mains 2025, conducted by the NTA, serves as the gateway to India's premier engineering institutions including all NITs, IIITs, and other GFTIs. The exam will be conducted in two sessions (January and April 2025), with the best score considered for rankings.",
    stats: [
      { label: "Expected Applicants", value: "12.5L+" },
      { label: "Exam Sessions", value: "2" },
      { label: "NIT+IIIT Seats", value: "23,000" },
      { label: "Total Questions", value: "90" }
    ],
    highlights: "Increased weightage to application-based questions, revised syllabus alignment with NCERT, introduction of competency-based questions, and possible changes in marking scheme.",
    importantDates: [
      { date: "October 2024", event: "Notification Release" },
      { date: "November 2024", event: "Registration Begins" },
      { date: "January 2025", event: "Session 1 Exam" },
      { date: "April 2025", event: "Session 2 Exam" }
    ],
    topperTip: {
      tip: "Start with analyzing the complete syllabus and previous year papers to identify high-weightage topics. Allocate 40% of your time to Physics, 30% to Chemistry, and 30% to Mathematics initially, adjusting based on your strengths.",
      name: "Rahul Sharma (AIR 47, JEE Mains 2024)"
    }
  },
  syllabus: [
    {
      subject: "Physics",
      weightage: "35-40%",
      topics: [
        { title: "Mechanics (30%)", details: "Laws of Motion, Work Energy Power, Rotational Dynamics" },
        { title: "Electrodynamics (25%)", details: "Electrostatics, Current Electricity, EMI, AC" },
        { title: "Modern Physics (15%)", details: "Atoms, Nuclei, Semiconductors" },
        { title: "Thermodynamics (10%)", details: "Kinetic Theory, Thermodynamics Processes" },
        { title: "Optics (10%)", details: "Ray Optics, Wave Optics" },
        { title: "Oscillations & Waves (10%)", details: "SHM, Sound Waves" }
      ]
    },
    {
      subject: "Chemistry",
      weightage: "30-35%",
      topics: [
        { title: "Physical Chemistry (35%)", details: "Mole Concept, Thermodynamics, Equilibrium" },
        { title: "Organic Chemistry (35%)", details: "GOC, Hydrocarbons, Named Reactions" },
        { title: "Inorganic Chemistry (30%)", details: "Periodic Table, Coordination Compounds" },
        { title: "Practical Chemistry", details: "Qualitative Analysis, Environmental Chemistry" }
      ]
    },
    {
      subject: "Mathematics",
      weightage: "30-35%",
      topics: [
        { title: "Algebra (25%)", details: "Quadratic Equations, Complex Numbers, Progressions" },
        { title: "Calculus (25%)", details: "Limits, Continuity, Differentiation, Integration" },
        { title: "Coordinate Geometry (20%)", details: "Straight Lines, Circles, Conic Sections" },
        { title: "Trigonometry (15%)", details: "Trigonometric Equations, Heights & Distances" },
        { title: "Vectors & 3D (15%)", details: "Vector Algebra, 3D Geometry" }
      ]
    }
  ],
  preparation: {
    phases: [
      {
        title: "Phase 1: Foundation Building (Months 1-4)",
        points: [
          "Complete NCERT thoroughly: 100% coverage with conceptual clarity",
          "Daily Practice: Solve 50-60 numericals across subjects",
          "Weak Area Identification: Regular topic-wise tests",
          "Reference Books: HC Verma (Physics), OP Tandon (Chemistry), RD Sharma (Maths)"
        ]
      },
      {
        title: "Phase 2: Advanced Learning (Months 5-8)",
        points: [
          "Advanced Concepts: I.E. Irodov (Physics), MS Chouhan (Organic), Cengage (Maths)",
          "Mock Tests: Weekly full-length tests with analysis",
          "Time Management: Develop subject-wise time allocation strategy",
          "Previous Year Papers: Analyze last 10 years' trends"
        ]
      },
      {
        title: "Phase 3: Revision & Final Prep (Months 9-12)",
        points: [
          "Intensive Revision: 3 complete syllabus revisions",
          "Mock Exam Conditions: Simulate actual exam environment",
          "Error Analysis: Maintain mistake logbook",
          "Final Touches: Formula revision, important theorems"
        ]
      }
    ],
    dailySchedule: "6:00-8:00 AM: Theory Study | 9:00-12:00 PM: Problem Solving | 2:00-4:00 PM: Weak Areas | 5:00-7:00 PM: Mock Tests | 8:00-9:00 PM: Revision",
    expertTip: {
      tip: "Divide your study sessions into 50-minute focused blocks with 10-minute breaks. Use Pomodoro technique for maximum concentration. Track your progress weekly and adjust your schedule accordingly.",
      name: "Neha Gupta (AIR 29, JEE Mains 2024)"
    }
  },
  pattern: {
    stats: [
      { label: "Subjects", value: "3" },
      { label: "Questions", value: "90" },
      { label: "Max Marks", value: "300" },
      { label: "Duration", value: "3h" }
    ],
    table: [
      { section: "Physics", questions: "30 (20+10*)", marks: "100", type: "MCQs + Numerical" },
      { section: "Chemistry", questions: "30 (20+10*)", marks: "100", type: "MCQs + Numerical" },
      { section: "Mathematics", questions: "30 (20+10*)", marks: "100", type: "MCQs + Numerical" }
    ],
    marking: [
      "Correct Answer: +4 marks",
      "Incorrect Answer (MCQ): -1 mark",
      "Unanswered Question: 0 marks",
      "Numerical Questions: No negative marking"
    ],
    expertTip: {
      tip: "Attempt numerical questions first as they have no negative marking. For MCQs, eliminate options systematically to improve guessing accuracy when unsure. Always keep an eye on the clock - allocate 60 minutes per subject.",
      name: "Priya Mehta (AIR 12, JEE Mains 2024)"
    }
  },
  predictor: {
    colleges: [
      { name: "NIT Trichy - CSE", chance: "98% Chance" },
      { name: "NIT Surathkal - ECE", chance: "85% Chance" },
      { name: "IIIT Hyderabad - CSD", chance: "75% Chance" },
      { name: "NIT Warangal - Mechanical", chance: "90% Chance" },
      { name: "IIIT Delhi - IT", chance: "80% Chance" }
    ],
    note: "This predictor provides estimates based on previous year trends. Actual cutoffs may vary depending on exam difficulty, number of applicants, and seat availability."
  },
  resources: [
    { icon: "book", title: "NCERT Textbooks (Class 11 & 12)", desc: "Foundation for all concepts, especially crucial for Chemistry and Physics theory", link: "#" },
    { icon: "atom", title: "Concepts of Physics (Vol I & II) by HC Verma", desc: "Best book for conceptual clarity and problem solving in Physics", link: "#" },
    { icon: "flask", title: "Organic Chemistry by OP Tandon", desc: "Comprehensive coverage of organic chemistry concepts and reactions", link: "#" },
    { icon: "square-root-alt", title: "Cengage Mathematics Series", desc: "Complete practice material with 5000+ problems across all topics", link: "#" },
    { icon: "laptop-code", title: "NTA Official Mock Tests", desc: "Most accurate representation of actual exam pattern and difficulty", link: "#" }
  ],
  platforms: [
    "NTA Abhyas App: Official practice platform with JEE pattern tests",
    "Unacademy JEE: Live classes by top educators",
    "Physics Wallah: Free YouTube lectures and study material",
    "Embibe: AI-powered practice and analysis",
    "BYJU'S JEE: Comprehensive video lessons and tests"
  ],
  faqs: [
    {
      question: "How is JEE Mains different from JEE Advanced?",
      answer: "JEE Mains is the first stage exam for admission to NITs/IIITs/GFTIs, while JEE Advanced is the second stage for IIT admission. Mains tests 11th-12th PCM fundamentals, while Advanced tests deeper conceptual understanding and problem-solving at higher difficulty."
    },
    {
      question: "What is the ideal time to start JEE preparation?",
      answer: "Most toppers begin serious preparation from Class 11. A 2-year systematic preparation is ideal, but even 1 year of focused study can yield good results with proper planning. The key is consistency and smart work rather than just early start."
    },
    {
      question: "How many hours should I study daily for JEE Mains?",
      answer: "Class 11 students: 4-6 hours | Class 12 students: 6-8 hours | Droppers: 8-10 hours. Quality matters more than quantity - focused, distraction-free study with regular testing is key. Include breaks and revision time in your schedule."
    },
    {
      question: "Is coaching necessary for JEE preparation?",
      answer: "While coaching provides structure, many toppers have cleared JEE through self-study using online resources. The key is disciplined preparation, good study material, and regular self-assessment. Evaluate your learning style - some students benefit from classroom environment while others prefer self-paced learning."
    },
    {
      question: "How to manage board exams with JEE preparation?",
      answer: "Focus on NCERT thoroughly as it forms 60-70% of JEE syllabus. After boards, dedicate 2 months for JEE-specific advanced concepts and intensive practice. Time management is crucial - create an integrated study plan covering both syllabi, prioritizing common topics first."
    },
    {
      question: "What is a good percentile in JEE Mains?",
      answer: "99+ percentile: Top NITs CSE | 95-98 percentile: Good NITs core branches | 90-95 percentile: Lower NITs/IIITs | 85-90 percentile: State colleges | 75-85 percentile: Private colleges. Aim for at least 95+ for good options."
    }
  ]
};

const quickLinks = [
  { label: 'Complete Syllabus', icon: '📚' },
  { label: '10 Years Papers', icon: '📄' },
  { label: 'College Predictor', icon: '📈' },
  { label: 'Cutoff Analysis', icon: '✂' },
  { label: 'Mock Tests', icon: '📝' },
  { label: 'Study Notes', icon: '🗒' },
  { label: 'Topper Strategies', icon: '🏆' },
  { label: 'Recommended Books', icon: '📖' },
];

const JeeMainHeader: React.FC = () => (
  <View style={styles.headerContainer}>
    <View style={styles.headerGradient}>
      <Text style={styles.logo}>🎓 JEEGuide</Text>
      <Text style={styles.headerTitle}>JEE Mains 2026 - Ultimate Preparation Guide</Text>
      <Text style={styles.headerSubtitle}>
        Your comprehensive roadmap to cracking India's premier engineering entrance examination
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

const JeeMainScreen: React.FC = () => {
  const [tab, setTab] = useState<string>('Overview');
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [percentile, setPercentile] = useState<string>('');
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
    <View style={{ flex: 1, backgroundColor: '#f9f9f9' }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Professional Gradient Header */}
        <JeeMainHeader />
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
              <Text style={styles.title}>{jeeMainData.overview.title}</Text>
              <Text style={styles.desc}>{jeeMainData.overview.description}</Text>
              <View style={styles.statsRow}>
                {jeeMainData.overview.stats.map(s => (
                  <View key={s.label} style={styles.statCard}>
                    <Text style={styles.statValue}>{s.value}</Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.highlightBox}>
                <Text style={styles.bold}>What's New in 2025:</Text>
                <Text>{jeeMainData.overview.highlights}</Text>
              </View>
              <Text style={styles.sectionTitle}>Important Dates</Text>
              {jeeMainData.overview.importantDates.map((d, i) => (
                <Text key={i} style={styles.dateRow}>{d.date}: {d.event}</Text>
              ))}
               
               <View style={styles.tipBox}>
  <Text style={styles.italic}>
    "Attempt numerical questions first — they have no negative marking. 
    Use elimination for MCQs, and watch the time!"
  </Text>
  <Text style={styles.tipName}>– Priya Mehta (AIR 12, JEE Mains 2024)</Text>
</View>

            </View>
          )}
          {tab === 'Syllabus' && (
            <View style={styles.card}>
              {jeeMainData.syllabus.map(subj => (
                <View key={subj.subject} style={styles.subjectCard}>
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
              {jeeMainData.preparation.phases.map((phase, i) => (
                <View key={i} style={styles.phaseCard}>
                  <Text style={styles.bold}>{phase.title}</Text>
                  {phase.points.map((p, j) => (
                    <Text key={j} style={styles.phasePoint}>- {p}</Text>
                  ))}
                </View>
              ))}
              <View style={styles.highlightBox}>
                <Text style={styles.bold}>Recommended Daily Schedule (8-10 hours):</Text>
                <Text>{jeeMainData.preparation.dailySchedule}</Text>
              </View>
              <View style={styles.tipBox}>
                <Text style={styles.bold}>Time Management Strategy</Text>
                <Text style={styles.italic}>
                  "{jeeMainData.preparation.expertTip.tip}"
                </Text>
                <Text style={styles.tipName}>- {jeeMainData.preparation.expertTip.name}</Text>
              </View>
            </View>
          )}
          {tab === 'Pattern' && (
            <View style={styles.card}>
              <View style={styles.statsRow}>
                {jeeMainData.pattern.stats.map(s => (
                  <View key={s.label} style={styles.statCard}>
                    <Text style={styles.statValue}>{s.value}</Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.sectionTitle}>📘Exam Structure</Text>
              <View style={styles.tableHeader}>
                <Text style={styles.tableCell}>Section</Text>
                <Text style={styles.tableCell}>Questions</Text>
                <Text style={styles.tableCell}>Marks</Text>
                <Text style={styles.tableCell}>Type</Text>
              </View>
              {jeeMainData.pattern.table.map((row, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{row.section}</Text>
                  <Text style={styles.tableCell}>{row.questions}</Text>
                  <Text style={styles.tableCell}>{row.marks}</Text>
                  <Text style={styles.tableCell}>{row.type}</Text>
                </View>
              ))}
              <Text style={{ fontSize: 13, marginTop: 8 }}>*20 MCQs (4 marks each), 10 Numerical (4 marks each, answer any 5)</Text>
              <Text style={styles.sectionTitle}>Marking Scheme</Text>
              {jeeMainData.pattern.marking.map((m, i) => (
                <Text key={i}>- {m}</Text>
              ))}
              <View style={styles.tipBox}>
                <Text style={styles.bold}>Exam Strategy</Text>
                <Text style={styles.italic}>
                  "{jeeMainData.pattern.expertTip.tip}"
                </Text>
                <Text style={styles.tipName}>- {jeeMainData.pattern.expertTip.name}</Text>
              </View>
            </View>
          )}
          {tab === 'Predictor' && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>College Predictor Tool</Text>
              <Text>Estimate your chances of getting into top engineering colleges based on your expected JEE Mains percentile:</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your expected percentile (0-100)"
                keyboardType="numeric"
                value={percentile}
                onChangeText={setPercentile}
                maxLength={5}
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
                  {jeeMainData.predictor.colleges.map((c, i) => (
                    <Text key={i}>{c.name} - {c.chance}</Text>
                  ))}
                  <Text style={{ marginTop: 8, fontSize: 13 }}>{jeeMainData.predictor.note}</Text>
                </View>
              )}
            </View>
          )}
          {tab === 'Resources' && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Recommended Study Resources</Text>

             {jeeMainData.resources.map((r, i) => (
  <TouchableOpacity
    key={i}
    style={styles.resourceCard}
    onPress={() => r.link && Linking.openURL(r.link)}
  >
    <View style={styles.resourceIconContainer}>
      <FontAwesome5 name={r.icon} size={20} color="#7e57c2" />
    </View>
    <View style={styles.resourceContent}>
      <Text style={styles.resourceTitle}>{r.title}</Text>
      <Text style={styles.resourceDescription}>{r.desc}</Text>
      <Text style={styles.resourceAction}>🔗 Open Resource</Text>
    </View>
  </TouchableOpacity>
))}

            
            
              <Text style={styles.sectionTitle}>Online Learning Platforms</Text>
              {jeeMainData.platforms.map((p, i) => (
                <Text key={i}>- {p}</Text>
              ))}
            </View>
          )}
          {tab === 'FAQs' && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
              {jeeMainData.faqs.map((f, i) => (
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
  // ======================
  // HEADER SECTION STYLES
  // ======================
  headerContainer: {
    backgroundColor: 'transparent',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    marginBottom: 8,
  },
  headerGradient: {
    backgroundColor: '#4a148c',
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

  // ======================
  // SEARCH BAR STYLES
  // ======================
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

  // ======================
  // QUICK LINKS GRID STYLES
  // ======================
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
    color: '#4a148c',
    fontWeight: '500',
    textAlign: 'center',
  },

  // ======================
  // TAB BAR STYLES
  // ======================
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
    backgroundColor: '#1ca9bfff',
  },
  tabText: {
    color: '#000000ff',
    fontWeight: '500',
    fontSize: 15,
  },
  tabTextActive: {
    color: '#11326eff',
    fontWeight: 'bold',
  },

  // ======================
  // CONTENT CARD STYLES
  // ======================
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
    color: '#8c148aff',
  },
  desc: {
    marginBottom: 12,
    color: '#333',
    fontSize: 15,
  },

  // ======================
  // STATS CARD STYLES
  // ======================
 statsRow: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  marginBottom: 16,
  marginTop: 10,
  gap: 8, // Optional if supported
},

statCard: {
  backgroundColor: '#f3e5f5', // lighter for contrast
  borderRadius: 12,
  paddingVertical: 14,
  paddingHorizontal: 12,
  alignItems: 'center',
  flexBasis: '48%', // Responsive two-column layout
  elevation: 2,
  shadowColor: '#00000020',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 4,
},

statValue: {
  fontSize: 20,
  fontWeight: '700',
  color: '#4a148c',
  marginBottom: 4,
},

statLabel: {
  fontSize: 13,
  color: '#666',
  textAlign: 'center',
  lineHeight: 18,
  letterSpacing: 0.3,
},

  // ======================
  // HIGHLIGHT BOX STYLES
  // ======================
 highlightBox: {
  backgroundColor: '#e3f2fd', // Soft blue
  borderLeftWidth: 4,
  borderLeftColor: '#1565c0', // Strong blue accent
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
  color: '#4a148c',
  letterSpacing: 0.3,
},

dateRow: {
  fontSize: 14,
  color: '#444',
  marginBottom: 4,
  lineHeight: 20,
},


  // ======================
  // TIP BOX STYLES
  // ======================
 tipBox: {
  backgroundColor: '#fffde7', // slightly warmer yellow
  borderLeftWidth: 5,
  borderLeftColor: '#fbc02d', // deeper amber tone for accent
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

  // ======================
  // SUBJECT CARD STYLES
  // ======================
  subjectCard: {
    backgroundColor: '#f3e5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderColor: '#1565c0',
  },
  subjectTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#4a148c',
    marginBottom: 6,
  },
  topicRow: {
    fontSize: 14,
    marginBottom: 2,
  },

  // ======================
  // PHASE CARD STYLES
  // ======================
  phaseCard: {
    backgroundColor: '#ede7f6',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderColor: '#4a148c',
  },
  phasePoint: {
    fontSize: 14,
    marginLeft: 6,
    marginBottom: 2,
  },

  // ======================
  // TABLE STYLES
  // ======================
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

  // ======================
  // INPUT & PREDICTION STYLES
  // ======================
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
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },

  // ======================
  // RESOURCE CARD STYLES
  // ======================
 resourceCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12, // Slightly larger radius for softer look
    padding: 16, // More padding for better spacing
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2, // Slightly stronger shadow for better depth
    shadowColor: '#00000020', // More subtle shadow color
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4, // Accent border
    borderLeftColor: '#4a148c', // Matching your theme color
},
resourceIconContainer: {
    backgroundColor: '#f3e5f5', // Light purple background for icon
    borderRadius: 8,
    width: 48, // Fixed size container
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16, // More spacing between icon and text
},
resourceIcon: {
    fontSize: 24, // Slightly larger icon
    color: '#4a148c', // Matching your theme color
},
resourceContent: {
    flex: 1,
},
resourceTitle: {
    fontSize: 16,
    fontWeight: '600', // Semi-bold for title
    color: '#333',
    marginBottom: 4,
},
resourceDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20, // Better readability
    marginBottom: 8,
},
resourceAction: {
    color: '#4a148c',
    fontSize: 14,
    fontWeight: '500',
},



  // ======================
  // FAQ CARD STYLES
  // ======================
  faqCard: {
    backgroundColor: '#d5c7c7ff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderColor: '#15c01bff',
  },
});

export default JeeMainScreen;