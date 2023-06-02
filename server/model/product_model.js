const mongoose =require("mongoose")

const productScheme = new mongoose.Schema({
    name:{
        type:String,
        require:true
    },
    catagory:{
        type:String,
        require:true,
        ref:'catagory'
    },
    
    description:{
        type:String,
        require:true
    },

    price:{
        type:Number,
        require:true
    },  
    photo:[{
        type:String,
        require:true
    }],
    blocked:{
        type:Boolean,
        default:false
    }
})

const Product =new mongoose.model("product",productScheme)

module.exports = Product