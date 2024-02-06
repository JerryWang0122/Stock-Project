const { Stock, User, Transaction, Dividend } = require('../models')
const { isValidDateFormat } = require('../helpers/input-helper')
const { checkSharesHold } = require('../helpers/transaction-helper')
const { Op } = require('sequelize')

const path = require('path')
const env = process.env.NODE_ENV || 'development'
const config = require(path.resolve(__dirname, '../config/config.json'))[env]
const Sequelize = require('sequelize')
let sequelize
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config)
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config)
}

const transServices = {
  addTransaction: async (req, cb) => {
    const { transDate, isBuy, quantity, pricePerUnit, fee, note, stockId } = req.body
    const userId = req.user.id

    const t = await sequelize.transaction()
    try {
      // 購入或賣出的股數不該為零
      if (quantity <= 0) throw new Error('Invalid quantity!')
      // check Date Format
      if (!isValidDateFormat(transDate, true)) throw new Error('Invalid Date Format! Should be YYYY-MM-DD')

      // 先檢查股票存不存在、User合不合法
      const [stock, user] = await Promise.all([
        Stock.findByPk(stockId),
        User.findByPk(userId)
      ])

      if (!stock) throw new Error("Stock doesn't exist in database! Please register first!")
      if (!user) throw new Error("User doesn't exist!")

      // 如果要賣，先檢查庫存
      if (!isBuy && await checkSharesHold(userId, stockId, transDate, quantity)) throw new Error('該操作將導致股票庫存不足，請確認交易紀錄正確性！')

      // 建立交易紀錄，同時更新影響到的股利sharesHold
      const [transaction, _] = await Promise.all([
        Transaction.create(
          { transDate, isBuy, quantity, pricePerUnit, fee, note, userId, stockId },
          { transaction: t }
        ),
        Dividend.increment(
          { sharesHold: isBuy ? quantity : -quantity },
          {
            where: {
              userId,
              stockId,
              dividendDate: {
                [Op.gt]: transDate
              }
            }
          },
          { transaction: t }
        )
      ])
      await t.commit()

      return cb(null, { transaction })
    } catch (err) {
      await t.rollback()
      return cb(err)
    }
  },
  getTransaction: (req, cb) => {
    const transId = req.params.tid

    Transaction.findByPk(transId)
      .then(transaction => {
        if (!transaction) throw new Error("Transaction doesn't exist !")
        if (transaction.userId !== req.user.id) throw new Error('Unauthorized User!')
        cb(null, { transaction })
      })
      .catch(err => cb(err))
  },
  deleteTransaction: async (req, cb) => {
    const t = await sequelize.transaction()
    try {
      const transId = req.params.tid
      const transaction = await Transaction.findByPk(transId)

      // check validity
      if (!transaction) throw new Error("Transaction doesn't exist !")
      if (transaction.userId !== req.user.id) throw new Error('Unauthorized User!')
      // 如果要刪掉的是買的，要檢查庫存
      if (transaction.isBuy && await checkSharesHold(req.user.id, transaction.stockId, transaction.transDate, transaction.quantity)) throw new Error('該操作將導致股票庫存不足，請確認交易紀錄正確性！')

      // 刪掉交易紀錄，同時更新股利的sharesHold
      const [deletedTransaction, _] = await Promise.all([
        transaction.destroy({ transaction: t }),
        Dividend.increment(
          { sharesHold: !transaction.isBuy ? transaction.quantity : -transaction.quantity },
          {
            where: {
              userId: req.user.id,
              stockId: transaction.stockId,
              dividendDate: {
                [Op.gt]: transaction.transDate
              }
            }
          },
          { transaction: t }
        )
      ])
      await t.commit()

      cb(null, { deletedTransaction })
    } catch (err) {
      await t.rollback()
      cb(err)
    }
  },
  getTransactionsByPage: async (req, cb) => {
    const stockId = req.params.stockId
    const page = parseInt(req.query.page) || 1
    const limit = 6

    try {
      if (page < 1) throw new Error('Invalid page query')
      const transactions = await Transaction.findAll({
        where: {
          stockId,
          userId: req.user.id
        },
        offset: (page - 1) * limit,
        limit,
        order: [['transDate', 'DESC']]
      })
      cb(null, { transactions })
    } catch (err) {
      cb(err)
    }
  },
  getCostRecap: async (req, cb) => {
    try {
      const user = await User.findByPk(req.user.id)
      if (!user) throw new Error("User didn't exist!")
      // 取得交易資訊
      const rawTransactions = await Transaction.findAll({
        where: { userId: req.user.id },
        include: Stock,
        order: [['stockId'], ['isBuy'], ['transDate']]
      })
      // 統計交易資料
      const recap = new Map()
      rawTransactions.forEach(trans => {
        const item = trans.toJSON()
        if (!recap.has(item.stockId)) {
          recap.set(item.stockId, {
            abstract: {
              id: item.stockId,
              symbol: item.Stock.symbol,
              name: item.Stock.name,
              sharesHold: item.isBuy ? item.quantity : 0,
              stockCost: item.isBuy ? Math.floor(item.quantity * item.pricePerUnit) : 0
            },
            ...item.isBuy ? { sell: 0 } : { sell: item.quantity }
          })
        } else {
          const temp = recap.get(item.stockId)
          if (item.isBuy) {
            // 買入股票的資料
            if (temp.sell) {
              // 賣出的股票還有剩餘時
              const remains = temp.sell - item.quantity
              temp.sell = Math.max(remains, 0)
              const sharesToAdd = Math.max(-remains, 0)
              temp.abstract.sharesHold += sharesToAdd
              temp.abstract.stockCost += Math.floor(sharesToAdd * item.pricePerUnit)
            } else {
              // 只剩買的
              temp.abstract.sharesHold += item.quantity
              temp.abstract.stockCost += Math.floor(item.quantity * item.pricePerUnit)
            }
          } else {
            // 賣出股票的資料
            temp.sell += item.quantity
          }
        }
      })
      const costRecap = Array.from(recap.values())
        .map(elm => elm.abstract)
        .filter(elm => elm.sharesHold !== 0)
        .sort((a, b) => b.stockCost - a.stockCost)

      const totalCost = costRecap.reduce((acc, cur) => acc + cur.stockCost, 0)

      cb(null, { totalCost, costRecap })
    } catch (err) {
      cb(err)
    }
  },
  // 已實現損益
  // 手續費算已實現損益
  getMarginRecap: async (req, cb) => {
    try {
      const user = await User.findByPk(req.user.id)
      if (!user) throw new Error("User didn't exist!")
      // 取得交易資訊
      const rawTransactions = await Transaction.findAll({
        where: { userId: req.user.id },
        include: Stock,
        order: [['stockId'], ['isBuy'], ['transDate']]
      })
      // 統計交易資料
      const recap = new Map()
      rawTransactions.forEach(trans => {
        const item = trans.toJSON()
        if (!recap.has(item.stockId)) {
          recap.set(item.stockId, {
            abstract: {
              id: item.stockId,
              symbol: item.Stock.symbol,
              name: item.Stock.name,
              // 買的部分，手續費屬於已實現損益；賣的部分是賺錢，但手續費要扣除
              stockMargin: item.isBuy ? -item.fee : Math.floor(item.quantity * item.pricePerUnit) - item.fee
            },
            sharesSell: item.isBuy ? 0 : item.quantity
          })
        } else {
          const temp = recap.get(item.stockId)
          if (item.isBuy) { // 買入股票的資料
            if (temp.sharesSell) { // 賣出的股票還有剩餘時
              // margin 扣除買入成本
              temp.abstract.stockMargin -= (Math.floor(Math.min(temp.sharesSell, item.quantity) * item.pricePerUnit) + item.fee)
              temp.sharesSell = Math.max(temp.sharesSell - item.quantity, 0)
            } else {
              temp.abstract.stockMargin -= item.fee
            }
          } else {
            // 賣出股票的資料
            temp.sharesSell += item.quantity
            temp.abstract.stockMargin += Math.floor(item.quantity * item.pricePerUnit) - item.fee
          }
        }
      })
      const marginRecap = Array.from(recap.values())
        .map(elm => elm.abstract)
        .sort((a, b) => b.stockMargin - a.stockMargin)

      const totalMargin = marginRecap.reduce((acc, cur) => acc + cur.stockMargin, 0)

      cb(null, { totalMargin, marginRecap })
    } catch (err) {
      cb(err)
    }
  }
}

module.exports = transServices
