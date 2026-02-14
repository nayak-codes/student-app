
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
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
import { signInWithGoogleToken, useGoogleAuth } from '../src/services/googleAuthService';

const { width } = Dimensions.get('window');

// Vibrant Social Palette - Matching Login
const COLORS = {
    primary: '#3797EF', // Insta Blue
    primaryDark: '#005bb5',
    background: '#FFFFFF',
    text: '#262626',
    textSecondary: '#8E8E8E',
    border: '#DBDBDB',
    inputBg: '#FAFAFA',
};

export default function SignupScreen() {
    const router = useRouter();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // Google Sign-In
    const { request, response, promptAsync } = useGoogleAuth();

    useEffect(() => {
        if (response?.type === 'success') {
            const { authentication } = response;
            if (authentication?.idToken) {
                handleGoogleResponse(authentication.idToken);
            }
        }
    }, [response]);

    const handleSignup = async () => {
        if (!name || !email || !password || !confirmPassword) {
            Alert.alert('Missing Fields', 'Please fill in all details.');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Password Mismatch', 'Passwords do not match.');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Weak Password', 'Password must be at least 6 characters.');
            return;
        }

        setLoading(true);
        try {
            await signUp(email, password, name, 'JEE'); // Default exam
            router.replace('/(tabs)');
        } catch (error: any) {
            let title = "Signup Failed";
            let message = "Something went wrong. Please try again.";

            if (error.code === 'auth/email-already-in-use') {
                title = "Email Already Taken";
                message = "An account with this email already exists. Please log in instead.";
            } else if (error.code === 'auth/weak-password') {
                title = "Weak Password";
                message = "Password should be at least 6 characters long.";
            } else if (error.code === 'auth/invalid-email') {
                title = "Invalid Email";
                message = "Please enter a valid email address.";
            }

            Alert.alert(title, message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleResponse = async (idToken: string) => {
        setLoading(true);
        try {
            await signInWithGoogleToken(idToken);
            router.replace('/(tabs)');
        } catch (error: any) {
            Alert.alert('Google Sign-In Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar style="dark" />
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Join Vidhyardhi today ⚡</Text>
                    <Text style={styles.headerSubtitle}>Sign up to see photos and videos from your campus friends.</Text>
                </View>

                {/* Form */}
                <View style={styles.formContainer}>
                    <TextInput
                        style={styles.instagramInput}
                        placeholder="Full Name"
                        placeholderTextColor="#94A3B8"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                        editable={!loading}
                    />
                    <TextInput
                        style={styles.instagramInput}
                        placeholder="Email"
                        placeholderTextColor="#94A3B8"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        editable={!loading}
                    />

                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Password"
                            placeholderTextColor="#94A3B8"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            editable={!loading}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                            <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#94A3B8" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Re-enter Password"
                            placeholderTextColor="#94A3B8"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showConfirmPassword}
                            editable={!loading}
                        />
                        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                            <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={20} color="#94A3B8" />
                        </TouchableOpacity>
                    </View>

                    {/* Signup Button */}
                    <TouchableOpacity
                        style={[styles.instagramButton, (!name || !email || !password) && styles.instagramButtonDisabled]}
                        onPress={handleSignup}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.instagramButtonText}>Sign up</Text>
                        )}
                    </TouchableOpacity>

                    {/* Terms Text */}
                    <Text style={styles.termsText}>
                        By signing up, you agree to our Terms, Data Policy and Cookies Policy.
                    </Text>
                </View>

            </ScrollView>

            {/* Footer Area */}
            <View style={styles.footerContainer}>
                <View style={styles.footerDivider} />
                <View style={styles.footerContent}>
                    <Text style={styles.footerText}>Already have an account?</Text>
                    <TouchableOpacity onPress={() => router.push('/login')}>
                        <Text style={styles.footerLink}>Log in</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 30,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 40,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#262626',
        marginBottom: 10,
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#8E8E8E',
        textAlign: 'center',
        marginBottom: 20,
        fontWeight: '500',
        lineHeight: 20,
    },
    formContainer: {
        width: '100%',
    },
    instagramInput: {
        backgroundColor: '#FAFAFA',
        borderColor: '#DBDBDB',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 14,
        marginBottom: 12,
        color: '#262626',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FAFAFA',
        borderColor: '#DBDBDB',
        borderWidth: 1,
        borderRadius: 5,
        marginBottom: 12,
    },
    passwordInput: {
        flex: 1,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 14,
        color: '#262626',
    },
    eyeIcon: {
        padding: 10,
    },
    instagramButton: {
        backgroundColor: '#3797EF',
        borderRadius: 5,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    instagramButtonDisabled: {
        backgroundColor: '#B2DFFC',
    },
    instagramButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
    },
    termsText: {
        color: '#8E8E8E',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 20,
        lineHeight: 18,
    },
    footerContainer: {
        paddingVertical: 20,
        paddingBottom: 50, // Added extra padding for Android navigation bar
        alignItems: 'center',
        borderTopWidth: 0,
    },
    footerDivider: {
        height: 1,
        width: '100%',
        backgroundColor: '#DBDBDB',
        marginBottom: 15,
    },
    footerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerText: {
        color: '#8E8E8E',
        fontSize: 12,
        marginRight: 5,
    },
    footerLink: {
        color: '#3797EF',
        fontSize: 12,
        fontWeight: '700',
    },
});
