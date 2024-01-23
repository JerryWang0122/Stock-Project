const { Transaction } = require('../models')
const { Op } = require('sequelize')

/**
 * @param {Number} userId user's id
 * @param {Number} stockId stock's id
 * @param {Date} transDate 交易發生日
 * @param {Number} changeQuantity 此次新增或刪除會影響的股數
 * @returns {Boolean} 庫存是否充足，不足返回true
 * @description 檢查使用者在特定股票的庫存，是否能接受此次改動。如"新增賣出操作"或"刪除買入操作"時，股票庫存是否充足？若無法接受此次改動，返回True
 */
const checkSharesHold = async (userId, stockId, transDate, changeQuantity) => {
  const [buy, sell] = await Promise.all([
    Transaction.sum('quantity', { where: { userId, stockId, isBuy: true, transDate: { [Op.lte]: transDate } } }),
    Transaction.sum('quantity', { where: { userId, stockId, isBuy: false, transDate: { [Op.lte]: transDate } } })
  ])
  return (buy - sell) < changeQuantity
}

module.exports = {
  checkSharesHold
}
