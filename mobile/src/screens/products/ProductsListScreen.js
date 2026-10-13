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
import ConfirmModal from '../../components/ConfirmModal';
import { productService } from '../../services/productService';

export const ProductsListScreen = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State for Add / Edit
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [productName, setProductName] = useState('');
  const [productCode, setProductCode] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [taxRate, setTaxRate] = useState('18');
  const [stockQuantity, setStockQuantity] = useState('10');
  const [category, setCategory] = useState('General');
  const [unit, setUnit] = useState('pcs');
  const [formError, setFormError] = useState('');

  // Delete State
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      const data = await productService.getProducts();
      setProducts(data || []);
    } catch (err) {
      console.warn('Failed to fetch products:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const query = searchQuery.toLowerCase();
    return products.filter((p) => {
      const name = (p.product_name || '').toLowerCase();
      const code = (p.product_code || '').toLowerCase();
      const cat = (p.category || '').toLowerCase();
      return name.includes(query) || code.includes(query) || cat.includes(query);
    });
  }, [products, searchQuery]);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setProductName('');
    setProductCode(`PRD-${Math.floor(Math.random() * 8999 + 1000)}`);
    setSalePrice('');
    setPurchasePrice('');
    setTaxRate('18');
    setStockQuantity('10');
    setCategory('General');
    setUnit('pcs');
    setFormError('');
    setModalVisible(true);
  };

  const handleOpenEditModal = (prod) => {
    setEditingProduct(prod);
    setProductName(prod.product_name || '');
    setProductCode(prod.product_code || '');
    setSalePrice(String(prod.sale_price || ''));
    setPurchasePrice(String(prod.purchase_price || ''));
    setTaxRate(String(prod.tax_rate !== undefined ? prod.tax_rate : '18'));
    setStockQuantity(String(prod.current_stock !== undefined ? prod.current_stock : '0'));
    setCategory(prod.category || 'General');
    setUnit(prod.unit || 'pcs');
    setFormError('');
    setModalVisible(true);
  };

  const handleSaveProduct = async () => {
    if (!productName.trim()) {
      setFormError('Product name is required');
      return;
    }
    const sale = parseFloat(salePrice);
    if (isNaN(sale) || sale < 0) {
      setFormError('Please enter a valid selling price');
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      const payload = {
        product_name: productName.trim(),
        product_code: productCode.trim() || undefined,
        sale_price: sale,
        purchase_price: parseFloat(purchasePrice) || 0,
        tax_rate: parseFloat(taxRate) || 0,
        current_stock: parseFloat(stockQuantity) || 0,
        category: category.trim() || 'General',
        unit: unit.trim() || 'pcs',
        is_active: true,
      };

      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, payload);
      } else {
        await productService.createProduct(payload);
      }

      setModalVisible(false);
      fetchProducts();
    } catch (err) {
      setFormError(err.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    setDeleting(true);
    try {
      await productService.deleteProduct(productToDelete.id);
      setDeleteModalVisible(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (err) {
      Alert.alert('Delete Failed', err.message || 'Unable to delete product.');
    } finally {
      setDeleting(false);
    }
  };

  const formatCurrency = (amount) => {
    const val = parseFloat(amount || 0);
    return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const renderProductItem = ({ item }) => {
    const stock = parseFloat(item.current_stock || 0);
    const isLowStock = stock <= 5;
    const isOutOfStock = stock <= 0;

    return (
      <Card style={styles.productCard}>
        <View style={styles.cardMain}>
          <View style={{ flex: 1 }}>
            <View style={styles.codeRow}>
              <Text style={styles.codeText}>{item.product_code || 'PRD'}</Text>
              <Text style={styles.categoryPill}> • {item.category || 'General'}</Text>
            </View>
            <Text style={styles.productName}>{item.product_name}</Text>
            <Text style={styles.priceText}>{formatCurrency(item.sale_price)}</Text>
          </View>

          <View style={styles.stockColumn}>
            <View
              style={[
                styles.stockPill,
                isOutOfStock
                  ? styles.stockOut
                  : isLowStock
                  ? styles.stockLow
                  : styles.stockNormal,
              ]}
            >
              <Text
                style={[
                  styles.stockPillText,
                  isOutOfStock
                    ? styles.stockOutText
                    : isLowStock
                    ? styles.stockLowText
                    : styles.stockNormalText,
                ]}
              >
                {stock} {item.unit || 'pcs'}
              </Text>
            </View>

            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => handleOpenEditModal(item)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="pencil" size={16} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconBtn, { marginLeft: SPACING.xs }]}
                onPress={() => {
                  setProductToDelete(item);
                  setDeleteModalVisible(true);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Card>
    );
  };

  if (loading && !refreshing) {
    return <LoadingState message="Loading catalog products..." fullScreen />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.searchHeader}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products by name, code, category..."
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
        data={filteredProducts}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderProductItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="cube-outline"
            title="No Products Found"
            description="Add products to your catalog to easily select them during bill generation."
            actionTitle="+ Add Product"
            onAction={handleOpenAddModal}
          />
        }
      />

      {/* Floating Add Product Button */}
      <TouchableOpacity style={styles.fab} onPress={handleOpenAddModal} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>

      {/* Add / Edit Product Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Input
                label="Product Name *"
                placeholder="e.g. Cotton T-Shirt"
                value={productName}
                onChangeText={setProductName}
                error={formError}
              />

              <View style={styles.rowInputs}>
                <View style={{ flex: 1, marginRight: SPACING.sm }}>
                  <Input
                    label="Product SKU / Code"
                    placeholder="PRD-001"
                    value={productCode}
                    onChangeText={setProductCode}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Category"
                    placeholder="e.g. Clothing"
                    value={category}
                    onChangeText={setCategory}
                  />
                </View>
              </View>

              <View style={styles.rowInputs}>
                <View style={{ flex: 1, marginRight: SPACING.sm }}>
                  <Input
                    label="Sale Price (₹) *"
                    placeholder="0.00"
                    value={salePrice}
                    onChangeText={setSalePrice}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Purchase Price (₹)"
                    placeholder="0.00"
                    value={purchasePrice}
                    onChangeText={setPurchasePrice}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <View style={styles.rowInputs}>
                <View style={{ flex: 1, marginRight: SPACING.sm }}>
                  <Input
                    label="Stock Qty"
                    placeholder="0"
                    value={stockQuantity}
                    onChangeText={setStockQuantity}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Tax Rate (%)"
                    placeholder="18"
                    value={taxRate}
                    onChangeText={setTaxRate}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <Input
                label="Unit of Measurement"
                placeholder="e.g. pcs, kg, box, mtr"
                value={unit}
                onChangeText={setUnit}
              />

              <Button
                title={saving ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
                onPress={handleSaveProduct}
                loading={saving}
                size="md"
                style={{ marginTop: SPACING.md }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        visible={deleteModalVisible}
        title="Delete Product"
        message={`Are you sure you want to delete "${productToDelete?.product_name}"?`}
        confirmText="Delete"
        loading={deleting}
        onConfirm={handleDeleteProduct}
        onCancel={() => {
          setDeleteModalVisible(false);
          setProductToDelete(null);
        }}
      />
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
  productCard: {
    marginBottom: SPACING.sm,
    padding: SPACING.md,
  },
  cardMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  codeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  categoryPill: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  stockColumn: {
    alignItems: 'flex-end',
    marginLeft: SPACING.md,
  },
  stockPill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.sm,
  },
  stockNormal: {
    backgroundColor: COLORS.primaryLight,
  },
  stockLow: {
    backgroundColor: COLORS.warningLight,
  },
  stockOut: {
    backgroundColor: COLORS.dangerLight,
  },
  stockPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  stockNormalText: {
    color: COLORS.primary,
  },
  stockLowText: {
    color: COLORS.warning,
  },
  stockOutText: {
    color: COLORS.danger,
  },
  actionButtonsRow: {
    flexDirection: 'row',
  },
  iconBtn: {
    padding: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
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
  rowInputs: {
    flexDirection: 'row',
  },
});

export default ProductsListScreen;
