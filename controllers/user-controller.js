const userServices = require('../services/user-services')

const userController = {
  register: (req, res, next) => {
    userServices.register(req, (err, data) => err ? next(err) : res.json({ success: true }))
  },
  login: (req, res, next) => {
    userServices.login(req, (err, data) => err ? next(err) : res.json({ success: true, data }))
  }
}

module.exports = userController
