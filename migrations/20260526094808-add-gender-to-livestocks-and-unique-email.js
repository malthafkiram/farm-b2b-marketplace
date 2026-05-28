"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Tambah kolom gender ke tabel Livestocks
    await queryInterface.addColumn("Livestock", "gender", {
      type: Sequelize.STRING,
      allowNull: true, // buat true dulu agar data lama tidak error jika ada, nanti divalidasi di model
    });

    // 2. Tambah constraint UNIQUE pada kolom email di tabel Users
    await queryInterface.addConstraint("Users", {
      fields: ["email"],
      type: "unique",
      name: "custom_unique_email_constraint", // nama constraint bebas
    });
  },

  async down(queryInterface, Sequelize) {
    // Untuk undo (db:migrate:undo), kita hapus kembali apa yang kita buat di atas dengan urutan terbalik

    // 1. Hapus constraint unique dari tabel Users
    await queryInterface.removeConstraint(
      "Users",
      "custom_unique_email_constraint",
    );

    // 2. Hapus kolom gender dari tabel Livestocks
    await queryInterface.removeColumn("Livestocks", "gender");
  },
};
