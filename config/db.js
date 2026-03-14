const mongoose = require('mongoose');
const dns = require('dns');

// Force Google DNS to bypass local ISP DNS blocking of MongoDB clusters
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
    try {
        let uri = process.env.MONGO_URI;
        if (process.env.TEST_MODE === 'true') {
            const { MongoMemoryServer } = require('mongodb-memory-server');
            const mongoServer = await MongoMemoryServer.create();
            uri = mongoServer.getUri();
            console.log('Using in-memory MongoDB for testing');
        }
        const conn = await mongoose.connect(uri);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('-------------------------------------------');
        console.error('🚨 MONGODB CONNECTION ERROR 🚨');
        console.error(`Message: ${error.message}`);
        console.error('-------------------------------------------');
        console.error('👉 Fix 1: Add your IP to MongoDB Atlas Whitelist (Network Access tab).');
        console.error('👉 Fix 2: If you want to continue working without Atlas, add "TEST_MODE=true" to your .env file to use an In-Memory database.');
        console.error('-------------------------------------------');
        process.exit(1);
    }
};

module.exports = connectDB;
