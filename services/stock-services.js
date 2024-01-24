const { Stock, Transaction } = require('../models')
const { TwStock } = require('node-twstock')
const twstock = new TwStock()
const stocks = twstock.stocks

const stockServices = {
  getSymbol: (req, cb) => {
    const { symbol } = req.body

    Stock.findOne({
      where: { symbol }
    })
      .then(stock => {
        if (stock) {
          return cb(null, { stock })
        }
        stocks.quote({ symbol })
          .then(stockInfo => Stock.create({ symbol: stockInfo.symbol, name: stockInfo.name }))
          .then(stock => cb(null, { stock }))
          .catch(err => {
            err.message = `Can not find Stock with symbol: ${symbol}`
            cb(err)
          })
      })
      .catch(err => cb(err))
  },
  getStock: async (req, cb) => {
    try {
      const symbol = req.params.symbol
      const stock = await Stock.findOne({
        where: { symbol },
        include: {
          model: Transaction,
          where: { userId: req.user.id }
        }
      })
      cb(null, { stock })
    } catch (err) {
      cb(err)
    }
  }
}

module.exports = stockServices
