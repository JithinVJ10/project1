const mongoose = require("mongoose")

const cartScheme = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"userdata",
        require:true
    },
    products:[{
        productId:{
            type: mongoose.Schema.Types.ObjectId,
            ref:"product",
            require:true
        },
        quantity:{
            type: Number,
            required: true,
            default: 1,
        }
    }],
    discount: {
        type: Number,
  
    },
},{timestamps:true})

const Cart = mongoose.model("cart",cartScheme)

module.exports = Cart