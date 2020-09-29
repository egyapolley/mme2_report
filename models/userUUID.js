const mongoose = require("mongoose");


const userUUIDSchema = new mongoose.Schema({
    email:String,
    uuid:String,
});


const UserUUID = new mongoose.model("userUUID",userUUIDSchema);

module.exports = UserUUID;
