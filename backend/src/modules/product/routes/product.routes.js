import express from 'express';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../controller/product.controller.js';

import { protect } from '../../../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getProducts);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;
