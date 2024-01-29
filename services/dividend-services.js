const { Stock, User, Dividend } = require('../models')
const { isValidDateFormat } = require('../helpers/input-helper')
const { calcSharesHold } = require('../helpers/dividend-helper')

const dividendServices = {
  addDividend: async (req, cb) => {
    const { dividendDate, amount, stockId } = req.body
    const userId = req.user.id

    try {
      if (amount < 0) throw new Error('Invalid amount!')
      // check Date Format
      if (!isValidDateFormat(dividendDate)) throw new Error('Invalid Date Format! Should be YYYY-MM-DD')

      // 先檢查股票存不存在、User合不合法
      const [stock, user] = await Promise.all([
        Stock.findByPk(stockId),
        User.findByPk(userId)
      ])

      if (!stock) throw new Error("Stock doesn't exist in database! Please register first!")
      if (!user) throw new Error("User doesn't exist!")

      // 計算配息日前庫存量
      const sharesHold = await calcSharesHold(userId, stockId, dividendDate)
      if (sharesHold < 0) throw new Error('Something wrong with your shares hold! Please check your transaction records.')
      const dividend = await Dividend.create({ dividendDate, amount, sharesHold, userId, stockId })

      return cb(null, { dividend })
    } catch (err) {
      return cb(err)
    }
  },
  deleteDividend: async (req, cb) => {
    try {
      const dividendId = req.params.did
      const dividend = await Dividend.findByPk(dividendId)

      // check validity
      if (!dividend) throw new Error("Dividend doesn't exist !")
      if (dividend.userId !== req.user.id) throw new Error('Unauthorized User!')

      const deletedDividend = await dividend.destroy()
      cb(null, { deletedDividend })
    } catch (err) {
      cb(err)
    }
  },
  getDividend: async (req, cb) => {
    try {
      const dividendId = req.params.did
      const dividend = await Dividend.findByPk(dividendId, { include: Stock })

      // check validity
      if (!dividend) throw new Error("Dividend doesn't exist !")
      if (dividend.userId !== req.user.id) throw new Error('Unauthorized User!')

      cb(null, { dividend })
    } catch (err) {
      cb(err)
    }
  },
  putDividend: async (req, cb) => {
    const { dividendDate, amount, stockId } = req.body
    try {
      if (amount < 0) throw new Error('Invalid amount!')
      // check Date Format
      if (!isValidDateFormat(dividendDate)) throw new Error('Invalid Date Format! Should be YYYY-MM-DD')

      const dividendId = req.params.did
      const [dividend, stock] = await Promise.all([
        Dividend.findByPk(dividendId),
        Stock.findByPk(stockId)
      ])

      // check validity
      if (!dividend) throw new Error("Dividend doesn't exist !")
      if (!stock) throw new Error("Stock doesn't exist in database! Please register first!")
      if (dividend.userId !== req.user.id) throw new Error('Unauthorized User!')

      // 配息日若更換，持股需重新計算
      const sharesHold = dividend.dividendDate === dividendDate ? dividend.sharesHold : await calcSharesHold(req.user.id, stockId, dividendDate)
      if (sharesHold < 0) throw new Error('Something wrong with your shares hold! Please check your transaction records.')

      dividend.set({ dividendDate, amount, sharesHold, stockId })
      const updatedDividend = await dividend.save()
      cb(null, { updatedDividend })
    } catch (err) {
      cb(err)
    }
  },
  getDividendsByPage: async (req, cb) => {
    const stockId = req.params.stockId
    const page = parseInt(req.query.page) || 1
    const limit = 6

    try {
      if (page < 1) throw new Error('Invalid page query')
      const dividends = await Dividend.findAll({
        where: {
          stockId,
          userId: req.user.id
        },
        offset: (page - 1) * limit,
        limit,
        order: [['dividendDate', 'DESC']]
      })
      cb(null, { dividends })
    } catch (err) {
      cb(err)
    }
  }
}

module.exports = dividendServices
