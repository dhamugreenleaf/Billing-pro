import { Op } from 'sequelize';
import Product from '../model/product.model.js';
import * as companyService from '../../company/services/company.service.js';

// Helper to get authoritative company_id from authenticated user
const getCompanyId = async (user_id) => {
  const company = await companyService.getCompanyProfile(user_id);
  if (!company) {
    throw { statusCode: 400, message: 'Company not found. Please setup company profile first.' };
  }
  return company.id;
};

export const getProducts = async (req, res) => {
  try {
    let company_id;
    try {
      company_id = await getCompanyId(req.user.id);
    } catch {
      return res.status(200).json({ success: true, data: [] });
    }

    const where = { company_id };

    // Support optional search, category, and is_active filtering
    const { search, category, is_active } = req.query;
    if (search) {
      where[Op.or] = [
        { product_name: { [Op.iLike]: `%${search}%` } },
        { product_code: { [Op.iLike]: `%${search}%` } },
        { barcode: { [Op.iLike]: `%${search}%` } }
      ];
    }
    if (category) {
      where.category = category;
    }
    if (is_active !== undefined) {
      where.is_active = is_active === 'true' || is_active === true;
    }

    const products = await Product.findAll({
      where,
      order: [['created_at', 'DESC']]
    });
    return res.status(200).json({ success: true, data: products });
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching products' });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    let company_id;
    try {
      company_id = await getCompanyId(req.user.id);
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message || 'Company not found' });
    }

    const product = await Product.findOne({
      where: { id, company_id }
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    return res.status(200).json({ success: true, data: product });
  } catch (error) {
    console.error('Error fetching product:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching product' });
  }
};

export const createProduct = async (req, res) => {
  try {
    let company_id;
    try {
      company_id = await getCompanyId(req.user.id);
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message || 'Company not found. Please setup company profile first.' });
    }

    const { 
      product_code, product_name, category, brand, hsn_code, barcode, 
      unit, purchase_price, selling_price, gst_percentage, 
      stock_quantity, minimum_stock, description, is_active 
    } = req.body;
    
    if (!product_name || selling_price === undefined || selling_price === null) {
      return res.status(400).json({ success: false, message: 'Product name and selling price are required' });
    }

    // Ignore any client-supplied company_id; enforce authenticated company_id
    const product = await Product.create({
      company_id,
      product_code, 
      product_name, 
      category, 
      brand, 
      hsn_code, 
      barcode, 
      unit, 
      purchase_price: purchase_price ? Number(purchase_price) : 0, 
      selling_price: Number(selling_price) || 0, 
      gst_percentage: gst_percentage ? Number(gst_percentage) : 0, 
      stock_quantity: stock_quantity !== undefined && stock_quantity !== '' ? Number(stock_quantity) : 0, 
      minimum_stock: minimum_stock !== undefined && minimum_stock !== '' ? Number(minimum_stock) : 0, 
      description, 
      is_active: is_active !== undefined ? Boolean(is_active) : true
    });

    return res.status(201).json({ success: true, data: product, message: 'Product created successfully' });
  } catch (error) {
    console.error('Error creating product:', error);
    return res.status(500).json({ success: false, message: 'Server error creating product' });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    let company_id;
    try {
      company_id = await getCompanyId(req.user.id);
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message || 'Company not found' });
    }

    // Query verifying BOTH product id and authenticated company_id
    const product = await Product.findOne({ where: { id, company_id } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Explicitly disallow updating company_id or id
    const {
      product_code, product_name, category, brand, hsn_code, barcode,
      unit, purchase_price, selling_price, gst_percentage,
      stock_quantity, minimum_stock, description, is_active
    } = req.body;

    const updatePayload = {};
    if (product_code !== undefined) updatePayload.product_code = product_code;
    if (product_name !== undefined) updatePayload.product_name = product_name;
    if (category !== undefined) updatePayload.category = category;
    if (brand !== undefined) updatePayload.brand = brand;
    if (hsn_code !== undefined) updatePayload.hsn_code = hsn_code;
    if (barcode !== undefined) updatePayload.barcode = barcode;
    if (unit !== undefined) updatePayload.unit = unit;
    if (purchase_price !== undefined) updatePayload.purchase_price = purchase_price ? Number(purchase_price) : 0;
    if (selling_price !== undefined) updatePayload.selling_price = Number(selling_price) || 0;
    if (gst_percentage !== undefined) updatePayload.gst_percentage = gst_percentage ? Number(gst_percentage) : 0;
    if (stock_quantity !== undefined) updatePayload.stock_quantity = stock_quantity !== '' ? Number(stock_quantity) : 0;
    if (minimum_stock !== undefined) updatePayload.minimum_stock = minimum_stock !== '' ? Number(minimum_stock) : 0;
    if (description !== undefined) updatePayload.description = description;
    if (is_active !== undefined) updatePayload.is_active = Boolean(is_active);

    await product.update(updatePayload);

    return res.status(200).json({ success: true, data: product, message: 'Product updated successfully' });
  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(500).json({ success: false, message: 'Server error updating product' });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    let company_id;
    try {
      company_id = await getCompanyId(req.user.id);
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message || 'Company not found' });
    }
    
    // Deletion strictly verified by both product ID and company_id
    const product = await Product.findOne({ where: { id, company_id } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await product.destroy();
    return res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting product' });
  }
};
