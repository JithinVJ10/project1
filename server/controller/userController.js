const userData = require('../model/model')
const Cart = require('../model/cart_model')
const Product = require('../model/product_model')
const Order = require("../model/order_model")
const paypal= require('paypal-rest-sdk')
const Coupon = require("../model/coupon-model")
const Wallet = require("../model/wallet-model")
const Catagory = require("../model/add_catagery")
const Wishlist = require("../model/wishlistModel")


exports.viewProducts = async (req, res) => {
  if (req.session.user) {
    try {
      const pageSize = 6;
      let currentPage = req.query.page ? parseInt(req.query.page) : 1;
      let totalProducts, data;

      if (req.query.query) {
        // Search query is provided
        const query = req.query.query;
        totalProducts = await Product.countDocuments({
          $or: [
            { name: { $regex: query, $options: 'i' } }, // Case-insensitive search for product name
            { description: { $regex: query, $options: 'i' } }, // Case-insensitive search for product description
          ],
        });
        data = await Product.find({
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } },
          ],
        })
          .skip((currentPage - 1) * pageSize)
          .limit(pageSize);

          
      } else {
        // No search query, retrieve all products
        totalProducts = await Product.countDocuments();
        data = await Product.find()
          .skip((currentPage - 1) * pageSize)
          .limit(pageSize);
      }

      const totalPages = Math.ceil(totalProducts / pageSize);
      const user = req.session.user;
      const catagory = await Catagory.find();

      res.render("product", {
        data,
        user,
        catagory,
        totalPages,
        currentPage,
      });
    } catch (err) {
      console.log(err);
      res.status(500).send("Server Error");
    }
  } else {
    // Guest user view
    try {
      const pageSize = 6;
      let currentPage = req.query.page ? parseInt(req.query.page) : 1;
      let totalProducts, data;

      if (req.query.query) {
        // Search query is provided
        const query = req.query.query;
        totalProducts = await Product.countDocuments({
          $or: [
            { name: { $regex: query, $options: 'i' } }, // Case-insensitive search for product name
            { description: { $regex: query, $options: 'i' } }, // Case-insensitive search for product description
          ],
          blocked: false, // Exclude blocked products
        });
        data = await Product.find({
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } },
          ],
          blocked: false, // Exclude blocked products
        })
          .skip((currentPage - 1) * pageSize)
          .limit(pageSize);
      } else {
        // No search query, retrieve all non-blocked products
        totalProducts = await Product.countDocuments({ blocked: false });
        data = await Product.find({ blocked: false })
          .skip((currentPage - 1) * pageSize)
          .limit(pageSize);
      }

      const totalPages = Math.ceil(totalProducts / pageSize);
      const catagory = await Catagory.find();

      res.render("product", {
        data,
        catagory,
        currentPage: 1,
        totalPages,
      });
    } catch (err) {
      console.log(err);
      res.status(500).send("Server Error");
    }
  }
};


//Single porduct page

exports.getSingleProduct = async (req,res)=>{
  if (req.session.user) {
    try {
        const user = req.session.user
        const {id}= req.params
        let product = await Product.findById(id)

        if (!product) {
            
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
}

//low to high
exports.LowToHigh = async (req, res) => {
  if(req.session.user){
  
  
    try {
      const pageSize = 6;
      const currentPage = parseInt(req.query.page) || 1;

      const totalProducts = await Product.countDocuments({ blocked: false });
      const totalPages = Math.ceil(totalProducts / pageSize);
      const skip = (currentPage - 1) * pageSize;
      

      const data = await Product.find({ blocked: false })
        .sort({ price: 1 })
        .skip(skip)
        .limit(pageSize);

      

      const catagory= await Catagory.find()
      const user = req.session.user;
      const user_id = req.session.user?._id;

      

      res.render("product", {
        data,
        user,
        user_id,
        totalPages,
        currentPage,
        catagory
      });
    } catch (error) {
      console.error("Error fetching products:", error);
      // res.render("error", { message: "Error fetching products" });
      res.status(500).sent("Error")
    }

  }else{
    const pageSize = 6;
    const totalProducts = await Product.countDocuments({ blocked: false });
    const totalPages = Math.ceil(totalProducts / pageSize);
    const data = await Product.find();
    const catagory = await Catagory.find();
  
    res.render("product", { data, catagory, currentPage: 1,totalPages });

  }
};

// price sort high to low
exports.HighToLow = async (req, res) => {
  if(req.session.user){
  
  
    try {
      const pageSize = 6;
      const currentPage = parseInt(req.query.page) || 1;

      const totalProducts = await Product.countDocuments({ blocked: false });
      const totalPages = Math.ceil(totalProducts / pageSize);
      const skip = (currentPage - 1) * pageSize;
      

      const data = await Product.find({ blocked: false })
        .sort({ price: -1 })
        .skip(skip)
        .limit(pageSize);

      

      const catagory= await Catagory.find()
      const user = req.session.user;
      const user_id = req.session.user?._id;


      res.render("product", {
        data,
        user,
        user_id,
        totalPages,
        currentPage,
        catagory
      });
    } catch (error) {
      console.error("Error fetching products:", error);
      // res.render("error", { message: "Error fetching products" });
      res.status(500).sent("Error")
    }

  }else{
    const pageSize = 6;
    const totalProducts = await Product.countDocuments({ blocked: false });
    const totalPages = Math.ceil(totalProducts / pageSize);
    const data = await Product.find();
    const catagory = await Catagory.find();
  
    res.render("product", { data, catagory, currentPage: 1,totalPages });

  }
};


// GET Cart

exports.getCart = async (req,res)=>{
  if (req.session.user) {
    try {
        
        let userId = req.session.user._id
        let user = req.session.user
        let cart = await Cart.findOne({ userId: userId }).populate(
          "products.productId"
        )
        
        if(cart!==null){
            let products = cart.products
            res.render('shoping-cart', { cart,user, products })
        }else{
            res.render('shoping-cart', { cart,user })

        }
        
      
      
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Server error'});
    }
    
  }else{
      res.redirect('/login')
  }
}

// Add to cart function
exports.addToCart = async (req,res)=>{
  try {
    const userId = req.session.user?._id
    const productId = req.params.id

    let userCart = await Cart.findOne({userId:userId})

    if (!userCart) {
        // If the user's cart doesn't exist
        //creat new one
        let newCart = new Cart({ userId: userId, products: [] });
        await newCart.save();
        userCart = newCart;
    }
  
    const productIndex = userCart.products.findIndex(
        (product) => product.productId == productId
  
    );

    if (productIndex === -1) {
        // If the product is not in the cart, add it
        userCart.products.push({ productId, quantity: 1 });
  
    }else {
        // If the product is already in the cart, increase its quantity by 1
        userCart.products[productIndex].quantity += 1;
  
      }
      
  
    await userCart.save();

    res.status(200).json({ message: 'Product added to cart successfully' });

  
  
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error'});

  }
}



exports.deleteItemInCart = async (req,res)=>{
    try {
        const productId = req.params.id
        const userId= req.session.user?._id
        

        const productDeleted = await Cart.findOneAndUpdate(
            {userId: userId},
            {$pull:{ products:{productId: productId}}},
            {new: true}
        )
        
        if(productDeleted){
          res.json({
            success:true,
            message:"Remove item",
          })
        }else{
            
            res.json({
              success:false,
              message:"failed to Remove item",
            })
        }

    } catch (error) {
        console.log(error);
        res.status(500).send("Server Error")
        
    }

}

exports.incrementQuantity = async (req,res)=>{
    
    const userId = req.session.user?._id
    const cartId = req.body.cartId
    

    try {
        let cart = await Cart.findOne({userId: userId}).populate("products.productId")

          // console.log(cart);

        let cartIndex = cart.products.findIndex(items=> items.productId.equals(cartId))
        
        cart.products[cartIndex].quantity +=1
        let result= await cart.save()


        const total = cart.products[cartIndex].quantity * cart.products[cartIndex].productId.price
        const quantity = cart.products[cartIndex].quantity;

        res.json({
            success:true,
            message:"Quantity updated",
            total,
            quantity

        })




    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to update quantity." });
    }

}

exports.decreaseQuantity = async (req, res) => {
  
    const cartItemId = req.body.cartItemId
    const userId = req.session.user?._id
  
  
    try {
      const cart = await Cart.findOne({ userId: userId }).populate("products.productId")
  
      const cartIndex = cart.products.findIndex(item => item.productId.equals(cartItemId))
  
      if (cartIndex === -1) {
        return res.json({ success: false, message: "Cart item not found." });
  
      }
      cart.products[cartIndex].quantity -= 1
      await cart.save()
  
      const total = cart.products[cartIndex].quantity * cart.products[cartIndex].productId.price;
  
      const quantity = cart.products[cartIndex].quantity;
      res.json({
        success: true,
        message: "Quantity updated successfully.",
        total,
        quantity,
      });
    } catch (error) {
      res.json({ success: false, message: "Failed to update quantity." });
    }
  
  }


  // GET Method address page render

  exports.userAddress = async (req,res) =>{
    if (req.session.user) {
        try {
            
          // getting id of current user
            const userId = req.session.user?._id

            const user = req.session.user

            // id have to pass with object
            const data = await userData.findOne({_id:userId})


            res.render("User-address", {data: data.address, user})
        } catch (error) {
            console.log(error);
            res.status(500).send("Network Error")
        }
    }else{
        res.redirect('/login')
    }
  }

// POST Method add new address to mongoDB user data address array
exports.addAddress = async (req, res) => {

    try {
        const userId = req.session.user?._id
        const { name, address, mobile, pincode, city, state } = req.body
    
        // Find the user by a specific identifier
        const user = await userData.findOne({_id:userId});

        
    
        if (!user) {
          res.status(404).send('User not found.');
          return;
        }
    
        // Push the new address data to the existing address array
        user.address.push({ name, address, mobile, pincode, city, state });
    
        // Save the updated user document
        await user.save();
    
        res.redirect("/User-address")
      } catch (err) {
        console.error(err);
        res.status(500).send('Error finding/updating user.');
      }
  };
  // POST
  exports.updateAddress = async (req, res) => {
    try {
      const id = req.params.id;
      const userId = req.session.user?._id;
      const { name, address, mobile, pincode, city, state } = req.body;
      
  
      // Find the user by their ID
      const user = await userData.findById(userId);
      
  
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      // Find the address to update
      const addressToUpdate = user.address.id(id);
      
  
      if (!addressToUpdate) {
        return res.status(404).json({ error: 'Address not found' });
      }
  
      // Update the address properties
      addressToUpdate.name = name;
      addressToUpdate.address = address;
      addressToUpdate.mobile = mobile;
      addressToUpdate.pincode = pincode;
      addressToUpdate.city = city;
      addressToUpdate.state = state;
  
      // Save the updated user
      await user.save();
  
      res.redirect("/User-address")
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Server error' });
    }
  };

  // POST User details update in profile page

  exports.userDetialsUpdate = async (req,res)=>{
    try {
      const {id}= req.params
      const {name,email,mobile} = req.body

      const userdetails = await userData.findByIdAndUpdate(id,{
        name:name,
        email:email,
        mobile:mobile
      })

      if (userdetails) {
        res.redirect("/user-profile")
      }

      
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: 'Server error' });
    }
  }


  // Profite Get

  exports.getProfile = async (req,res)=>{
    if (req.session.user) {
      try {
          const user = req.session.user
          const id = req.session.user?._id
          const userdetails = await userData.findOne({_id:id})
          res.render("User-profile",{userdetails,user})
      } catch (error) {
          console.log(error);
          res.status(500).send("Server Error")
      }
      
    }else{
        res.redirect("/user-logout")
    }
  }

  // POST profile address update

  exports.updateProfileAddress = async (req, res) => {
    try {
      const id = req.params.id;
      const userId = req.session.user?._id;
      const { name, address, mobile, pincode, city, state } = req.body;
     
  
      // Find the user by their ID
      const user = await userData.findById(userId);
      
  
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      // Find the address to update
      const addressToUpdate = user.address.id(id);
      
  
      if (!addressToUpdate) {
        return res.status(404).json({ error: 'Address not found' });
      }
  
      // Update the address properties
      addressToUpdate.name = name;
      addressToUpdate.address = address;
      addressToUpdate.mobile = mobile;
      addressToUpdate.pincode = pincode;
      addressToUpdate.city = city;
      addressToUpdate.state = state;
  
      // Save the updated user
      await user.save();
  
      res.redirect("/user-profile")
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Server error' });
    }
  };

  // POST add new address in profile page

  exports.addAddressProfile = async (req, res) => {

    try {
        const userId = req.session.user?._id
        const { name, address, mobile, pincode, city, state } = req.body
    
        // Find the user by a specific identifier
        const user = await userData.findOne({_id:userId});

        
    
        if (!user) {
          res.status(404).send('User not found.');
          return;
        }
    
        // Push the new address data to the existing address array
        user.address.push({ name, address, mobile, pincode, city, state });
    
        // Save the updated user document
        await user.save();
    
        res.redirect("/user-profile")
      } catch (err) {
        console.error(err);
        res.status(500).send('Error finding/updating user.');
      }
  };

  // delete user address

  exports.deleteAddress = async (req,res) =>{
      try {
        // Find the user document by ID
        const userId = req.session.user?._id
        const addressId = req.params.id

        const user = await userData.findById(userId);
    
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
    
        // Find the index of the address with the specified _id in the array
        const addressIndex = user.address.findIndex(address => address._id.toString() === addressId);
    
        if (addressIndex === -1) {
          return res.status(404).json({ error: 'Address not found' });
        }
    
        // Remove the address from the array
        user.address.splice(addressIndex, 1);
    
        // Save the updated user document
        await user.save();
    
        res.redirect('/user-profile'); // Redirect to a suitable page after successful deletion
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
      }
    }
      

  


  // GET checkout rendering page

  exports.checkout = async (req, res) => {
    if (req.session.user) {
      try {
        const id = req.params.id;
        const userId = req.session.user?._id; 
        const user = req.session.user
  
        const userdata = await userData.findOne(
          { _id: userId },
          { address: { $elemMatch: { _id: id } } }
        )

        const coupon = await Coupon.find()

        const cart = await Cart.findOne({userId:userdata}).populate("products.productId")

  
        if (userdata) {
          const address = userdata.address[0]; // Get the first (and only) address matching the query
  
          
          res.render('checkout',{user,cart,address,coupon});
        } else {
          res.status(404).send('Address not found');
        }
      } catch (error) {
        console.log(error);
        res.status(500).send('Server Error');
      }
    } else {
      res.redirect('/login');
    }
  };


// order comfirm page after pressing place order POST

let paypalTotal = 0
exports.placeorder = async (req,res)=>{
  if(req.session.user){
    try {

      const user = req.session.user
      const userId = req.session.user?._id
      const id = req.params.id
      const payment = req.body.payment

    const Currentuser = await userData.findOne({ _id: userId });
      if (!Currentuser) {
        return res.status(404).send('User not found');
      }
    const addressIndex = Currentuser.address.findIndex((item)=> item._id.equals(id))

    const specifiedAddress = Currentuser.address[addressIndex]

      if (!specifiedAddress) {
        return res.status(404).send('Address not found');
      }


      const cart = await Cart.findOne({userId: userId}).populate("products.productId")
      

      const wallet = await Wallet.findOne({userId:userId})

      const discount = cart.discount
      const walletDicount = cart.wallet

      const items = cart.products.map(item =>{
        const product = item.productId;
        const quantity = item.quantity;
        const price = product.price;

        if (!price) {
          throw new Error("Product price is required");
        }
        if (!product) {
          throw new Error("Product is required");
        }
  
        return {
          product: product._id,
          quantity: quantity,
          price: price,
        }
        
      })


      let totalPrice = 0;
      items.forEach((item) => {
        totalPrice += item.price * item.quantity;
      });

      if(discount){
        totalPrice -= discount
      }

      if (walletDicount) {
        totalPrice -= walletDicount
        wallet.balance-=walletDicount
  
        await wallet.save()
      }


      if(payment == "COD"){

        const order = new Order({
          user: userId,
          items: items,
          total: totalPrice,
          status: "Pending",
          payment_method: payment,
          createdAt: new Date(),
          
          address: specifiedAddress,
        });
  
        await order.save()



  
        await Cart.deleteOne({userId:userId})
  
  
        res.render("order_comfirm",{user,userId})

      }else if (payment == "paypal") {
        const order = new Order({
          user: userId,
          items: items,
          total: totalPrice,
          status: "Pending",
          payment_method: payment,
          createdAt: new Date(),
          
          address: specifiedAddress,
        });
  
        await order.save()

        cart.products.forEach((element) => {
          paypalTotal += totalPrice;
        });

        let createPayment = {
          intent: "sale",
          payer: { payment_method: "paypal" },
          redirect_urls: {
            return_url: "http://localhost:3000/paypal-success",
            cancel_url: "http://localhost:3000/paypal-err",
          },
          transactions: [ 
            {
              amount: {
                currency: "USD",
                total: (paypalTotal / 82).toFixed(2), // Divide by 82 to convert to USD
              },
              description: "Super User Paypal Payment",
            },
          ],
        };

        paypal.payment.create(createPayment, function (error, payment) {
          if (error) {
            console.log(error);
            throw error;
            
          } else {
            for (let i = 0; i < payment.links.length; i++) {
              if (payment.links[i].rel === "approval_url") {
                res.redirect(payment.links[i].href);
              }
            }
          }
        });
        await Cart.deleteOne({ userId: userId });
        
      }
  
  
      } catch (error) {
        console.log(error);
        res.status(500).send("network error")
      }
  
    } else {
      res.redirect("/login")
    }
  }


  exports.paypal_success= async(req,res)=>{
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;
    const user = req.session.user
    const userId = req.session.user?._id

    // const data = await userData.findOne(userId)
  
   
   
    
    
  
    const execute_payment_json = {
      "payer_id": payerId,
      "transactions": [{
          "amount": {
            "currency": "USD",
              "total": paypalTotal
          }
      }]
    };
    paypal.payment.execute(paymentId, execute_payment_json, function  (error, payment) {
      //When error occurs when due to non-existent transaction, throw an error else log the transaction details in the console then send a Success string reposponse to the user.
  
      
  
    if  (error)  {
        console.log(error.response);
        throw error;
    } else  {

      // req.session.user = data
      
      res.render("paypalSuccess",{payment,user, userId,})
    }
  });
  
  }
  
  
  exports.paypal_err=(req,res)=>{
    console.log(req.query);
    res.send("error")
  }
  
        
  


// Razorpay 

// exports.generateRazorpay  =  (orderId, total) => {
//   return new Promise((resolve, reject) => {
//     var options = {
//       amount: parseInt(total) * 100,
//       currency: 'INR',
//       receipt: orderId
//     }
//     instance.orders.create(options, function (err, order) {
//       if (err) {
//         console.log(err);
//       } else {
//         resolve(order)
//       }
//     })
//   })
// }



// order details page

exports.ordersDetails = async (req,res)=>{
  if (req.session.user) {

    try {
      const userId = req.session.user?._id
      const user = req.session.user

      const orders = await Order.find({user:user}).populate("items.product")

      const orderDetails = orders.map((order) => {
        return {
          _id: order._id,
          items: order.items,
          total: order.total,
          status: order.status,
          payment_method: order.payment_method,
          createdAt: order.createdAt,
          address: order.address,
          returnExpired: order.returnExpired,
        };
      });

      
      res.render("order_details",{orderDetails,user})

    } catch (error) {
      console.log(error);
      res.status(500).send("network error")

    }

  }else{
    res.redirect("/login")
  }
}

// coupon 

exports.redeemCoupon = async (req, res) => {
  const { coupon } = req.body;
  const userId = req.session.user?._id

  const couponFind = await Coupon.findOne({ code: coupon });
  const userCoupon = await userData.findOne({_id:userId});

  if (userCoupon.coupon.includes(coupon)) {
    return res.json({
      success: false,
      message: 'Coupon Already used'
    });
  }

  if (!couponFind || couponFind.status === false) {
    return res.json({
      success: false,
      message: couponFind ? 'Coupon Deactivated' : 'Coupon not found'
    });
  }
  userCoupon.coupon.push(coupon);
  await userCoupon.save();

  const currentDate = new Date();
  const expirationDate = new Date(couponFind.expiryDate);

  if (currentDate > expirationDate) {
    return res.json({
      success: false,
      message: 'Coupon Expired'
    });
  }

  const amount = couponFind.discount;

  res.json({
    success: true,
    message: 'Coupon available',
    couponFind,
    amount: parseInt(amount)
  });


  try {
    
    const cart = await Cart.findOne({userId:userId})
    cart.discount=amount
   
    if (!cart) {
      
      return; // or throw an error
    }
  
    cart.discount = amount;

    await cart.save();

  } catch (error) {
    console.error("Error updating cart:", error);
    // handle the error appropriately
  }
  

};

exports.singleOrderDetails = async (req,res)=>{
  if (req.session.user) {
    try {
      const user = req.session.user
      const id = req.params.id

      const order = await Order.findById(id).populate('user').populate('items.product').populate('items.quantity')

      res.render("Single-orderDetails",{order, user})
    } catch (error) {
      console.log(error);
      res.status(500).send("Server Error")
      
    }
  }else{
    res.redirect("/")
  }

}

// Order Cancel and Refund to wallet GEt

exports.orderCancel = async (req,res) =>{
  try {
    const id = req.params.id

    const order = await Order.findByIdAndUpdate(id,{
      status:"Cancelled"

    },{new:true})

  

    const wallet = await Wallet.findOne({userId:order.user})
    if(wallet){
      wallet.balance += order.total
      wallet.transactions.push(order.payment_method)

      await wallet.save()
    }else{
      const newWallet = new Wallet({
        userId: order.user,
        orderId: order._id,
        balance: order.total,
        transactions: [order.payment_method]
      })
      await newWallet.save()
    }

    await Order.updateOne({ _id: id }, { $set: { status: 'Refunded Amount' } });

    if (order) {
      res.redirect("/orders-details")
    }

    
  } catch (error) {
    console.log(error);
    res.status(501).send("Server Error")
  }
}

// Order Return GET

exports.orderReturn = async (req,res) =>{
  try {
    const id = req.params.id
    const order = await Order.findByIdAndUpdate(id,{
      status:"Returned"

    },{new:true})

    res.redirect("/orders-details")
    
  } catch (error) {
    console.log(error);
    res.status(501).send("Server Error")
    
  }

}

// Invoice page render GET
exports.invoice = async (req,res)=>{
  if(req.session.user){
    try {
      const {id}= req.params
      const user = req.session.user

      const order = await Order.findById(id).populate('user').populate('items.product').populate('items.quantity')

      res.render("invoice",{order,user})

      
    } catch (error) {
      console.log(error);
      res.status(500).send("Server Error")
    }
  }else{
    res.redirect("/")
  }
}

// Wallet page render GET
exports.wallet = async (req,res) =>{
  if(req.session.user){
    try {
      const userId = req.session.user?._id
      const user = req.session.user
      let sum = 0

      const walletbalance = await Wallet.findOne({ userId: userId }).populate('orderId');
      const orderdetails = await Order.find({ user: userId, status: "Refunded Amount" }).populate('items.product');
      
     
      

      if (walletbalance) {
        sum += walletbalance.balance;
      }

      
      res.render("wallet", { user, wallet: walletbalance?.orderId, sum, walletbalance, orderdetails })

    } catch (error) {
      console.log(error);
      res.status(500).send("Server Error")
    }
  }else{
    res.redirect("/login")
  }
}


// Pay using Wallet balance POST
exports.walletPay = async (req,res)=>{
  try {

    const userId = req.session.user?._id

    const wallet = await Wallet.findOne({userId:userId})
    const cart = await Cart.findOne({userId:userId}).populate("products.productId")


    let totalPrice = 0
    
    const items = cart.products.map(item =>{
      const product = item.productId;
      const quantity = item.quantity;
      const price = item.productId.price
     
     
      totalPrice += price * quantity;

    })

    
    let balance = (10 / 100) * totalPrice;

     let wallet_balance= wallet.balance
      if (balance <  wallet.balance) {
        totalPrice -= balance;
        cart.wallet = balance;
        await cart.save();

        

        // wallet.balance-=balance

        
        // await wallet.save();
        // console.log( wallet.balance,"after");
     }

     res.json({
      success: true,
      message: "Wallet add Successful",
      totalPrice,
      wallet_balance
    });

  } catch (error) {
    console.log(error);
    res.status(500).json("Server Error")
  }
}

//wishlist get
exports.getWishlist = async  (req,res)=>{
  if (req.session.user) {
    try {
      const user = req.session.user
      const userId = req.session.user?._id

      const wishlistData = await Wishlist.findOne({userId:userId}).populate('products.productId')

      if(wishlistData!==null){
        let products = wishlistData.products
        res.render("wishlist",{user,products,wishlistData})
      }else{
        res.render("wishlist",{user,wishlistData})

      }

        
      } catch (error) {
        console.log(error);
      }
  }else{
    res.redirect("/login")
  }
}

// add to wishlist

exports.addToWishlist = async (req,res)=>{
  try {
    
    const productId = req.params.id
    const userId = req.session.user

    let userWishlist = await Wishlist.findOne({userId:userId})

  if (!userWishlist) {
      // If the user's cart doesn't exist
      //creat new one
      let newWishlist = new Wishlist({ userId: userId, products: [] });
      await newWishlist.save();
      userWishlist = newWishlist;
  }

  const productIndex = userWishlist.products.findIndex(
      (product) => product.productId == productId

  );
  

  if (productIndex === -1) {
    // If the product is not in the wishlist, add it
    userWishlist.products.push({ productId: productId, quantity: 1 });
  } else {
    // If the product is already in the wishlist, increase its quantity by 1
    userWishlist.products[productIndex].quantity += 1;
  }
  
    

  const result = await userWishlist.save();


  res.status(200).json({ message: 'Product added to wishlist successfully' });

  } catch (error) {
    console.log(error);
  }
}

exports.removeItemWishlist = async (req,res)=>{
  try {
    const productId = req.params.id
    const userId= req.session.user?._id
    

    const productDeleted = await Wishlist.findOneAndUpdate(
        {userId: userId},
        {$pull:{ products:{productId: productId}}},
        {new: true}
    )
    
    if(productDeleted){
      res.json({
        success:true,
        message:"Remove item",
      })
    }else{
       
        res.json({
          success:false,
          message:"failed to Remove item",
        })
    }

  } catch (error) {
      console.log(error);
      res.status(500).send("Server Error")
      
  }
}
