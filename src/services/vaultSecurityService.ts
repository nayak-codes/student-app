// Vault Security Service
// Manages password protection for the document vault

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

const VAULT_PASSWORD_KEY = '@vault_password';
const BIOMETRIC_ENABLED_KEY = '@vault_biometric_enabled';

// Simple hash function for password storage
const hashPassword = (password: string): string => {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
};

// Check if a password has been set
export const hasVaultPassword = async (): Promise<boolean> => {
    try {
        const password = await AsyncStorage.getItem(VAULT_PASSWORD_KEY);
        const exists = password !== null;
        console.log('🔍 Checking vault password:', exists ? 'EXISTS' : 'NOT SET');
        return exists;
    } catch (error) {
        console.error('❌ Error checking vault password:', error);
        return false;
    }
};

// Set a new vault password
export const setVaultPassword = async (password: string): Promise<boolean> => {
    try {
        console.log('🔐 Setting vault password...');
        const hashedPassword = hashPassword(password);
        console.log('🔐 Password hashed successfully');

        await AsyncStorage.setItem(VAULT_PASSWORD_KEY, hashedPassword);
        console.log('🔐 Password saved to AsyncStorage');

        // Verify it was saved
        const saved = await AsyncStorage.getItem(VAULT_PASSWORD_KEY);
        if (saved) {
            console.log('✅ Password verified in storage');
            return true;
        } else {
            console.error('❌ Password not found after saving');
            return false;
        }
    } catch (error) {
        console.error('❌ Error setting vault password:', error);
        return false;
    }
};

// Verify the entered password
export const verifyVaultPassword = async (password: string): Promise<boolean> => {
    try {
        const storedHash = await AsyncStorage.getItem(VAULT_PASSWORD_KEY);
        if (!storedHash) return false;

        const enteredHash = hashPassword(password);
        return storedHash === enteredHash;
    } catch (error) {
        console.error('Error verifying vault password:', error);
        return false;
    }
};

// Reset/remove the vault password
export const resetVaultPassword = async (): Promise<boolean> => {
    try {
        await AsyncStorage.removeItem(VAULT_PASSWORD_KEY);
        return true;
    } catch (error) {
        console.error('Error resetting vault password:', error);
        return false;
    }
};

// Change the vault password (requires old password verification)
export const changeVaultPassword = async (
    oldPassword: string,
    newPassword: string
): Promise<boolean> => {
    try {
        const isValid = await verifyVaultPassword(oldPassword);
        if (!isValid) return false;

        return await setVaultPassword(newPassword);
    } catch (error) {
        console.error('Error changing vault password:', error);
        return false;
    }
};

// ============ BIOMETRIC AUTHENTICATION ============

// Check if device supports biometric authentication
export const isBiometricSupported = async (): Promise<boolean> => {
    try {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        console.log('👆 Biometric support:', { compatible, enrolled });
        return compatible && enrolled;
    } catch (error) {
        console.error('❌ Error checking biometric support:', error);
        return false;
    }
};

// Get available biometric types
export const getBiometricTypes = async (): Promise<string[]> => {
    try {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        const typeNames = types.map(type => {
            switch (type) {
                case LocalAuthentication.AuthenticationType.FINGERPRINT:
                    return 'Fingerprint';
                case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
                    return 'Face ID';
                case LocalAuthentication.AuthenticationType.IRIS:
                    return 'Iris';
                default:
                    return 'Biometric';
            }
        });
        console.log('👆 Available biometric types:', typeNames);
        return typeNames;
    } catch (error) {
        console.error('❌ Error getting biometric types:', error);
        return [];
    }
};

// Check if biometric authentication is enabled for vault
export const isBiometricEnabled = async (): Promise<boolean> => {
    try {
        const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
        return enabled === 'true';
    } catch (error) {
        console.error('❌ Error checking biometric enabled:', error);
        return false;
    }
};

// Enable/disable biometric authentication for vault
export const setBiometricEnabled = async (enabled: boolean): Promise<boolean> => {
    try {
        await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, enabled.toString());
        console.log('👆 Biometric authentication', enabled ? 'enabled' : 'disabled');
        return true;
    } catch (error) {
        console.error('❌ Error setting biometric enabled:', error);
        return false;
    }
};

// Authenticate using biometric
export const authenticateWithBiometric = async (): Promise<boolean> => {
    try {
        console.log('👆 Starting biometric authentication...');
        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Unlock Document Vault',
            fallbackLabel: 'Use Password',
            cancelLabel: 'Cancel',
            disableDeviceFallback: true,
        });

        if (result.success) {
            console.log('✅ Biometric authentication successful');
            return true;
        } else {
            console.log('❌ Biometric authentication failed:', result.error);
            return false;
        }
    } catch (error) {
        console.error('❌ Error during biometric authentication:', error);
        return false;
    }
};
