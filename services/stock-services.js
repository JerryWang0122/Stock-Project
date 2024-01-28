const { calcSharesHold } = require('../helpers/dividend-helper')
const { Stock, Transaction, Dividend } = require('../models')
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
      let stock = await Stock.findOne({
        where: { symbol },
        include: [
          {
            model: Transaction,
            where: { userId: req.user.id }
          },
          {
            model: Dividend,
            where: { userId: req.user.id }
          }
        ],
        order: [[Transaction, 'transDate'], [Dividend, 'dividendDate']]
      })
      if (!stock) throw new Error('尚未輸入此股票相關紀錄')

      // 整理abstract資料
      stock = stock.toJSON()
      const sharesHold = await calcSharesHold(req.user.id, stock.id, new Date())
      const totalCost = stock.Transactions.reduce((acc, cur) => acc + (cur.isBuy ? 1 : -1) * cur.quantity * cur.pricePerUnit + cur.fee, 0)
      const accuIncome = stock.Dividends.reduce((acc, cur) => acc + cur.sharesHold * cur.amount, 0)
      const avgCost = sharesHold ? (totalCost - accuIncome) / sharesHold : null
      const totalReturn = -1 * totalCost + accuIncome

      stock.abstract = { sharesHold, totalCost, accuIncome, avgCost, totalReturn }
      cb(null, { stock })
    } catch (err) {
      cb(err)
    }
  }
}

module.exports = stockServices
