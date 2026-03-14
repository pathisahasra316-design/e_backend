require('dotenv').config();
const connectDB = require('./config/db');
const User = require('./models/User');

const createAdminUser = async () => {
    try {
        await connectDB();

        const adminExists = await User.findOne({ email: 'admin@smartstore.com' });
        
        if (adminExists) {
            console.log('Admin user already exists!');
            console.log('Email: admin@smartstore.com');
            console.log('Password is the one you set previously, or if you just ran this script it is: Admin@123');
            process.exit(0);
        }

        const adminUser = new User({
            name: 'System Admin',
            email: 'admin@smartstore.com',
            password: 'Admin@123',
            role: 'admin'
        });

        await adminUser.save();
        console.log('Admin user successfully created!');
        console.log('---------------------------');
        console.log('Login Details:');
        console.log('Email: admin@smartstore.com');
        console.log('Password: Admin@123');
        console.log('---------------------------');
        
        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error.message);
        process.exit(1);
    }
};

createAdminUser();
