const Product = require('../models/Product');
const Store = require('../models/Store');

exports.getProducts = async (req, res) => {
    try {
        const products = await Product.find({});
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createProduct = async (req, res) => {
    try {
        const { productName, description, price, category, stock, images } = req.body;
        
        let storeId = req.body.storeId;
        if (!storeId) {
            const Store = require('../models/Store');
            let store = await Store.findOne({ storeName: 'Demo Store' });
            if (!store) {
                store = new Store({
                    storeName: 'Demo Store',
                    ownerId: req.user ? req.user._id : null,
                    description: 'A demo store for default products'
                });
                await store.save();
            }
            storeId = store._id;
        }

        const product = new Product({
            productName, description, price, category, storeId, stock, images
        });
        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            product.productName = req.body.productName || product.productName;
            product.description = req.body.description || product.description;
            product.price = req.body.price || product.price;
            product.category = req.body.category || product.category;
            product.stock = req.body.stock || product.stock;
            product.images = req.body.images || product.images;

            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            await product.deleteOne();
            res.json({ message: 'Product removed' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createProductReview = async (req, res) => {
    try {
        const { rating, comment, userName, orderId } = req.body;
        const Order = require('../models/Order');
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // If orderId provided, verify delivery and prevent duplicate reviews for that order
        if (orderId) {
            const order = await Order.findById(orderId);
            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }
            if (order.userId.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Not authorized to review this order' });
            }
            if (order.orderStatus !== 'Delivered') {
                return res.status(400).json({ message: 'You can only review products from delivered orders' });
            }
            // Check if this productId is already in reviewedProducts
            const alreadyReviewedInOrder = Array.isArray(order.reviewedProducts) &&
                order.reviewedProducts.some(pid => pid.toString() === product._id.toString());
            if (alreadyReviewedInOrder) {
                return res.status(400).json({ message: 'You have already reviewed this product for this order' });
            }
            // Mark product as reviewed in this order BEFORE saving the review
            order.reviewedProducts = order.reviewedProducts || [];
            order.reviewedProducts.push(product._id);
            await order.save();
        }


        // Add or update review on the product
        const existingReview = product.reviews.find(
            (r) => r.userId && r.userId.toString() === req.user._id.toString()
        );

        if (existingReview) {
            existingReview.rating = Number(rating);
            existingReview.comment = comment;
            existingReview.createdAt = Date.now();
        } else {
            product.reviews.push({
                userName: userName || req.user.name,
                rating: Number(rating),
                comment,
                userId: req.user._id,
            });
        }

        product.numReviews = product.reviews.length;
        product.rating =
            product.reviews.reduce((acc, item) => item.rating + acc, 0) /
            product.reviews.length;

        await product.save();
        res.status(201).json({ message: 'Review submitted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete product review
// @route   DELETE /api/products/:id/reviews/:reviewId
// @access  Private/Admin
exports.deleteProductReview = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const reviewIndex = product.reviews.findIndex(
            (rev) => rev._id.toString() === req.params.reviewId
        );

        if (reviewIndex === -1) {
            return res.status(404).json({ message: 'Review not found' });
        }

        product.reviews.splice(reviewIndex, 1);
        product.numReviews = product.reviews.length;

        if (product.numReviews > 0) {
            product.rating =
                product.reviews.reduce((acc, item) => item.rating + acc, 0) /
                product.reviews.length;
        } else {
            product.rating = 0;
        }

        await product.save();
        res.status(200).json({ message: 'Review deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

