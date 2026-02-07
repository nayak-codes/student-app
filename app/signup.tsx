
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

// Vibrant Social Palette
const COLORS = {
    primary: '#4F46E5', // Indigo 600
    primaryDark: '#7C3AED', // Violet 600
    accent: '#DB2777', // Pink 600
    background: '#F8FAFC',
    surface: '#FFFFFF',
    text: '#0F172A', // Slate 900
    textSecondary: '#475569', // Slate 600
    border: '#E2E8F0',
    highlight: '#F5F3FF', // Violet 50
};

export default function SignupScreen() {
    const router = useRouter();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [focusedInput, setFocusedInput] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Google Sign-In
    const { request, response, promptAsync } = useGoogleAuth();

    // Handle Google Sign-In response
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
            await signUp(email, password, name, 'JEE'); // Default exam, can be changed in profile later
            router.replace('/(tabs)');
        } catch (error: any) {
            Alert.alert('Signup Failed', error.message);
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

    const handleGoogleSignIn = async () => {
        try {
            await promptAsync();
        } catch (error: any) {
            console.error('Google Sign-In error:', error);
            Alert.alert('Error', 'Failed to initiate Google Sign-In');
        }
    };

    const renderInput = (
        id: string,
        label: string,
        iconName: any,
        value: string,
        setValue: (val: string) => void,
        placeholder: string,
        keyboardType: 'default' | 'email-address' = 'default',
        secureTextEntry: boolean = false,
        toggleSecure?: () => void,
        isSecureVisible?: boolean
    ) => (
        <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{label}</Text>
            <View style={[
                styles.inputWrapper,
                focusedInput === id && styles.inputWrapperFocused
            ]}>
                <Ionicons name={iconName} size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder={placeholder}
                    placeholderTextColor={COLORS.textSecondary}
                    value={value}
                    onChangeText={setValue}
                    secureTextEntry={secureTextEntry}
                    keyboardType={keyboardType}
                    autoCapitalize={id === 'email' ? 'none' : 'words'}
                    autoComplete={
                        id === 'email' ? 'email' :
                            id === 'name' ? 'name' :
                                id === 'password' ? 'new-password' :
                                    id === 'confirmPassword' ? 'new-password' : undefined
                    }
                    onFocus={() => setFocusedInput(id)}
                    onBlur={() => setFocusedInput(null)}
                    editable={!loading}
                    importantForAutofill="yes"
                    textContentType={
                        id === 'email' ? 'username' :
                            id === 'password' ? 'newPassword' :
                                id === 'confirmPassword' ? 'newPassword' :
                                    id === 'name' ? 'name' : 'none'
                    }
                />
                {toggleSecure && (
                    <TouchableOpacity onPress={toggleSecure} style={styles.eyeIcon} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name={isSecureVisible ? 'eye-outline' : 'eye-off-outline'} size={20} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <StatusBar style="dark" />
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
                        <Ionicons name="close" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.subtitle}>Join Vidhyardhi today ⚡</Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    {renderInput('name', 'Full Name', 'person-outline', name, setName, 'full name')}
                    {renderInput('email', 'Email', 'at', email, setEmail, 'email', 'email-address')}
                    {renderInput('password', 'Password', 'key-outline', password, setPassword, 'password', 'default', !showPassword, () => setShowPassword(!showPassword), showPassword)}
                    {renderInput('confirmPassword', 'Re-enter Password', 'key-outline', confirmPassword, setConfirmPassword, 'Re-enter password', 'default', !showConfirmPassword, () => setShowConfirmPassword(!showConfirmPassword), showConfirmPassword)}

                    {/* Signup Button */}
                    <TouchableOpacity
                        style={styles.signupButtonShadow}
                        onPress={handleSignup}
                        disabled={loading}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={[COLORS.primary, COLORS.primaryDark]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.signupButton}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Text style={styles.signupButtonText}>Create Account</Text>
                                    <Ionicons name="rocket-outline" size={20} color="#FFF" style={{ marginLeft: 8 }} />
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Google Sign-In - Temporarily disabled until OAuth is configured */}
                    {/* <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>or continue with</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <TouchableOpacity
                        style={styles.googleButton}
                        onPress={handleGoogleSignIn}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="logo-google" size={24} color="#DB4437" />
                        <Text style={styles.googleButtonText}>Sign up with Google</Text>
                    </TouchableOpacity> */}

                    {/* Login Link */}
                    <View style={styles.loginContainer}>
                        <Text style={styles.loginText}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => router.push('/login')}>
                            <Text style={styles.loginLink}>Log In</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        paddingVertical: 40,
        paddingTop: 60,
        backgroundColor: COLORS.surface,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 5,
        marginBottom: 24,
    },
    headerBack: {
        position: 'absolute',
        top: 50,
        left: 20,
        padding: 8,
        zIndex: 10,
    },
    logo: {
        fontSize: 32,
        fontWeight: '900',
        color: COLORS.primary,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    form: {
        paddingHorizontal: 24,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '500',
        color: COLORS.textSecondary,
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        paddingHorizontal: 14,
        height: 54,
    },
    inputWrapperFocused: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.highlight,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: COLORS.text,
        fontWeight: '500',
    },
    eyeIcon: {
        padding: 4,
    },
    signupButtonShadow: {
        marginTop: 12,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
        borderRadius: 14,
    },
    signupButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 14,
    },
    signupButtonText: {
        color: '#FFF',
        fontSize: 17,
        fontWeight: '700',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: COLORS.border,
    },
    dividerText: {
        marginHorizontal: 16,
        fontSize: 13,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: 14,
        paddingVertical: 14,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        gap: 12,
    },
    googleButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.text,
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
    },
    loginText: {
        color: COLORS.textSecondary,
        fontSize: 15,
    },
    loginLink: {
        color: COLORS.primary,
        fontSize: 15,
        fontWeight: '700',
    },
});
