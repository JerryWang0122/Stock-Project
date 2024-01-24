const express = require('express')
const stockController = require('../../controllers/stock-controller')
const router = express.Router()

router.get('/:symbol', stockController.getStock)

module.exports = router
