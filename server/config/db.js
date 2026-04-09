const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 20,
      minPoolSize: 5,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 60000,
      retryWrites: true,
      w: 1,
      compressors: 'snappy,zlib',
      journal: false,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Enable compression for data transfer
    conn.connection.setMaxListeners(20);
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
