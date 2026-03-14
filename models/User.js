const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'seller', 'customer'], default: 'customer' },
    avatar: { type: String, default: '' },
    profile: {
        phone: { type: String, default: '' },
        houseNumber: { type: String, default: '' },
        address: { type: String, default: '' },
        landmark: { type: String, default: '' },
        city: { type: String, default: '' },
        district: { type: String, default: '' },
        state: { type: String, default: '' },
        country: { type: String, default: '' },
        pincode: { type: String, default: '' },
        avatar: { type: String, default: '' }
    },
    tokens: { type: Number, default: 0 },
    lastVisit: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
