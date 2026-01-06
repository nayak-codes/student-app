// Setup Vault Password Modal
// Modal for creating a new vault password on first access

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import {
    getBiometricTypes,
    isBiometricSupported,
    setBiometricEnabled,
    setVaultPassword,
} from '../services/vaultSecurityService';

interface SetupVaultPasswordModalProps {
    visible: boolean;
    onPasswordSet: () => void;
}

const SetupVaultPasswordModal: React.FC<SetupVaultPasswordModalProps> = ({
    visible,
    onPasswordSet,
}) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [biometricSupported, setBiometricSupported] = useState(false);
    const [biometricTypes, setBiometricTypes] = useState<string[]>([]);
    const [enableBiometric, setEnableBiometric] = useState(true);

    useEffect(() => {
        const checkBiometric = async () => {
            const supported = await isBiometricSupported();
            setBiometricSupported(supported);
            if (supported) {
                const types = await getBiometricTypes();
                setBiometricTypes(types);
            }
        };
        checkBiometric();
    }, []);

    const getPasswordStrength = (): { text: string; color: string } => {
        if (password.length === 0) return { text: '', color: '' };
        if (password.length < 4) return { text: 'Too Short', color: '#EF4444' };
        if (password.length < 6) return { text: 'Weak', color: '#F59E0B' };
        if (password.length < 8) return { text: 'Good', color: '#10B981' };
        return { text: 'Strong', color: '#059669' };
    };

    const handleSetPassword = async () => {
        if (password.length < 4) {
            Alert.alert('Invalid Password', 'Password must be at least 4 characters long');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Password Mismatch', 'Passwords do not match. Please try again.');
            return;
        }

        setIsLoading(true);
        try {
            const success = await setVaultPassword(password);
            if (success) {
                // Enable biometric if supported and user opted in
                if (biometricSupported && enableBiometric) {
                    await setBiometricEnabled(true);
                }

                const biometricMsg = biometricSupported && enableBiometric
                    ? ` ${biometricTypes[0]} authentication has been enabled.`
                    : '';

                Alert.alert(
                    '🔒 Password Set Successfully',
                    `Your document vault is now protected. Remember your password!${biometricMsg}`,
                    [{ text: 'OK', onPress: onPasswordSet }]
                );
                setPassword('');
                setConfirmPassword('');
            } else {
                Alert.alert('Error', 'Failed to set password. Please try again.');
            }
        } catch (error) {
            console.error('Setup password error:', error);
            Alert.alert('Error', 'An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const strength = getPasswordStrength();

    return (
        <Modal visible={visible} animationType="fade" transparent>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="shield-checkmark" size={40} color="#4F46E5" />
                        </View>
                        <Text style={styles.title}>Secure Your Documents</Text>
                        <Text style={styles.subtitle}>
                            Create a password to protect your document vault
                        </Text>
                    </View>

                    {/* Password Input */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Create Password</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="lock-closed" size={20} color="#64748B" />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter password"
                                placeholderTextColor="#94A3B8"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons
                                    name={showPassword ? 'eye-off' : 'eye'}
                                    size={20}
                                    color="#64748B"
                                />
                            </TouchableOpacity>
                        </View>
                        {password.length > 0 && (
                            <Text style={[styles.strengthText, { color: strength.color }]}>
                                {strength.text}
                            </Text>
                        )}
                    </View>

                    {/* Confirm Password Input */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Confirm Password</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="lock-closed" size={20} color="#64748B" />
                            <TextInput
                                style={styles.input}
                                placeholder="Re-enter password"
                                placeholderTextColor="#94A3B8"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showConfirmPassword}
                                autoCapitalize="none"
                            />
                            <TouchableOpacity
                                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                <Ionicons
                                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                                    size={20}
                                    color="#64748B"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Biometric Option */}
                    {biometricSupported && (
                        <View style={styles.biometricContainer}>
                            <View style={styles.biometricInfo}>
                                <Ionicons name="finger-print" size={24} color="#4F46E5" />
                                <View style={styles.biometricText}>
                                    <Text style={styles.biometricTitle}>
                                        Enable {biometricTypes[0] || 'Biometric'}
                                    </Text>
                                    <Text style={styles.biometricSubtitle}>
                                        Unlock vault with your fingerprint or face
                                    </Text>
                                </View>
                            </View>
                            <Switch
                                value={enableBiometric}
                                onValueChange={setEnableBiometric}
                                trackColor={{ false: '#E2E8F0', true: '#A5B4FC' }}
                                thumbColor={enableBiometric ? '#4F46E5' : '#94A3B8'}
                            />
                        </View>
                    )}

                    {/* Info */}
                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle" size={16} color="#4F46E5" />
                        <Text style={styles.infoText}>
                            Remember this password. You'll need it to access your documents.
                        </Text>
                    </View>

                    {/* Set Password Button */}
                    <TouchableOpacity
                        style={[
                            styles.setButton,
                            (password.length < 4 || isLoading) && styles.setButtonDisabled,
                        ]}
                        onPress={handleSetPassword}
                        disabled={password.length < 4 || isLoading}
                    >
                        <Ionicons name="shield-checkmark" size={20} color="#FFF" />
                        <Text style={styles.setButtonText}>
                            {isLoading ? 'Setting Password...' : 'Set Password'}
                        </Text>
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
        marginBottom: 16,
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
    strengthText: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
        marginLeft: 4,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF2FF',
        padding: 12,
        borderRadius: 12,
        gap: 8,
        marginBottom: 20,
    },
    infoText: {
        flex: 1,
        fontSize: 12,
        color: '#4F46E5',
        lineHeight: 16,
    },
    biometricContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F8FAFC',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 16,
    },
    biometricInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    biometricText: {
        flex: 1,
    },
    biometricTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 2,
    },
    biometricSubtitle: {
        fontSize: 12,
        color: '#64748B',
    },
    setButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4F46E5',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    setButtonDisabled: {
        backgroundColor: '#CBD5E1',
    },
    setButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
});

export default SetupVaultPasswordModal;
