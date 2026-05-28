"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Transaction extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Menghubungkan Junction Table ke User
      Transaction.belongsTo(models.User, {
        foreignKey: "UserId",
      });

      // Menghubungkan Junction Table ke Livestock
      Transaction.belongsTo(models.Livestock, {
        foreignKey: "LivestockId",
      });
    }
  }
  Transaction.init(
    {
      UserId: DataTypes.INTEGER,
      LivestockId: DataTypes.INTEGER,
      totalPaid: DataTypes.INTEGER,
      receiptNumber: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Transaction",
    },
  );
  return Transaction;
};
