const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    products: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
            quantity: { type: Number, required: true },
            extraDetails: { type: Array } // Store seats/rooms
        }
    ],
    totalPrice: { type: Number, required: true },
    tokensUsed: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    orderStatus: { type: String, enum: ['Pending', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'], default: 'Pending' },
    shippingAddress: {
        address: { type: String, required: true },
        city: { type: String, required: true },
        pincode: { type: String, required: true },
        phone: { type: String, required: true },
        landmark: { type: String },
        state: { type: String, required: true }
    },
    tracking: [
        {
            status: { type: String, required: true },
            message: { type: String, required: true },
            updatedAt: { type: Date, default: Date.now }
        }
    ],
    paymentMethod: { type: String, required: true },
    paymentDetails: {
        transactionId: { type: String },
        cardNumber: { type: String },
        cardHolder: { type: String },
        expiry: { type: String },
        cvv: { type: String }
    },
    createdAt: { type: Date, default: Date.now },
    reviewedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
});

module.exports = mongoose.model('Order', orderSchema);
