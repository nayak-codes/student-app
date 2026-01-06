// Premium College Sections Component
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface PremiumSectionsProps {
    collegeName: string;
    expandedFAQ: number | null;
    setExpandedFAQ: (index: number | null) => void;
}

export const AlumniSection: React.FC<{ collegeName: string }> = ({ collegeName }) => (
    <View style={styles.section}>
        <View style={styles.sectionHeader}>
            <MaterialIcons name="stars" size={24} color="#4F46E5" />
            <Text style={styles.sectionTitle}>Notable Alumni</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.alumniContainer}>
                <View style={styles.alumniCard}>
                    <View style={styles.alumniAvatar}>
                        <MaterialIcons name="person" size={40} color="#4F46E5" />
                    </View>
                    <Text style={styles.alumniName}>Sundar Pichai</Text>
                    <Text style={styles.alumniRole}>CEO, Google</Text>
                    <Text style={styles.alumniBatch}>Batch: 1993</Text>
                </View>

                <View style={styles.alumniCard}>
                    <View style={styles.alumniAvatar}>
                        <MaterialIcons name="person" size={40} color="#10B981" />
                    </View>
                    <Text style={styles.alumniName}>Kris Gopalakrishnan</Text>
                    <Text style={styles.alumniRole}>Co-founder, Infosys</Text>
                    <Text style={styles.alumniBatch}>Batch: 1978</Text>
                </View>

                <View style={styles.alumniCard}>
                    <View style={styles.alumniAvatar}>
                        <MaterialIcons name="person" size={40} color="#F59E0B" />
                    </View>
                    <Text style={styles.alumniName}>Parag Agrawal</Text>
                    <Text style={styles.alumniRole}>Former CEO, Twitter</Text>
                    <Text style={styles.alumniBatch}>Batch: 2005</Text>
                </View>
            </View>
        </ScrollView>
    </View>
);

export const TestimonialsSection = () => (
    <View style={styles.section}>
        <View style={styles.sectionHeader}>
            <MaterialIcons name="format-quote" size={24} color="#4F46E5" />
            <Text style={styles.sectionTitle}>Student Testimonials</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.testimonialsContainer}>
                <View style={styles.testimonialCard}>
                    <View style={styles.quoteIcon}>
                        <MaterialIcons name="format-quote" size={28} color="#4F46E5" />
                    </View>
                    <Text style={styles.testimonialText}>
                        "The campus life and academic rigor prepared me perfectly for my career. The faculty is world-class and always accessible!"
                    </Text>
                    <View style={styles.testimonialAuthor}>
                        <Text style={styles.authorName}>Priya Sharma</Text>
                        <Text style={styles.authorDetails}>B.Tech CSE '23 • Amazon</Text>
                    </View>
                    <View style={styles.starRating}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <MaterialIcons key={star} name="star" size={16} color="#F59E0B" />
                        ))}
                    </View>
                </View>

                <View style={styles.testimonialCard}>
                    <View style={styles.quoteIcon}>
                        <MaterialIcons name="format-quote" size={28} color="#10B981" />
                    </View>
                    <Text style={styles.testimonialText}>
                        "Amazing research opportunities and industry exposure. Got placed in my dream company with an excellent package!"
                    </Text>
                    <View style={styles.testimonialAuthor}>
                        <Text style={styles.authorName}>Rahul Verma</Text>
                        <Text style={styles.authorDetails}>B.Tech EE '22 • Google</Text>
                    </View>
                    <View style={styles.starRating}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <MaterialIcons key={star} name="star" size={16} color="#F59E0B" />
                        ))}
                    </View>
                </View>

                <View style={styles.testimonialCard}>
                    <View style={styles.quoteIcon}>
                        <MaterialIcons name="format-quote" size={28} color="#EF4444" />
                    </View>
                    <Text style={styles.testimonialText}>
                        "Best 4 years! Great peers, amazing professors, and endless opportunities for personal and professional growth."
                    </Text>
                    <View style={styles.testimonialAuthor}>
                        <Text style={styles.authorName}>Aisha Khan</Text>
                        <Text style={styles.authorDetails}>B.Tech Mech '21 • Microsoft</Text>
                    </View>
                    <View style={styles.starRating}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <MaterialIcons key={star} name="star" size={16} color="#F59E0B" />
                        ))}
                    </View>
                </View>
            </View>
        </ScrollView >
    </View >
);

export const FAQSection: React.FC<{ expandedFAQ: number | null; setExpandedFAQ: (index: number | null) => void }> = ({
    expandedFAQ,
    setExpandedFAQ,
}) => (
    <View style={styles.section}>
        <View style={styles.sectionHeader}>
            <MaterialIcons name="help-outline" size={24} color="#4F46E5" />
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        </View>
        <View style={styles.faqContainer}>
            {[
                {
                    question: 'What are the hostel facilities?',
                    answer: 'We provide separate hostels for boys and girls with 24x7 security, Wi-Fi enabled rooms, hygienic mess facilities, and recreational areas. All hostels have modern amenities including laundry and common rooms.',
                },
                {
                    question: 'How is the placement support?',
                    answer: 'We have a dedicated Training & Placement cell that provides resume building, interview preparation, aptitude training, and connects students with 200+ recruiting companies annually. Mock interviews and soft skills training included.',
                },
                {
                    question: 'Are scholarships available?',
                    answer: 'Yes! Merit-based scholarships cover up to 100% tuition for top rankers. Need-based scholarships, SC/ST/OBC fee waivers, and education loans through partner banks are also available.',
                },
                {
                    question: 'What is the average class size?',
                    answer: 'Classes typically have 60-80 students with a student-faculty ratio of 15:1, ensuring personalized attention and interactive learning environment.',
                },
                {
                    question: 'Is there coaching for competitive exams?',
                    answer: 'Yes, we provide free GATE, GRE, and CAT coaching for eligible students. Special coaching programs for competitive exams are conducted by expert faculty members.',
                },
            ].map((faq, index) => (
                <TouchableOpacity
                    key={index}
                    style={styles.faqItem}
                    onPress={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                >
                    <View style={styles.faqQuestion}>
                        <Text style={styles.faqQuestionText}>{faq.question}</Text>
                        <Ionicons
                            name={expandedFAQ === index ? 'chevron-up' : 'chevron-down'}
                            size={20}
                            color="#64748B"
                        />
                    </View>
                    {expandedFAQ === index && <Text style={styles.faqAnswer}>{faq.answer}</Text>}
                </TouchableOpacity>
            ))}
        </View>
    </View>
);

export const FeeStructureSection = () => (
    <View style={styles.section}>
        <View style={styles.sectionHeader}>
            <MaterialIcons name="account-balance-wallet" size={24} color="#4F46E5" />
            <Text style={styles.sectionTitle}>Fee Structure 2024-25</Text>
        </View>
        <View style={styles.feeContainer}>
            <View style={styles.feeCard}>
                <View style={styles.feeHeader}>
                    <Ionicons name="school-outline" size={24} color="#4F46E5" />
                    <Text style={styles.feeTitle}>B.Tech (4 Years)</Text>
                </View>
                <View style={styles.feeBreakdown}>
                    <View style={styles.feeRow}>
                        <Text style={styles.feeLabel}>Tuition Fee</Text>
                        <Text style={styles.feeValue}>₹2,00,000/year</Text>
                    </View>
                    <View style={styles.feeRow}>
                        <Text style={styles.feeLabel}>Hostel Fee</Text>
                        <Text style={styles.feeValue}>₹60,000/year</Text>
                    </View>
                    <View style={styles.feeRow}>
                        <Text style={styles.feeLabel}>Mess Charges</Text>
                        <Text style={styles.feeValue}>₹40,000/year</Text>
                    </View>
                    <View style={styles.feeRow}>
                        <Text style={styles.feeLabel}>Other Fees</Text>
                        <Text style={styles.feeValue}>₹10,000/year</Text>
                    </View>
                    <View style={[styles.feeRow, styles.feeTotalRow]}>
                        <Text style={styles.feeTotalLabel}>Total Per Year</Text>
                        <Text style={styles.feeTotalValue}>₹3,10,000</Text>
                    </View>
                </View>
                <View style={styles.feeNote}>
                    <Ionicons name="information-circle-outline" size={16} color="#64748B" />
                    <Text style={styles.feeNoteText}>4-year total: ₹12,40,000</Text>
                </View>
            </View>

            <View style={styles.feeCard}>
                <View style={styles.feeHeader}>
                    <Ionicons name="business-outline" size={24} color="#10B981" />
                    <Text style={styles.feeTitle}>M.Tech (2 Years)</Text>
                </View>
                <View style={styles.feeBreakdown}>
                    <View style={styles.feeRow}>
                        <Text style={styles.feeLabel}>Tuition Fee</Text>
                        <Text style={styles.feeValue}>₹1,50,000/year</Text>
                    </View>
                    <View style={styles.feeRow}>
                        <Text style={styles.feeLabel}>Hostel Fee</Text>
                        <Text style={styles.feeValue}>₹60,000/year</Text>
                    </View>
                    <View style={styles.feeRow}>
                        <Text style={styles.feeLabel}>Mess Charges</Text>
                        <Text style={styles.feeValue}>₹40,000/year</Text>
                    </View>
                    <View style={styles.feeRow}>
                        <Text style={styles.feeLabel}>Other Fees</Text>
                        <Text style={styles.feeValue}>₹10,000/year</Text>
                    </View>
                    <View style={[styles.feeRow, styles.feeTotalRow]}>
                        <Text style={styles.feeTotalLabel}>Total Per Year</Text>
                        <Text style={styles.feeTotalValue}>₹2,60,000</Text>
                    </View>
                </View>
                <View style={styles.feeNote}>
                    <Ionicons name="information-circle-outline" size={16} color="#64748B" />
                    <Text style={styles.feeNoteText}>2-year total: ₹5,20,000</Text>
                </View>
            </View>
        </View>
    </View>
);

export const ScholarshipsSection = () => (
    <View style={styles.section}>
        <View style={styles.sectionHeader}>
            <MaterialIcons name="card-giftcard" size={24} color="#4F46E5" />
            <Text style={styles.sectionTitle}>Scholarships & Financial Aid</Text>
        </View>
        <View style={styles.scholarshipsGrid}>
            <View style={styles.scholarshipCard}>
                <View style={[styles.scholarshipBadge, { backgroundColor: '#EEF2FF' }]}>
                    <MaterialIcons name="military-tech" size={32} color="#4F46E5" />
                </View>
                <Text style={styles.scholarshipTitle}>Merit Scholarship</Text>
                <Text style={styles.scholarshipAmount}>Up to 100% Tuition</Text>
                <Text style={styles.scholarshipDesc}>For JEE Advanced top 1000 rankers</Text>
                <View style={styles.scholarshipCriteria}>
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    <Text style={styles.scholarshipCriteriaText}>Rank {'<'} 1000</Text>
                </View>
            </View>

            <View style={styles.scholarshipCard}>
                <View style={[styles.scholarshipBadge, { backgroundColor: '#F0FDF4' }]}>
                    <MaterialIcons name="stars" size={32} color="#10B981" />
                </View>
                <Text style={styles.scholarshipTitle}>Excellence Award</Text>
                <Text style={styles.scholarshipAmount}>50% Tuition</Text>
                <Text style={styles.scholarshipDesc}>For ranks 1001-5000</Text>
                <View style={styles.scholarshipCriteria}>
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    <Text style={styles.scholarshipCriteriaText}>Rank 1001-5000</Text>
                </View>
            </View>

            <View style={styles.scholarshipCard}>
                <View style={[styles.scholarshipBadge, { backgroundColor: '#FFF7ED' }]}>
                    <MaterialIcons name="volunteer-activism" size={32} color="#F59E0B" />
                </View>
                <Text style={styles.scholarshipTitle}>Need-Based Aid</Text>
                <Text style={styles.scholarshipAmount}>₹50K-₹2L</Text>
                <Text style={styles.scholarshipDesc}>Based on family income</Text>
                <View style={styles.scholarshipCriteria}>
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    <Text style={styles.scholarshipCriteriaText}>Income {'<'} ₹5L</Text>
                </View>
            </View>

            <View style={styles.scholarshipCard}>
                <View style={[styles.scholarshipBadge, { backgroundColor: '#FEF2F2' }]}>
                    <MaterialIcons name="school" size={32} color="#EF4444" />
                </View>
                <Text style={styles.scholarshipTitle}>Education Loan</Text>
                <Text style={styles.scholarshipAmount}>Up to ₹20L</Text>
                <Text style={styles.scholarshipDesc}>Bank partnerships</Text>
                <View style={styles.scholarshipCriteria}>
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    <Text style={styles.scholarshipCriteriaText}>Low interest</Text>
                </View>
            </View>
        </View>
    </View>
);

const styles = StyleSheet.create({
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

    // Alumni
    alumniContainer: {
        flexDirection: 'row',
        gap: 16,
        paddingRight: 16,
    },
    alumniCard: {
        width: 180,
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    alumniAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    alumniName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 4,
        textAlign: 'center',
    },
    alumniRole: {
        fontSize: 13,
        color: '#64748B',
        marginBottom: 6,
        textAlign: 'center',
    },
    alumniBatch: {
        fontSize: 12,
        color: '#94A3B8',
    },

    // Testimonials
    testimonialsContainer: {
        flexDirection: 'row',
        gap: 16,
        paddingRight: 16,
    },
    testimonialCard: {
        width: 280,
        backgroundColor: '#FFF',
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    quoteIcon: {
        marginBottom: 12,
    },
    testimonialText: {
        fontSize: 14,
        color: '#475569',
        lineHeight: 22,
        marginBottom: 16,
    },
    testimonialAuthor: {
        marginBottom: 12,
    },
    authorName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 2,
    },
    authorDetails: {
        fontSize: 12,
        color: '#64748B',
    },
    starRating: {
        flexDirection: 'row',
        gap: 4,
    },

    // FAQ
    faqContainer: {
        gap: 12,
    },
    faqItem: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    faqQuestion: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    faqQuestionText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
    },
    faqAnswer: {
        marginTop: 12,
        fontSize: 14,
        color: '#64748B',
        lineHeight: 21,
    },

    // Fee Structure
    feeContainer: {
        gap: 16,
    },
    feeCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 18,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    feeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    feeTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1E293B',
    },
    feeBreakdown: {
        gap: 12,
    },
    feeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    feeLabel: {
        fontSize: 14,
        color: '#64748B',
    },
    feeValue: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
    },
    feeTotalRow: {
        borderTopWidth: 2,
        borderTopColor: '#E2E8F0',
        paddingTop: 12,
        marginTop: 4,
    },
    feeTotalLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1E293B',
    },
    feeTotalValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#4F46E5',
    },
    feeNote: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        gap: 6,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    feeNoteText: {
        fontSize: 13,
        color: '#64748B',
    },

    // Scholarships
    scholarshipsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    scholarshipCard: {
        flex: 1,
        minWidth: '47%',
        backgroundColor: '#FFF',
        padding: 18,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    scholarshipBadge: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
    },
    scholarshipTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 6,
    },
    scholarshipAmount: {
        fontSize: 18,
        fontWeight: '700',
        color: '#4F46E5',
        marginBottom: 8,
    },
    scholarshipDesc: {
        fontSize: 13,
        color: '#64748B',
        marginBottom: 12,
        lineHeight: 19,
    },
    scholarshipCriteria: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    scholarshipCriteriaText: {
        fontSize: 12,
        color: '#10B981',
        fontWeight: '600',
    },
});
