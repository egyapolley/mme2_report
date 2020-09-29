const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username:String,
    password:String,
    email:String,
    first_name:String,
    last_name:String,

});

const User = new mongoose.model("User",userSchema);

module.exports = User;
