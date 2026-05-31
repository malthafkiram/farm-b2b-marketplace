const express = require("express");
const app = express();
const port = 3000;
const Controller = require("./controllers/controller");

// import sesion nya
const session = require("express-session");

const { formatRupiah } = require("./helpers/rupiah");

const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/uploads");
  },
  filename: function (req, file, cb) {
    // Membuat nama file unik: TANGGAL-NAMAASLI.ekstensi ==> kalau begina file tidak akan pernah sama, konsep ini sama kayaj migration yang buat nama file nya per milidetik gitu
    const uniqueSuffix = Date.now() + "-" + file.originalname;
    cb(null, uniqueSuffix);
  },
});

const upload = multer({ storage: storage });

// Beritahu Express bahwa folder 'public' bisa diakses langsung oleh browser
app.use(express.static("public"));

app.locals.formatRupiah = formatRupiah;

app.set("view engine", "ejs");
app.use(
  express.urlencoded({
    extended: true,
  }),
);

app.use(
  session({
    secret: "sayapBerkasih",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  }),
);

const isLoggedIn = function (req, res, next) {
  if (req.session && req.session.userId) {
    next();
  } else {
    return res.redirect("/login");
  }
};

app.get("/", Controller.home);
app.get("/register", Controller.formRegister);
app.post("/register", Controller.register);
app.get("/login", Controller.formLogin);
app.post("/login", Controller.login);
app.get("/logout", Controller.logout);
app.get("/aboutUs", Controller.aboutUs);
app.get("/stock", isLoggedIn, Controller.getStock);
app.get("/stock/add", isLoggedIn, Controller.formAdd);
app.get("/transactions/history", isLoggedIn, Controller.transactionHistory);
app.get("/seller/dashboard", isLoggedIn, Controller.sellerDashboard);
app.post("/stock/add", isLoggedIn, upload.single("image"), Controller.addStock);

app.get("/stock/:id", Controller.productDetail);

app.get("/stock/buy/:id", isLoggedIn, Controller.buy);
app.get("/stock/delete/:id", isLoggedIn, Controller.deleteStock);
app.get("/stock/edit/:id", Controller.formEdit);
app.post("/stock/edit/:id", upload.single("image"), Controller.updateStock);
app.get("/stock/add-to-cart/:id", Controller.addToCart);

app.listen(port, () => {
  console.log(`I <3 More ${port}`);
});
