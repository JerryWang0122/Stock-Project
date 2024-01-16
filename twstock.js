const { TwStock } = require('node-twstock')
const twstock = new TwStock()
const stocks = twstock.stocks

stocks.quote({ symbol: '00878'})
  .then(data => console.log(data))