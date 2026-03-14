const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    gstPercentage: { type: Number, default: 18 },
    deliveryCharge: { type: Number, default: 0 },
    freeDeliveryThreshold: { type: Number, default: 500 },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Settings', settingsSchema);
