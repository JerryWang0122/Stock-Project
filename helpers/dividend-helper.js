const { Transaction } = require('../models')
const { Op } = require('sequelize')

/**
 * @param {Number} userId user's id
 * @param {Number} stockId stock's id
 * @param {Date} dividendDate 交易發生日
 * @returns {Number} sharesHold 此次配息股票庫存量
 * @description 檢查使用者在配息日前(不包含配息當日)，特定股票的庫存量
 */
const calcSharesHold = async (userId, stockId, dividendDate) => {
  const [buy, sell] = await Promise.all([
    Transaction.sum('quantity', { where: { userId, stockId, isBuy: true, transDate: { [Op.lt]: dividendDate } } }),
    Transaction.sum('quantity', { where: { userId, stockId, isBuy: false, transDate: { [Op.lt]: dividendDate } } })
  ])
  return (buy - sell)
}

module.exports = {
  calcSharesHold
}
