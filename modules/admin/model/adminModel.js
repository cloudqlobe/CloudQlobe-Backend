const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Create the schema for the Admin
const AdminSchema = new mongoose.Schema({
    adminName: { 
        type: String, 
        required: true 
    },
    adminEmail: { 
        type: String, 
        required: true, 
        unique: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    role: { 
        type: String, 
        enum: ['superadmin', 'admin', 'moderator'], 
        default: 'admin' 
    }
});

// Hash the password before saving the admin document
AdminSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

module.exports = mongoose.model('Admin', AdminSchema);
