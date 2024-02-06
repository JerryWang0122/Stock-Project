const { calcSharesHold } = require('../helpers/dividend-helper')
const { generateMonthArray } = require('../helpers/input-helper')
const { Stock, Transaction, Dividend, sequelize } = require('../models')
const { TwStock } = require('node-twstock')
const { Op } = require('sequelize')
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
  },
  getRecapDiagram: async (req, cb) => {
    try {
      const period = parseInt(req.body.period)
      const monthArr = await generateMonthArray(period, req.user.id)
      const accIncomeArr = []
      let accIncome = 0
      const transMap = new Map()
      const investmentCostArr = []

      const [dividends, transactions] = await Promise.all([
        Promise.all(monthArr.map((month, idx, arr) => {
          if (idx !== 0) {
            return Dividend.findAll({
              where: {
                [Op.and]: [
                  { userId: req.user.id },
                  sequelize.where(sequelize.fn('DATE_FORMAT', sequelize.col('dividend_date'), '%Y-%m'), {
                    [Op.lte]: month
                  }),
                  sequelize.where(sequelize.fn('DATE_FORMAT', sequelize.col('dividend_date'), '%Y-%m'), {
                    [Op.gt]: arr[idx - 1]
                  })
                ]
              }
            })
          } else {
            return Dividend.findAll({
              where: {
                [Op.and]: [
                  { userId: req.user.id },
                  sequelize.where(sequelize.fn('DATE_FORMAT', sequelize.col('dividend_date'), '%Y-%m'), {
                    [Op.lte]: month
                  })
                ]
              }
            })
          }
        })),
        Promise.all(monthArr.map((month, idx, arr) => {
          if (idx !== 0) {
            return Transaction.findAll({
              where: {
                [Op.and]: [
                  { userId: req.user.id },
                  sequelize.where(sequelize.fn('DATE_FORMAT', sequelize.col('trans_date'), '%Y-%m'), {
                    [Op.lte]: month
                  }),
                  sequelize.where(sequelize.fn('DATE_FORMAT', sequelize.col('trans_date'), '%Y-%m'), {
                    [Op.gt]: arr[idx - 1]
                  })
                ]
              },
              order: [['stockId'], ['isBuy', 'DESC'], ['transDate']]
            })
          } else {
            return Transaction.findAll({
              where: {
                [Op.and]: [
                  { userId: req.user.id },
                  sequelize.where(sequelize.fn('DATE_FORMAT', sequelize.col('trans_date'), '%Y-%m'), {
                    [Op.lte]: month
                  })
                ]
              },
              order: [['stockId'], ['isBuy', 'DESC'], ['transDate']]
            })
          }
        }))
      ])

      // Dividend data
      for (const sectionDividend of dividends) {
        for (const item of sectionDividend) {
          accIncome += Math.floor(item.sharesHold * item.amount)
        }
        accIncomeArr.push(accIncome)
      }

      // Transaction data
      for (const sectionTransaction of transactions) {
        for (const item of sectionTransaction) {
          if (!transMap.has(item.stockId)) {
            transMap.set(item.stockId, {
              buyCost: [{ quantity: item.quantity, pricePerUnit: item.pricePerUnit }]
            })
          } else {
            const temp = transMap.get(item.stockId)
            if (item.isBuy) {
              temp.buyCost.push({ quantity: item.quantity, pricePerUnit: item.pricePerUnit })
            } else {
            // 賣出股票的資料
              let sellShares = item.quantity
              while (sellShares > 0 && temp.buyCost.length > 0) {
                // 已買入的股票夠不夠賣，負值代表不夠
                const remains = temp.buyCost[0].quantity - sellShares
                sellShares = Math.max(-remains, 0)
                remains <= 0 ? temp.buyCost.shift() : temp.buyCost[0].quantity = remains
              }
            }
          }
        }
        // 該期資料計算結束，登記投資成本
        investmentCostArr.push(
          Array.from(transMap.values())
            .map(i => i.buyCost.reduce((acc, cur) => acc + Math.floor(cur.quantity * cur.pricePerUnit), 0))
            .reduce((acc, cur) => acc + cur, 0)
        )
      }

      cb(null, { monthArr, accIncomeArr, investmentCostArr })
    } catch (err) {
      cb(err)
    }
  }
}

module.exports = stockServices
