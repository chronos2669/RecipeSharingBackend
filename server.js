//load environment variables from .env file
require('dotenv').config();

//import required packages
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./src/config/database');

//connect to MongoDB database
connectDB();

//create Express app
const app = express();

//security middleware
app.use(helmet()); //adds various HTTP headers for security
app.use(cors()); //allows cross-origin requests (frontend to backend)

//body parser middleware
app.use(express.json()); //allows app to understand JSON
app.use(express.urlencoded({ extended: true })); //allows app to understand form data

//rate limiting to prevent spam
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, //limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

//test route to check if server is running
app.get('/', (req, res) => {
  res.json({ message: 'Recipe Sharing API is running!' });
});

//API Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/recipes', require('./src/routes/recipes'));
app.use('/api/reviews', require('./src/routes/reviews'));
app.use('/api/users', require('./src/routes/users'));
app.use('/api/shopping-list', require('./src/routes/shoppingList'));

//error handling middleware (catches all errors)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

//start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to check if it's working`);
});
