import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Header from '../../components/Header';
import LoadingState from '../../components/LoadingState';
import { subscriptionService } from '../../services/subscriptionService';
import { reportsService } from '../../services/reportsService';
import { ENV } from '../../config/env';

const PLANS_DATA = [
  {
    name: 'Free',
    price: '₹0',
    cycle: 'Forever',
    billLimit: '10 bills/month',
    features: [
      'Up to 10 bills per month',
      'Basic billing format',
      'Customer directory',
      'Basic product management',
    ],
    recommended: false,
  },
  {
    name: 'Basic',
    price: '₹500',
    cycle: 'per month',
    billLimit: '1,500 bills/month',
    features: [
      'Up to 1,500 bills per month',
      '⚡ Express Fast Billing mode',
      'Full GST & Tax invoicing',
      'Classic & Wholesale formats',
      'Sales history & reports',
    ],
    recommended: true,
  },
  {
    name: 'Pro',
    price: '₹800',
    cycle: 'per month',
    billLimit: '2,500 bills/month',
    features: [
      'Up to 2,500 bills per month',
      '📦 Products & Services module',
      'All 9 premium invoice templates',
      'Stock tracking & inventory alerts',
      'Tally-format invoice & export',
      'Priority WhatsApp support',
    ],
    recommended: false,
  },
];

export const SubscriptionScreen = ({ navigation }) => {
  const [subscription, setSubscription] = useState(null);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activating, setActivating] = useState(false);

  const fetchSubscriptionData = useCallback(async () => {
    try {
      const [subData, reportData] = await Promise.allSettled([
        subscriptionService.getCurrentSubscription(),
        reportsService.getDashboardStats(),
      ]);

      if (subData.status === 'fulfilled') setSubscription(subData.value);
      if (reportData.status === 'fulfilled') setTotalInvoices(reportData.value?.totalInvoices || 0);
    } catch (err) {
      console.warn('Subscription fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptionData();
  }, [fetchSubscriptionData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSubscriptionData();
  };

  const handleTestActivate = async (planName) => {
    setActivating(true);
    try {
      await subscriptionService.activateTestPro(planName);
      Alert.alert('Success', `🎉 ${planName} Plan activated successfully!`);
      fetchSubscriptionData();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to activate plan.');
    } finally {
      setActivating(false);
    }
  };

  if (loading && !refreshing) {
    return <LoadingState message="Loading subscription plans..." fullScreen />;
  }

  const currentPlanName = subscription?.Plan?.name || 'Free';
  const planLimits = { Free: 10, Basic: 1500, Pro: 2500 };
  const maxLimit = planLimits[currentPlanName] || 10;
  const usagePercent = Math.min(Math.round((totalInvoices / maxLimit) * 100), 100);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Subscription Plans"
        subtitle="Billing Quotas & Features"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* Active Plan Card */}
        <Card style={styles.activePlanCard}>
          <View style={styles.activePlanHeader}>
            <View>
              <Text style={styles.activePlanSub}>Current Active Plan</Text>
              <Text style={styles.activePlanTitle}>{currentPlanName} Plan</Text>
            </View>
            <Badge label="Active" variant="success" size="md" />
          </View>

          <View style={styles.usageContainer}>
            <View style={styles.usageTextRow}>
              <Text style={styles.usageLabel}>Monthly Bill Usage</Text>
              <Text style={styles.usageNumbers}>
                {totalInvoices} / {maxLimit.toLocaleString()} bills
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${usagePercent}%` }]} />
            </View>
          </View>
        </Card>

        {/* Store Compliance Policy Notice */}
        <View style={styles.complianceNotice}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.info} style={styles.infoIcon} />
          <Text style={styles.complianceText}>
            GoBill business accounts and SaaS billing quotas sync seamlessly across Web and Mobile. To upgrade your plan or manage corporate billing, visit your account portal at <Text style={styles.portalLink}>gobill.gldatacenter.com</Text>.
          </Text>
        </View>

        {/* Available Plans */}
        <Text style={styles.sectionTitle}>Available Tiers</Text>

        {PLANS_DATA.map((plan) => {
          const isCurrent = currentPlanName.toLowerCase() === plan.name.toLowerCase();

          return (
            <Card
              key={plan.name}
              style={[
                styles.planCard,
                plan.recommended && styles.recommendedCard,
                isCurrent && styles.currentPlanBorder,
              ]}
            >
              {plan.recommended ? (
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedBadgeText}>RECOMMENDED</Text>
                </View>
              ) : null}

              <View style={styles.planCardHeader}>
                <View>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planQuota}>{plan.billLimit}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.planPrice}>{plan.price}</Text>
                  <Text style={styles.planCycle}>{plan.cycle}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.featuresList}>
                {plan.features.map((feat, idx) => (
                  <View key={idx} style={styles.featureRow}>
                    <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} style={styles.checkIcon} />
                    <Text style={styles.featureText}>{feat}</Text>
                  </View>
                ))}
              </View>

              {isCurrent ? (
                <View style={styles.currentActiveBtn}>
                  <Ionicons name="checkmark" size={18} color={COLORS.primary} />
                  <Text style={styles.currentActiveBtnText}> Your Current Plan</Text>
                </View>
              ) : ENV.isDev ? (
                <Button
                  title={`Switch to ${plan.name} (Dev Mode)`}
                  onPress={() => handleTestActivate(plan.name)}
                  loading={activating}
                  variant={plan.recommended ? 'primary' : 'outline'}
                  size="sm"
                  style={{ marginTop: SPACING.md }}
                />
              ) : null}
            </Card>
          );
        })}
      </ScrollView>
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
  activePlanCard: {
    backgroundColor: '#0f172a',
    marginBottom: SPACING.lg,
  },
  activePlanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  activePlanSub: {
    fontSize: 12,
    color: '#94a3b8',
  },
  activePlanTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.white,
    marginTop: 2,
  },
  usageContainer: {
    marginTop: SPACING.xs,
  },
  usageTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  usageLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  usageNumbers: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  complianceNotice: {
    flexDirection: 'row',
    backgroundColor: COLORS.infoLight,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xl,
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  complianceText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.text,
    lineHeight: 18,
  },
  portalLink: {
    fontWeight: '700',
    color: COLORS.info,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  planCard: {
    marginBottom: SPACING.md,
    position: 'relative',
  },
  recommendedCard: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  currentPlanBorder: {
    backgroundColor: '#f8fafc',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -10,
    right: SPACING.lg,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  recommendedBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  planQuota: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  planPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  planCycle: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  featuresList: {
    marginBottom: SPACING.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  checkIcon: {
    marginRight: 6,
  },
  featureText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
  },
  currentActiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    marginTop: SPACING.md,
  },
  currentActiveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
});

export default SubscriptionScreen;
