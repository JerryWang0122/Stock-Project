const express = require('express')
const transController = require('../../controllers/transaction-controller')
const dividendController = require('../../controllers/dividend-controller')
const stockController = require('../../controllers/stock-controller')
const router = express.Router()

router.post('/recap-diagram', stockController.getRecapDiagram)
router.get('/cost', transController.getCostRecap)
router.get('/dividends', dividendController.getDividendsRecap)
router.get('/margin', transController.getMarginRecap)

module.exports = router
