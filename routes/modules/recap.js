const express = require('express')
const transController = require('../../controllers/transaction-controller')
const dividendController = require('../../controllers/dividend-controller')
const router = express.Router()

router.get('/cost', transController.getCostRecap)
router.get('/dividends', dividendController.getDividendsRecap)

module.exports = router
