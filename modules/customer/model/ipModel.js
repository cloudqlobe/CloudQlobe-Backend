const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Create the schema for the IP Address
const IPAddressSchema = new mongoose.Schema({
    ip: { 
        type: String, 
        required: true 
    },
    status: { 
        type: String, 
        required: true 
    },
    addedTime: { 
        type: Date, 
        default: Date.now 
    }
}, {
    _id: { type: String, default: uuidv4 }, // Generates a unique string for the document ID
});

// Create and export the IP Address model
module.exports = mongoose.model('IPAddress', IPAddressSchema);
