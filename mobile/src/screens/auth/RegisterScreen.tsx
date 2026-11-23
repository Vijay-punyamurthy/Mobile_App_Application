import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../types';

export const RegisterScreen = ({ navigation }: any) => {
  const { register, isLoading, error } = useAuthStore();
  const [role, setRole] = useState<UserRole>('buyer');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [companyOrAgency, setCompanyOrAgency] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password) {
      setLocalError('Please complete all required fields.');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }
    setLocalError(null);
    try {
      await register({
        role,
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        phone_number: phoneNumber.trim() || undefined,
        company_or_agency: companyOrAgency.trim() || undefined,
        license_number: licenseNumber.trim() || undefined,
      });
    } catch (e: any) {
      setLocalError(e.message || 'Registration failed');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Select your LandConnect role to get started</Text>
        </View>

        {/* Role Selection Tabs */}
        <View style={styles.roleTabs}>
          {(['buyer', 'seller', 'broker'] as UserRole[]).map((r) => {
            const isSelected = role === r;
            return (
              <TouchableOpacity
                key={r}
                style={[styles.roleTab, isSelected && styles.roleTabActive]}
                onPress={() => setRole(r)}
              >
                <Text style={[styles.roleTabText, isSelected && styles.roleTabTextActive]}>
                  {r.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.roleExplanation}>
          <Text style={styles.roleExplanationText}>
            {role === 'buyer' && 'Browse, save, and purchase land parcels with direct audio/video calling to sellers.'}
            {role === 'seller' && 'List and manage personal land tracts, post imagery, and connect directly with buyers.'}
            {role === 'broker' && 'Licensed agent representation: manage multiple client listings and organize virtual inspection rooms.'}
          </Text>
        </View>

        {(localError || error) && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color="#ef4444" style={{ marginRight: 6 }} />
            <Text style={styles.errorText}>{localError || error}</Text>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Jordan Miller"
              placeholderTextColor="#94a3b8"
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address *</Text>
            <TextInput
              style={styles.input}
              placeholder="jordan@example.com"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password * (min. 6 chars)</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="+1 (555) 000-0000"
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
          </View>

          {role === 'broker' && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Agency / Brokerage Firm *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Premier Land Partners"
                  placeholderTextColor="#94a3b8"
                  value={companyOrAgency}
                  onChangeText={setCompanyOrAgency}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Real Estate License # *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. DRE-0294819"
                  placeholderTextColor="#94a3b8"
                  value={licenseNumber}
                  onChangeText={setLicenseNumber}
                />
              </View>
            </>
          )}

          <TouchableOpacity style={styles.submitBtn} onPress={handleRegister} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitBtnText}>Complete Registration</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}> Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    padding: 24,
    flexGrow: 1,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  roleTabs: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 4,
    marginBottom: 10,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  roleTabActive: {
    backgroundColor: '#0284c7',
  },
  roleTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  roleTabTextActive: {
    color: '#ffffff',
  },
  roleExplanation: {
    backgroundColor: '#f0f9ff',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bae6fd',
    marginBottom: 16,
  },
  roleExplanationText: {
    color: '#0369a1',
    fontSize: 12,
    lineHeight: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    flex: 1,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
    backgroundColor: '#f8fafc',
    color: '#0f172a',
    fontSize: 14,
  },
  submitBtn: {
    backgroundColor: '#0284c7',
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  footerText: {
    color: '#64748b',
    fontSize: 14,
  },
  footerLink: {
    color: '#0284c7',
    fontSize: 14,
    fontWeight: '700',
  },
});
