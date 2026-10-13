import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

export const OtpVerifyScreen = ({ route, navigation }) => {
  const { mobile } = route.params || {};
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resending, setResending] = useState(false);

  const { login } = useAuth();

  useEffect(() => {
    let interval = null;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendCooldown]);

  const handleVerify = async () => {
    if (!otp || otp.length < 4) {
      setError('Please enter a valid OTP code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const normalizedMobile = `91${mobile}`;
      // In development, if user enters mock or test OTP
      const result = await authService.verifyMsg91(normalizedMobile, otp, '', 'user');

      if (result?.token && result?.user) {
        await login(result.token, result.user);
      } else {
        throw new Error('Verification completed but no user session was returned.');
      }
    } catch (err) {
      const msg = err.message || 'OTP verification failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;

    setResending(true);
    setError('');

    try {
      const normalizedMobile = `91${mobile}`;
      await authService.resendOtp(normalizedMobile);
      setResendCooldown(60);
    } catch (err) {
      setError(err.message || 'Failed to resend OTP. Please try again later.');
    } finally {
      setResending(false);
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
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Verify Mobile Number</Text>
            <Text style={styles.cardSubtitle}>
              We have dispatched a 6-digit verification code to:
            </Text>

            <View style={styles.phoneBadge}>
              <Text style={styles.phoneText}>+91 {mobile}</Text>
              <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.changePhoneText}>Change</Text>
              </TouchableOpacity>
            </View>

            <Input
              label="Enter 6-digit OTP Code"
              placeholder="123456"
              value={otp}
              onChangeText={(t) => {
                setOtp(t.replace(/\D/g, '').slice(0, 6));
                if (error) setError('');
              }}
              keyboardType="number-pad"
              maxLength={6}
              error={error}
              inputStyle={styles.otpInput}
            />

            <Button
              title="Verify & Continue"
              onPress={handleVerify}
              loading={loading}
              size="lg"
              style={styles.submitBtn}
            />

            <View style={styles.resendSection}>
              {resendCooldown > 0 ? (
                <Text style={styles.resendTimerText}>
                  Resend OTP in <Text style={styles.timerBold}>{resendCooldown}s</Text>
                </Text>
              ) : (
                <TouchableOpacity
                  onPress={handleResend}
                  disabled={resending}
                  activeOpacity={0.7}
                >
                  <Text style={styles.resendLink}>
                    {resending ? 'Sending...' : 'Didn’t receive the code? Resend OTP'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
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
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  phoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
  },
  phoneText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  changePhoneText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  otpInput: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 8,
    textAlign: 'center',
  },
  submitBtn: {
    marginTop: SPACING.md,
  },
  resendSection: {
    marginTop: SPACING.xl,
    alignItems: 'center',
  },
  resendTimerText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  timerBold: {
    fontWeight: '700',
    color: COLORS.text,
  },
  resendLink: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
});

export default OtpVerifyScreen;
