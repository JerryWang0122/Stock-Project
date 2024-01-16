const express = require('express')
const userController = require('../controllers/user-controller')
const { apiErrorHandler } = require('../middleware/error-handler')
const { checkLocalSignin } = require('../middleware/api-auth')
const router = express.Router()

router.post('/register', userController.register)
router.post('/login', checkLocalSignin, userController.login)

router.use('/', apiErrorHandler)
module.exports = router
