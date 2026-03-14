const Settings = require('../models/Settings');

exports.getSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = await Settings.create({
                gstPercentage: 18,
                deliveryCharge: 40,
                freeDeliveryThreshold: 500
            });
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const { gstPercentage, deliveryCharge, freeDeliveryThreshold } = req.body;
        let settings = await Settings.findOne();
        
        if (settings) {
            settings.gstPercentage = gstPercentage !== undefined ? gstPercentage : settings.gstPercentage;
            settings.deliveryCharge = deliveryCharge !== undefined ? deliveryCharge : settings.deliveryCharge;
            settings.freeDeliveryThreshold = freeDeliveryThreshold !== undefined ? freeDeliveryThreshold : settings.freeDeliveryThreshold;
            settings.updatedAt = Date.now();
            await settings.save();
        } else {
            settings = await Settings.create({
                gstPercentage,
                deliveryCharge,
                freeDeliveryThreshold
            });
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
