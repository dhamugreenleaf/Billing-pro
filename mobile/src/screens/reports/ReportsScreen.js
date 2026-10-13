import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import Card from '../../components/Card';
import LoadingState from '../../components/LoadingState';
import { reportsService } from '../../services/reportsService';

export const ReportsScreen = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      const data = await reportsService.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.warn('Reports error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  if (loading && !refreshing) {
    return <LoadingState message="Calculating business reports..." fullScreen />;
  }

  const formatCurrency = (amount) => {
    const val = parseFloat(amount || 0);
    return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const totalSales = parseFloat(stats?.totalSales || 0);
  const totalPaid = parseFloat(stats?.totalPaid || 0);
  const totalPending = parseFloat(stats?.totalPending || 0);
  const paidPercent = totalSales > 0 ? Math.round((totalPaid / totalSales) * 100) : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        <Text style={styles.pageTitle}>Sales & Collections</Text>
        <Text style={styles.pageSubtitle}>Live financial performance summary</Text>

        {/* Primary Metric Card */}
        <Card style={styles.heroCard}>
          <Text style={styles.heroLabel}>Total Revenue</Text>
          <Text style={styles.heroValue}>{formatCurrency(totalSales)}</Text>
          <View style={styles.collectionRateWrap}>
            <Text style={styles.collectionRateText}>
              ✅ {paidPercent}% Collected to Date
            </Text>
          </View>
        </Card>

        {/* Split Cards */}
        <View style={styles.splitGrid}>
          <Card style={styles.splitCard}>
            <View style={[styles.iconWrap, { backgroundColor: COLORS.successLight }]}>
              <Ionicons name="checkmark-done" size={20} color={COLORS.success} />
            </View>
            <Text style={styles.splitLabel}>Total Collected</Text>
            <Text style={[styles.splitValue, { color: COLORS.success }]}>
              {formatCurrency(totalPaid)}
            </Text>
          </Card>

          <Card style={styles.splitCard}>
            <View style={[styles.iconWrap, { backgroundColor: COLORS.dangerLight }]}>
              <Ionicons name="time" size={20} color={COLORS.danger} />
            </View>
            <Text style={styles.splitLabel}>Pending Dues</Text>
            <Text style={[styles.splitValue, { color: COLORS.danger }]}>
              {formatCurrency(totalPending)}
            </Text>
          </Card>
        </View>

        {/* Activity Summary */}
        <Text style={styles.sectionTitle}>Transaction Summary</Text>
        <Card style={styles.summaryListCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryRowLeft}>
              <Ionicons name="receipt-outline" size={18} color={COLORS.primary} style={styles.rowIcon} />
              <Text style={styles.summaryRowLabel}>Total Invoices Generated</Text>
            </View>
            <Text style={styles.summaryRowValue}>{stats?.totalInvoices || 0}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <View style={styles.summaryRowLeft}>
              <Ionicons name="people-outline" size={18} color={COLORS.info} style={styles.rowIcon} />
              <Text style={styles.summaryRowLabel}>Registered Buyers & Clients</Text>
            </View>
            <Text style={styles.summaryRowValue}>{stats?.totalCustomers || 0}</Text>
          </View>
        </Card>

        {/* Accounting Tip */}
        <View style={styles.tipCard}>
          <Ionicons name="bulb-outline" size={20} color={COLORS.warning} style={{ marginRight: SPACING.sm }} />
          <Text style={styles.tipText}>
            Tip: You can export complete GST sales registers and Tally XML ledger files anytime from the GoBill Web Portal.
          </Text>
        </View>
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
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  pageSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: SPACING.lg,
    marginTop: 2,
  },
  heroCard: {
    backgroundColor: '#0f172a',
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  heroLabel: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  heroValue: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.white,
    marginVertical: 4,
  },
  collectionRateWrap: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
    marginTop: SPACING.xs,
  },
  collectionRateText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  splitGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  splitCard: {
    flex: 1,
    padding: SPACING.md,
    marginVertical: 0,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  splitLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  splitValue: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  summaryListCard: {
    marginBottom: SPACING.xl,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  summaryRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowIcon: {
    marginRight: SPACING.sm,
  },
  summaryRowLabel: {
    fontSize: 14,
    color: COLORS.text,
  },
  summaryRowValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.surface,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.warningLight,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.text,
    lineHeight: 18,
  },
});

export default ReportsScreen;
