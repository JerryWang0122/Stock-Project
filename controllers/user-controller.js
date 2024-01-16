const userServices = require('../services/user-services')

const userController = {
  register: (req, res, next) => {
    userServices.register(req, (err, data) => err ? next(err) : res.json({ success: true }))
  }
}

module.exports = userController
