const express = require("express")
const route = express.Router()
const multer = require("multer")
const fs = require("fs")
const path =require("path")

const controller = require("../controller/productController")
const Product = require("../model/product_model")
const Catagory = require("../model/add_catagery")
const userData = require("../model/model")
const adminController = require("../controller/adminController")
const Order = require("../model/order_model")


// ADMIN login details
const credAdmin = {
    email:"jithin@gmail.com",
    password:"123"
}

// multer image uploader
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         const uploadDir ='./uploads'
//         if (!fs.existsSync(uploadDir)) {
//             fs.mkdirSync(uploadDir)
//         }
//         cb(null, uploadDir)
//     },
//     filename: function (req, file, cb) {
//         const originalname = file.originalname.replace(/[^a-zA-Z0-9]/g,"")
//         cb(null,`${file.fieldname}_${Date.now()}_${originalname}`)
//     }
//   });
  
// const upload = multer({ storage: storage })

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, './uploads'); // Specify the destination folder for uploaded files
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + ext); // Set a unique filename for each uploaded file
    }
  });
  
  const upload = multer({ storage: storage });


// admin sign in with vaildation
route.post("/signin",(req,res)=>{
    let email = req.body.email
    let password = req.body.password

    if (credAdmin.email == email && credAdmin.password == password) {

        req.session.admin = credAdmin
        res.redirect("/admin")

    }else if(email==="" || password===""){
        let msg = "Please fill*"
        res.render("signinAdmin",{msg})
    }else{
        let msg = "Invaild email or password"
        res.render("signinAdmin",{msg})
    }
})

// ADMIN main page rendering
route.get("/admin",adminController.dashboard);

// PRODUCTS

// admin product page loading with data
route.get("/products-admin", controller.adminProducts)

// admin add products page rendering
route.get("/addProduct",controller.addProduct)

// products search and sort
route.get("/productsSearch",adminController.productsSearch)

// CATAGORY

// admin catagory page rendering with data
route.get("/catagory-admin", adminController.adminCatagory)

// admin add catagory page rendering
route.get("/add-catagory", adminController.addCatagory)

// admin edit catagory page rendering with that particular user data
route.get("/editCatagory/:id",adminController.editCatagory)

// USER view Admin

// admin user view page rendering with users data
route.get("/user-admin",adminController.adminUser)

// User block and unblock

route.put("/block-user/:id", adminController.blockUser)
route.put("/unblock-user/:id", adminController.unBlockUser)


// renderig admin order page

route.get("/admin-order",adminController.AdminOrder)
route.post("/update-order/:id",adminController.updateOrder)
route.get("/admin-Orderdetails/:id",adminController.adminOrderDetails)

// product controller
route.post("/addcata",controller.addcatagory)
route.post("/updateCatagory/:id",controller.updateCatagory)
route.delete("/deleteCatagory/:id",controller.deleteCategory)


route.post("/addProduct",upload.array('photo',3),controller.addproduct)
route.get("/update-products/:id",controller.updateProduct)
route.post("/UpdateProduct/:id",upload.array('photo',3),controller.updProduct)
route.put("/block-Product/:id",controller.blockProduct)
route.put("/unblock-Product/:id",controller.unBlockProduct)

// sales reports

route.get("/sales-report",adminController.SalesReport)
route.post("/adminSalesReportFilter",adminController.FilterbyDates)

// coupons

route.get("/adminCoupon", adminController.adminCoupon)
route.get("/addCoupon",adminController.addCoupon)
route.post("/addCoupon",adminController.addCouponPost)
route.get("/deleteCoupon/:id",adminController.deleteCoupon)
route.put("/activateCoupon/:id",adminController.activateCoupon)
route.put("/DeactivateCoupon/:id",adminController.deactivateCoupon)

// Banner

route.get("/adminBanner",adminController.adminBanner)
route.get("/addBanner",adminController.addBannerGet)


route.get("/error-404",(req,res)=>{
    if (req.session.admin) {
        res.render("error404")
    }else{
        res.render("/admin")
    }
})

// LOGOUT FUNCTION

route.get("/admin/logout",(req,res)=>{
    req.session.admin = null
    res.redirect("/admin")
})


module.exports = route