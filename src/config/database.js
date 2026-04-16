const mongoose = require('mongoose');

//function to connect to MongoDB
const connectDB = async () => {
  try {
    //connect to MongoDB using the connection string from .env
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    //exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;