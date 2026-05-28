"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Livestock extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // One-to-Many inverse: Livestock ini dimiliki oleh seorang User (Peternak)
      Livestock.belongsTo(models.User, {
        foreignKey: "UserId",
      });

      // Many-to-Many: Livestock bisa dibeli oleh banyak User lewat tabel Transaction
      Livestock.belongsToMany(models.User, {
        through: models.Transaction,
        foreignKey: "LivestockId",
      });

      Livestock.hasMany(models.Transaction, {
        foreignKey: "LivestockId",
      });
    }

    static getAvailableLivestocks(options = {}) {
      // Kita pastikan method ini selalu menyaring livestock yang berstatus 'Tersedia'
      options.where = {
        ...options.where,
        status: "Tersedia",
      };

      // Mengembalikan promise findAll dengan opsi yang dikirim dari controller
      return this.findAll(options);
    }

    // Membuat label kode kustom (misalnya itu = "SAPI-1")
    get animalCode() {
      return `${this.type.toUpperCase()}-${this.id}`;
    }
  }
  Livestock.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: "Nama hewan ternak tidak boleh kosong!" },
          notEmpty: { msg: "Nama hewan ternak tidak boleh kosong!" },
        },
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: "Jenis hewan harus dipilih!" },
          notEmpty: { msg: "Jenis hewan harus dipilih!" },
        },
      },
      price: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: { msg: "Harga tidak boleh kosong!" },
          isInt: { msg: "Harga harus berupa angka nominal!" },
          min: {
            args: [500000],
            msg: "Harga ternak minimal adalah Rp 500.000!",
          },
        },
      },
      status: DataTypes.STRING,
      UserId: DataTypes.INTEGER,
      gender: DataTypes.STRING,
      imageUrl: DataTypes.STRING,
      description: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Livestock",
      // 2. HOOKS: beforeCreate untuk memformat input sebelum masuk ke database
      hooks: {
        beforeCreate: (livestock, options) => {
          // Set status default menjadi 'Tersedia' sebelum data disimpan
          if (!livestock.status) {
            livestock.status = "Tersedia";
          }
          // Format nama ternak otomatis menjadi Uppercase
          if (livestock.name) {
            livestock.name = livestock.name.toUpperCase();
          }

          livestock.imageUrl = `http://localhost:3000/${livestock.imageUrl}`;
        },
      },
    },
  );
  return Livestock;
};
