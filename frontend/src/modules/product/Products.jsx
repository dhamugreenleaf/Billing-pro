import React, { useState, useEffect } from 'react';
import { Plus, X, Edit, Trash2, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const { user } = useSelector((state) => state.auth);
  
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
    fetchProducts();
  }, []);

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
          padding: '4rem 2rem', 
          textAlign: 'center', 
          backgroundColor: '#f8fafc',
          borderRadius: '12px',
          border: '1px solid #e2e8f0'
        }}>
          <Package size={48} color="#94a3b8" style={{ marginBottom: '1rem' }} />
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>Pro Feature</h3>
          <p style={{ color: '#64748b', marginBottom: '1.5rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
            The Products & Services module is available exclusively on Pro plans. Upgrade your plan to manage items and speed up your billing.
          </p>
          <Link 
            to="/plans"
            style={{
              display: 'inline-block',
              background: '#3b82f6', color: 'white', textDecoration: 'none',
              padding: '10px 24px', borderRadius: '8px', fontWeight: '600'
            }}
          >
            Upgrade to Pro
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem', position: 'relative' }}>
      <style>{`
        .product-card {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          padding: 20px;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .product-card:hover {
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          border-color: #cbd5e1;
        }
        .form-label {
          display: block;
          font-weight: 500;
          color: #334155;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
        }
        .form-control {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 0.95rem;
          transition: all 0.2s;
        }
        .form-control:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#0f172a', fontWeight: '700' }}>Products & Services</h1>
          <p style={{ margin: '0.375rem 0 0 0', color: '#64748b', fontSize: '0.95rem' }}>Manage items you bill for</p>
        </div>
        <button 
          onClick={openCreateModal}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: '#3b82f6', color: 'white', border: 'none',
            padding: '10px 20px', borderRadius: '8px', fontSize: '0.95rem',
            fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#2563eb'}
          onMouseLeave={e => e.currentTarget.style.background = '#3b82f6'}
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
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', fontWeight: '600' }}>{product.product_name}</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={() => openEditModal(product)}
                    style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
                    title="Edit"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(product.id)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.5rem' }}>
                ₹{Number(product.selling_price)}
              </div>
              
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem', flex: 1 }}>
                {product.description || <span style={{ fontStyle: 'italic', opacity: 0.7 }}>No description</span>}
              </p>

              <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem', fontSize: '0.85rem', color: '#475569', flexWrap: 'wrap' }}>
                {product.product_code && (
                  <div>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8' }}>Code</span>
                    <span style={{ fontWeight: '500' }}>{product.product_code}</span>
                  </div>
                )}
                {product.hsn_code && (
                  <div>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8' }}>HSN/SAC</span>
                    <span style={{ fontWeight: '500' }}>{product.hsn_code}</span>
                  </div>
                )}
                {product.gst_percentage > 0 && (
                  <div>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8' }}>Tax</span>
                    <span style={{ fontWeight: '500' }}>{product.gst_percentage}%</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff', padding: '2rem', borderRadius: '16px',
            width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: '700' }}>
                {editingProduct ? 'Edit Product' : 'Add Product'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: '#f1f5f9', border: 'none', cursor: 'pointer', borderRadius: '50%',
                  padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#64748b'
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 2 }}>
                  <label className="form-label">Product Name *</label>
                  <input 
                    type="text" 
                    value={formData.product_name} 
                    onChange={e => setFormData({...formData, product_name: e.target.value})} 
                    required 
                    className="form-control" 
                    placeholder="e.g. Web Design Service" 
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Product Code</label>
                  <input 
                    type="text" 
                    value={formData.product_code} 
                    onChange={e => setFormData({...formData, product_code: e.target.value})} 
                    className="form-control" 
                    placeholder="e.g. WD-01" 
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Description</label>
                <textarea 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  className="form-control" 
                  placeholder="Additional details..."
                  rows="3"
                />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
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
                <div style={{ flex: 1 }}>
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
                <div style={{ flex: 1 }}>
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
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">HSN/SAC Code</label>
                  <input 
                    type="text" 
                    value={formData.hsn_code} 
                    onChange={e => setFormData({...formData, hsn_code: e.target.value})} 
                    className="form-control" 
                    placeholder="e.g. 9983" 
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Category</label>
                  <input 
                    type="text" 
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value})} 
                    className="form-control" 
                    placeholder="e.g. Electronics" 
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Unit</label>
                  <input 
                    type="text" 
                    value={formData.unit} 
                    onChange={e => setFormData({...formData, unit: e.target.value})} 
                    className="form-control" 
                    placeholder="e.g. pcs, kg, hrs" 
                  />
                </div>
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1',
                    background: 'white', color: '#475569', fontWeight: '500', cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  style={{
                    padding: '10px 20px', borderRadius: '8px', border: 'none',
                    background: '#3b82f6', color: 'white', fontWeight: '600', cursor: 'pointer'
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
