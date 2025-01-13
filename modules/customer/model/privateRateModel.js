const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Create the schema for Private Rate
const PrivateRateSchema = new mongoose.Schema({
    countryCode: { 
        type: String, 
        required: true 
    },
    country: { 
        type: String, 
        required: true 
    },
    qualityDescription: { 
        type: String, 
        required: true 
    },
    rate: { 
        type: Number, 
        required: true 
    },
    status: { 
        type: String, 
        required: true 
    },
    testStatus: { 
        type: String, 
        required: true 
    },
    profile: { 
        type: String 
    },
    testControl: { 
        type: String 
    },
    addedTime: { 
        type: Date, 
        default: Date.now 
    }
}, {
    _id: { type: String, default: uuidv4 }, // Generates a unique string for the document ID
});

// Create and export the Private Rate model
module.exports = mongoose.model('PrivateRate', PrivateRateSchema);
