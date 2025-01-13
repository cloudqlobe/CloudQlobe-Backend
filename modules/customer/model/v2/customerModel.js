const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Helper function to generate a custom customer ID
function generateCustomerId(companyName) {
    // Take the first 4 letters of the companyName (or all if less than 4), convert to uppercase
    const namePart = companyName.slice(0, 4).toUpperCase();
    // Generate a random 4-digit number
    const numberPart = Math.floor(1000 + Math.random() * 9000);
    // Combine and return the customerId
    return `${namePart}${numberPart}`;
}

// Create the schema for the Customer
const CustomerSchema = new mongoose.Schema({
    companyName: { 
        type: String, 
        required: true 
    },
    companyEmail: { 
        type: String, 
        required: true, 
        unique: true 
    },
    contactPerson: { 
        type: String, 
        required: true 
    },
    country: { 
        type: String, 
        required: true 
    },
    companyPhone: { 
        type: String, 
        required: true 
    },
    address: { 
        type: String 
    },
    companyWebsite: { 
        type: String 
    },
    companyLinkedIn: { 
        type: String // Added to match the request parameter
    },

    // User-specific fields
    userFirstname: { 
        type: String, 
        required: true 
    },
    userLastname: { 
        type: String, 
        required: true 
    },
    username: { 
        type: String, 
        required: true, 
        unique: true 
    },
    userEmail: { 
        type: String, 
        required: true, 
        unique: true 
    },
    userMobile: { 
        type: String, 
        required: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    supportEmail: { 
        type: String 
    },
    sipSupport: { 
        type: String, 
        required: true 
    },
    codex: { 
        type: String, 
        required: true 
    },
    switchIps: [{ 
        type: String, // Added to support multiple switch IPs
        validate: {
            validator: function(value) {
                // Add basic validation to ensure IP address format
                const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
                return value.every(ip => ipRegex.test(ip));
            },
            message: 'Please enter valid IP addresses'
        }
    }],
    ipdbid: { 
        type: String 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },

    // Customer type and status fields
    customerType: { 
        type: String, 
        enum: ['Carrier', 'Customer','Lead'], 
        required: true 
    },
    customerStatus: { 
        type: String, 
       // enum: ['active', 'inactive', 'suspended'], 
        default: 'active' 
    },
    leadStatus: { 
        type: String, 
       // enum: ['new', 'hot', 'converted', 'junk','dead'], 
        default: 'new' 
    },
    leadType: { 
        type: String, 
        //enum: ['hot', 'warm', 'cold'], 
        default: 'cold' 
    },

    // Additional fields
    cartId: { 
        type: [String], 
        ref: 'Cart' 
    },
    ticketsId: [{ 
        type: String, 
        ref: 'Ticket' 
    }],
    followupStatus: { 
        type: String, 
        //enum: ['pending', 'completed', 'ignored'], 
        default: 'pending' 
    },
    customerId: { 
        type: String, 
        unique: true 
    },
    privateRateId: { 
        type: [String], 
        ref: 'PrivateRate' 
    }   
});

// Hash the password before saving the customer document
CustomerSchema.pre('save', async function (next) {
    // If the password is modified, hash it
        if (this.isModified('password')) {
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
        }
F
    // Generate customerId if it's not already set
    if (!this.customerId) {
        this.customerId = generateCustomerId(this.companyName);
    }

    next();
});

module.exports = mongoose.model('Customer', CustomerSchema);
