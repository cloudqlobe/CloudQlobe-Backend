const express = require('express');
const router = express.Router();
const memberController = require('../controller/memberController') 

router.post('/accountMember/login', memberController.memberLogin);
router.post('/supportMember/login', memberController.supportMemberLogin);
router.post('/saleMember/login', memberController.saleMemberLogin);
router.post('/carrierMember/login', memberController.carrierMemberLogin);
router.post('/leadMember/login', memberController.leadMemberLogin);


module.exports = router;
