const express = require('express')
const dividendController = require('../../controllers/dividend-controller')
const router = express.Router()

router.post('/', dividendController.addDividend)
router.delete('/:did', dividendController.deleteDividend)
router.get('/:did', dividendController.getDividend)
router.put('/:did', dividendController.putDividend)

module.exports = router
