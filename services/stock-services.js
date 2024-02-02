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
  getStockAbstract: async (req, cb) => {
    try {
      const symbol = req.params.symbol
      const stock = await Stock.findOne({ where: { symbol } })
      if (!stock) throw new Error('此股票尚未登入資料庫')
      let [transactions, dividends] = await Promise.all([
        Transaction.findAll({
          where: {
            userId: req.user.id,
            stockId: stock.id
          },
          order: [['transDate']]
        }),
        Dividend.findAll({
          where: {
            userId: req.user.id,
            stockId: stock.id
          },
          order: [['dividendDate']]
        })
      ])
      if (!transactions) throw new Error('尚未輸入此股票相關紀錄')
      transactions = transactions.map(item => item.toJSON())
      dividends = dividends.map(item => item.toJSON())
      // 整理abstract資料
      const sharesHold = await calcSharesHold(req.user.id, stock.id, new Date())
      const totalCost = transactions.reduce((acc, cur) => acc + (cur.isBuy ? 1 : -1) * Math.floor(cur.quantity * cur.pricePerUnit) + cur.fee, 0)
      const accIncome = dividends.reduce((acc, cur) => acc + Math.floor(cur.sharesHold * cur.amount), 0)
      const totalReturn = -1 * totalCost + accIncome

      const abstract = { sharesHold, totalCost, accIncome, totalReturn }
      cb(null, { abstract })
    } catch (err) {
      cb(err)
    }
  }
}

module.exports = stockServices
