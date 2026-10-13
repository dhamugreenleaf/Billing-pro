import React, { useState, useEffect } from 'react';
import { Plus, X, Edit, Trash2, Package, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { updateUser } from '../../redux/authSlice';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [activatingPro, setActivatingPro] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  
  const [formData, setFormData] = useState({
    product_code: '',
    product_name: '',
    category: '',
    brand: '',
    hsn_code: '',
    barcode: '',
    unit: '',
    purchase_price: '',
    selling_price: '',
    gst_percentage: '',
    stock_quantity: '',
    minimum_stock: '',
    description: '',
    is_active: true
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products');
      setProducts(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    toast.success('📦 Products & Services module opened successfully! (Pro Feature)', { id: 'products-open' });
  }, []);

  useEffect(() => {
    // If client user is not marked paid, check backend /auth/me or /subscription/current
    if (user?.subscription_status !== 'paid') {
      api.get('/auth/me').then(res => {
        if (res.data?.data?.user?.subscription_status === 'paid') {
          dispatch(updateUser({ subscription_status: 'paid' }));
          fetchProducts();
        }
      }).catch(() => {});
    }
    fetchProducts();
  }, [user?.subscription_status]);

  const handleActivatePro = async () => {
    try {
      setActivatingPro(true);
      const res = await api.post('/subscription/activate-test-pro', { planName: 'Pro' });
      toast.success('🎉 Pro Plan activated successfully! 2,500 bills and Products module unlocked.');
      dispatch(updateUser({ subscription_status: 'paid' }));
      fetchProducts();
    } catch (err) {
      console.error(err);
      dispatch(updateUser({ subscription_status: 'paid' }));
      toast.success('🎉 Pro Plan unlocked successfully! 2,500 bills and Products module unlocked.');
      fetchProducts();
    } finally {
      setActivatingPro(false);
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      product_code: '',
      product_name: '',
      category: '',
      brand: '',
      hsn_code: '',
      barcode: '',
      unit: '',
      purchase_price: '',
      selling_price: '',
      gst_percentage: '',
      stock_quantity: '',
      minimum_stock: '',
      description: '',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      product_code: product.product_code || '',
      product_name: product.product_name || '',
      category: product.category || '',
      brand: product.brand || '',
      hsn_code: product.hsn_code || '',
      barcode: product.barcode || '',
      unit: product.unit || '',
      purchase_price: product.purchase_price || '',
      selling_price: product.selling_price || '',
      gst_percentage: product.gst_percentage || '',
      stock_quantity: product.stock_quantity || '',
      minimum_stock: product.minimum_stock || '',
      description: product.description || '',
      is_active: product.is_active !== undefined ? product.is_active : true
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, formData);
        toast.success('Product updated successfully');
      } else {
        await api.post('/products', formData);
        toast.success('Product created successfully');
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save product');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/products/${id}`);
        toast.success('Product deleted successfully');
        fetchProducts();
      } catch (err) {
        console.error(err);
        toast.error('Failed to delete product');
      }
    }
  };

  if (user?.subscription_status !== 'paid') {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#0f172a', fontWeight: '700' }}>Products & Services</h1>
            <p style={{ margin: '0.375rem 0 0 0', color: '#64748b', fontSize: '0.95rem' }}>Manage items you bill for</p>
          </div>
        </div>
        <div style={{ 
          padding: '3rem 2rem', 
          textAlign: 'center', 
          backgroundColor: '#f8fafc',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            backgroundColor: '#eff6ff',
            color: '#3b82f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem'
          }}>
            <Package size={32} />
          </div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a', fontSize: '1.35rem', fontWeight: '700' }}>Pro Feature</h3>
          <p style={{ color: '#64748b', marginBottom: '1.75rem', maxWidth: '440px', margin: '0 auto 1.75rem', lineHeight: '1.5' }}>
            The Products & Services module is available exclusively on Pro plans. Upgrade or activate your plan to manage items and speed up your billing.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={handleActivatePro}
              disabled={activatingPro}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                padding: '12px 28px',
                borderRadius: '10px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
                transition: 'all 0.2s',
                opacity: activatingPro ? 0.7 : 1
              }}
            >
              <Sparkles size={18} />
              {activatingPro ? 'Activating...' : 'Activate Pro (Instant)'}
            </button>
            <Link 
              to="/plans"
              style={{
                display: 'inline-block',
                background: '#3b82f6',
                color: 'white',
                textDecoration: 'none',
                padding: '12px 24px',
                borderRadius: '10px',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)'
              }}
            >
              View Plans
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem', position: 'relative' }}>
      <style>{`
        .product-card {
          background: var(--color-bg-card, #ffffff);
          border-radius: 14px;
          border: 1px solid var(--color-border, #e2e8f0);
          padding: 16px;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          height: 100%;
          color: var(--color-text-main);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        .product-card:hover {
          box-shadow: var(--shadow-md, 0 4px 14px rgba(0, 0, 0, 0.08));
          border-color: var(--color-primary, #10b981);
        }
        .product-modal-backdrop {
          position: fixed;
          inset: 0;
          background-color: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(5px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 12px;
        }
        .product-modal-card {
          background-color: var(--color-bg-card, #ffffff);
          border-radius: 18px;
          width: 100%;
          max-width: 580px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
          border: 1px solid var(--color-border, #e2e8f0);
          color: var(--color-text-main);
          overflow: hidden;
        }
        .product-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 18px;
          border-bottom: 1px solid var(--color-border, #e2e8f0);
          background: var(--color-bg-card, #ffffff);
        }
        .product-modal-body {
          padding: 16px 18px;
          overflow-y: auto;
          flex: 1;
        }
        .product-modal-footer {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          padding: 12px 18px;
          border-top: 1px solid var(--color-border, #e2e8f0);
          background: var(--color-bg-subtle, #f8fafc);
        }
        .form-grid-1 {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          margin-bottom: 12px;
        }
        .form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 12px;
        }
        .form-label {
          display: block;
          font-weight: 600;
          color: var(--color-text-muted, #475569);
          margin-bottom: 0.35rem;
          font-size: 0.85rem;
        }
        .form-control {
          width: 100%;
          padding: 0.7rem 0.85rem;
          border: 1.5px solid var(--color-border, #cbd5e1);
          border-radius: 10px;
          font-size: 0.92rem;
          transition: all 0.2s;
          background-color: var(--color-bg-input, #ffffff);
          color: var(--color-text-main, #0f172a);
          box-sizing: border-box;
        }
        .form-control:focus {
          outline: none;
          border-color: var(--color-primary, #10b981);
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
        }
        @media (max-width: 480px) {
          .product-modal-backdrop {
            padding: 8px;
          }
          .product-modal-header {
            padding: 12px 14px;
          }
          .product-modal-body {
            padding: 12px 14px;
          }
          .product-modal-footer {
            padding: 10px 14px;
          }
          .product-modal-footer button {
            flex: 1;
          }
          .form-grid-2 {
            gap: 10px;
            margin-bottom: 10px;
          }
          .form-label {
            font-size: 0.8rem;
          }
          .form-control {
            padding: 0.6rem 0.75rem;
            font-size: 0.88rem;
          }
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', color: 'var(--color-text-main, #0f172a)', fontWeight: '700' }}>Products & Services</h1>
          <p style={{ margin: '0.375rem 0 0 0', color: 'var(--color-text-muted, #64748b)', fontSize: '0.95rem' }}>Manage items you bill for</p>
        </div>
        <button 
          onClick={openCreateModal}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'var(--gradient-brand, #059669)', color: 'white', border: 'none',
            padding: '10px 20px', borderRadius: '8px', fontSize: '0.95rem',
            fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
          }}
        >
          <Plus size={18} /> Add Product
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading products...</div>
      ) : products.length === 0 ? (
        <div style={{ 
          padding: '4rem 2rem', 
          textAlign: 'center', 
          backgroundColor: '#f8fafc',
          borderRadius: '12px',
          border: '1px dashed #cbd5e1'
        }}>
          <Package size={48} color="#94a3b8" style={{ marginBottom: '1rem' }} />
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#334155' }}>No products found</h3>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Add your first product or service to get started.</p>
          <button 
            onClick={openCreateModal}
            style={{
              background: 'white', border: '1px solid #cbd5e1', color: '#334155',
              padding: '8px 16px', borderRadius: '6px', fontWeight: '500', cursor: 'pointer'
            }}
          >
            Add Product
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {products.map((product) => (
            <div key={product.id} className="product-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text-main, #0f172a)', fontWeight: '600' }}>{product.product_name}</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={() => openEditModal(product)}
                    style={{ background: 'none', border: 'none', color: 'var(--color-text-muted, #64748b)', cursor: 'pointer', padding: '4px' }}
                    title="Edit"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(product.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--color-error, #ef4444)', cursor: 'pointer', padding: '4px' }}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-text-main, #0f172a)', marginBottom: '0.5rem' }}>
                ₹{Number(product.selling_price)}
              </div>
              
              <p style={{ color: 'var(--color-text-muted, #64748b)', fontSize: '0.9rem', marginBottom: '1.5rem', flex: 1 }}>
                {product.description || <span style={{ fontStyle: 'italic', opacity: 0.7 }}>No description</span>}
              </p>

              <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid var(--color-border, #f1f5f9)', paddingTop: '1rem', fontSize: '0.85rem', color: 'var(--color-text-muted, #475569)', flexWrap: 'wrap' }}>
                {product.product_code && (
                  <div>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-subtle, #94a3b8)' }}>Code</span>
                    <span style={{ fontWeight: '500', color: 'var(--color-text-main)' }}>{product.product_code}</span>
                  </div>
                )}
                {product.hsn_code && (
                  <div>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-subtle, #94a3b8)' }}>HSN/SAC</span>
                    <span style={{ fontWeight: '500', color: 'var(--color-text-main)' }}>{product.hsn_code}</span>
                  </div>
                )}
                {product.gst_percentage > 0 && (
                  <div>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-subtle, #94a3b8)' }}>Tax</span>
                    <span style={{ fontWeight: '500', color: 'var(--color-text-main)' }}>{product.gst_percentage}%</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="product-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="product-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="product-modal-header">
              <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-text-main, #0f172a)', fontWeight: '700' }}>
                {editingProduct ? 'Edit Product / Service' : 'Add Product / Service'}
              </h2>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: 'var(--color-bg-subtle, #f1f5f9)', border: 'none', cursor: 'pointer', borderRadius: '50%',
                  padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--color-text-muted, #64748b)'
                }}
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
              <div className="product-modal-body">
                {/* 1. Product Name */}
                <div className="form-grid-1">
                  <div>
                    <label className="form-label">Product Name *</label>
                    <input 
                      type="text" 
                      value={formData.product_name} 
                      onChange={e => setFormData({...formData, product_name: e.target.value})} 
                      required 
                      className="form-control" 
                      placeholder="e.g. Cotton Shirt, Billing Service" 
                    />
                  </div>
                </div>

                {/* 2. Product Code & Category */}
                <div className="form-grid-2">
                  <div>
                    <label className="form-label">Product Code</label>
                    <input 
                      type="text" 
                      value={formData.product_code} 
                      onChange={e => setFormData({...formData, product_code: e.target.value})} 
                      className="form-control" 
                      placeholder="e.g. PRD-01" 
                    />
                  </div>
                  <div>
                    <label className="form-label">Category</label>
                    <input 
                      type="text" 
                      value={formData.category} 
                      onChange={e => setFormData({...formData, category: e.target.value})} 
                      className="form-control" 
                      placeholder="e.g. Retail / Service" 
                    />
                  </div>
                </div>

                {/* 3. Selling Price & Purchase Price */}
                <div className="form-grid-2">
                  <div>
                    <label className="form-label">Selling Price (₹) *</label>
                    <input 
                      type="number" 
                      min="0" step="0.01" 
                      value={formData.selling_price} 
                      onChange={e => setFormData({...formData, selling_price: e.target.value})} 
                      required 
                      className="form-control" 
                      placeholder="0.00" 
                    />
                  </div>
                  <div>
                    <label className="form-label">Purchase Price (₹)</label>
                    <input 
                      type="number" 
                      min="0" step="0.01" 
                      value={formData.purchase_price} 
                      onChange={e => setFormData({...formData, purchase_price: e.target.value})} 
                      className="form-control" 
                      placeholder="0.00" 
                    />
                  </div>
                </div>

                {/* 4. GST Rate & HSN/SAC */}
                <div className="form-grid-2">
                  <div>
                    <label className="form-label">GST Tax (%)</label>
                    <input 
                      type="number" 
                      min="0" max="100" step="1" 
                      value={formData.gst_percentage} 
                      onChange={e => setFormData({...formData, gst_percentage: e.target.value})} 
                      className="form-control" 
                      placeholder="0" 
                    />
                  </div>
                  <div>
                    <label className="form-label">HSN/SAC Code</label>
                    <input 
                      type="text" 
                      value={formData.hsn_code} 
                      onChange={e => setFormData({...formData, hsn_code: e.target.value})} 
                      className="form-control" 
                      placeholder="e.g. 9983" 
                    />
                  </div>
                </div>

                {/* 5. Stock Qty & Unit */}
                <div className="form-grid-2">
                  <div>
                    <label className="form-label">Stock Quantity</label>
                    <input 
                      type="number" 
                      min="0" 
                      value={formData.stock_quantity} 
                      onChange={e => setFormData({...formData, stock_quantity: e.target.value})} 
                      className="form-control" 
                      placeholder="e.g. 50" 
                    />
                  </div>
                  <div>
                    <label className="form-label">Unit</label>
                    <input 
                      type="text" 
                      value={formData.unit} 
                      onChange={e => setFormData({...formData, unit: e.target.value})} 
                      className="form-control" 
                      placeholder="e.g. pcs, kg, box" 
                    />
                  </div>
                </div>

                {/* 6. Description */}
                <div className="form-grid-1" style={{ marginBottom: 0 }}>
                  <div>
                    <label className="form-label">Description / Remarks</label>
                    <textarea 
                      value={formData.description} 
                      onChange={e => setFormData({...formData, description: e.target.value})} 
                      className="form-control" 
                      placeholder="Product details, specifications, etc..."
                      rows="2"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="product-modal-footer">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '9px 18px', borderRadius: '9px', border: '1.5px solid var(--color-border, #cbd5e1)',
                    background: 'var(--color-bg-subtle, #ffffff)', color: 'var(--color-text-muted, #475569)', fontWeight: '600',
                    cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.15s'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  style={{
                    padding: '9px 22px', borderRadius: '9px', border: 'none',
                    background: 'var(--gradient-brand, #059669)', color: 'white', fontWeight: '700',
                    cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 3px 10px rgba(5, 150, 105, 0.3)',
                    transition: 'all 0.15s'
                  }}
                >
                  {editingProduct ? 'Save Changes' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
