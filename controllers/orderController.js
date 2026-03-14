const Order = require('../models/Order');

exports.createOrder = async (req, res) => {
    try {
        const { products, totalPrice, paymentMethod, paymentDetails, shippingAddress, tokensUsed, discountAmount } = req.body;
        if (products && products.length === 0) {
            return res.status(400).json({ message: 'No order items' });
        }

        // Handle Tokens and Discount
        if (tokensUsed > 0) {
            const User = require('../models/User');
            const user = await User.findById(req.user._id);
            
            if (!user || user.tokens < tokensUsed) {
                return res.status(400).json({ message: 'Insufficient tokens' });
            }

            // Deduct tokens
            user.tokens -= tokensUsed;
            await user.save();
            console.log(`Deducted ${tokensUsed} tokens from user ${user.email}. Remaining: ${user.tokens}`);
        }
        
        const isPrepaid = paymentMethod !== 'Cash on Delivery';
        
        const order = new Order({
            userId: req.user._id,
            products,
            totalPrice,
            tokensUsed: tokensUsed || 0,
            discountAmount: discountAmount || 0,
            paymentMethod,
            paymentDetails,
            shippingAddress,
            orderStatus: isPrepaid ? 'Processing' : 'Pending',
            tracking: [
                {
                    status: isPrepaid ? 'Processing' : 'Pending',
                    message: isPrepaid 
                        ? 'Payment verified. Your order is being processed.' 
                        : 'Order placed successfully. Awaiting confirmation.'
                }
            ]
        });

        const createdOrder = await order.save();
        res.status(201).json(createdOrder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getOrders = async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user._id })
            .populate('products.productId', 'productName price category images')
            .populate('reviewedProducts', '_id');

        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('products.productId', 'productName price')
            .populate('userId', 'name email');
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const { status, message } = req.body;
        
        const order = await Order.findById(req.params.id);
        
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.orderStatus = status;
        order.tracking.push({
            status: status,
            message: message || `Status updated to ${status}`
        });

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
