const express = require("express")

const route = express.Router()
const userData=require("../model/model")
const Product = require("../model/product_model")
const Cart = require("../model/cart_model")
const UserControl = require("../controller/userController")
const bcrypt = require("bcrypt")
const Catagory = require('../model/add_catagery')

// user main page rendering 
route.get("/",async (req,res)=>{

    if (req.session.user) {
        try {
            const user = req.session.user
            const data = await Product.find()


            res.render("index-after-login",{user,data})
        } catch (error) {
            console.log(error);
            res.status(500).send("Server Error")
        }

    }else{
        res.render("index")
    }
})


// user home  page2 rendering
route.get("/home-02",(req,res)=>{
    res.render("home-02")
})

// user product page  rendering with product data
route.get("/product", async (req,res)=>{
    if (req.session.user) {
        try {
            const user = req.session.user
            const data = await Product.find()
            const catagory = await Catagory.find()

            if (data) {
                res.render("product", {data,user,catagory})
            }
        } catch (err) {
            console.log(err);
            res.status(500).send("Server Error")
        }
        
    }else{
        const data = await Product.find()
        const catagory = await Catagory.find()
        res.render("product", {data,catagory})
    }
    
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

    if (users) {
        return res.render("signup",{msg:"email or phone already existing"})
    }



    const saltRounds = 10;

    bcrypt.hash(password,saltRounds,(err,hash)=>{
        if(err){
            res.status(500).send({message: err.message || 'Some error occurred while hashing the password'})
            return
        }

        const data ={
            name: name,
            email:email,
            mobile:mobile,
            password: hash
    
        }

        userData.insertMany([data])
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

//rendering product details page with particular product
route.get("/product-details/:id", async (req,res) =>{
    if (req.session.user) {
        try {
            const user = req.session.user
            const {id}= req.params
            let product = await Product.findById(id)

            if (!product) {
                console.log("Not found");
                res.redirect("/product")
            }

            return res.render("product-detail" ,{product,user})
        } catch (error) {
            console.error(error)
            res.redirect("/product")
        }
        
    }else{
        res.redirect("/login")
    }
    
})


// User profile

route.get("/user-profile", async (req,res)=>{
    if (req.session.user) {
        try {
            const id = req.session.user?._id
            const userdetails = await userData.findOne({_id:id})
            res.render("User-profile",{userdetails})
        } catch (error) {
            
        }
        
    }else{
        res.redirect("/user-logout")
    }
})

// rendering shopping cart page
route.get("/shoping-cart", async (req,res)=>{
    if (req.session.user) {
        try {
            
            let userId = req.session.user._id
            let user = req.session.user
            let cart = await Cart.findOne({ userId: userId }).populate(
              "products.productId"
            )
            
            if(cart){
                let products = cart.products
                res.render('shoping-cart', { cart,user, products })
            }else{
                res.redirect("/product")

            }
            
          
          
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: 'Server error'});
        }
        
    }else{
        res.redirect('/login')
    }
})

// add to cart function

route.post("/add-to-cart/:id",UserControl.addToCart)

//delete a itemfom cart
route.get("/deleteItem-inCart/:id",UserControl.deleteItemInCart)

//incremenr and decement quantity

route.post("/increase_product",UserControl.incrementQuantity)
route.post("/decreaseQuantity",UserControl.decreaseQuantity)

  // address page render
  route.get("/User-address",UserControl.userAddress)

// add new user address
route.post("/add-address",UserControl.addAddress)

// update user address
route.post("/update-address/:id",UserControl.updateAddress)

// checkout page render

route.get("/checkout/:id",UserControl.checkout)
route.post("/order/:id",UserControl.placeorder)
route.get("/orders-details",UserControl.ordersDetails)
route.get("/order-cancel/:id",UserControl.orderCancel)
route.get("/order-return/:id",UserControl.orderReturn)


route.get('/paypal-success',UserControl.paypal_success)
route.get('/paypal-success',UserControl.paypal_err)




// user log out
route.get("/user-logout", (req,res)=>{
    req.session.user = null

    res.redirect("/")

})

module.exports = route