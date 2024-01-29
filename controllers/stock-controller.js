const stockServices = require('../services/stock-services')

const stockController = {
  getSymbol: (req, res, next) => {
    stockServices.getSymbol(req, (err, data) => err ? next(err) : res.json({ success: true, data }))
  },
  getStockAbstract: (req, res, next) => {
    stockServices.getStockAbstract(req, (err, data) => err ? next(err) : res.json({ success: true, data }))
  }
}

module.exports = stockController
