const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/stats', protect, authorizeRoles('admin'), async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalProducts = await Product.countDocuments();
        const totalOrders = await Order.countDocuments();
        
        // Calculate total sales sum
        const salesResult = await Order.aggregate([
            { $group: { _id: null, totalSales: { $sum: "$totalPrice" } } }
        ]);
        const totalSales = salesResult.length > 0 ? salesResult[0].totalSales : 0;

        // Get 5 most recent orders for a feeds/recent activity table
        const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5).populate('userId', 'name email');

        res.json({
            totalUsers,
            totalProducts,
            totalOrders,
            totalSales,
            recentOrders
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/orders', protect, authorizeRoles('admin'), async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 }).populate('userId', 'name email');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
