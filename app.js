const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

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






app.listen(3000, () => {
  console.log("Server is now running on port 3000.");
});
