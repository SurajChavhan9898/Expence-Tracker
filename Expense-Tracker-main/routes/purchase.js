const express = require('express');

const purchaseController = require('../controllers/purchase');

const userAuthentication = require('../middleware/auth');

const router = express.Router();

router.get('/premium-membership', userAuthentication.authenticate, purchaseController.purchasepremium);

router.post('/update-transaction-status', userAuthentication.authenticate, purchaseController.updateTransactionStatus)

module.exports = router;