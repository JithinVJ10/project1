require('dotenv').config();
const userData = require('../model/model')
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken)
const serviceSid = process.env.TWILIO_SERVICE_SID;


//send OTP
exports.sendOTP = async (req, res, next) => {
  console.log("sms");
    const { mobile } = req.body;
    req.session.mobile=mobile
    try {
      const user = await userData.findOne({mobile: mobile });
      if(!user){
        res.render('login',{msg:"phone number is not registered"});
      }else{
        const otpResponse = await client.verify.v2
          .services(serviceSid)
          .verifications.create({
            to: "+91"+mobile,
            channel: "sms",
          });
       
        res.render('otpSubmit',{msg:"otp send successfully"});
      }
     
    } catch (error) {
      res.status(error?.status || 400).send(error?.message || "Something went wrong!");
    }
    
};


//verify OTP
exports.verifyOTP = async (req, res) => {
    const verificationCode =req.body.otp;
    const phoneNumber = req.session.mobile;
    
    
  
    if (!phoneNumber) {
      res.status(400).send({ message: "Phone number is required" });
      return;
    }
  
    try {
      // Verify the SMS code entered by the user
      const verification_check = await client.verify.v2
        .services(serviceSid)
        .verificationChecks.create({
          to: '+91' + phoneNumber,
          code: verificationCode
        });
  
      if (verification_check.status === 'approved') {
        // If the verification is successful this
        const user= await userData.findOne({mobile:phoneNumber})

        req.session.user = user
      
        res.redirect('/');
      } else {
        // If the verification fails, return an error message
        res.render('login', { msg: "Invalid verification code" });
      }
    } catch (err) {
      console.log("verification faild");
      res.status(500).send({ message: err.message || "Some error occurred while verifying the code"});
  }
  
  };