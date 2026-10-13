import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import Card from '../../components/Card';
import ConfirmModal from '../../components/ConfirmModal';
import { useAuth } from '../../context/AuthContext';
import { companyService } from '../../services/companyService';
import { subscriptionService } from '../../services/subscriptionService';
import { ENV } from '../../config/env';

export const SettingsScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [company, setCompany] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const [comp, sub] = await Promise.allSettled([
          companyService.getProfile(),
          subscriptionService.getCurrentSubscription(),
        ]);
        if (comp.status === 'fulfilled') setCompany(comp.value);
        if (sub.status === 'fulfilled') setSubscription(sub.value);
      } catch (e) {
        // ignore
      }
    };
    loadProfile();
  }, []);

  const handleConfirmLogout = async () => {
    setShowLogoutModal(false);
    await logout();
  };

  const planName = subscription?.Plan?.name || 'Free';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.pageTitle}>Settings & Business</Text>

        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarWrap}>
              <Text style={styles.avatarText}>
                {(company?.name || user?.name || 'G').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1, marginLeft: SPACING.md }}>
              <Text style={styles.profileName}>{company?.name || user?.name || 'GoBill Merchant'}</Text>
              <Text style={styles.profilePhone}>📱 +91 {user?.mobile_number}</Text>
              <View style={styles.planBadgeWrap}>
                <Text style={styles.planBadgeText}>⚡ {planName} Plan</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Menu Items */}
        <Text style={styles.sectionHeader}>Business Configuration</Text>
        <Card style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('CompanyProfile')}
          >
            <View style={[styles.menuIconWrap, { backgroundColor: COLORS.primaryLight }]}>
              <Ionicons name="business-outline" size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuItemTitle}>Company Profile & GST</Text>
              <Text style={styles.menuItemSubtitle}>Business name, GSTIN, PAN, address</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Subscription')}
          >
            <View style={[styles.menuIconWrap, { backgroundColor: COLORS.warningLight }]}>
              <Ionicons name="flash-outline" size={20} color={COLORS.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuItemTitle}>Subscription & Quotas</Text>
              <Text style={styles.menuItemSubtitle}>Active plan, bill quotas, features</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        </Card>

        <Text style={styles.sectionHeader}>About & Legal</Text>
        <Card style={styles.menuCard}>
          <View style={styles.menuItem}>
            <View style={[styles.menuIconWrap, { backgroundColor: COLORS.infoLight }]}>
              <Ionicons name="phone-portrait-outline" size={20} color={COLORS.info} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuItemTitle}>App Version</Text>
              <Text style={styles.menuItemSubtitle}>
                GoBill v{ENV.APP_VERSION} ({ENV.isDev ? 'Development' : 'Production'})
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.menuItem}>
            <View style={[styles.menuIconWrap, { backgroundColor: COLORS.surface }]}>
              <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.textSecondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuItemTitle}>Security & Privacy</Text>
              <Text style={styles.menuItemSubtitle}>End-to-end encrypted session</Text>
            </View>
          </View>
        </Card>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => setShowLogoutModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color={COLORS.danger} style={{ marginRight: SPACING.sm }} />
          <Text style={styles.logoutBtnText}>Sign Out of GoBill</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Logout Confirmation */}
      <ConfirmModal
        visible={showLogoutModal}
        title="Sign Out"
        message="Are you sure you want to sign out of your GoBill account on this device?"
        confirmText="Sign Out"
        confirmVariant="danger"
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  profileCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  profilePhone: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  planBadgeWrap: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  planBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  menuCard: {
    padding: 0,
    marginBottom: SPACING.xl,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  menuItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  menuItemSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.surface,
    marginLeft: 56,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.dangerLight,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.md,
  },
  logoutBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.danger,
  },
});

export default SettingsScreen;
