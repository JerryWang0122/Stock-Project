'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Stocks', [{
      symbol: '00878',
      name: '國泰永續高股息',
      created_at: new Date(),
      updated_at: new Date()
    }, {
      symbol: '0056',
      name: '元大高股息',
      created_at: new Date(),
      updated_at: new Date()
    }, {
      symbol: '0050',
      name: '元大台灣50',
      created_at: new Date(),
      updated_at: new Date()
    }, {
      symbol: '00929',
      name: '復華台灣科技優息',
      created_at: new Date(),
      updated_at: new Date()
    }, {
      symbol: '2330',
      name: '台積電',
      created_at: new Date(),
      updated_at: new Date()
    }])
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Stocks', {})
  }
}
