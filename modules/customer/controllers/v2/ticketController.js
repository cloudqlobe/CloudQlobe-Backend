// TicketController.js

const SupportTicket = require('../model/ticketModel'); // Adjust the path as necessary

// Create a new support ticket
 const createTicket = async (req, res) => {
    try {
        const newTicket = new SupportTicket(req.body);
        await newTicket.save();
        res.status(201).json(newTicket);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get all support tickets
const getAllTickets = async (req, res) => {
    try {
        const tickets = await SupportTicket.find();
        res.status(200).json(tickets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a single support ticket by ticketId
const getTicketById = async (req, res) => {
    try {
        // Get ticketId from the query parameters
        const { ticketId } = req.query; 

        // Ensure ticketId is provided
        if (!ticketId) {
            return res.status(400).json({ message: 'Ticket ID is required' });
        }

        // Find the ticket using the ticketId from the query
        const ticket = await SupportTicket.findOne({ ticketId });
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Send the ticket data as the response
        res.status(200).json(ticket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
const getTicketByCustomerId = async (req, res) => {
    try {
        // Get customerId from the query parameters
        const { customerId } = req.query; 

        // Ensure customerId is provided
        if (!customerId) {
            return res.status(400).json({ message: 'Customer ID is required' });
        }

        // Find tickets using the customerId from the query
        const tickets = await SupportTicket.find({ customerId });
        
        // Check if any tickets were found
        if (tickets.length === 0) {
            return res.status(404).json({ message: 'No tickets found for this customer' });
        }

        // Send the ticket(s) data as the response
        res.status(200).json(tickets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// Update a support ticket by ticketId
const updateTicket = async (req, res) => {
    try {
        const ticket = await SupportTicket.findOneAndUpdate(
            { ticketId: req.params.ticketId },
            req.body,
            { new: true, runValidators: true }
        );
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }
        res.status(200).json(ticket);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete a support ticket by ticketId
const deleteTicket = async (req, res) => {
    try {
        const ticket = await SupportTicket.findOneAndDelete({ ticketId: req.params.ticketId });
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createTicket,
    getAllTickets,
    getTicketById,
    getTicketByCustomerId,
    updateTicket,
    deleteTicket,
};
