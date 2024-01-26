'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class Dividend extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate (models) {
      Dividend.belongsTo(models.User, { foreignKey: 'userId' })
      Dividend.belongsTo(models.Stock, { foreignKey: 'stockId' })
    }
  }
  Dividend.init({
    dividendDate: DataTypes.DATEONLY,
    amount: DataTypes.FLOAT,
    sharesHold: DataTypes.INTEGER,
    userId: DataTypes.INTEGER,
    stockId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Dividend',
    tableName: 'Dividends',
    underscored: true
  })
  return Dividend
}
