'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class Stock extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate (models) {
      Stock.hasMany(models.Transaction, { foreignKey: 'stockId' })
      Stock.hasMany(models.Dividend, { foreignKey: 'stockId' })
    }
  }
  Stock.init({
    symbol: DataTypes.STRING,
    name: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Stock',
    tableName: 'Stocks',
    underscored: true
  })
  return Stock
}
