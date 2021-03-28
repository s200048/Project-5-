require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
const User = require("./models/user");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const flash = require("connect-flash");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
// authenticate user
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
//flash
app.use(flash());
app.use((req,res,next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.err_msg = req.flash("err_msg");
  next();
});


// connect to mongoDB
mongoose
  .connect("mongodb://localhost:27017/systemDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log("Successfully connnecting to mongoDB.");
  })
  .catch((e) => {
    console.log(e);
  });


// Homepage
app.get("/", (req, res) => {
  res.render("index");
});


// Login page
app.get("/login", (req, res) => {
  res.render("login");
});


// Sign up Page
app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req,res,next) => {
  let {fullname, usertype, username, password, password2} = req.body;
  // password matching
  if (password !== password2) {
    req.flash("err_msg", "Password don't match. Please check.")
    res.redirect("/register");
  } else {
    // email not registered yet
    try {
      let foundUser = await User.findOne({username});
      if (foundUser) {
        req.flash("err_msg", "Email is already registed.")
        res.redirect("/register");
      } else {
        let newUser = new User(req.body); //因為 User入邊冇password,req.body會自動將password整走
        await User.register(newUser, password); //用到User.register因為plugin(passportLocalMongoose)，佢同bcrypt, hash, salt 一樣，重比佢地加密更長
        req.flash("success_msg", "Success registered, please login again."); 
        res.redirect("/login");
      }
    } catch (err) {
      next(err);
    }
  }
});

app.get("/*", (req,res) => {
  res.status(404);
  res.render("errorViews/404");
});

// app.use(function (req, res, next) {
//   res.status(404).render("errorViews/404");
// });

app.use(function (err, req, res, next) {
  res.status(500).render("errorViews/500");
});

app.listen(3000, () => {
  console.log("Server is now running on port 3000.");
});
