const Order = require("../model/order_model")
const Product = require("../model/product_model")
const Catagory = require("../model/add_catagery")
const userData = require("../model/model")
const Coupon = require("../model/coupon-model")

// GET method ADMIN dashboard Rendering with Sales report "/admim"

exports.dashboard = async (req,res)=>{
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
}


// // Sales report on pdf  and execl

// exports.pdf_execlDownload = async (req,res) =>{

// }


// admin user view page rendering with users data

exports.adminUser = async (req,res) =>{
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
}

// GET Search and Sort products

exports.productsSearch = async (req,res)=>{
    if (req.session.admin) {
        try {
            const { sort, search } = req.query;
        
            // Build the query object
            const query = {};
        
            // Sorting
            const sortOptions = {
              name: 'name',
              category: 'category',
              price: 'price',
            };
            const sortField = sortOptions[sort] || 'name';
            const sortQuery = { [sortField]: 1 };
        
            // Searching
            if (search) {
              query.name = { $regex: new RegExp(search, 'i') };
            }
        
            // Fetch the products from the database
            const products = await Product.find(query).sort(sortQuery);
        
            // Render the products using an EJS template
            res.render('productAdmin', { products });
          } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
          }
    }else{
        res.redirect("/admin")
    }
}

// GET admin catagery

exports.adminCatagory = async (req,res) =>{
    if (req.session.admin){
        
        try {
            const category_find  = await Catagory.find()
            res.render("categoryAdmin",{category_find})
          }catch(err){
            res.status(500).send({
              message:
                err.message || "error occured while retrieving user information",
            
            })
          }
    }else{
        res.redirect('/admin')
    }
}

//GET add catagory rendering
exports.addCatagory = async (req,res) =>{
    if (req.session.admin) {
        res.render("add-category")
    }else{
        res.redirect('/admin')
    }
}

// admin edit catagory page rendering with that particular data GET
exports.editCatagory = async (req,res) =>{
    if (req.session.admin) {
        try {
            const {id} = req.params
            const catagory = await Catagory.findById(id)

            if (!catagory) {
                console.log("No catagory");
                res.redirect("/add-catagory")
            }else{
                res.render("edit-catagory",{catagory})
            }
        } catch (err) {
            console.log(err);
            res.status(500).send("Server error")
        }
    }else{
        res.redirect("/admin")
    }
}


// Block user 

exports.blockUser = async (req,res) =>{
    try {
        const id = req.params.id
        const user = await userData.findByIdAndUpdate(
            id,
            {
              isBlocked: true,
            },
      
            { new: true }
      
        );

        if (user) {
            console.log(user);
            res.json({ success: true });
          } else {
            console.log("User not found");
            res.json({ success: false, message: "User not found" });
          }
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, error: "Failed to block user" });
    }
};

// user unblock

exports.unBlockUser = async (req,res) =>{
    try {
        const id = req.params.id
        const user = await userData.findByIdAndUpdate(
            id,
            {
              isBlocked: false,
            },
      
            { new: true }
      
        );

        if (user) {
            console.log(user);
            res.json({ success: true });
        }else{
            console.log("User not found");
            res.json({ success: false, message: "User not found" });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, error: "Failed to unblock user" });
    }
}


// ORDER

exports.AdminOrder = async (req,res) =>{
    if(req.session.admin){

        const order = await Order.find().populate("user").populate("items.product")
        res.render("Admin_order",{order})
    }else{
        res.redirect("/admin")
    }
}
// POST 
exports.updateOrder = async (req , res)=>{
    try {
        const id = req.params.id
        const orderStatus = req.body.status
        const order = await Order.findByIdAndUpdate(id,{
            status:orderStatus
        },{ new: true })

        console.log(order);

        res.redirect("/admin-order")

    } catch (error) {
        console.log(error);
        res.status(501).send("Server Error")
    }
}

// Admin single Order details page
exports.adminOrderDetails = async (req,res)=>{

    if (req.session.admin) {
        try {
            const {id} = req.params
            const order = await Order.findById(id).populate('user').populate('items.product').populate('items.quantity')

            console.log(order);

            res.render("Admin-OrderDetails",{order})
    
    
        } catch (error) {
            console.log(error);
            res.status(500).sent("Server problem")
        }
    }else{
        res.redirect("/admin")
    }

}

// Sales reports

exports.SalesReport=async(req,res)=>{
  if(req.session.admin){
    try {
      const admin=req.session.admin
      const filteredOrders=await Order.find().populate("user").populate("items.product").populate("address")
      console.log(filteredOrders,"hhhdhdhh");
      res.render("sales-report",{admin,filteredOrders})

    } catch (error) {
      console.log(error);
      res.status(500).sent("Server Error")
    }
  }else{
    res.redirect("/admin")
  }

}

exports.FilterbyDates=async(req,res)=>{
  const admin=req.session.admin
  const FromDate=req.body.fromdate
  console.log(FromDate);
  const Todate=req.body.todate
  console.log(Todate);
  const filteredOrders=await Order.find({createdAt:{$gte:FromDate,$lte:Todate}}).populate("user").populate("items.product").populate("address")
 
  res.render("sales-report",{admin,filteredOrders})
}


// coupon get method

exports.adminCoupon = async (req,res)=>{
  if (req.session.admin) {
    try {
      const coupons = await Coupon.find()
      res.render("adminCoupon",{coupons})
    } catch (error) {
      console.log(error);
      res.status(500).send("Server Error")
    }
  }else{
    res.redirect("/admin")
  }
}
// GET add coupon page render
exports.addCoupon = (req,res)=>{
  if (req.session.admin) {
    try {

      
      res.render("addCoupon")

    } catch (error) {
      console.log(error);
      res.status(500).send("Server Error")
    }
  }else{
    res.redirect("/admin")
  }
}

exports.addCouponPost = async (req,res)=>{
  try {
    const {code,startingdate,ExpireDate,discount} = req.body
    
    const coupon = new Coupon({
      code:code,
      startingDate:startingdate,
      expiryDate:ExpireDate,
      discount:discount,
      status:false

    })

    await coupon.save()

    res.redirect("/adminCoupon")
    
  } catch (error) {
    console.log(error);
    res.status(500).send("Error")
  }
}

exports.deleteCoupon = async (req,res)=>{
  try {

    const id = req.params.id

    const removedCoupon = await Coupon.findByIdAndRemove(id)

    if (removedCoupon) {
      // Category deleted successfully
      console.log("Coupon del successfully");
      res.json({ success: true });
    } else {
      // Category not found or failed to delete
      console.log("Coupon del failed");
      res.json({ success: false });
    }
    
  } catch (error) {
    console.log(error);
    res.status(500).send("Error")

  }
}
