// Import required packages

const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const express = require('express');
// Load environment variables
dotenv.config();

// Initialize the Express application
const app = express();

// Middleware
app.use(cors()); // Enable CORS for all routes


app.use(bodyParser.json()); // Parse incoming JSON requests

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Import routes
const adminRoutes = require('./modules/admin/routes/adminRoutes');
//const customerRoutes = require('./modules/customer/routes/customerRoutes');
//const RateRoutes = require('./modules/admin/routes/RateRoutes');
//const TicketRouter = require('./modules/customer/routes/ticketRoutes'); 
//const CartRouter = require('./modules/customer/routes/CartItemRoutes');
const customerRoutes = require('./modules/admin/routes/v3/customerRoutes')
// Use routes
app.use('/v3/api', customerRoutes);
// app.use('/api/admin', adminRoutes);
// //app.use('/api/customer', customerRoutes);
// app.use('/api/Rates', RateRoutes);
// //app.use('/api/tickets', TicketRouter);
// app.use('/api/cart', CartRouter)
// Default route
app.get('/', (req, res) => {
    res.send('Welcome to the Admin and Customer Management API');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal Server Error' });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});
