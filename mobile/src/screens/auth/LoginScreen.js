import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  SafeAreaView,
  Alert,
} from 'react-native';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { authService } from '../../services/authService';

export const LoginScreen = ({ navigation }) => {
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleMobileChange = (text) => {
    // Strip non-digits and normalize +91 / leading 0
    let cleaned = text.replace(/\D/g, '');
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      cleaned = cleaned.slice(2);
    } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
      cleaned = cleaned.slice(1);
    }
    if (cleaned.length > 10) {
      cleaned = cleaned.slice(-10);
    }
    setMobile(cleaned);
    if (error) setError('');
  };

  const handleSendOtp = async () => {
    if (mobile.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const normalizedMobile = `91${mobile}`;
      try {
        await authService.resendOtp(normalizedMobile);
      } catch (sendErr) {
        // Log status and allow navigation so user can input code
        console.log('OTP request status:', sendErr.message);
      }
      navigation.navigate('OtpVerify', { mobile });
    } catch (err) {
      const message = err.message || 'Unable to proceed with login. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoBadgeText}>GB</Text>
            </View>
            <Text style={styles.brandTitle}>GoBill</Text>
            <Text style={styles.brandSubtitle}>GST Billing & Business Accounting</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign in to your account</Text>
            <Text style={styles.cardSubtitle}>
              Enter your 10-digit mobile number to receive a secure OTP verification code.
            </Text>

            <Input
              label="Mobile Number"
              prefix="+91"
              placeholder="98765 43210"
              value={mobile}
              onChangeText={handleMobileChange}
              keyboardType="number-pad"
              maxLength={10}
              error={error}
            />

            <Button
              title="Get OTP Code"
              onPress={handleSendOtp}
              loading={loading}
              size="lg"
              style={styles.submitBtn}
            />

            <View style={styles.securityNote}>
              <Text style={styles.securityText}>
                🔒 100% Secure Login with Verification Code
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By signing in, you agree to GoBill's Terms of Service and Privacy Policy.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  logoBadgeText: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: SPACING.lg,
  },
  submitBtn: {
    marginTop: SPACING.md,
  },
  securityNote: {
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  securityText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  footer: {
    marginTop: SPACING.xxl,
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default LoginScreen;
