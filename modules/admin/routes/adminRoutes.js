const express = require('express');
const router = express.Router();
const AdminController = require('../controller/adminController') 
const CarrierController = require('../controller/carrierController') 
const supportController = require('../controller/supportController') 
const SaleController = require('../controller/saleController') 
const LeadController = require('../controller/leadController') 
const AuthController = require('../controller/authController') 
const TeamManagementRoutes = require('../TeamManagement/routes/page')

router.post('/login', AuthController.adminLogin);
router.post('/verify-token', AuthController.verifyAdminToken);
router.post('/logout', AuthController.logout);

//Team Management ...........................................

router.use('/teamManagement', TeamManagementRoutes);

//Team Management ...........................................

//Members CRUD ............................................

router.post('/createaccountMember', AdminController.createMember);
router.get('/allaccountMember', AdminController.getAllMember);
router.put('/updateaccountMember/:id', AdminController.updateMember);
router.delete('/deleteaccountMember/:id', AdminController.deleteMember);

router.post('/createsupportMember', supportController.createSupportMember);
router.get('/allsupportMember', supportController.getAllSupportMember);
router.put('/updatesupportMember/:id', supportController.updateSupportMember);
router.delete('/deletesupportMember/:id', supportController.deleteSupportMember);

router.post('/createcarrierMember', CarrierController.createCarrierMember);
router.get('/allcarrierMember', CarrierController.getAllCarrierMember);
router.put('/updatecarrierMember/:id', CarrierController.updateCarrierMember);
router.delete('/deletecarrierMember/:id', CarrierController.deleteCarrierMember);
  
router.post('/createleadMember', LeadController.createLeadMember);
router.get('/allleadMember', LeadController.getAllLeadMember);
router.put('/updateleadMember/:id', LeadController.updateLeadMember);
router.delete('/deleteleadMember/:id', LeadController.deleteLeadMember);

router.post('/createsaleMember', SaleController.createSaleMember);
router.get('/allsaleMember', SaleController.getAllSaleMember);
router.put('/updatesaleMember/:id', SaleController.updateSaleMember);
router.delete('/deletesaleMember/:id', SaleController.deleteSaleMember);

//Members CRUD  ..............................................................

router.post('/ccrates', AdminController.createCCRate);
router.get('/ccrates', AdminController.getAllCCRate);
router.get('/ccrate/:id', AdminController.getCCRate);
router.put('/ccrates/:id', AdminController.updateCCRate);
router.delete('/ccrates/:id', AdminController.deleteCCRate);

router.put('/delete/specialRate/:id', AdminController.deleteSpecialRate);


router.post('/clirates', AdminController.createCLIRate);
router.get('/clirates', AdminController.getAllCLIRate);
router.get('/clirate/:id', AdminController.getCLIRate);
router.put('/clirates/:id', AdminController.updateCLIRate);
router.delete('/clirates/:id', AdminController.deleteCLIRate);

router.post('/targeted/rate', AdminController.createTargetedRate);
router.get('/targeted/rate', AdminController.getAllTargetedRate);
router.get('/targeted/rate/:id', AdminController.getTargetedRate);
router.put('/targeted/rate/:id', AdminController.updateTargetRate);
router.delete('/targeted/rate/:id', AdminController.deleteTargetedRate);

router.post('/offer/rate', AdminController.createOfferRate);
router.get('/offer/rate', AdminController.getAllOfferRate);
router.get('/offer/rate/:id', AdminController.getOfferRate);
router.put('/offer/rate/:id', AdminController.updateOfferRate);
router.delete('/offer/rate/:id', AdminController.deleteOfferRate);

module.exports = router;