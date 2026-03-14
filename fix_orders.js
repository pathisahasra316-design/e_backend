require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/Order');

const fixOrders = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');

        // Find all Pending orders that are NOT Cash on Delivery
        const orders = await Order.find({ 
            orderStatus: 'Pending', 
            paymentMethod: { $ne: 'Cash on Delivery' } 
        });

        console.log(`Found ${orders.length} orders to update.`);

        for (const order of orders) {
            order.orderStatus = 'Processing';
            order.tracking.push({
                status: 'Processing',
                message: 'Payment verified. Your order is being processed.'
            });
            await order.save();
            console.log(`Updated Order: ${order._id}`);
        }

        console.log('All applicable orders updated successfully.');
        process.exit();
    } catch (error) {
        console.error('Error fixing orders:', error);
        process.exit(1);
    }
};

fixOrders();
