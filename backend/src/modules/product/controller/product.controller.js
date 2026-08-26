import Product from '../model/product.model.js';

export const getProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { company_id: req.user.company_id },
      order: [['created_at', 'DESC']]
    });
    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, message: 'Server error fetching products' });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { 
      product_code, product_name, category, brand, hsn_code, barcode, 
      unit, purchase_price, selling_price, gst_percentage, 
      stock_quantity, minimum_stock, description, is_active 
    } = req.body;
    
    if (!product_name || selling_price === undefined) {
      return res.status(400).json({ success: false, message: 'Product name and selling price are required' });
    }

    const product = await Product.create({
      company_id: req.user.company_id,
      product_code, 
      product_name, 
      category, 
      brand, 
      hsn_code, 
      barcode, 
      unit, 
      purchase_price: purchase_price || 0, 
      selling_price: selling_price || 0, 
      gst_percentage: gst_percentage || 0, 
      stock_quantity: stock_quantity || 0, 
      minimum_stock: minimum_stock || 0, 
      description, 
      is_active: is_active !== undefined ? is_active : true
    });

    res.status(201).json({ success: true, data: product, message: 'Product created successfully' });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ success: false, message: 'Server error creating product' });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const product = await Product.findOne({ where: { id, company_id: req.user.company_id } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await product.update(updateData);

    res.json({ success: true, data: product, message: 'Product updated successfully' });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ success: false, message: 'Server error updating product' });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findOne({ where: { id, company_id: req.user.company_id } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await product.destroy();
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ success: false, message: 'Server error deleting product' });
  }
};
