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
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { signIn } from '../src/services/authService';
import { signInWithGoogleToken, useGoogleAuth } from '../src/services/googleAuthService';

const { width } = Dimensions.get('window');

// Vibrant Social Palette
const COLORS = {
  primary: '#4F46E5', // Indigo 600
  primaryDark: '#7C3AED', // Violet 600 - More playful gradient end
  accent: '#DB2777', // Pink 600 - For playful touches
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#0F172A', // Slate 900
  textSecondary: '#475569', // Slate 600
  border: '#E2E8F0',
};

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Info', 'Need your email and password to get you in!');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      let title = "Login Failed";
      let message = "Something went wrong. Please try again.";

      if (error.code === 'auth/invalid-credential' || error.message.includes('invalid-credential')) {
        title = "Incorrect Details";
        message = "The email or password you entered is incorrect. Please try again.";
      } else if (error.code === 'auth/user-not-found' || error.message.includes('user-not-found')) {
        title = "Account Not Found";
        message = "No account found with this email. Please sign up first.";
      } else if (error.code === 'auth/wrong-password' || error.message.includes('wrong-password')) {
        title = "Incorrect Password";
        message = "The password you entered is incorrect.";
      } else if (error.code === 'auth/invalid-email' || error.message.includes('invalid-email')) {
        title = "Invalid Email";
        message = "Please enter a valid email address.";
      } else if (error.code === 'auth/too-many-requests') {
        title = "Too Many Attempts";
        message = "Access to this account has been temporarily disabled due to many failed login attempts. Please try again later.";
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

  const handleGoogleSignIn = async () => {
    try {
      await promptAsync();
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      Alert.alert('Error', 'Failed to initiate Google Sign-In');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />

      {/* Main Content Centered */}
      <View style={styles.contentContainer}>

        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>Vidhyardhi</Text>
        </View>

        {/* Form Inputs */}
        <View style={styles.formContainer}>
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

          {/* Forgot Password Link - Right Aligned or Centered like Insta */}
          <TouchableOpacity style={styles.forgotPassword} onPress={() => { }}>
            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.instagramButton, (!email || !password) && styles.instagramButtonDisabled]}
            onPress={handleLogin}
            disabled={loading || !email || !password}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.instagramButtonText}>Log in</Text>
            )}
          </TouchableOpacity>

          {/* Divider OR */}
          {/* <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
            </View> */}

          {/* Google Login Link (Insta style often has FB link here) */}
          {/* <TouchableOpacity style={styles.googleLink} onPress={handleGoogleSignIn}>
                <Ionicons name="logo-google" size={20} color="#4F46E5" />
                <Text style={styles.googleLinkText}>Log in with Google</Text>
            </TouchableOpacity> */}

        </View>
      </View>

      {/* Footer Area - "Don't have an account? Sign up" */}
      <View style={styles.footerContainer}>
        <View style={styles.footerDivider} />
        <View style={styles.footerContent}>
          <Text style={styles.footerText}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => router.push('/signup')}>
            <Text style={styles.footerLink}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Clean White
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30, // Standard padding
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoImage: {
    width: 60,
    height: 60,
    marginBottom: 10,
  },
  logoText: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    fontSize: 32,
    fontWeight: 'bold', // Or a specific font like 'Billabong' for true Insta feel if available
    color: '#000',
  },
  formContainer: {
    width: '100%',
  },
  instagramInput: {
    backgroundColor: '#FAFAFA', // Very light grey
    borderColor: '#DBDBDB', // Subtle border
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
  forgotPassword: {
    alignItems: 'flex-end',
    marginBottom: 30,
  },
  forgotPasswordText: {
    color: '#3797EF', // Insta Blue
    fontSize: 12,
    fontWeight: '600',
  },
  instagramButton: {
    backgroundColor: '#3797EF', // Insta Blue
    borderRadius: 5,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instagramButtonDisabled: {
    backgroundColor: '#B2DFFC', // Faded Blue
  },
  instagramButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#DBDBDB',
  },
  dividerText: {
    marginHorizontal: 15,
    color: '#8E8E8E',
    fontWeight: '600',
    fontSize: 12,
  },
  googleLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  googleLinkText: {
    color: '#3797EF',
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 8,
  },
  footerContainer: {
    paddingVertical: 20,
    paddingBottom: 50, // Added extra padding for Android navigation bar
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 20 : 0,
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
    color: '#3797EF', // Insta Blue
    fontSize: 12,
    fontWeight: '700',
  },
});
