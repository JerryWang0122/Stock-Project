const express = require('express')
const transController = require('../../controllers/transaction-controller')
const router = express.Router()

router.post('/', transController.addTransaction)
router.get('/:tid', transController.getTransaction)
module.exports = router
