const express = require('express');

const forgotpasswordController = require('../controllers/forgotpassword');

const router = express.Router();

router.post('/forgotpassword', forgotpasswordController.postForgotPassword);

router.get('/resetpassword/:id', forgotpasswordController.getResetPassword);

router.get('/updatepassword/:id', forgotpasswordController.getUpdatePassword);

module.exports = router;