const express = require("express")

const route = express.Router()
const userData=require("../model/model")
const Product = require("../model/product_model")
const Cart = require("../model/cart_model")
const UserControl = require("../controller/userController")
const bcrypt = require("bcrypt")
const Catagory = require('../model/add_catagery')
const Banner = require("../model/bannerModel")

// user main page rendering 
route.get("/",async (req,res)=>{

    if (req.session.user) {
        try {
            const user = req.session.user
            const userId = req.session.user?._id

            const data = await Product.find()
            const catagory = await Catagory.find()
            const banner = await Banner.find()
            let modelCart = await Cart.findOne({ userId: userId }).populate(
                "products.productId"
              )
            
            if(modelCart!==null){
                let products = modelCart.products
                res.render("index-after-login",{user,data,catagory,products,banner})
            }else{
                res.render("index-after-login",{user,data,catagory,banner})
            }

        } catch (error) {
            console.log(error);
            res.status(500).send("Server Error")
        }

    }else{
        const banner = await Banner.find()
        const data = await Product.find()
        const catagory = await Catagory.find()
        
        res.render("index",{data,catagory,banner})
    }
})


// user home  page2 rendering
route.get("/home-02",(req,res)=>{
    res.render("home-02")
})

// user sign up rendering
route.get("/signup",(req,res)=>{
    res.render("signup")
})

//user signup and adding user data to DB
route.post("/signup", async (req,res)=>{
    const name = req.body.name
    const email =req.body.email
    const mobile = req.body.mobile
    const password= req.body.password
    const confirmpassword= req.body.confirmpassword

    if (confirmpassword !== password) {
        return res.render("signup",{msg:"password not matching"})
    }

    const users = await userData.find({email:email,mobile:mobile})

    console.log(users);

    if (users.length > 0) {
        return res.render("signup",{msg:"email or phone already existing"})
    }



    const saltRounds = 10;

    bcrypt.hash(password,saltRounds,(err,hash)=>{
        if(err){
            res.status(500).send({message: err.message || 'Some error occurred while hashing the password'})
            return
        }

        const data = new userData({
            name: name,
            email:email,
            mobile:mobile,
            password: hash
        })

        data.save()
            .then(()=>{
                
                res.redirect("/login")
            })
            .catch((err) => {
                res.status(500).send({
                message: err.message || "Some error occurred while creating a create operation",
                });
            })
    }) 


})

// user login page rendering
route.get("/login", (req,res)=>{
    
    if (req.session.user) {
        res.render("index-after-login")
    }else{
        res.render("login")
    }

})


// login user and give access

route.post("/login", async (req,res)=>{
    const name = req.body.name
    const password = req.body.password

    try {
        if (!name || !password ) {
            let msg = "Please fill full"
            return res.render("login",{msg})
        }
    
    
        const user = await userData.findOne({name:name})
        if (user) {
            if (user.isBlocked) {
                let msg = "You are blocked user"
                return res.render("login",{msg})
            }

            const isMatch = await bcrypt.compare(password,user.password)
            if(isMatch){
                req.session.user = user
                res.redirect("/")
            }else{
                let msg = "Password is incorrect"
                return res.render("login",{msg})
            }
        }else{
            let msg = "User not found"
            return res.render("login",{msg})
        }
    
    
    } catch (error) {
        
    }
})

// OTP log in

route.get("/otp",(req,res)=>{
    res.render('otpSubmit')
})

// user product page  rendering with product data
route.get("/product", UserControl.viewProducts)
route.get("/product-details/:id",UserControl.getSingleProduct)
// product sort
route.get("/low-to-high",UserControl.LowToHigh)
route.get("/high-to-low",UserControl.HighToLow)

// User profile

route.get("/user-profile",UserControl.getProfile)

// rendering shopping cart page
route.get("/shoping-cart",UserControl.getCart)
// add to cart function
route.post("/add-to-cart/:id",UserControl.addToCart)
//delete a itemfom cart
route.get("/deleteItem-inCart/:id",UserControl.deleteItemInCart)
//incremene and decement quantity
route.post("/increase_product",UserControl.incrementQuantity)
route.post("/decreaseQuantity",UserControl.decreaseQuantity)

  // address page render
  route.get("/User-address",UserControl.userAddress)

// add new user address
route.post("/add-address",UserControl.addAddress)

// update user address
route.post("/update-address/:id",UserControl.updateAddress)
route.post("/update-userdetails/:id",UserControl.userDetialsUpdate)
route.post("/update-ProfileAddress/:id",UserControl.updateProfileAddress)
route.post("/profileAddress-add",UserControl.addAddressProfile)
route.get('/delete-address/:id',UserControl.deleteAddress)

// checkout page render

route.get("/checkout/:id",UserControl.checkout)
route.post("/order/:id",UserControl.placeorder)
route.get("/orders-details",UserControl.ordersDetails)
route.get("/singleOrderDetails/:id",UserControl.singleOrderDetails)
route.get("/order-cancel/:id",UserControl.orderCancel)
route.get("/order-return/:id",UserControl.orderReturn)
// Invoice page render
route.get("/invoice/:id",UserControl.invoice)


// PAYPAL GET route
route.get('/paypal-success',UserControl.paypal_success)
route.get('/paypal-success',UserControl.paypal_err)

// COUPON
route.post("/redeem_coupon",UserControl.redeemCoupon)

// Wallet
route.get("/wallet",UserControl.wallet)
route.put('/wallet-pay',UserControl.walletPay)

// Wishlist
route.get("/wishlist",UserControl.getWishlist)
route.post('/add-to-wishlist/:id',UserControl.addToWishlist)
route.delete("/deleteItem-Wishlist/:id",UserControl.removeItemWishlist)



// user log out
route.get("/user-logout", (req,res)=>{
    req.session.user = null
    res.redirect("/")
})

module.exports = route