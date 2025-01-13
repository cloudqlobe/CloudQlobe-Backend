const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Create the schema for Ticket Updates (Sub-document)
const TicketUpdateSchema = new mongoose.Schema({
    date: { 
        type: Date, 
        required: true, 
        default: Date.now 
    },
    notes: { 
        type: String, 
        required: true 
    },
    status: { 
        type: String, 
        enum: ['open', 'in-progress', 'closed', 'pending', 'resolved'], 
        required: true 
    },
    actionTaken: { 
        type: String, 
        required: true 
    }
}, { _id: false }); // Prevent Mongoose from creating an _id for sub-documents

// Create the schema for the Support Ticket
const SupportTicketSchema = new mongoose.Schema({
    ticketId: { 
        type: String, 
        default: uuidv4, // Generates a unique ticket ID
        unique: true 
    },
    issueTitle: { 
        type: String, 
        required: true 
    },
    issueDescription: { 
        type: String, 
        required: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updates: [TicketUpdateSchema], // Array to hold updates on the ticket
    assignedPerson: { 
        type: String, 
        required: true 
    },
    assignedDepartment: { 
        type: String, 
        enum: ['support', 'technical', 'billing', 'sales'], 
        required: true 
    },
    priority: { 
        type: String, 
        enum: ['low', 'medium', 'high', 'urgent'], 
        default: 'medium' 
    },
    customerId: { 
        type: String, 
        ref: 'Customer', // Refers to the Customer model
        required: true 
    },
    contactType: { 
        type: String, 
        enum: ['email', 'phone', 'in-person', 'chat'], 
        required: true 
    },
    contactDetails: { 
        type: String, 
        required: true 
    },
    scheduledTime: { 
        type: Date 
    },
    resolutionTime: { 
        type: Date 
    },
    status: { 
        type: String, 
        enum: ['open', 'in-progress', 'closed', 'pending', 'resolved'], 
        default: 'open' 
    },
    notes: { 
        type: String 
    }
});

// Create and export the Support Ticket model
module.exports = mongoose.model('SupportTicket', SupportTicketSchema);
