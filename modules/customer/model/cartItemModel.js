const mongoose = require('mongoose');

// Create CartItem schema
const CartItemSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Customer', // Assuming you have a Customer model
    },
    rateDetails: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Rate', // Assuming you're referencing an existing Rate model
    },
    testStatus: {
      type: String,
      required: true,
      enum: ['Pending', 'In Progress', 'Completed'], // Example statuses, adjust as needed
    },
    testStartTime: {
      type: Date,
      required: true,
    },
    testEndTime: {
      type: Date,
      required: true,
    },
    testDate: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true } // This will automatically add `createdAt` and `updatedAt` fields
);

// Create and export the CartItem model
const CartItem = mongoose.model('CartItem', CartItemSchema);

module.exports = CartItem;
