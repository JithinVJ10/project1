const Order = require("../model/order_model")
const Product = require("../model/product_model")
const Catagory = require("../model/add_catagery")
const userData = require("../model/model")

// GET render Admin products view page

exports.adminProducts = async (req,res) =>{
    if (req.session.admin) {
        try {
            const products = await Product.find()
            
            res.render('productAdmin', { products });
          } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Server error' });
          }
        
    }else{
        res.redirect('/admin')
    }
}

// admin add product page rendering GET

exports.addProduct = async (req,res) =>{
    if (req.session.admin) {
        try {
            const catagory = await Catagory.find()

            res.render("add-products",{catagory})
        } catch (err) {
            console.log(err);
            res.status(500).send('Server error')
        }
    }else{
        res.redirect('/products-admin')
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