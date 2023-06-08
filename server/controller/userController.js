const userData = require('../model/model')
const Cart = require('../model/cart_model')
const Product = require('../model/product_model')
const Order = require("../model/order_model")
const paypal=require('paypal-rest-sdk')

// Add to cart fuction
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
            res.redirect("/shoping-cart")
        }else{
            console.log("product not deleled");
        }

    } catch (error) {
        console.log(error);
        res.status(500).send("Server Error")
        
    }

}

exports.incrementQuantity = async (req,res)=>{
    console.log("quantity incre");
    const userId = req.session.user?._id
    const cartId = req.body.cartId
    console.log(userId);

    try {
        let cart = await Cart.findOne({userId: userId}).populate("products.productId")

          // console.log(cart);

        let cartIndex = cart.products.findIndex(items=> items.productId.equals(cartId))
        console.log(cartIndex);
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

    console.log("quantity decre");
  
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

            // id have to pass with object
            const data = await userData.findOne({_id:userId})


            res.render("User-address", {data: data.address})
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

        console.log(user);
    
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
      console.log(id);
  
      // Find the user by their ID
      const user = await userData.findById(userId);
      console.log(user);
  
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      // Find the address to update
      const addressToUpdate = user.address.id(id);
      console.log(addressToUpdate);
  
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
  


  // GET checkout rendering page

  exports.checkout = async (req, res) => {
    if (req.session.user) {
      try {
        const id = req.params.id;
        const userId = req.session.user?._id; 
  
        const user = await userData.findOne(
          { _id: userId },
          { address: { $elemMatch: { _id: id } } }
        )

        const cart = await Cart.findOne({userId:user}).populate("products.productId")

  
        if (user) {
          const address = user.address[0]; // Get the first (and only) address matching the query
  
          console.log(address);
          res.render('checkout',{user,cart,address});
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


// order comfirm page after pressing place order

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
      console.log("hhdhdh");
      console.log(id);
      console.log("hhdhdh");

      const cart = await Cart.findOne({userId: userId}).populate("products.productId")
      cart ? console.log(cart) : console.log("Cart not found");

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
  
    console.log(paypalTotal);
   
    
    
  
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
      
      console.log(JSON.stringify(payment));

      
      
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

      console.log(orderDetails);
      
      res.render("order_details",{orderDetails,user})

    } catch (error) {
      console.log(error);
      res.status(500).send("network error")

    }

  }else{
    res.redirect("/login")
  }
}

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

exports.orderCancel = async (req,res) =>{
  try {
    const id = req.params.id

    const order = await Order.findByIdAndUpdate(id,{
      status:"Cancelled"

    },{new:true})

    console.log(order);

    res.redirect("/orders-details")
  } catch (error) {
    console.log(error);
    res.status(501).send("Server Error")
  }
}

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

