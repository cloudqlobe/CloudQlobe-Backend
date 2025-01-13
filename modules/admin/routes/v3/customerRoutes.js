const express = require('express');
const router = express.Router();

const { CustomerController, MyRatesController, RateController, SupportTicketController, FollowupController,CLIRateController,PrivateRateController,TestController,ChatController, CCRatesTickerController, CliRatesTickerController ,InquiryController, EmailController} = require('../../controllers/v3/cutsomerController');

// Customer routes
router.post('/Register', CustomerController.createCustomer);
router.get('/customers', CustomerController.getAllCustomers);
router.get('/customers/:id', CustomerController.getCustomerById);
router.put('/customers/:id', CustomerController.updateCustomer);
router.delete('/customers/:id', CustomerController.deleteCustomer);
router.post('/customers/login',CustomerController.loginCustomer)
router.put('/customers/updatemyrate/:id',CustomerController.updateMyRatesId);
router.put('/customers/updaterateAdded/:id',CustomerController.updateRateAddedToTest);
router.get('/customers/:id/support', CustomerController.getcustomerSupportById)
router.post('/createSuperadmins',CustomerController.createSuperAdmin)
router.post('/Adminlogin' ,CustomerController.superAdminlogin )

// MyRates routes
router.post('/myrates', MyRatesController.createRate);
router.get('/myrates', MyRatesController.getAllRates);
router.get('/myrates/:id', MyRatesController.getRateById);
router.put('/myrates/:id', MyRatesController.updateRate);
router.delete('/myrates/:id', MyRatesController.deleteRate);


// Rate routes
router.post('/rates', RateController.createRate);
router.get('/rates', RateController.getAllRates);
// router.get('/rates/:id', ()=>console.log("qwertyuiop"));
router.get('/rates/:id', RateController.getRateById);


router.put('/rates/:id', RateController.updateRate);
router.delete('/rates/:id', RateController.deleteRate);

// SupportTicket routes
router.post('/tickets', SupportTicketController.createTicket);
router.get('/tickets', SupportTicketController.getAllTickets);
router.get('/tickets/:id', SupportTicketController.getTicketById);
router.put('/tickets/:id', SupportTicketController.updateTicket);
router.delete('/tickets/:id', SupportTicketController.deleteTicket);

// Followup routes
router.post('/followups', FollowupController.createFollowup);
router.get('/followups', FollowupController.getAllFollowups);
router.get('/followups/:id', FollowupController.getFollowupById);
router.put('/followups/:id', FollowupController.updateFollowup);
router.delete('/followups/:id', FollowupController.deleteFollowup);

//cli routes
router.post('/clirates', CLIRateController.createRate); // Create a new CLI Rate
router.get('/clirates', CLIRateController.getAllRates); // Get all CLI Rates
router.get('/clirates/:id', CLIRateController.getRateById); // Get a CLI Rate by ID
router.put('/clirates/:id', CLIRateController.updateRate); // Update a CLI Rate by ID
router.delete('/clirates/:id', CLIRateController.deleteRate); // Delete a CLI Rate by ID


// Routes for Test
router.get('/tests', TestController.getAllTests);           // Get all tests
router.get('/tests/:id', TestController.getTestById);        // Get a single test by ID
router.post('/tests', TestController.createTest);           // Create a new test
router.put('/tests/:id', TestController.updateTest);         // Update a test
router.delete('/tests/:id', TestController.deleteTest);      // Delete a test

//Routes for Test
router.post('/chat/create', ChatController.createMessage);
// Route to get all messages by conversation id (cid)
router.get('/chat/conversation/:cid', ChatController.getMessagesByCid);
// Route to mark a message as read by message ID
router.put('/chat/markAsRead/:messageId', ChatController.markAsRead);
// Route to get all messages by customer ID
router.get('/chat/customer/:customerId', ChatController.getMessagesByCustomerId);
router.get('/chat', ChatController.getAllMessages);

//emails
router.post('/sendTestAccount', EmailController.sendTestAccountDetails);
// Route for sending configuration approval email
router.post('/sendConfigurationApproval', EmailController.sendConfigurationApproval);
// Route for sending test success notification email
router.post('/sendTestSuccessNotification', EmailController.sendTestSuccessNotification);


//PrivateRate Routes
router.post('/private-rates', PrivateRateController.createPrivateRate); // Create a new rate
router.get('/private-rates', PrivateRateController.getAllPrivateRates); // Get all rates
router.get('/private-rates/:id', PrivateRateController.getPrivateRateById); // Get a single rate by ID
router.put('/private-rates/:id', PrivateRateController.updatePrivateRate); // Update a rate by ID
router.delete('/private-rates/:id', PrivateRateController.deletePrivateRate); //


//ccticker routes
router.get('/cct', CCRatesTickerController.getAllCCRatesTickers);


router.get('/cct/:id', CCRatesTickerController.getCCRatesTickerById);
router.post('/cct', CCRatesTickerController.createCCRatesTicker);
router.put('/cct/:id', CCRatesTickerController.updateCCRatesTicker);
router.delete('/cct/:id', CCRatesTickerController.deleteCCRatesTicker);

//cliticker routes
router.get('/clt', CliRatesTickerController.getAllCliRatesTickers);
router.get('/clt/:id', CliRatesTickerController.getCliRatesTickerById);
router.post('/clt', CliRatesTickerController.createCliRatesTicker);
router.put('/clt/:id', CliRatesTickerController.updateCliRatesTicker);
router.delete('/clt/:id', CliRatesTickerController.deleteCliRatesTicker);

//Enquiry Routes



router.post("/inquiries", InquiryController.createInquiry);
router.get("/inquiries", InquiryController.getInquiries);
router.get("/inquiries/:id", InquiryController.getInquiryById);
router.put("/inquiries/:id", InquiryController.updateInquiry);
router.delete("/inquiries/:id", InquiryController.deleteInquiry);


//Email Routes
router.post('/email/send', EmailController.sendEmail);      // Endpoint to send email
router.get('/email/history', EmailController.getEmails);     // Endpoint to retrieve email history


module.exports = router;
