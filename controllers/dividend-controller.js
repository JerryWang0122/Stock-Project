const dividendServices = require('../services/dividend-services')

const dividendController = {
  addDividend: (req, res, next) => {
    dividendServices.addDividend(req, (err, data) => err ? next(err) : res.json({ success: true, data }))
  },
  getDividend: (req, res, next) => {
    dividendServices.getDividend(req, (err, data) => err ? next(err) : res.json({ success: true, data }))
  },
  deleteDividend: (req, res, next) => {
    dividendServices.deleteDividend(req, (err, data) => err ? next(err) : res.json({ success: true, data }))
  },
  putDividend: (req, res, next) => {
    dividendServices.putDividend(req, (err, data) => err ? next(err) : res.json({ success: true, data }))
  },
  getDividendsByPage: (req, res, next) => {
    dividendServices.getDividendsByPage(req, (err, data) => err ? next(err) : res.json({ success: true, data }))
  },
  getDividendsRecap: (req, res, next) => {
    dividendServices.getDividendsRecap(req, (err, data) => err ? next(err) : res.json({ success: true, data }))
  }
}

module.exports = dividendController
