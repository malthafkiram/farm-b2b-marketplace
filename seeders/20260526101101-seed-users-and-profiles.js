"use strict";

const bcrypt = require("bcryptjs");
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const insertedUsers = await queryInterface.bulkInsert(
      "Users",
      [
        {
          email: "lala@cantik.com",
          password: await bcrypt.hash("password123", 10),
          role: "Seller",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          email: "elshad@ganteng.com",
          password: await bcrypt.hash("password123", 10),
          role: "Buyer",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      { returning: true },
    );

    const lalaUser = insertedUsers.find(
      (u) => u.email === "lala@cantik.com",
    );
    const elshadUser = insertedUsers.find(
      (u) => u.email === "elshad@ganteng.com",
    );

    await queryInterface.bulkInsert(
      "UserProfiles",
      [
        {
          fullName: "Lala Seller",
          phoneNumber: "081234567890",
          address: "Makassar",
          UserId: lalaUser.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          fullName: "Elshad Buyer",
          phoneNumber: "089876543210",
          address: "Jakarta Barat",
          UserId: elshadUser.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {},
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("UserProfiles", null, {});
    await queryInterface.bulkDelete("Users", null, {});
  },
};
