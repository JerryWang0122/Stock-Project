const { Stock, User, Transaction } = require('../models')
const { isValidDateFormat } = require('../helpers/input-helper')
const { checkSharesHold } = require('../helpers/transaction-helper')

const transServices = {
  addTransaction: async (req, cb) => {
    const { transDate, isBuy, quantity, pricePerUnit, fee, note, stockId } = req.body
    const userId = req.user.id

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

      // 建立交易紀錄
      // 之後需要考慮股利
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
        cb(null, { transaction })
      })
      .catch(err => cb(err))
  },
  deleteTransaction: async (req, cb) => {
    try {
      const transId = req.params.tid
      const transaction = await Transaction.findByPk(transId)

      // check validity
      if (!transaction) throw new Error("Transaction doesn't exist !")
      if (transaction.userId !== req.user.id) throw new Error('Unauthorized User!')
      // 如果要刪掉的是買的，要檢查庫存
      if (transaction.isBuy && await checkSharesHold(req.user.id, transaction.stockId, transaction.transDate, transaction.quantity)) throw new Error('該操作將導致股票庫存不足，請確認交易紀錄正確性！')

      const deletedTransaction = await transaction.destroy()
      cb(null, { deletedTransaction })
    } catch (err) {
      cb(err)
    }
  }
}

module.exports = transServices
