import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Switch,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Header from '../../components/Header';
import { invoiceService } from '../../services/invoiceService';
import { customerService } from '../../services/customerService';
import { productService } from '../../services/productService';
import { companyService } from '../../services/companyService';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

const GST_RATES = [0, 5, 12, 18, 28];

export const CreateInvoiceScreen = ({ navigation }) => {
  // Company Profile for Seller State
  const [sellerState, setSellerState] = useState('Delhi');

  // Customer State
  const [customersList, setCustomersList] = useState([]);
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [placeOfSupply, setPlaceOfSupply] = useState('Delhi');
  const [showPosModal, setShowPosModal] = useState(false);

  // Catalog Products
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [showProductPicker, setShowProductPicker] = useState(false);

  // Line Items
  const [items, setItems] = useState([
    { id: '1', item_name: '', quantity: '1', unit_price: '', tax_percentage: 18 }
  ]);

  // Pricing & GST Settings
  const [discount, setDiscount] = useState('0');
  const [gstEnabled, setGstEnabled] = useState(true);
  const [gstRate, setGstRate] = useState(18);
  const [gstPriceType, setGstPriceType] = useState('exclusive');

  // Payment Options
  const [paymentOption, setPaymentOption] = useState('full'); // 'full' | 'partial' | 'unpaid'
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [partialAmount, setPartialAmount] = useState('');

  // UI & Loading
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Load initial company profile, customer catalog, and products
    const loadInitData = async () => {
      try {
        const [comp, custs, prods] = await Promise.allSettled([
          companyService.getProfile(),
          customerService.getCustomers(),
          productService.getProducts(),
        ]);

        if (comp.status === 'fulfilled' && comp.value?.state) {
          setSellerState(comp.value.state);
          setPlaceOfSupply(comp.value.state);
        }
        if (custs.status === 'fulfilled') setCustomersList(custs.value || []);
        if (prods.status === 'fulfilled') setCatalogProducts(prods.value || []);
      } catch (err) {
        console.warn('Initial data load warning:', err);
      }
    };

    loadInitData();
  }, []);

  // Autofill customer on 10-digit phone
  const handleMobileChange = async (text) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 10);
    setCustomerMobile(cleaned);

    if (cleaned.length === 10) {
      const match = customersList.find((c) => c.mobile_number === cleaned);
      if (match) {
        setCustomerName(match.name || '');
        setBillingAddress(match.billing_address || '');
      } else {
        try {
          const remoteCust = await customerService.getCustomerByMobile(cleaned);
          if (remoteCust) {
            setCustomerName(remoteCust.name || '');
            setBillingAddress(remoteCust.billing_address || '');
          }
        } catch (e) {
          // ignore
        }
      }
    }
  };

  // Line Item Handlers
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { id: String(Date.now()), item_name: '', quantity: '1', unit_price: '', tax_percentage: gstRate }
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) {
      Alert.alert('Notice', 'An invoice requires at least one item.');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index, field, value) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSelectCatalogProduct = (prod) => {
    setItems((prev) => [
      ...prev.filter((it) => it.item_name.trim() !== '' || it.unit_price !== ''),
      {
        id: String(Date.now()),
        product_id: prod.id,
        product_code: prod.product_code || '',
        item_name: prod.product_name || '',
        quantity: '1',
        unit_price: String(prod.sale_price || ''),
        tax_percentage: prod.tax_rate !== undefined ? Number(prod.tax_rate) : gstRate,
      }
    ]);
    setShowProductPicker(false);
  };

  // Calculations
  const calculations = useMemo(() => {
    let subtotal = 0;
    items.forEach((item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unit_price) || 0;
      subtotal += qty * price;
    });

    const disc = parseFloat(discount) || 0;
    const taxable = Math.max(0, subtotal - disc);

    let taxAmount = 0;
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;
    let total = taxable;

    const isIntraState =
      sellerState.trim().toLowerCase() === placeOfSupply.trim().toLowerCase();

    if (gstEnabled && taxable > 0) {
      const rate = parseFloat(gstRate) || 0;
      if (gstPriceType === 'inclusive') {
        taxAmount = (taxable * rate) / (100 + rate);
        total = taxable;
      } else {
        taxAmount = (taxable * rate) / 100;
        total = taxable + taxAmount;
      }

      if (isIntraState) {
        cgstAmount = taxAmount / 2;
        sgstAmount = taxAmount / 2;
      } else {
        igstAmount = taxAmount;
      }
    }

    return {
      subtotal,
      discount: disc,
      taxable,
      taxAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      total,
      isIntraState,
    };
  }, [items, discount, gstEnabled, gstRate, gstPriceType, sellerState, placeOfSupply]);

  // Submission
  const handleSubmitInvoice = async () => {
    const errs = {};

    if (!customerMobile || customerMobile.length !== 10) {
      errs.customerMobile = 'Valid 10-digit mobile number is required';
    }
    if (!customerName.trim()) {
      errs.customerName = 'Customer name is required';
    }

    // Validate items
    const validItems = items.filter(
      (it) => it.item_name.trim() !== '' && parseFloat(it.unit_price) >= 0
    );

    if (validItems.length === 0) {
      Alert.alert('Missing Items', 'Please add at least one line item with a valid name and price.');
      return;
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      Alert.alert('Validation Error', 'Please correct the highlighted fields.');
      return;
    }

    setSubmitting(true);

    try {
      let paidAmt = calculations.total;
      if (paymentOption === 'unpaid') {
        paidAmt = 0;
      } else if (paymentOption === 'partial') {
        paidAmt = parseFloat(partialAmount) || 0;
      }

      const payload = {
        customer_mobile: customerMobile,
        customer_name: customerName.trim(),
        billing_address: billingAddress.trim() || 'Counter Sale',
        shipping_address: billingAddress.trim() || 'Counter Sale',
        place_of_supply: placeOfSupply,
        gst_enabled: gstEnabled,
        gst_rate: gstRate,
        gst_price_type: gstPriceType,
        discount: calculations.discount,
        payment_method: paymentMethod,
        paid_amount: paidAmt,
        items: validItems.map((it) => ({
          product_id: it.product_id || null,
          product_code: it.product_code || null,
          item_name: it.item_name.trim(),
          description: it.item_name.trim(),
          quantity: parseFloat(it.quantity) || 1,
          unit_price: parseFloat(it.unit_price) || 0,
          discount: 0,
          tax_percentage: gstEnabled ? gstRate : 0,
        })),
      };

      const result = await invoiceService.createInvoice(payload);

      Alert.alert(
        'Invoice Created',
        `Invoice ${result.invoice_number || ''} generated successfully!`,
        [
          {
            text: 'View Details',
            onPress: () => navigation.replace('InvoiceDetail', { id: result.id }),
          },
        ]
      );
    } catch (err) {
      Alert.alert('Invoice Generation Failed', err.message || 'Server rejected invoice.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    const val = parseFloat(amount || 0);
    return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Create New Bill"
        subtitle="Fast GST Invoice Generation"
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Customer Details Card */}
        <Text style={styles.sectionTitle}>Customer Details</Text>
        <Card style={styles.sectionCard}>
          <Input
            label="Customer Mobile"
            prefix="+91"
            placeholder="98765 43210"
            value={customerMobile}
            onChangeText={handleMobileChange}
            keyboardType="number-pad"
            maxLength={10}
            error={errors.customerMobile}
          />

          <Input
            label="Customer Name"
            placeholder="e.g. Ramesh Kumar"
            value={customerName}
            onChangeText={(t) => {
              setCustomerName(t);
              if (errors.customerName) setErrors((prev) => ({ ...prev, customerName: null }));
            }}
            error={errors.customerName}
          />

          <Input
            label="Billing Address"
            placeholder="e.g. 12, Main Bazaar, City"
            value={billingAddress}
            onChangeText={setBillingAddress}
          />

          {/* Place of Supply Picker */}
          <Text style={styles.inputLabel}>Place of Supply (State)</Text>
          <TouchableOpacity
            style={styles.dropdownBtn}
            onPress={() => setShowPosModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.dropdownBtnText}>{placeOfSupply}</Text>
            <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        </Card>

        {/* Line Items Card */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Items & Products</Text>
          {catalogProducts.length > 0 ? (
            <TouchableOpacity onPress={() => setShowProductPicker(true)}>
              <Text style={styles.addCatalogLink}>+ Pick Catalog Product</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {items.map((item, index) => (
          <Card key={item.id || index} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemIndexLabel}>Item #{index + 1}</Text>
              {items.length > 1 ? (
                <TouchableOpacity onPress={() => handleRemoveItem(index)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle-outline" size={20} color={COLORS.danger} />
                </TouchableOpacity>
              ) : null}
            </View>

            <Input
              label="Item Description"
              placeholder="e.g. Cotton Shirt / Service"
              value={item.item_name}
              onChangeText={(t) => handleUpdateItem(index, 'item_name', t)}
            />

            <View style={styles.rowInputs}>
              <View style={{ flex: 1, marginRight: SPACING.sm }}>
                <Input
                  label="Qty"
                  placeholder="1"
                  value={String(item.quantity)}
                  onChangeText={(t) => handleUpdateItem(index, 'quantity', t)}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={{ flex: 2 }}>
                <Input
                  label="Price (₹)"
                  placeholder="0.00"
                  value={String(item.unit_price)}
                  onChangeText={(t) => handleUpdateItem(index, 'unit_price', t)}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </Card>
        ))}

        <Button
          title="+ Add Another Item"
          onPress={handleAddItem}
          variant="outline"
          size="sm"
          style={styles.addItemBtn}
        />

        {/* GST & Discount Settings */}
        <Text style={styles.sectionTitle}>Taxes & Discounts</Text>
        <Card style={styles.sectionCard}>
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchTitle}>Enable GST Billing</Text>
              <Text style={styles.switchSubtitle}>
                {calculations.isIntraState
                  ? `Intra-state: CGST (${gstRate / 2}%) + SGST (${gstRate / 2}%)`
                  : `Inter-state: IGST (${gstRate}%)`}
              </Text>
            </View>
            <Switch
              value={gstEnabled}
              onValueChange={setGstEnabled}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
            />
          </View>

          {gstEnabled ? (
            <View style={styles.gstRateSelector}>
              <Text style={styles.inputLabel}>GST Rate</Text>
              <View style={styles.ratePills}>
                {GST_RATES.map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.ratePill, gstRate === r && styles.ratePillActive]}
                    onPress={() => setGstRate(r)}
                  >
                    <Text style={[styles.ratePillText, gstRate === r && styles.ratePillTextActive]}>
                      {r}%
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}

          <Input
            label="Overall Discount (₹)"
            placeholder="0.00"
            value={discount}
            onChangeText={setDiscount}
            keyboardType="decimal-pad"
          />
        </Card>

        {/* Payment Collection */}
        <Text style={styles.sectionTitle}>Payment Collection</Text>
        <Card style={styles.sectionCard}>
          <View style={styles.paymentOptionRow}>
            {[
              { id: 'full', label: 'Paid Full' },
              { id: 'partial', label: 'Partial' },
              { id: 'unpaid', label: 'Unpaid' },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[styles.optionPill, paymentOption === opt.id && styles.optionPillActive]}
                onPress={() => setPaymentOption(opt.id)}
              >
                <Text style={[styles.optionPillText, paymentOption === opt.id && styles.optionPillTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {paymentOption === 'partial' ? (
            <Input
              label="Amount Paid (₹)"
              placeholder="0.00"
              value={partialAmount}
              onChangeText={setPartialAmount}
              keyboardType="decimal-pad"
            />
          ) : null}

          {paymentOption !== 'unpaid' ? (
            <View style={{ marginTop: SPACING.sm }}>
              <Text style={styles.inputLabel}>Payment Method</Text>
              <View style={styles.paymentMethodRow}>
                {['cash', 'upi', 'card'].map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.methodPill, paymentMethod === m && styles.methodPillActive]}
                    onPress={() => setPaymentMethod(m)}
                  >
                    <Text
                      style={[styles.methodPillText, paymentMethod === m && styles.methodPillTextActive]}
                    >
                      {m.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}
        </Card>

        {/* Live Calculation Summary */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryVal}>{formatCurrency(calculations.subtotal)}</Text>
          </View>
          {calculations.discount > 0 ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount</Text>
              <Text style={[styles.summaryVal, { color: COLORS.danger }]}>
                - {formatCurrency(calculations.discount)}
              </Text>
            </View>
          ) : null}
          {gstEnabled ? (
            <>
              {calculations.isIntraState ? (
                <>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>CGST ({gstRate / 2}%)</Text>
                    <Text style={styles.summaryVal}>+ {formatCurrency(calculations.cgstAmount)}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>SGST ({gstRate / 2}%)</Text>
                    <Text style={styles.summaryVal}>+ {formatCurrency(calculations.sgstAmount)}</Text>
                  </View>
                </>
              ) : (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>IGST ({gstRate}%)</Text>
                  <Text style={styles.summaryVal}>+ {formatCurrency(calculations.igstAmount)}</Text>
                </View>
              )}
            </>
          ) : null}
          <View style={[styles.summaryRow, styles.summaryTotalRow]}>
            <Text style={styles.summaryTotalLabel}>Grand Total</Text>
            <Text style={styles.summaryTotalVal}>{formatCurrency(calculations.total)}</Text>
          </View>
        </Card>

        <Button
          title={submitting ? 'Generating Invoice...' : `Generate Bill (${formatCurrency(calculations.total)})`}
          onPress={handleSubmitInvoice}
          loading={submitting}
          size="lg"
          style={styles.submitInvoiceBtn}
        />
      </ScrollView>

      {/* Place of Supply Modal */}
      <Modal visible={showPosModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Place of Supply</Text>
              <TouchableOpacity onPress={() => setShowPosModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              {INDIAN_STATES.map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[styles.modalItem, placeOfSupply === st && styles.modalItemActive]}
                  onPress={() => {
                    setPlaceOfSupply(st);
                    setShowPosModal(false);
                  }}
                >
                  <Text style={[styles.modalItemText, placeOfSupply === st && styles.modalItemTextActive]}>
                    {st}
                  </Text>
                  {placeOfSupply === st ? (
                    <Ionicons name="checkmark" size={18} color={COLORS.primary} />
                  ) : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Catalog Product Picker Modal */}
      <Modal visible={showProductPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose from Catalog</Text>
              <TouchableOpacity onPress={() => setShowProductPicker(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              {catalogProducts.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.catalogItem}
                  onPress={() => handleSelectCatalogProduct(p)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.catalogName}>{p.product_name}</Text>
                    <Text style={styles.catalogMeta}>
                      Stock: {p.current_stock || 0} {p.unit || 'pcs'} • Tax: {p.tax_rate || 0}%
                    </Text>
                  </View>
                  <Text style={styles.catalogPrice}>{formatCurrency(p.sale_price)}</Text>
                </TouchableOpacity>
              ))}
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
  container: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  addCatalogLink: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  dropdownBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dropdownBtnText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  itemCard: {
    marginBottom: SPACING.sm,
    padding: SPACING.md,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  itemIndexLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  rowInputs: {
    flexDirection: 'row',
  },
  addItemBtn: {
    marginBottom: SPACING.md,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  switchTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  switchSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  gstRateSelector: {
    marginBottom: SPACING.md,
  },
  ratePills: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  ratePill: {
    flex: 1,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  ratePillActive: {
    backgroundColor: COLORS.primary,
  },
  ratePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  ratePillTextActive: {
    color: COLORS.white,
  },
  paymentOptionRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  optionPill: {
    flex: 1,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  optionPillActive: {
    backgroundColor: COLORS.primary,
  },
  optionPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  optionPillTextActive: {
    color: COLORS.white,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  methodPill: {
    flex: 1,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
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
  summaryCard: {
    backgroundColor: '#0f172a',
    marginBottom: SPACING.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#94a3b8',
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
  },
  summaryTotalRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    paddingTop: SPACING.sm,
    marginTop: SPACING.xs,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.white,
  },
  summaryTotalVal: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  submitInvoiceBtn: {
    marginBottom: SPACING.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.backdrop,
    justifyContent: 'flex-end',
  },
  modalContent: {
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
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  modalItemActive: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  modalItemText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  modalItemTextActive: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  catalogItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  catalogName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  catalogMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  catalogPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
});

export default CreateInvoiceScreen;
