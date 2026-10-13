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
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import EmptyState from '../../components/EmptyState';
import LoadingState from '../../components/LoadingState';
import { customerService } from '../../services/customerService';

export const CustomersListScreen = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [formError, setFormError] = useState('');

  const fetchCustomers = useCallback(async () => {
    try {
      const data = await customerService.getCustomers();
      setCustomers(data || []);
    } catch (err) {
      console.warn('Failed to fetch customers:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCustomers();
  };

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const query = searchQuery.toLowerCase();
    return customers.filter((c) => {
      const cName = (c.name || '').toLowerCase();
      const cPhone = (c.mobile_number || '').toLowerCase();
      const cAddr = (c.billing_address || '').toLowerCase();
      const cGst = (c.gstin || '').toLowerCase();
      return (
        cName.includes(query) ||
        cPhone.includes(query) ||
        cAddr.includes(query) ||
        cGst.includes(query)
      );
    });
  }, [customers, searchQuery]);

  const handleOpenAddModal = () => {
    setName('');
    setMobile('');
    setBillingAddress('');
    setShippingAddress('');
    setGstin('');
    setFormError('');
    setModalVisible(true);
  };

  const handleSaveCustomer = async () => {
    if (!name.trim()) {
      setFormError('Customer name is required');
      return;
    }
    const cleanMobile = mobile.replace(/\D/g, '').slice(0, 10);
    if (!cleanMobile || cleanMobile.length !== 10) {
      setFormError('Valid 10-digit mobile number is required');
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      await customerService.createCustomer({
        name: name.trim(),
        mobile_number: cleanMobile,
        billing_address: billingAddress.trim() || undefined,
        shipping_address: shippingAddress.trim() || billingAddress.trim() || undefined,
        gstin: gstin.trim() || undefined,
      });

      setModalVisible(false);
      fetchCustomers();
    } catch (err) {
      setFormError(err.message || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  const renderCustomerItem = ({ item }) => {
    return (
      <Card style={styles.customerCard}>
        <View style={styles.cardHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {(item.name || 'C').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1, marginLeft: SPACING.md }}>
            <Text style={styles.customerName}>{item.name}</Text>
            <Text style={styles.customerMobile}>📱 +91 {item.mobile_number}</Text>
          </View>
        </View>

        {item.billing_address ? (
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.addressText} numberOfLines={2}>
              {' '}{item.billing_address}
            </Text>
          </View>
        ) : null}

        {item.gstin ? (
          <View style={styles.gstinRow}>
            <Text style={styles.gstinLabel}>GSTIN: </Text>
            <Text style={styles.gstinValue}>{item.gstin}</Text>
          </View>
        ) : null}
      </Card>
    );
  };

  if (loading && !refreshing) {
    return <LoadingState message="Loading customers..." fullScreen />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.searchHeader}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by customer name, phone, GSTIN..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <FlatList
        data={filteredCustomers}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderCustomerItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="No Customers Found"
            description="Add your buyers and regular clients to quickly autocomplete their bills."
            actionTitle="+ Add Customer"
            onAction={handleOpenAddModal}
          />
        }
      />

      {/* Floating Add Customer Button */}
      <TouchableOpacity style={styles.fab} onPress={handleOpenAddModal} activeOpacity={0.85}>
        <Ionicons name="person-add" size={24} color={COLORS.white} />
      </TouchableOpacity>

      {/* Add Customer Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Customer</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Input
                label="Full Name / Business Name *"
                placeholder="e.g. Anand Textiles"
                value={name}
                onChangeText={setName}
                error={formError}
              />

              <Input
                label="Mobile Number *"
                prefix="+91"
                placeholder="98765 43210"
                value={mobile}
                onChangeText={(t) => setMobile(t.replace(/\D/g, '').slice(0, 10))}
                keyboardType="number-pad"
                maxLength={10}
              />

              <Input
                label="Billing Address"
                placeholder="e.g. 45, Market Street"
                value={billingAddress}
                onChangeText={setBillingAddress}
                multiline
                numberOfLines={2}
              />

              <Input
                label="Customer GSTIN (Optional)"
                placeholder="22AAAAA0000A1Z5"
                value={gstin}
                onChangeText={(t) => setGstin(t.toUpperCase())}
                autoCapitalize="characters"
                maxLength={15}
              />

              <Button
                title={saving ? 'Saving...' : 'Add Customer'}
                onPress={handleSaveCustomer}
                loading={saving}
                size="md"
                style={{ marginTop: SPACING.md }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    paddingVertical: SPACING.md,
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
  listContent: {
    padding: SPACING.lg,
    paddingBottom: 90,
  },
  customerCard: {
    marginBottom: SPACING.sm,
    padding: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  customerMobile: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: SPACING.xs,
  },
  addressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 16,
  },
  gstinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.surface,
  },
  gstinLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  gstinValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.backdrop,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '90%',
    padding: SPACING.xl,
    ...SHADOWS.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalScroll: {
    paddingBottom: SPACING.xxl,
  },
});

export default CustomersListScreen;
