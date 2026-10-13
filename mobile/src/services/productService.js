import api from './api';

export const productService = {
  /**
   * Get products list with optional search and category filters
   */
  async getProducts(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.category) query.append('category', params.category);
    if (params.is_active !== undefined) query.append('is_active', String(params.is_active));

    const queryString = query.toString();
    const endpoint = queryString ? `/products?${queryString}` : '/products';
    const response = await api.get(endpoint);
    return response.data;
  },

  /**
   * Get product by ID
   */
  async getProduct(id) {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  /**
   * Create a new product
   */
  async createProduct(productData) {
    const response = await api.post('/products', productData);
    return response.data;
  },

  /**
   * Update an existing product
   */
  async updateProduct(id, productData) {
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
  },

  /**
   * Delete a product
   */
  async deleteProduct(id) {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },
};

export default productService;
