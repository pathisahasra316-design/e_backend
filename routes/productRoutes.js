const express = require('express');
const { getProducts, createProduct, updateProduct, deleteProduct, createProductReview, deleteProductReview } = require('../controllers/productController');

const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
    .get(getProducts)
    .post(protect, authorizeRoles('admin', 'seller'), createProduct);

router.route('/:id/reviews').post(protect, createProductReview);
router.route('/:id/reviews/:reviewId').delete(protect, authorizeRoles('admin'), deleteProductReview);


router.route('/:id')
    .put(protect, authorizeRoles('admin', 'seller'), updateProduct)
    .delete(protect, authorizeRoles('admin', 'seller'), deleteProduct);

module.exports = router;
