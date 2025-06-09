const express = require('express');
const router = express.Router();
const imageUpload = require('../../../middlewares/ImageUpload/imageUpload')
const commonController = require('../controller/commonController') 
const supportController = require('../controller/supportController') 
const communicationController = require('../controller/communicationController')
const accountController = require('../controller/accountController') 
const messageController = require('../controller/memberMessageController'); 
const chatBotController = require('../controller/chatBotController'); 
const { auth } = require('../../../middlewares/authMiddleware');

// Add this to your backend routes
router.get('/auth/check', auth); // More standard endpoint naming

router.post('/logout', (req, res) => {
    res.clearCookie('Token');
    return res.status(200).json({ message: 'Logged out successfully' });
});

//ChatBot
router.get('/chatbot/faq', chatBotController.getAllChatBotFaq);
router.post('/chat/create', chatBotController.createChatBotMessage);
router.get('/chat/messages', chatBotController.getAllChatBotMessages);
router.patch('/chat/messages/read', chatBotController.updateMessageStatus );

 
//account
router.post('/accountMember/login', accountController.memberLogin);
router.get('/account/:id', accountController.getAccountMember);
router.post('/Transactions',imageUpload,accountController.createTransaction)
router.post('/VendorCreate',imageUpload,accountController.Vendorcreate)
router.get('/getAllTransactions',accountController.getAllTransactions)
router.get('/getTransactionsByMemberId/:id',accountController.getTransactionsByMemberId)
router.get('/getTransactions/:id',accountController.getTransactions)
router.get('/getAllVendor',accountController.getAllVendor)
router.get('/getVendorByMemberId/:id',accountController.getVendorByMemberId)
router.put('/updateTransaction/:id',accountController.updateTransactionsServiceEngineer)
router.put('/updateMemberTransactionId/:id',accountController.updateMemberTransactionsId)
router.put('/updateVendor/:id',accountController.updateVendorServiceEngineer)
router.put('/updateMemberVendorId/:id',accountController.updateMemberVendorsId)
router.put('/updateTransationStatus/:id', accountController.updateTransationStatus);
router.put('/updateVendorStatus/:id', accountController.updateVentorStatus);
router.put('/updatePrivateRate/:id',accountController.updateTestPrivateRateServiceEngineer)
router.put('/updateMemberPrivateRateId/:id',accountController.updateMemberPrivateRateId)
router.put('/updatePrivateRateStatus/:id', accountController.updatePrivateRateStatus);
//overdraft
router.post('/createOverdraft', accountController.createOverdraft);
router.get('/getAllOverdraft',accountController.getAllOverdraft)
router.put('/updateOverdraft/:id',accountController.updateOverdraftServiceEngineer)
router.put('/updateMemberOverdraftId/:id',accountController.updateMemberOverdraftId)
router.put('/updateOverdraftStatus/:id', accountController.updateOverdraftStatus);

//communication
router.get('/enquiry', communicationController.getAllCustomerEnquiry);
router.get('/didNumber', communicationController.getAllCustomerDidNumber);
router.put('/enquiry/:id', communicationController.updateEnquiry);
router.put('/updateMemberEnquiryId/:id', communicationController.updateMemberEnquiryId);
router.put('/updateEnquiryStatus/:id', communicationController.updateEnquiryStatus);
router.put('/did/:id', communicationController.updateDID);
router.put('/updateMemberDIDId/:id', communicationController.updateMemberDIDId);
router.put('/updateDidStatus/:id', communicationController.updateDIDStatus);

//support
router.post('/supportMember/login', supportController.supportMemberLogin);
router.get('/support/:id', supportController.getSupportMember);
router.get('/getTestingRateByMemberId/:id', supportController.getTestingRateByMemberId); 
router.put('/updateMemberTest/:id', supportController.updateMemberTest);
router.put('/tests/:id', supportController.updateTest);
router.put('/teststatus/:id', supportController.updateTestStatus);
router.get('/tests', supportController.gettestData); 
router.post('/createMember/customerTroubleTicket', supportController.createMemberCustomerTroubleTicket);
router.get('/troubleticket', supportController.getAllTroubleTicket);
router.get('/getTroubleTicketByMemberId/:id', supportController.getTroubleTicketByMemberId);
router.get('/troubleticket/:id', supportController.getTroubleTicket);
router.put('/updateMemberTicket/:id', supportController.updateMemberTicket);
router.put('/troubleticket/:id', supportController.updateTroubleTicket);
router.put('/troubleticketstatus/:id', supportController.updateTroubleTicketStatus);
router.post('/support/createcustomerfollowup', supportController.createCustomerFollowup);
router.get('/fetchCustomerId', supportController.fetchCustomerId);

//Lead
router.post('/leadMember/login', commonController.leadMemberLogin);
router.get('/leadMember/:id', commonController.getLeadMember);
router.get('/myRates', commonController.getMyRate);
router.get('/lead/:id', commonController.getLead);

//Lead/Sale/Carrier
router.post('/saleMember/login', commonController.saleMemberLogin);
router.post('/carrierMember/login', commonController.carrierMemberLogin);

router.post('/leadMember/NewLead', commonController.createNewLead);
router.put('/updateLead/:id', commonController.updateCustomer);
router.put('/leadStatus/:id', commonController.updateLeadStatus);
router.put('/leadConversion/:id', commonController.LeadConversion);
router.post('/createcustomerfollowups', commonController.createCustomerFollowup);
router.get('/customerfollowups', commonController.getAllFollowup);
router.get('/getCustomerFollowupsByMemberId/:id', commonController.getCustomerFollowupsByMemberId);
router.get('/customerfollowups/:id', commonController.getCustomerFollowups);
router.get('/getFollowupsByCategory/:id', commonController.getFollowupsByCategory);
router.get('/followups/:id', commonController.getFollowups);
router.put('/followups/:id', commonController.updateFollowHistory);

router.post('/private_ccrates', commonController.createPrivateCCRate);
router.get('/private_ccrates', commonController.getAllPrivateCCRate);
router.get('/private_ccrates/:id', commonController.getPrivateCCRate);
router.post('/private_clirates', commonController.createPrivateCLIRate);
router.get('/private_clirates', commonController.getAllPrivateCLIRate);
router.get('/private_clirates/:id', commonController.getPrivateCLIRate);
//test privateRate
router.post('/test_privateRate', commonController.testPrivateRate);
router.get('/test_privateRate', commonController.getAllTestPrivateRate);
router.get('/test_privateRate/:id', commonController.getTestPrivateRate);

router.get('/getAllMessage', messageController.getAllMessage);
router.get('/getLeadsMessage', messageController.getLeadsMessage);
router.get('/getSalesMessage', messageController.getSalesMessage);
router.get('/getCarriersMessage', messageController.getCarriersMessage);
router.get('/getAccountsMessage', messageController.getAccountsMessage);
router.post('/createMessage', messageController.postMessage);
router.put('/markAsRead', messageController.markAsRead);
router.put('/messageReply', messageController.messageReply);
router.delete('/deleteMessage/:id', messageController.deleteMessage);

module.exports = router;
