const express = require('express');

const premiumController = require('../controllers/premium');

const userAuthentication = require('../middleware/auth');

const router = express.Router();

router.use("/show-leaderboard",userAuthentication.authenticate, premiumController.getLeaderBoard );

module.exports = router;