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
const Course = require("./models/course");

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
  res.locals.error = req.flash("error");
  next();
});

// middleware function authentication
function isLoggedIn (req,res,next) {
  if (!req.isAuthenticated()) {
    req.flash("err_msg", "Please login first before accessing this page!");
    res.redirect("/login");
  } else {
    next();
  }
}

function isStudent (req, res, next) {
  if (req.user.usertype !== "Student") {
    res.status(403).render("errorViews/403");
  } else{
    next();
  }
}

function isTeacher (req, res, next) {
  if (req.user.usertype !== "Teacher") {
    res.status(403).render("errorViews/403");
  } else{
    next();
  }
}

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


app.post("/login", 
passport.authenticate("local", {failureFlash:true, failureRedirect:"/login",}), 
(req,res) => {
  console.log(req.user);
  if (req.user.usertype == "Student") {
    res.redirect("/student/index");
  } else {
    res.redirect("/teacher/index");
  }
  // let {username, password} = req.body;
  // try {
  //   let foundUser = await User.findOne({username});

  //   if (!foundUser) {
  //     req.flash("err_msg", "User not found.")
  //     req.redirect("/login");
  //   } else {
  //     if (password !== foundUser.password){
  //       req.flash("err_msg", "Password not correct");
  //       res.redirect("/login");
  //     } else {
  //       if (foundUser.courses == student) {
  //         res.render("studentViews/index.ejs");
  //       } else {
  //         res.render("teacherViews/index.ejs");
  //       }
  //     }
  //   }
  // } catch (err) {
  //   console.log(err);
  //   res.send("Error in server");
  //   next(err);
  // }
});

// Student routes
  app.get("/student/index", isLoggedIn, isStudent,  (req,res) => {
    res.render("studentViews/index");
  });

// teacher routers
app.get("/teacher/index", isLoggedIn, isTeacher, async (req,res) => {
  let { _id } = req.user;
  try{
    let teacher = await User.findOne({ _id });
    let coursesFound = await Course.find({_id: {$in: teacher.courses }}) //coursesFound ??? array(??????)
    res.render("teacherViews/index", {user: req.user, courses: coursesFound});
  } catch (err) {
    next(err);
  }
});

app.get("/teacher/create", isLoggedIn, isTeacher, (req,res) => {
  res.render("teacherViews/create", {user: req.user});
});

app.post("/teacher/create", isLoggedIn, isTeacher, async (req, res) => {
  let {courseName, description, price} = req.body;
  let {_id, fullname} = req.user;
  try {
    let newCourse = new Course ({
      name: courseName, description, price, author: fullname, author_id: _id,
    });
    let data = await newCourse.save();
    let author = await User.findOne({_id});
    author.courses.push(data._id);
    await author.save();
    res.redirect("/teacher/index");
  } catch (err) {
    console.log(err);
    req.flash("err_msg", "Error with creating your course.Please check with admin.");
    res.redirect("/teacher/create");
  }
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
        let newUser = new User(req.body); //?????? User?????????password,req.body????????????password??????
        await User.register(newUser, password); //??????User.register??????plugin(passportLocalMongoose)?????????bcrypt, hash, salt ?????????????????????????????????
        req.flash("success_msg", "Success registered, please login again."); 
        res.redirect("/login");
      }
    } catch (err) {
      next(err);
    }
  }
});

//log out
app.get("/logout", (req,res) => {
  req.logOut();
  res.redirect("/");
});


app.get("/*", (req,res) => {
  res.status(404);
  res.render("errorViews/404");
});

app.use(function (err, req, res, next) {
  console.log(err);
  res.status(500).render("errorViews/500");
});

app.listen(3000, () => {
  console.log("Server is now running on port 3000.");
});
