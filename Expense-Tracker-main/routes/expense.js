const express = require('express');

const expenseController = require('../controllers/expense');
const userAuth = require('../middleware/auth');

const router = express.Router();

router.get('/get-expenses/:pageNo', userAuth.authenticate, expenseController.getExpenses);

router.post('/post-expense', userAuth.authenticate, expenseController.postExpense);

router.get('/delete-expense/:expenseId', userAuth.authenticate, expenseController.deleteExpense);

router.post('/edit-expense/:expenseId', userAuth.authenticate, expenseController.editExpense);

router.get('/download', userAuth.authenticate, expenseController.getDownloadExpenses);

router.get('/getAllUrl', userAuth.authenticate, expenseController.getDownloadAllUrl);

module.exports = router;