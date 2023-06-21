const mongoose = require('mongoose')

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        require: true
    },
    startingDate: {
        type: Date,
        require: true,
    },
    expiryDate: {
        type: Date,
        require: true
    },
    discount: {
        type: String,
        require: true,
    },
    status: {
        type: Boolean,
        default: false
    }
})

const Coupon = new mongoose.model("coupons", couponSchema)

module.exports = Coupon