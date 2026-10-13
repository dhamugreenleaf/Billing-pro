import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Header from '../../components/Header';
import LoadingState from '../../components/LoadingState';
import ConfirmModal from '../../components/ConfirmModal';
import { invoiceService } from '../../services/invoiceService';

export const InvoiceDetailScreen = ({ route, navigation }) => {
  const { id } = route.params || {};
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  // Payment Recording Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Delete Invoice Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchInvoiceDetails = useCallback(async () => {
    try {
      const data = await invoiceService.getInvoice(id);
      setInvoice(data);
    } catch (err) {
      Alert.alert('Error', err.message || 'Unable to load invoice details.', [
        { text: 'Go Back', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setLoading(false);
    }
  }, [id, navigation]);

  useEffect(() => {
    fetchInvoiceDetails();
  }, [fetchInvoiceDetails]);

  if (loading || !invoice) {
    return <LoadingState message="Loading invoice..." fullScreen />;
  }

  const formatCurrency = (amount) => {
    const val = parseFloat(amount || 0);
    return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const total = parseFloat(invoice.total_amount || 0);
  const paid = parseFloat(invoice.paid_amount || 0);
  const due = Math.max(0, total - paid);

  const handleOpenPaymentModal = () => {
    setPaymentAmount(String(due > 0 ? due.toFixed(2) : '0.00'));
    setPaymentMethod('cash');
    setPaymentNotes('');
    setPaymentError('');
    setShowPaymentModal(true);
  };

  const handleRecordPayment = async () => {
    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      setPaymentError('Please enter a valid payment amount');
      return;
    }
    if (amt > due) {
      setPaymentError(`Amount cannot exceed the remaining due of ${formatCurrency(due)}`);
      return;
    }

    setRecordingPayment(true);
    setPaymentError('');

    try {
      await invoiceService.recordPayment(invoice.id, {
        amount: amt,
        payment_method: paymentMethod,
        notes: paymentNotes || 'Recorded from GoBill Mobile',
      });
      setShowPaymentModal(false);
      fetchInvoiceDetails();
    } catch (err) {
      setPaymentError(err.message || 'Failed to record payment');
    } finally {
      setRecordingPayment(false);
    }
  };

  const handleDeleteInvoice = async () => {
    setDeleting(true);
    try {
      await invoiceService.deleteInvoice(invoice.id);
      setShowDeleteModal(false);
      navigation.goBack();
    } catch (err) {
      Alert.alert('Delete Failed', err.message || 'Unable to delete invoice.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title={`Invoice ${invoice.invoice_number}`}
        subtitle={new Date(invoice.created_at).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity onPress={() => setShowDeleteModal(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="trash-outline" size={22} color={COLORS.danger} />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.container}>
        {/* Status & Amount Banner */}
        <Card style={styles.bannerCard}>
          <View style={styles.bannerTop}>
            <View>
              <Text style={styles.bannerAmountLabel}>Total Bill Amount</Text>
              <Text style={styles.bannerAmountValue}>{formatCurrency(total)}</Text>
            </View>
            <Badge
              label={invoice.payment_status || 'unpaid'}
              variant={invoice.payment_status || 'unpaid'}
              size="md"
            />
          </View>

          <View style={styles.bannerDivider} />

          <View style={styles.bannerBottom}>
            <View>
              <Text style={styles.bannerSmallLabel}>Amount Paid</Text>
              <Text style={[styles.bannerSmallValue, { color: COLORS.success }]}>
                {formatCurrency(paid)}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.bannerSmallLabel}>Balance Due</Text>
              <Text style={[styles.bannerSmallValue, { color: due > 0 ? COLORS.danger : COLORS.text }]}>
                {formatCurrency(due)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Customer Information */}
        <Text style={styles.sectionTitle}>Customer Details</Text>
        <Card style={styles.sectionCard}>
          <Text style={styles.customerName}>{invoice.customer_name || 'Walk-in Customer'}</Text>
          {invoice.customer_mobile ? (
            <Text style={styles.detailRow}>📱 +91 {invoice.customer_mobile}</Text>
          ) : null}
          {invoice.billing_address ? (
            <Text style={styles.detailRow}>📍 {invoice.billing_address}</Text>
          ) : null}
          {invoice.place_of_supply ? (
            <Text style={styles.detailRow}>🏛️ Place of Supply: {invoice.place_of_supply}</Text>
          ) : null}
        </Card>

        {/* Line Items Table */}
        <Text style={styles.sectionTitle}>Invoice Items</Text>
        <Card style={styles.sectionCard}>
          {invoice.items && invoice.items.length > 0 ? (
            invoice.items.map((item, idx) => (
              <View key={item.id || idx} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>
                    {item.item_name || item.description || `Item ${idx + 1}`}
                  </Text>
                  <Text style={styles.itemSubtext}>
                    Qty: {item.quantity || 1} × {formatCurrency(item.unit_price)}
                  </Text>
                </View>
                <Text style={styles.itemTotal}>{formatCurrency(item.total)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyItemsText}>No individual items specified.</Text>
          )}
        </Card>

        {/* Tax & GST Breakdown */}
        <Text style={styles.sectionTitle}>Bill Breakdown</Text>
        <Card style={styles.sectionCard}>
          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>Subtotal</Text>
            <Text style={styles.calcValue}>{formatCurrency(invoice.subtotal || invoice.amount)}</Text>
          </View>

          {parseFloat(invoice.discount_amount || 0) > 0 ? (
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Discount</Text>
              <Text style={[styles.calcValue, { color: COLORS.danger }]}>
                - {formatCurrency(invoice.discount_amount)}
              </Text>
            </View>
          ) : null}

          {invoice.gst_enabled ? (
            <>
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Taxable Value</Text>
                <Text style={styles.calcValue}>{formatCurrency(invoice.taxable_amount)}</Text>
              </View>
              {parseFloat(invoice.cgst_amount || 0) > 0 ? (
                <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>CGST ({parseFloat(invoice.cgst_rate)}%)</Text>
                  <Text style={styles.calcValue}>+ {formatCurrency(invoice.cgst_amount)}</Text>
                </View>
              ) : null}
              {parseFloat(invoice.sgst_amount || 0) > 0 ? (
                <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>SGST ({parseFloat(invoice.sgst_rate)}%)</Text>
                  <Text style={styles.calcValue}>+ {formatCurrency(invoice.sgst_amount)}</Text>
                </View>
              ) : null}
              {parseFloat(invoice.igst_amount || 0) > 0 ? (
                <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>IGST ({parseFloat(invoice.igst_rate)}%)</Text>
                  <Text style={styles.calcValue}>+ {formatCurrency(invoice.igst_amount)}</Text>
                </View>
              ) : null}
            </>
          ) : null}

          <View style={[styles.calcRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Grand Total</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(total)}</Text>
          </View>
        </Card>

        {/* Payments History */}
        <Text style={styles.sectionTitle}>Payments Recorded</Text>
        <Card style={styles.sectionCard}>
          {invoice.payments && invoice.payments.length > 0 ? (
            invoice.payments.map((p, idx) => (
              <View key={p.id || idx} style={styles.paymentRow}>
                <View>
                  <Text style={styles.paymentMethodText}>
                    {(p.payment_method || 'Cash').toUpperCase()}
                  </Text>
                  <Text style={styles.paymentDateText}>
                    {new Date(p.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                <Text style={styles.paymentAmountText}>+ {formatCurrency(p.amount)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyItemsText}>No payment transactions recorded.</Text>
          )}

          {due > 0 ? (
            <Button
              title="+ Record Payment"
              onPress={handleOpenPaymentModal}
              variant="primary"
              size="sm"
              style={styles.recordPaymentBtn}
            />
          ) : null}
        </Card>
      </ScrollView>

      {/* Record Payment Modal */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Payment</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDueNotice}>
              Outstanding Balance Due: <Text style={{ fontWeight: '700' }}>{formatCurrency(due)}</Text>
            </Text>

            <Input
              label="Payment Amount (₹)"
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              error={paymentError}
            />

            {/* Payment Method Selector */}
            <Text style={styles.methodLabel}>Payment Method</Text>
            <View style={styles.methodRow}>
              {['cash', 'upi', 'card', 'bank_transfer'].map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.methodPill, paymentMethod === m && styles.methodPillActive]}
                  onPress={() => setPaymentMethod(m)}
                >
                  <Text
                    style={[styles.methodPillText, paymentMethod === m && styles.methodPillTextActive]}
                  >
                    {m === 'bank_transfer' ? 'Bank' : m.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Notes (Optional)"
              value={paymentNotes}
              onChangeText={setPaymentNotes}
              placeholder="e.g. Paid in cash at counter"
            />

            <Button
              title="Save Payment"
              onPress={handleRecordPayment}
              loading={recordingPayment}
              size="md"
              style={{ marginTop: SPACING.md }}
            />
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        visible={showDeleteModal}
        title="Delete Invoice"
        message={`Are you sure you want to permanently delete invoice ${invoice.invoice_number}? This action cannot be undone.`}
        confirmText="Delete"
        loading={deleting}
        onConfirm={handleDeleteInvoice}
        onCancel={() => setShowDeleteModal(false)}
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
  bannerCard: {
    backgroundColor: '#0f172a',
    marginBottom: SPACING.lg,
  },
  bannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerAmountLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  bannerAmountValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.white,
    marginTop: 2,
  },
  bannerDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginVertical: SPACING.md,
  },
  bannerBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bannerSmallLabel: {
    fontSize: 11,
    color: '#94a3b8',
  },
  bannerSmallValue: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  sectionCard: {
    marginBottom: SPACING.md,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  detailRow: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 3,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  itemSubtext: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  emptyItemsText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  calcLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  calcValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
    marginTop: SPACING.xs,
  },
  grandTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  grandTotalValue: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.primary,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  paymentMethodText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  paymentDateText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  paymentAmountText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.success,
  },
  recordPaymentBtn: {
    marginTop: SPACING.md,
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
    padding: SPACING.xl,
    ...SHADOWS.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalDueNotice: {
    fontSize: 13,
    color: COLORS.danger,
    marginBottom: SPACING.sm,
  },
  methodLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  methodRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  methodPill: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  methodPillActive: {
    backgroundColor: COLORS.primary,
  },
  methodPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  methodPillTextActive: {
    color: COLORS.white,
  },
});

export default InvoiceDetailScreen;
