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

// admin login details
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

// admin main page rendering
route.get("/admin", async (req, res) => {
    try {
        
      if (req.session.admin) {

        const today = new Date().toISOString().split("T")[0];
        const startOfDay = new Date(today);
        const endOfDay = new Date(today);
        endOfDay.setDate(endOfDay.getDate() + 1);
        endOfDay.setMilliseconds(endOfDay.getMilliseconds() - 1);

        const orders = await Order.find(); // Fetching all orders from the database

        // Extracting necessary data for the chart
        const salesData = orders.map(order => ({
          createdAt: order.createdAt.toISOString().split('T')[0], // Extracting date only
          total: order.total
        }));
  
        // Calculating the total sales for each date
        const salesByDate = salesData.reduce((acc, curr) => {
          acc[curr.createdAt] = (acc[curr.createdAt] || 0) + curr.total;
          return acc;
        }, {});
  
        // Converting the sales data into separate arrays for chart labels and values
        const chartLabels = Object.keys(salesByDate);
        const chartData = Object.values(salesByDate);
      
        const todaySales = await Order
          .countDocuments({
            createdAt: { $gte: startOfDay, $lt: endOfDay },
            status: "Delivered",
          })
          .exec();
        console.log(todaySales);
      
        const totalsales = await Order.countDocuments({ status: "Delivered" });
      
        const todayRevenue = await Order.aggregate([
          {
            $match: {
              createdAt: { $gte: startOfDay, $lt: endOfDay },
              status: "Delivered",
            },
          },
          { $group: { _id: null, totalRevenue: { $sum: "$total" } } },
        ]);
      
        const revenue = todayRevenue.length > 0 ? todayRevenue[0].totalRevenue : 0;
      
        const TotalRevenue = await Order.aggregate([
          {
            $match: { status: "Delivered" },
          },
          { $group: { _id: null, Revenue: { $sum: "$total" } } },
        ]);
      
        const Revenue = TotalRevenue.length > 0 ? TotalRevenue[0].Revenue : 0;

        console.log(TotalRevenue);
      
        const Orderpending = await Order.countDocuments({ status: "Pending" });
        const OrderReturn = await Order.countDocuments({
          status: "Returned",
        });
        const Ordershipped = await Order.countDocuments({ status: "Shipped" });
      
        const Ordercancelled = await Order.countDocuments({
          status: "Cancelled",
        });
      
        const salesCountByMonth = await Order.aggregate([
          {
            $match: {
              status: "Delivered",
            },
          },
          {
            $group: {
              _id: {
                month: { $month: "$createdAt" },
                year: { $year: "$createdAt" },
              },
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              month: "$_id.month",
              year: "$_id.year",
              count: 1,
            },
          },
        ]);
      
        console.log(salesCountByMonth);
      
        res.render("indexAdmin", {
          todaySales,
          totalsales,
          revenue,
          Revenue,
          Orderpending,
          Ordershipped,
          Ordercancelled,
          salesCountByMonth,
          OrderReturn,
          chartLabels: JSON.stringify(chartLabels),
          chartData: JSON.stringify(chartData)
        });
      } else {
        res.render("signinAdmin");
      }
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
  });

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

// PRODUCTS

// admin product page loading with data
route.get("/products-admin", adminController.adminProducts)

// admin add products page rendering
route.get("/addProduct",adminController.addProduct)

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
route.get("/user-admin",async(req,res)=>{

    if (req.session.admin) {
        try {
            const data = await userData.find()
            res.render("user",{data})

        } catch (err) {
            console.log(err);
            res.status(500).send("server error")
        }
    }else{
        res.redirect('/admin')
    }
    
})

// user block and unblock

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



route.get("/error-404",(req,res)=>{
    if (req.session.admin) {
        res.render("error404")
    }else{
        res.render("/admin")
    }
})

route.get("/admin/logout",(req,res)=>{
    req.session.admin = null
    res.redirect("/admin")
})


module.exports = route