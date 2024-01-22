'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class Transaction extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate (models) {
      Transaction.belongsTo(models.User, { foreignKey: 'userId' })
      Transaction.belongsTo(models.Stock, { foreignKey: 'stockId' })
    }
  }
  Transaction.init({
    transDate: DataTypes.DATEONLY,
    isBuy: DataTypes.BOOLEAN,
    quantity: DataTypes.INTEGER,
    pricePerUnit: DataTypes.FLOAT,
    fee: DataTypes.INTEGER,
    note: DataTypes.STRING,
    userId: DataTypes.INTEGER,
    stockId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Transaction',
    tableName: 'Transactions',
    underscored: true
  })
  return Transaction
}
