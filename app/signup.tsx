
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { signUp } from '../src/services/authService';

const EDUCATION_LEVELS = [
    { id: '10th', label: 'Class 10' },
    { id: 'Intermediate', label: 'Inter / +2' },
    { id: 'Undergraduate', label: 'B.Tech / Degree' },
    { id: 'Graduate', label: 'Masters / PG' },
];

const COURSES = [
    { id: 'MPC', label: 'MPC' },
    { id: 'BiPC', label: 'BiPC' },
    { id: 'MEC', label: 'MEC' },
    { id: 'CEC', label: 'CEC' },
    { id: 'CSE', label: 'CSE' },
    { id: 'ECE', label: 'ECE' },
    { id: 'EEE', label: 'EEE' },
    { id: 'Mechanical', label: 'Mechanical' },
    { id: 'Civil', label: 'Civil' },
    { id: 'Other', label: 'Other' },
];

const EXAMS = [
    { id: 'JEE', name: 'JEE Main/Advanced', icon: '🎓' },
    { id: 'NEET', name: 'NEET', icon: '⚕️' },
    { id: 'EAPCET', name: 'EAPCET', icon: '📚' },
    { id: 'SRMJEE', name: 'SRMJEE', icon: '🏛️' },
];

export default function SignupScreen() {
    const router = useRouter();
    const [step, setStep] = useState(1); // 1: Basic Info, 2: Education

    // Basic Info
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Education Info
    const [educationLevel, setEducationLevel] = useState<'10th' | 'Intermediate' | 'Undergraduate' | 'Graduate' | null>(null);
    const [course, setCourse] = useState('');
    const [selectedExam, setSelectedExam] = useState<'JEE' | 'NEET' | 'EAPCET' | 'SRMJEE'>('JEE');

    const [loading, setLoading] = useState(false);

    const handleNext = () => {
        if (!name || !email || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        setStep(2);
    };

    const handleBack = () => {
        setStep(1);
    };

    const handleSignup = async () => {
        if (!educationLevel || !course) {
            Alert.alert('Error', 'Please select your education details');
            return;
        }

        setLoading(true);
        try {
            await signUp(email, password, name, selectedExam, educationLevel, course);
            Alert.alert('Success', 'Account created successfully!', [
                { text: 'OK', onPress: () => router.replace('/(tabs)') }
            ]);
        } catch (error: any) {
            Alert.alert('Signup Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    const renderStep1 = () => (
        <>
            {/* Name Input */}
            <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#6C63FF" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    value={name}
                    onChangeText={setName}
                    autoComplete="name"
                    editable={!loading}
                />
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#6C63FF" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    editable={!loading}
                />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#6C63FF" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoComplete="password-new"
                    editable={!loading}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                    <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#94a3b8" />
                </TouchableOpacity>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#6C63FF" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    editable={!loading}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                    <Ionicons name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#94a3b8" />
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.signupButton} onPress={handleNext}>
                <Text style={styles.signupButtonText}>Next</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
        </>
    );

    const renderStep2 = () => (
        <>
            <Text style={styles.sectionTitle}>Education Level</Text>
            <View style={styles.chipContainer}>
                {EDUCATION_LEVELS.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={[styles.chip, educationLevel === item.id && styles.chipSelected]}
                        onPress={() => setEducationLevel(item.id as any)}
                    >
                        <Text style={[styles.chipText, educationLevel === item.id && styles.chipTextSelected]}>
                            {item.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.sectionTitle}>Course / Stream</Text>
            <View style={styles.chipContainer}>
                {COURSES.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={[styles.chip, course === item.id && styles.chipSelected]}
                        onPress={() => setCourse(item.id)}
                    >
                        <Text style={[styles.chipText, course === item.id && styles.chipTextSelected]}>
                            {item.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Exam Selection - Keep as part of the flow */}
            <Text style={styles.sectionTitle}>Target Exam</Text>
            <View style={styles.examGrid}>
                {EXAMS.map((exam) => (
                    <TouchableOpacity
                        key={exam.id}
                        style={[
                            styles.examCard,
                            selectedExam === exam.id && styles.examCardSelected,
                        ]}
                        onPress={() => setSelectedExam(exam.id as any)}
                        disabled={loading}
                    >
                        <Text style={styles.examIcon}>{exam.icon}</Text>
                        <Text style={[
                            styles.examName,
                            selectedExam === exam.id && styles.examNameSelected,
                        ]}>
                            {exam.name}
                        </Text>
                        {selectedExam === exam.id && (
                            <Ionicons name="checkmark-circle" size={20} color="#6C63FF" style={styles.checkIcon} />
                        )}
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.backButton} onPress={handleBack} disabled={loading}>
                    <Ionicons name="arrow-back" size={20} color="#64748b" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.signupButton, styles.flexButton, loading && styles.signupButtonDisabled]}
                    onPress={handleSignup}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.signupButtonText}>Create Account</Text>
                    )}
                </TouchableOpacity>
            </View>
        </>
    );

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.logo}>📚 StudentVerse</Text>
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>
                        {step === 1 ? "Let's get your basics down" : "Tell us about your education"}
                    </Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    {step === 1 ? renderStep1() : renderStep2()}

                    <View style={styles.stepIndicator}>
                        <View style={[styles.stepDot, step >= 1 ? styles.stepDotActive : {}]} />
                        <View style={[styles.stepDot, step >= 2 ? styles.stepDotActive : {}]} />
                    </View>

                    {/* Login Link */}
                    {step === 1 && (
                        <View style={styles.loginContainer}>
                            <Text style={styles.loginText}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => router.back()}>
                                <Text style={styles.loginLink}>Sign In</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logo: {
        fontSize: 48,
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        paddingVertical: 16,
        fontSize: 16,
        color: '#1e293b',
    },
    eyeIcon: {
        padding: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 12,
        marginTop: 8,
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 20,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    chipSelected: {
        backgroundColor: '#e0e7ff',
        borderColor: '#6C63FF',
    },
    chipText: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '500',
    },
    chipTextSelected: {
        color: '#6C63FF',
        fontWeight: '600',
    },
    examGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    examCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#e2e8f0',
    },
    examCardSelected: {
        borderColor: '#6C63FF',
        backgroundColor: '#f0efff',
    },
    examIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    examName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
        textAlign: 'center',
    },
    examNameSelected: {
        color: '#6C63FF',
    },
    checkIcon: {
        position: 'absolute',
        top: 8,
        right: 8,
    },
    signupButton: {
        backgroundColor: '#6C63FF',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 24,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    flexButton: {
        flex: 1,
        marginBottom: 0,
    },
    signupButtonDisabled: {
        opacity: 0.6,
    },
    signupButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
    },
    backButton: {
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginText: {
        color: '#64748b',
        fontSize: 14,
    },
    loginLink: {
        color: '#6C63FF',
        fontSize: 14,
        fontWeight: '600',
    },
    stepIndicator: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 20,
    },
    stepDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#e2e8f0',
    },
    stepDotActive: {
        backgroundColor: '#6C63FF',
        width: 24,
    },
});
