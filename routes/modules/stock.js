const express = require('express')
const stockController = require('../../controllers/stock-controller')
const transController = require('../../controllers/transaction-controller')
const dividendController = require('../../controllers/dividend-controller')
const router = express.Router()

router.get('/:stockId/transactions', transController.getTransactionsByPage)
router.get('/:stockId/dividends', dividendController.getDividendsByPage)
router.get('/:symbol/abstract', stockController.getStockAbstract)

module.exports = router
