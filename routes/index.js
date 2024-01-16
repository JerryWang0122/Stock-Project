const express = require('express')
const userController = require('../controllers/user-controller')
const { apiErrorHandler } = require('../middleware/error-handler')
const router = express.Router()

router.post('/register', userController.register)

router.use('/', apiErrorHandler)
module.exports = router
