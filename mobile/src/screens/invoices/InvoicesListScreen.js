import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import LoadingState from '../../components/LoadingState';
import { invoiceService } from '../../services/invoiceService';

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'paid', label: 'Paid' },
  { id: 'partial', label: 'Partial' },
  { id: 'unpaid', label: 'Unpaid' },
];

export const InvoicesListScreen = ({ navigation }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const fetchInvoices = useCallback(async () => {
    try {
      const data = await invoiceService.getInvoices();
      setInvoices(data || []);
    } catch (err) {
      console.warn('Failed to fetch invoices:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInvoices();
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter((item) => {
      // Status filter
      if (activeFilter !== 'all') {
        const itemStatus = (item.payment_status || 'unpaid').toLowerCase();
        if (itemStatus !== activeFilter) return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const num = (item.invoice_number || '').toLowerCase();
        const name = (item.customer_name || '').toLowerCase();
        const mobile = (item.customer_mobile || '').toLowerCase();
        return num.includes(query) || name.includes(query) || mobile.includes(query);
      }
      return true;
    });
  }, [invoices, activeFilter, searchQuery]);

  const formatCurrency = (amount) => {
    const val = parseFloat(amount || 0);
    return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const renderInvoiceItem = ({ item }) => {
    const total = parseFloat(item.total_amount || 0);
    const paid = parseFloat(item.paid_amount || 0);
    const due = Math.max(0, total - paid);

    return (
      <Card
        style={styles.invoiceCard}
        onPress={() => navigation.navigate('InvoiceDetail', { id: item.id })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.numberWrap}>
            <Text style={styles.invoiceNumber}>{item.invoice_number}</Text>
            <Text style={styles.invoiceDate}>
              {new Date(item.created_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </Text>
          </View>
          <Badge
            label={item.payment_status || 'unpaid'}
            variant={item.payment_status || 'unpaid'}
            size="sm"
          />
        </View>

        <View style={styles.customerRow}>
          <Ionicons name="person-outline" size={14} color={COLORS.textMuted} style={styles.rowIcon} />
          <Text style={styles.customerName} numberOfLines={1}>
            {item.customer_name || 'Walk-in Customer'}
          </Text>
          {item.customer_mobile ? (
            <Text style={styles.customerMobile}> • {item.customer_mobile}</Text>
          ) : null}
        </View>

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.amountLabel}>Total Bill</Text>
            <Text style={styles.amountValue}>{formatCurrency(total)}</Text>
          </View>
          {due > 0 ? (
            <View style={styles.dueContainer}>
              <Text style={styles.dueLabel}>Balance Due</Text>
              <Text style={styles.dueValue}>{formatCurrency(due)}</Text>
            </View>
          ) : (
            <View style={styles.paidContainer}>
              <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
              <Text style={styles.paidText}> Fully Paid</Text>
            </View>
          )}
        </View>
      </Card>
    );
  };

  if (loading && !refreshing) {
    return <LoadingState message="Loading invoices..." fullScreen />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Search & Filter Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search invoice #, customer name, mobile..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Pills */}
        <View style={styles.filterPills}>
          {FILTER_TABS.map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setActiveFilter(tab.id)}
              >
                <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <FlatList
        data={filteredInvoices}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderInvoiceItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="receipt-outline"
            title="No Invoices Found"
            description={
              searchQuery
                ? 'No bills match your active search and filter criteria.'
                : 'You have not created any bills yet. Tap "+ Create Bill" to get started.'
            }
            actionTitle="+ Create Bill"
            onAction={() => navigation.navigate('CreateInvoice')}
          />
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateInvoice')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchHeader: {
    backgroundColor: COLORS.card,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 44,
  },
  searchIcon: {
    marginRight: SPACING.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  filterPills: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
  },
  filterPillActive: {
    backgroundColor: COLORS.primary,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterPillTextActive: {
    color: COLORS.white,
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: 90,
  },
  invoiceCard: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  numberWrap: {
    flex: 1,
  },
  invoiceNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  invoiceDate: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.xs,
  },
  rowIcon: {
    marginRight: 4,
  },
  customerName: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  customerMobile: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: COLORS.surface,
    paddingTop: SPACING.sm,
    marginTop: SPACING.xs,
  },
  amountLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  dueContainer: {
    alignItems: 'flex-end',
  },
  dueLabel: {
    fontSize: 11,
    color: COLORS.danger,
    fontWeight: '500',
  },
  dueValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.danger,
  },
  paidContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paidText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.success,
  },
  fab: {
    position: 'absolute',
    right: SPACING.xl,
    bottom: SPACING.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.lg,
  },
});

export default InvoicesListScreen;
