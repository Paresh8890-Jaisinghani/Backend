const mongoose = require('mongoose');


const AuthSchema = new mongoose.Schema({
    username : String,
    password : String,
    company : String
})



const Authmodel = mongoose.model("auth",AuthSchema)


module.exports = Authmodel