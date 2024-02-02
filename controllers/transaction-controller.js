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
  },
  getTransactionsByPage: (req, res, next) => {
    transServices.getTransactionsByPage(req, (err, data) => err ? next(err) : res.json({ success: true, data }))
  },
  getCostRecap: (req, res, next) => {
    transServices.getCostRecap(req, (err, data) => err ? next(err) : res.json({ success: true, data }))
  },
  getMarginRecap: (req, res, next) => {
    transServices.getMarginRecap(req, (err, data) => err ? next(err) : res.json({ success: true, data }))
  }
}

module.exports = transController
