const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController') 

router.post('/createAdmin', adminController.createAdmin);
router.get('/getAllAdmin', adminController.getAllAdmin);
router.put('/updateAdmin/:id', adminController.updateAdmin);
router.delete('/deleteAdmin/:id', adminController.deleteAdmin);

router.post('/login', adminController.superAdminLogin);

module.exports = router;