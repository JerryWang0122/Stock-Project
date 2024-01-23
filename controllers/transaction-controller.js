const transServices = require('../services/transaction-services')

const transController = {
  addTransaction: (req, res, next) => {
    transServices.addTransaction(req, (err, data) => err ? next(err) : res.json({ success: true, data }))
  },
  getTransaction: (req, res, next) => {
    transServices.getTransaction(req, (err, data) => err ? next(err) : res.json({ success: true, data }))
  },
  deleteTransaction: (req, res, next) => {
    transServices.deleteTransaction(req, (err, data) => err ? next(err) : res.json({ success: true, data }))
  }
}

module.exports = transController
