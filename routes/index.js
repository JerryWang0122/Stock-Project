const express = require('express')
const userController = require('../controllers/user-controller')
const { apiErrorHandler } = require('../middleware/error-handler')
const { checkLocalSignin, authenticated } = require('../middleware/api-auth')
const stockController = require('../controllers/stock-controller')
const transactionRouter = require('./modules/transaction')
const stockRouter = require('./modules/stock')

const router = express.Router()

router.use('/transactions', authenticated, transactionRouter)
router.use('/stocks', authenticated, stockRouter)

router.post('/register', userController.register)
router.post('/login', checkLocalSignin, userController.login)

router.post('/symbol', stockController.getSymbol)
router.get('/test-token', authenticated, (req, res) => {
  res.json({ success: true })
})

router.use('/', apiErrorHandler)
module.exports = router
