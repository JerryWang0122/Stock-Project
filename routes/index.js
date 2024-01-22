const express = require('express')
const userController = require('../controllers/user-controller')
const { apiErrorHandler } = require('../middleware/error-handler')
const { checkLocalSignin, authenticated } = require('../middleware/api-auth')
const stockController = require('../controllers/stock-controller')
const router = express.Router()

router.post('/register', userController.register)
router.post('/login', checkLocalSignin, userController.login)

router.post('/symbol', stockController.getStock)
router.get('/test-token', authenticated, (req, res) => {
  res.json({ success: true })
})

router.use('/', apiErrorHandler)
module.exports = router
