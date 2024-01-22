const { Stock, User, Transaction } = require('../models')
const { isValidDateFormat } = require('../helpers/input-helper')
const { Op } = require('sequelize')

const transServices = {
  addTransaction: async (req, cb) => {
    const { transDate, isBuy, quantity, pricePerUnit, fee, note, stockId } = req.body
    const userId = req.user.id

    try {
      // check Date Format
      if (!isValidDateFormat(transDate)) throw new Error('Invalid Date Format! Should be YYYY-MM-DD')

      const [stock, user] = await Promise.all([
        Stock.findByPk(stockId),
        User.findByPk(userId)
      ])

      if (!stock) throw new Error("Stock doesn't exist in database! Please register first!")
      if (!user) throw new Error("User doesn't exist!")

      if (!isBuy) { // 如果要賣，先檢查庫存
        const [buy, sell] = await Promise.all([
          Transaction.sum('quantity', { where: { userId, stockId, isBuy: true, transDate: { [Op.lte]: transDate } } }),
          Transaction.sum('quantity', { where: { userId, stockId, isBuy: false, transDate: { [Op.lte]: transDate } } })
        ])
        if ((buy - sell) < quantity) throw new Error('庫存不足')
      }

      const transaction = await Transaction.create({ transDate, isBuy, quantity, pricePerUnit, fee, note, userId, stockId })

      return cb(null, { transaction })
    } catch (err) {
      return cb(err)
    }
  },
  getTransaction: (req, cb) => {
    const transId = req.params.tid

    Transaction.findByPk(transId)
      .then(transaction => {
        if (!transaction) throw new Error("Transaction doesn't exist !")
        if (transaction.userId !== req.user.id) throw new Error('Unauthorized User!')
        cb(null, transaction)
      })
      .catch(err => cb(err))
  }
}

module.exports = transServices
