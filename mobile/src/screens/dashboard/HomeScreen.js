import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import LoadingState from '../../components/LoadingState';
import { useAuth } from '../../context/AuthContext';
import { reportsService } from '../../services/reportsService';
import { companyService } from '../../services/companyService';
import { subscriptionService } from '../../services/subscriptionService';

export const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [company, setCompany] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = useCallback(async () => {
    try {
      const [statsData, companyData, subData] = await Promise.allSettled([
        reportsService.getDashboardStats(),
        companyService.getProfile(),
        subscriptionService.getCurrentSubscription(),
      ]);

      if (statsData.status === 'fulfilled') setStats(statsData.value);
      if (companyData.status === 'fulfilled') setCompany(companyData.value);
      if (subData.status === 'fulfilled') setSubscription(subData.value);
    } catch (err) {
      console.warn('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  if (loading) {
    return <LoadingState message="Loading business dashboard..." fullScreen />;
  }

  const formatCurrency = (amount) => {
    const val = parseFloat(amount || 0);
    return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const planName = subscription?.Plan?.name || 'Free';
  const planLimits = { Free: 10, Basic: 1500, Pro: 2500 };
  const maxLimit = planLimits[planName] || 10;
  const currentCount = stats?.totalInvoices || 0;
  const usagePercent = Math.min(Math.round((currentCount / maxLimit) * 100), 100);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {/* Header Bar */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.companyName}>
              {company?.name || user?.name || 'GoBill Store'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => navigation.navigate('SettingsTab')}
            activeOpacity={0.8}
          >
            <Ionicons name="business" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Subscription Banner */}
        <TouchableOpacity
          style={styles.planBanner}
          onPress={() => navigation.navigate('Subscription')}
          activeOpacity={0.85}
        >
          <View style={styles.planBannerTop}>
            <View style={styles.planBadgeContainer}>
              <Text style={styles.planBadgeText}>⚡ {planName} Plan</Text>
            </View>
            <Text style={styles.planUsageText}>
              {currentCount} / {maxLimit.toLocaleString()} bills
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${usagePercent}%` }]} />
          </View>
        </TouchableOpacity>

        {/* Quick Action Grid */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={[styles.quickActionCard, { backgroundColor: COLORS.primary }]}
            onPress={() => navigation.navigate('CreateInvoice')}
            activeOpacity={0.8}
          >
            <Ionicons name="receipt" size={24} color={COLORS.white} />
            <Text style={[styles.quickActionText, { color: COLORS.white }]}>+ Create Bill</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('ProductsTab')}
            activeOpacity={0.8}
          >
            <Ionicons name="cube-outline" size={24} color={COLORS.primary} />
            <Text style={styles.quickActionText}>Products</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('CustomersTab')}
            activeOpacity={0.8}
          >
            <Ionicons name="people-outline" size={24} color={COLORS.primary} />
            <Text style={styles.quickActionText}>Customers</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('ReportsTab')}
            activeOpacity={0.8}
          >
            <Ionicons name="bar-chart-outline" size={24} color={COLORS.primary} />
            <Text style={styles.quickActionText}>Reports</Text>
          </TouchableOpacity>
        </View>

        {/* Financial Metrics Cards */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.metricsGrid}>
          <Card style={styles.metricCard}>
            <View style={styles.metricIconWrap}>
              <Ionicons name="wallet-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.metricLabel}>Total Sales</Text>
            <Text style={styles.metricValue}>{formatCurrency(stats?.totalSales)}</Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: COLORS.dangerLight }]}>
              <Ionicons name="alert-circle-outline" size={20} color={COLORS.danger} />
            </View>
            <Text style={styles.metricLabel}>Pending Due</Text>
            <Text style={[styles.metricValue, { color: COLORS.danger }]}>
              {formatCurrency(stats?.totalPending)}
            </Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: COLORS.infoLight }]}>
              <Ionicons name="documents-outline" size={20} color={COLORS.info} />
            </View>
            <Text style={styles.metricLabel}>Total Invoices</Text>
            <Text style={styles.metricValue}>{stats?.totalInvoices || 0}</Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: COLORS.warningLight }]}>
              <Ionicons name="person-add-outline" size={20} color={COLORS.warning} />
            </View>
            <Text style={styles.metricLabel}>Total Customers</Text>
            <Text style={styles.metricValue}>{stats?.totalCustomers || 0}</Text>
          </Card>
        </View>

        {/* Recent Invoices */}
        <View style={styles.recentHeader}>
          <Text style={styles.sectionTitle}>Recent Invoices</Text>
          <TouchableOpacity onPress={() => navigation.navigate('BillsTab')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {stats?.recentInvoices && stats.recentInvoices.length > 0 ? (
          stats.recentInvoices.slice(0, 5).map((invoice) => (
            <Card
              key={invoice.id}
              style={styles.invoiceItem}
              onPress={() => navigation.navigate('InvoiceDetail', { id: invoice.id })}
            >
              <View style={styles.invoiceItemLeft}>
                <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
                <Text style={styles.customerName}>{invoice.customer_name || 'Walk-in Customer'}</Text>
                <Text style={styles.invoiceDate}>
                  {new Date(invoice.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
              </View>
              <View style={styles.invoiceItemRight}>
                <Text style={styles.invoiceAmount}>{formatCurrency(invoice.total_amount)}</Text>
                <Badge
                  label={invoice.payment_status || 'unpaid'}
                  variant={invoice.payment_status || 'unpaid'}
                  size="sm"
                />
              </View>
            </Card>
          ))
        ) : (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No invoices created yet.</Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => navigation.navigate('CreateInvoice')}
            >
              <Text style={styles.emptyBtnText}>Create your first bill</Text>
            </TouchableOpacity>
          </Card>
        )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  greeting: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  companyName: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.4,
  },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planBanner: {
    backgroundColor: '#0f172a',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  planBannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  planBadgeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  planBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  planUsageText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
    gap: SPACING.xs,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  metricCard: {
    width: '47.5%',
    padding: SPACING.md,
    marginVertical: 0,
  },
  metricIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  metricLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 2,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  invoiceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  invoiceItemLeft: {
    flex: 1,
  },
  invoiceNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  customerName: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  invoiceDate: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  invoiceItemRight: {
    alignItems: 'flex-end',
    marginLeft: SPACING.md,
  },
  invoiceAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
  },
  emptyBtn: {
    backgroundColor: COLORS.primaryLight,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
  },
  emptyBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
});

export default HomeScreen;
