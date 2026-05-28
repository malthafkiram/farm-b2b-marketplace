"use strict";
const { Model } = require("sequelize");
const bcrypt = require("bcryptjs");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // One-to-One: User memiliki satu UserProfile
      User.hasOne(models.UserProfile, {
        foreignKey: "UserId",
      });

      // One-to-Many: User (Peternak) bisa memiliki banyak Livestock
      User.hasMany(models.Livestock, {
        foreignKey: "UserId",
      });

      // Many-to-Many: User (Pembeli) bisa membeli banyak Livestock lewat tabel Transaction
      User.belongsToMany(models.Livestock, {
        through: models.Transaction,
        foreignKey: "UserId",
      });
    }
  }
  User.init(
    {
      email: DataTypes.STRING,
      password: DataTypes.STRING,
      role: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "User",
      hooks: {
        beforeCreate(user, options) {
          const salt = bcrypt.genSaltSync(10);
          const hash = bcrypt.hashSync(user.password, salt);
          user.password = hash;
        },
      },
    },
  );
  return User;
};
