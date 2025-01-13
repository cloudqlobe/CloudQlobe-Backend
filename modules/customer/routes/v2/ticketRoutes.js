const express = require('express');
const router = express.Router();
const TicketController = require('../controllers/ticketController'); // Adjust the path as necessary

// Define routes for the support tickets
router.post('/', TicketController.createTicket); // Create a new ticket
router.get('/', TicketController.getAllTickets); // Get all tickets
router.get('/:ticketId', TicketController.getTicketById); // Get a ticket by ID
router.get('/customerId', TicketController.getTicketByCustomerId); // Get tickets by customer ID
router.put('/:ticketId', TicketController.updateTicket); // Update a ticket by ID
router.delete('/:ticketId', TicketController.deleteTicket); // Delete a ticket by ID

module.exports = router;
