// Enter Vault Password Modal
// Modal for entering password to unlock the document vault

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    authenticateWithBiometric,
    getBiometricTypes,
    isBiometricEnabled,
    resetVaultPassword,
    verifyVaultPassword,
} from '../services/vaultSecurityService';

interface EnterVaultPasswordModalProps {
    visible: boolean;
    onPasswordCorrect: () => void;
    onPasswordReset: () => void;
}

const EnterVaultPasswordModal: React.FC<EnterVaultPasswordModalProps> = ({
    visible,
    onPasswordCorrect,
    onPasswordReset,
}) => {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [attempts, setAttempts] = useState(0);
    const [biometricEnabled, setBiometricEnabled] = useState(false);
    const [biometricTypes, setBiometricTypes] = useState<string[]>([]);

    // Check if biometric is enabled and auto-trigger
    useEffect(() => {
        const checkAndTriggerBiometric = async () => {
            if (!visible) return;

            const enabled = await isBiometricEnabled();
            setBiometricEnabled(enabled);

            if (enabled) {
                const types = await getBiometricTypes();
                setBiometricTypes(types);
                // Auto-trigger biometric on modal open
                setTimeout(() => handleBiometricAuth(), 500);
            }
        };
        checkAndTriggerBiometric();
    }, [visible]);

    const handleBiometricAuth = async () => {
        try {
            const success = await authenticateWithBiometric();
            if (success) {
                setPassword('');
                setAttempts(0);
                onPasswordCorrect();
            }
        } catch (error) {
            console.error('Biometric auth error:', error);
            // Silently fail and let user use password
        }
    };

    const handleUnlock = async () => {
        if (password.length === 0) {
            Alert.alert('Enter Password', 'Please enter your password');
            return;
        }

        setIsLoading(true);
        try {
            const isCorrect = await verifyVaultPassword(password);
            if (isCorrect) {
                setPassword('');
                setAttempts(0);
                onPasswordCorrect();
            } else {
                const newAttempts = attempts + 1;
                setAttempts(newAttempts);
                setPassword('');

                if (newAttempts >= 3) {
                    Alert.alert(
                        '❌ Too Many Attempts',
                        'You\'ve entered the wrong password 3 times. Would you like to reset your vault password?',
                        [
                            { text: 'Cancel', style: 'cancel' },
                            {
                                text: 'Reset Password',
                                style: 'destructive',
                                onPress: handleResetPassword,
                            },
                        ]
                    );
                } else {
                    Alert.alert(
                        'Incorrect Password',
                        `Wrong password. ${3 - newAttempts} attempt(s) remaining.`
                    );
                }
            }
        } catch (error) {
            console.error('Verify password error:', error);
            Alert.alert('Error', 'An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = () => {
        Alert.alert(
            '⚠️ Reset Vault Password',
            'Are you sure you want to reset your vault password? You will need to set a new password.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: async () => {
                        const success = await resetVaultPassword();
                        if (success) {
                            setPassword('');
                            setAttempts(0);
                            onPasswordReset();
                        } else {
                            Alert.alert('Error', 'Failed to reset password');
                        }
                    },
                },
            ]
        );
    };

    return (
        <Modal visible={visible} animationType="fade" transparent>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="lock-closed" size={40} color="#4F46E5" />
                        </View>
                        <Text style={styles.title}>Vault Locked</Text>
                        <Text style={styles.subtitle}>
                            Enter your password to access your documents
                        </Text>
                    </View>

                    {/* Password Input */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Password</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="key" size={20} color="#64748B" />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your password"
                                placeholderTextColor="#94A3B8"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                                autoFocus
                                onSubmitEditing={handleUnlock}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons
                                    name={showPassword ? 'eye-off' : 'eye'}
                                    size={20}
                                    color="#64748B"
                                />
                            </TouchableOpacity>
                        </View>
                        {attempts > 0 && (
                            <Text style={styles.errorText}>
                                {attempts} failed attempt(s)
                            </Text>
                        )}
                    </View>

                    {/* Unlock Button */}
                    <TouchableOpacity
                        style={[
                            styles.unlockButton,
                            (password.length === 0 || isLoading) && styles.unlockButtonDisabled,
                        ]}
                        onPress={handleUnlock}
                        disabled={password.length === 0 || isLoading}
                    >
                        <Ionicons name="lock-open" size={20} color="#FFF" />
                        <Text style={styles.unlockButtonText}>
                            {isLoading ? 'Unlocking...' : 'Unlock Vault'}
                        </Text>
                    </TouchableOpacity>

                    {/* Biometric Button */}
                    {biometricEnabled && (
                        <TouchableOpacity
                            style={styles.biometricButton}
                            onPress={handleBiometricAuth}
                        >
                            <Ionicons name="finger-print" size={24} color="#4F46E5" />
                            <Text style={styles.biometricButtonText}>
                                Use {biometricTypes[0] || 'Biometric'}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* Forgot Password */}
                    <TouchableOpacity
                        style={styles.forgotButton}
                        onPress={handleResetPassword}
                    >
                        <Text style={styles.forgotButtonText}>Forgot Password?</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 8,
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 15,
        color: '#1E293B',
    },
    errorText: {
        fontSize: 12,
        color: '#EF4444',
        marginTop: 4,
        marginLeft: 4,
    },
    unlockButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4F46E5',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
        marginBottom: 12,
    },
    unlockButtonDisabled: {
        backgroundColor: '#CBD5E1',
    },
    unlockButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
    biometricButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 8,
        marginBottom: 8,
    },
    biometricButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#4F46E5',
    },
    forgotButton: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    forgotButtonText: {
        fontSize: 14,
        color: '#4F46E5',
        fontWeight: '600',
    },
});

export default EnterVaultPasswordModal;
