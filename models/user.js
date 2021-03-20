const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new mongoose.Schema ({
    name: { type: String, },
    usertype: {tpye: String},
    username: {type: String },
    courses: {type:[String], default: []},

});

userSchema.plugin(passportLocalMongoose);   //一定要先plugin，再裝到mongoose.model入邊，次序好重要
const User = mongoose.model("User", userSchema);
module.exports = User;