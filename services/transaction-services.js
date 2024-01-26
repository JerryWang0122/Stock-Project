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
      // check Date Format
      if (!isValidDateFormat(transDate)) throw new Error('Invalid Date Format! Should be YYYY-MM-DD')

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
  }
}

module.exports = transServices
