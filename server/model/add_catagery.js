const mongoose = require("mongoose")

const catagoryScheme = new mongoose.Schema({
    catagory:{
        type:String,
        unique:true,
        require:true
    },
    description:{
        type:String,
        // require:true
    }
})

const Catagory = mongoose.model('catagory',catagoryScheme)

module.exports = Catagory