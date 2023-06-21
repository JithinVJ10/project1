const mongoose = require("mongoose")

const wishlistScheme = new mongoose.Schema({
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
    
})

const Wishlist = mongoose.model('wishlists',wishlistScheme)

module.exports = Wishlist