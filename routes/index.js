const express = require('express')
const userController = require('../controllers/user-controller')
const { apiErrorHandler } = require('../middleware/error-handler')
const { checkLocalSignin, authenticated } = require('../middleware/api-auth')
const router = express.Router()

router.post('/register', userController.register)
router.post('/login', checkLocalSignin, userController.login)
router.get('/test-token', authenticated, (req, res) => {
  res.json({ success: true })
})

router.use('/', apiErrorHandler)
module.exports = router
