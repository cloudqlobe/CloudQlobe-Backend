const express = require('express');
const router = express.Router();
const AdminController = require('../controller/adminController') 

router.post('/login', AdminController.adminLogin);

//Members CRUD ............................................

router.post('/createaccountMember', AdminController.createMember);
router.get('/allaccountMember', AdminController.getAllMember);
router.put('/updateaccountMember/:id', AdminController.updateMember);
router.delete('/deleteaccountMember/:id', AdminController.deleteMember);

router.post('/createsupportMember', AdminController.createSupportMember);
router.get('/allsupportMember', AdminController.getAllSupportMember);
router.put('/updatesupportMember/:id', AdminController.updateSupportMember);
router.delete('/deletesupportMember/:id', AdminController.deleteSupportMember);

router.post('/createcarrierMember', AdminController.createCarrierMember);
router.get('/allcarrierMember', AdminController.getAllCarrierMember);
router.put('/updatecarrierMember/:id', AdminController.updateCarrierMember);
router.delete('/deletecarrierMember/:id', AdminController.deleteCarrierMember);

router.post('/createleadMember', AdminController.createLeadMember);
router.get('/allleadMember', AdminController.getAllLeadMember);
router.put('/updateleadMember/:id', AdminController.updateLeadMember);
router.delete('/deleteleadMember/:id', AdminController.deleteLeadMember);

router.post('/createsaleMember', AdminController.createSaleMember);
router.get('/allsaleMember', AdminController.getAllSaleMember);
router.put('/updatesaleMember/:id', AdminController.updateSaleMember);
router.delete('/deletesaleMember/:id', AdminController.deleteSaleMember);

//Members CRUD  ..............................................................

router.post('/ccrates', AdminController.createCCRate);
router.get('/ccrates', AdminController.getAllCCRate);
router.put('/ccrates/:id', AdminController.updateCCRate);
router.delete('/ccrates/:id', AdminController.deleteCCRate);

router.post('/clirates', AdminController.createCLIRate);
router.get('/clirates', AdminController.getAllCLIRate);
router.put('/clirates/:id', AdminController.updateCLIRate);
router.delete('/clirates/:id', AdminController.deleteCLIRate);


module.exports = router;