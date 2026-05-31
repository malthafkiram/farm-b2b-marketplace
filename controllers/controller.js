const { where, Op } = require("sequelize");
// const Op = Sequelize.Op;
const {
  Livestock,
  UserProfile,
  User,
  Transaction,
} = require("../models/index");

const bcrypt = require("bcryptjs");
class Controller {
  // Home => tampilan utama
  // Home => tampilan utama (Katalog Pasar Global)
  static async home(req, res) {
    try {
      const { search } = req.query;

      let user = null;
      if (req.session.userId) {
        user = await User.findOne({
          where: { id: req.session.userId },
          include: UserProfile,
        });
      }

      if (req.session.userRole === "Seller") {
        let sellerProductOptions = {
          include: User,
          where: { UserId: req.session.userId },
          order: [["id", "ASC"]],
        };

        if (search) {
          sellerProductOptions.where = {
            ...sellerProductOptions.where,
            [Op.or]: [
              { name: { [Op.iLike]: `%${search}%` } },
              { type: { [Op.iLike]: `%${search}%` } },
            ],
          };
        }

        let products = await Livestock.findAll(sellerProductOptions);

        return res.render("home", {
          userRole: req.session.userRole,
          isLogin: req.session.userId,
          user,
          products,
        });
      }

      let buyerProductOptions = {
        where: {},
        order: [["id", "ASC"]],
      };

      if (search) {
        buyerProductOptions.where = {
          [Op.or]: [
            { name: { [Op.iLike]: `%${search}%` } },
            { type: { [Op.iLike]: `%${search}%` } },
          ],
        };
      }

      let products = await Livestock.findAll(buyerProductOptions);

      res.render("home", {
        userRole: req.session.userRole,
        isLogin: req.session.userId,
        user,
        products,
      });
    } catch (error) {
      console.log(error);
      res.send(error);
    }
  }

  // Registernya get dan post
  static async formRegister(req, res) {
    try {
      res.render("register", {
        userRole: req.session.userRole,
        isLogin: req.session.userId,
      });
    } catch (error) {
      console.log(error);
      res.send(error);
    }
  }

  static async register(req, res) {
    try {
      const { email, password, role, fullName, phoneNumber } = req.body;

      // buat data user untuk dimasukkin ke tabel usernya
      const newUser = await User.create({ email, password, role });

      // pakek id user baru/new usernya untuk buat userProfilnya
      await UserProfile.create({
        fullName,
        phoneNumber,
        UserId: newUser.id, // Foreign Key nya ke user baru
      });

      res.redirect("/login");
    } catch (error) {
      console.log(error);
      res.send(error);
    }
  }

  // Login get dan postnya
  static async formLogin(req, res) {
    try {
      res.render("login", {
        userRole: req.session.userRole,
        isLogin: req.session.userId,
        notification: req.query.notification || null, // notif
      });
    } catch (error) {
      console.log(error);
      res.send(error);
    }
  }
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // cari usernya melalui email
      const user = await User.findOne({ where: { email } });

      // validasi kalau usernya gak ada atau passwordnya ga ada
      // if (!user) {
      //   return res.send("Email atau password salah!");
      // }

      // const isValidPassword = bcrypt.compareSync(password, user.password);
      const isValidPassword = user
        ? bcrypt.compareSync(password, user.password)
        : false;
      // if (!isValidPassword) {
      //   return res.send("Email atau password salah!");
      // }
      if (!user || !isValidPassword) {
        return res.redirect("/login?notification=Email atau password salah!");
      }

      req.session.userId = user.id;
      req.session.userRole = user.role;

      res.redirect("/");
    } catch (error) {
      console.log(error);
      res.send(error);
    }
  }

  // Logout
  static async logout(req, res) {
    try {
      req.session.destroy((err) => {
        if (err) return res.send(err.message);
        res.redirect("/");
      });
    } catch (error) {
      console.log(error);
      res.send(error);
    }
  }

  // stock
  static async getStock(req, res) {
    try {
      const { search, notification } = req.query;

      // 1. JALUR UNTUK SELLER (PETERNAK)
      if (req.session.userRole === "Seller") {
        let sellerOptions = {
          where: { UserId: req.session.userId }, // Murni hanya mengambil milik peternak yang login
          include: {
            model: User,
            include: { model: UserProfile },
          },
          order: [["id", "ASC"]],
        };

        // Jika Seller melakukan search jenis di halaman kandangnya
        if (search) {
          sellerOptions.where.type = { [Op.iLike]: `%${search}%` };
        }

        // Ambil SEMUA produk milik Seller ini (termasuk yang sudah Terjual agar bisa dipantau)
        const livestocks = await Livestock.findAll(sellerOptions);

        let user = await User.findOne({
          where: { id: req.session.userId },
          include: UserProfile,
        });

        return res.render("stock", {
          livestocks,
          notification,
          userRole: req.session.userRole,
          isLogin: req.session.userId,
          user,
        });
      }

      // 2. JALUR UNTUK BUYER (PEMBELI)
      // Buat objek opsi yang bersih dan terisolasi khusus untuk Buyer
      let buyerOptions = {
        where: {},
        include: {
          model: User,
          include: { model: UserProfile },
        },
        order: [["id", "ASC"]],
      };

      // Ambil array ID dari session keranjang belanja milik Buyer
      const userCart = req.session.cart || []; // Contoh isinya: [5]

      // Pasang filter agar HANYA mengambil ID hewan yang terdaftar di dalam keranjang belanja
      buyerOptions.where.id = {
        [Op.in]: userCart,
      };

      // Jika Buyer melakukan search di dalam halaman keranjangnya
      if (search) {
        buyerOptions.where.type = { [Op.iLike]: `%${search}%` };
      }

      const livestocks = await Livestock.findAll(buyerOptions);

      // Panggil Static Method bawaan modelmu untuk menyaring yang berstatus 'Tersedia' saja
      // const livestocks = await Livestock.getAvailableLivestocks(buyerOptions);

      let user = null;
      if (req.session.userId) {
        user = await User.findOne({
          where: { id: req.session.userId },
          include: UserProfile,
        });
      }

      // Render tampilan keranjang belanja khusus Buyer
      res.render("stock", {
        livestocks,
        notification,
        userRole: req.session.userRole,
        isLogin: req.session.userId,
        user,
      });
    } catch (error) {
      console.log(error);
      res.send(error.message);
    }
  }

  // add stock
  static async formAdd(req, res) {
    try {
      // PROTEKSI: Jika bukan Peternak, tendang balik ke /stock
      if (req.session.userRole !== "Seller") {
        return res.redirect(
          "/stock?notification=Akses ditolak! Hanya Peternak yang boleh menambah stok.",
        );
      }

      let user = null;
      if (req.session.userId) {
        user = await User.findOne({
          where: { id: req.session.userId },
          include: UserProfile,
        });
      }

      const { errors } = req.query;

      res.render("addStock", {
        errors,
        userRole: req.session.userRole,
        isLogin: req.session.userId ? true : false,
        user,
      });
    } catch (error) {
      console.log(error);
      res.send(error);
    }
  }
  static async addStock(req, res) {
    try {
      const { name, type, price, description, gender } = req.body;

      const UserId = req.session.userId;

      if (!UserId) {
        return res.send(
          "Anda harus login terlebih dahulu untuk menambah stok!",
        );
      }

      // ambil naam file dari multer jika ada file yang di unggah
      let imageUrl = null;
      if (req.file) {
        imageUrl = `/uploads/${req.file.filename}`;
      }
      console.log(req.file);
      console.log(imageUrl, "=========>");

      await Livestock.create({
        name,
        type,
        price,
        description,
        gender,
        UserId,
        imageUrl: imageUrl,
      });

      res.redirect("/stock");
    } catch (error) {
      if (error.name === "SequelizeValidationError") {
        const errMessages = error.errors.map((err) => err.message);
        return res.redirect(
          `/stock/add?errors=${encodeURIComponent(JSON.stringify(errMessages))}`,
        );
      }
      console.log(error);
      res.send(error.message);
    }
  }
  // buy
  static async buy(req, res) {
    try {
      if (req.session.userRole === "Seller") {
        return res.redirect(
          "/stock?notification=Akses ditolak! Hanya akun Pembeli yang dapat melakukan transaksi.",
        );
      }
      const { id } = req.params;

      const buyerId = req.session.userId;

      if (!buyerId) {
        return res.send(
          "Anda harus login terlebih dahulu untuk membeli ternak!",
        );
      }

      // Cari data ternaknya untuk mengambil data harga (price)
      const animal = await Livestock.findByPk(id);
      if (!animal) {
        return res.send("Data ternak tidak ditemukan!");
      }

      if (req.session.cart) {
        req.session.cart = req.session.cart.filter(
          (id) => id !== Number(animal.id),
        );
      }

      // Masukkan data ke tabel junction Transactions (Many-to-Many)
      await Transaction.create({
        UserId: buyerId, // ID Pembeli dinamis dari session
        LivestockId: animal.id, // ID Ternak yang dibeli
        totalPaid: animal.price, // Menyimpan nominal harga saat transaksi terjadi
        receiptNumber: `REC-${Date.now()}`, // Membuat nomor resi unik otomatis menggunakan timestamp
      });

      // Update status livestock menjadi 'Terjual' agar tidak muncul lagi di list stok tersedia
      await animal.update({ status: "Terjual" });

      // Setelah sukses transaksi, kembalikan user ke halaman utama stok
      res.redirect("/transactions/history");
    } catch (error) {
      console.log(error);
      res.send(error);
    }
  }

  // Product Detail
  static async productDetail(req, res) {
    try {
      const { id } = req.params;

      let user = null;

      if (req.session.userId) {
        user = await User.findOne({
          where: { id: req.session.userId },
          include: UserProfile,
        });
      }

      const product = await Livestock.findByPk(id, {
        include: {
          model: User,
          include: UserProfile,
        },
      });

      if (!product) {
        return res.send("Produk tidak ditemukan");
      }

      res.render("productDetail", {
        product,
        userRole: req.session.userRole,
        isLogin: req.session.userId,
        user,
      });
    } catch (error) {
      console.log(error);
      res.send(error);
    }
  }

  static async deleteStock(req, res) {
    try {
      const { id } = req.params;

      // Menggunakan PROMISE CHAINING
      Livestock.destroy({
        where: { id },
      }).then(() => {
        // Jika proses delete berhasil, oper pesan sukses lewat query string menuju halaman /stock
        res.redirect(
          "/stock?notification=Hewan ternak berhasil dihapus dari sistem!",
        );
      });
    } catch (error) {
      console.log(error);
      res.send(error);
    }
  }

  // history transaksi
  static async transactionHistory(req, res) {
    try {
      const buyerId = req.session.userId;
      const userRole = req.session.userRole;

      if (!buyerId) {
        return res.redirect("/login?error=Silakan login terlebih dahulu!");
      }

      if (userRole === "Seller") {
        return res.redirect(
          "/stock?notification=Akses ditolak! Halaman riwayat pembelian hanya untuk akun Pembeli.",
        );
      }

      // Query ke tabel Transaction dengan Eager Loading ke model Livestock
      const transactions = await Transaction.findAll({
        where: { UserId: buyerId },
        include: {
          model: Livestock, // Mengambil data detail ternak yang dibeli
        },
        order: [["createdAt", "DESC"]],
      });

      // navbar
      let user = null;

      if (req.session.userId) {
        user = await User.findOne({
          where: { id: req.session.userId },
          include: UserProfile,
        });
      }
      // Render ke halaman view baru
      res.render("transactionHistory", {
        transactions,
        userRole: req.session.userRole,
        isLogin: req.session.userId,
        user,
      });
    } catch (error) {
      res.send(error);
    }
  }

  // dasbord si saller nya
  static async sellerDashboard(req, res) {
    try {
      const sellerId = req.session.userId;
      const userRole = req.session.userRole;

      // Proteksi: Pastikan user sudah login
      if (!sellerId) {
        return res.redirect("/login?error=Silakan login terlebih dahulu!");
      }

      // Proteksi: Hanya Peternak yang boleh mengakses halaman ini
      if (userRole === "Buyer") {
        return res.redirect(
          "/stock?notification=Akses ditolak! Halaman Dashboard Penjual hanya untuk akun Peternak.",
        );
      }

      // Query Menggunakan Nested Eager Loading untuk melacak pembeli ternak
      const myStocks = await Livestock.findAll({
        where: { UserId: sellerId },
        include: {
          model: Transaction,
          include: {
            model: User,
            include: {
              model: UserProfile,
            },
          },
        },
        order: [["id", "ASC"]],
      });

      // navbar
      let user = null;

      if (req.session.userId) {
        user = await User.findOne({
          where: { id: req.session.userId },
          include: UserProfile,
        });
      }

      res.render("sellerDashboard", {
        myStocks,
        userRole: req.session.userRole,
        isLogin: req.session.userId,
        user,
      });
    } catch (error) {
      console.log(error);
      res.send(error.message);
    }
  }

  // Edit
  static async formEdit(req, res) {
    try {
      const { id } = req.params;

      if (req.session.userRole === "Buyer") {
        return res.redirect(
          "/stock?notification=Akses ditolak! Hanya Peternak yang boleh mengedit stok.",
        );
      }

      const animal = await Livestock.findByPk(id);

      let user = null;
      if (req.session.userId) {
        user = await User.findOne({
          where: { id: req.session.userId },
          include: UserProfile,
        });
      }
      const { errors } = req.query;

      res.render("editStockForm", {
        animal,
        errors,
        userRole: req.session.userRole,
        isLogin: req.session.userId,
        user,
      });
    } catch (error) {
      console.log(error);
      res.send(error.message);
    }
  }

  static async updateStock(req, res) {
    try {
      const { id } = req.params;
      const { name, type, price, description, gender } = req.body;

      const animal = await Livestock.findByPk(id);

      let finalImageUrl = animal.imageUrl;
      if (req.file) {
        finalImageUrl = `/uploads/${req.file.filename}`;
      }

      await animal.update({
        name,
        type,
        price,
        description,
        gender,
        imageUrl: finalImageUrl,
      });

      res.redirect(
        "/stock?notification=Data hewan ternak berhasil diperbarui!",
      );
    } catch (error) {
      if (error.name === "SequelizeValidationError") {
        const errMessages = error.errors.map((err) => err.message);
        return res.redirect(
          `/stock/edit/${req.params.id}?errors=${encodeURIComponent(JSON.stringify(errMessages))}`,
        );
      }
      console.log(error);
      res.send(error.message);
    }
  }

  // Add to card
  static async addToCart(req, res) {
    try {
      const { id } = req.params;
      const buyerId = req.session.userId;

      if (!buyerId) {
        return res.send(
          "Anda harus login terlebih dahulu untuk memasukkan ternak ke keranjang!",
        );
      }

      // Jika di session belum ada keranjang, buatkan array kosong
      if (!req.session.cart) {
        req.session.cart = [];
      }

      // Masukkan ID produk ke dalam array keranjang session (jika belum ada)
      if (!req.session.cart.includes(Number(id))) {
        req.session.cart.push(Number(id));
      }

      console.log("=== ISI KERANJANG SESSION BUYER ===");
      console.log(
        req.session.cart,
        "<<<< Apakah ID Produk Sudah Muncul di Sini?",
      );
      console.log("===================================");

      // Setelah dicatat di session, lempar Buyer ke halaman stock (Keranjang mereka)
      res.redirect("/stock");
    } catch (error) {
      console.log(error);
      res.send(error.message);
    }
  }

  // About
  static async aboutUs(req, res) {
    try {
      // navbar
      let user = null;

      if (req.session.userId) {
        user = await User.findOne({
          where: { id: req.session.userId },
          include: UserProfile,
        });
      }
      res.render("aboutUs", {
        userRole: req.session.userRole,
        isLogin: req.session.userId,
        user,
      });
    } catch (error) {
      console.log(error);
      res.send(error);
    }
  }
}

module.exports = Controller;
