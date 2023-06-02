const express = require("express")
require('dotenv').config()

const twilio = require('../controller/twilio-sms')
const router = express.Router()

router.post('/send-otp',twilio.sendOTP)
router.post('/verify-otp',twilio.verifyOTP)

module.exports = router