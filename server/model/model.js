const mongoose = require("mongoose")

let userSchema = new mongoose.Schema({
    name : {
        type : String,
        required: true
    },
    email : {
        type: String,
        required: true,
        unique: true
    },
    mobile:{
        type:Number,
        require:true,
        unique: true
    },
    password:{
        type: String,
        required: true
    },
    address:[{
        name:String,
        address:String,
        mobile:String,
        city:String,
        pincode:Number,
        state:String,
    }],
    isBlocked:{
        type:Boolean,
        default:false
    },
    coupon:[String],
})

const userData = mongoose.model("userdata",userSchema)

module.exports = userData