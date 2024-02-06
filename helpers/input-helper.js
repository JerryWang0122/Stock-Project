const { Transaction } = require('../models')
const sequelize = require('sequelize')

const isValidDateFormat = (inputDate, isTransaction = false) => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/

  if (!dateRegex.test(inputDate)) {
    return false // 不符合 YYYY-MM-DD 格式
  }

  const [year, month, day] = inputDate.split('-')
  const parsedDate = new Date(year, month - 1, day)
  if (isTransaction && (new Date() < parsedDate)) throw new Error('Future transaction cannot be accepted!')

  // 检查日期对象是否有效，并且年月日与输入一致
  return (
    parsedDate.getFullYear() === Number(year) &&
    parsedDate.getMonth() === Number(month) - 1 &&
    parsedDate.getDate() === Number(day)
  )
}

const generateMonthArray = async (period, userId) => {
  if (![1, 3, 6, 12].some(e => e === period)) throw new Error('Invalid period')

  const result = []
  const currentDateObj = new Date()

  if (period !== 12) {
    for (let i = 0; i < 12; i++) {
      const year = currentDateObj.getFullYear()
      const month = currentDateObj.getMonth() + 1 // 月份是從 0 開始的，所以需要加 1

      // 將年月格式化為 'YYYY-MM'
      const formattedMonth = `${year}-${month.toString().padStart(2, '0')}`

      result.push(formattedMonth)

      // 依照週期調整日期
      currentDateObj.setMonth(currentDateObj.getMonth() - period)
    }
  } else {
    const { minYear } = await Transaction.findOne({
      where: { userId },
      attributes: [
        [sequelize.fn('MIN', sequelize.fn('YEAR', sequelize.col('trans_date'))), 'minYear']
      ],
      raw: true
    })
    if (!minYear) throw new Error('Please key in at least ONE transaction!')
    for (let year = currentDateObj.getFullYear(); year >= minYear; year--) {
      result.push(`${year}-12`)
    }
  }
  return result.reverse() // 反轉陣列，使得結果按照遞增的順序
}

module.exports = {
  isValidDateFormat,
  generateMonthArray
}
