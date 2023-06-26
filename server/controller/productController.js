const multer = require("multer")
const Product = require("../model/product_model")
const fs = require("fs")
const Catagory = require("../model/add_catagery")
const sharp = require("sharp")


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
      res.redirect('/admin')
  }
}


exports.addproduct = async (req,res)=>{
    try {

      const {name,catagory,description,price} =req.body
      const photo = req.files.map((file) => file.filename)

      if (name=="") {
        return res.render("add-products",{msg:"Please enter the name"})
      }
      if (catagory=="") {
        return res.render("add-products",{msg:"Please Select the catagory"})
      }
      if (description=="") {
        return res.render("add-products",{msg:"Please enter the description"})
      }
      if (price=="") {
        return res.render("add-products",{msg:"Please input the price"})
      }
      if (photo=="") {
        return res.render("add-products",{msg:"Please insert the photo"})
      }

        
        const product = new Product({
            name: name,
            catagory:catagory,
            description:description,
            price:price,
            photo:photo,
            blocked:false
        })

        // Crop and save each uploaded image
        const croppedImages = [];
    
        for (const file of req.files) {
          const croppedImage = `cropped_${file.filename}`;
    
          await sharp(file.path)
            .resize(500, 600, { fit: 'cover' })
            .toFile(`uploads/${croppedImage}`);
    
            
          croppedImages.push(croppedImage);
        }
    
        product.photo = croppedImages;
  
  

        await product.save()
        res.redirect("/products-admin")

    } catch (err) {
        console.log(err);
        res.status(500).send({
            message:err.message ||"some error while adding products"
        })
    }
}

// get method to render update product page with products
exports.updateProduct = async (req,res)=>{

  if (req.session.admin) {
    try {
      const { id } = req.params
      const product = await Product.findById(id)
      const catagory = await Catagory.find()
  
      if (!product) {
        console.log("No products");
        return res.redirect("/products-admin")
      }

      return res.render("updateProducts", { product,catagory })
  
  
    } catch (err) {
      console.error(err);
      return res.redirect('/products-admin');
    }
  }else{
    console.log("No session");
    res.redirect("/products-admin")

  }

}


// POST prduct update submit

exports.updProduct = async (req, res) => {
  if (req.session.admin) {
    try {
      const id = req.params.id;

      const files = req.files; // Assuming req.files contains the uploaded file(s)

      // Check if files were uploaded
      if (files && files.length > 0) {
        const newImages = files.map(file => file.filename);

        // Delete the previous images
        if (req.body.photos && req.body.photos.length > 0) {
          req.body.photos.forEach(photo => {
            try {
              fs.unlinkSync('./uploads/' + photo);
            } catch (error) {
              console.log(error);
            }
          });
        }

        // Crop and save the new images
        for (const file of files) {
          const newImage = file.filename;

          // Perform image cropping
          const croppedImageBuffer = await sharp(file.path)
            .resize({ width: 500, height: 600 })
            .toBuffer();

          // Save the cropped image to disk
          fs.writeFileSync('./uploads/' + newImage, croppedImageBuffer);

          newImages.push(newImage);
        }

        // Update the product's photo using findByIdAndUpdate
        const updatedProduct = await Product.findByIdAndUpdate(
          id,
          {
            name: req.body.name,
            catagory:req.body.catagory,
            description:req.body.description,
            price:req.body.price,
            photo: newImages,
            blocked:req.body.blocked || false
          },
          { new: true }
        );

        if (updatedProduct) {
          console.log('Product photo updated');
          res.redirect('/products-admin');
        } else {
          // If product not found
          console.log('Product not found');
          res.redirect('/products-admin');
        }
      } else {
        console.log('No file uploaded');
        res.redirect('/products-admin');
      }
    } catch (error) {
      console.error(error);
      res.send(error);
    }
  } else {
    console.log('Session not found');
    res.redirect('/admin');
  }
};


// exports.updProduct = async (req, res) => {
//   if (req.session.user) {
//     try {
//       const id = req.params.id
      
//       let new_image = "";
//       if (req.file) {
//         new_image = req.file.filename;
//         try {
//           fs.unlinkSync("./uploads/" + req.body.photo);
//         } catch (error) {
//           console.log(error);
//         }
//       } else {
//         new_image = req.body.photo;
//       }
  
  
//       // Update the product using findByIdAndUpdate
//       const updatedProduct = await Product.findByIdAndUpdate(
//         id,
//         {
//           name: req.body.name,
//           catagory:req.body.catagory,
//           description:req.body.description,
//           price:req.body.price,
//           photo:new_image 
//         },
  
//         { new: true }
  
//       );
      
      
//       // Set { new: true } to return the updated document
  
//       if (updatedProduct) {
//         console.log("Product updated");
//         res.redirect("/products-admin");
//       } else {
//         // if Product not found
//         console.log("Product not found");
//         res.redirect("/products-admin");
//       }
//     } catch (error) {
//       console.error(error);
//       res.send(error);
//     }
    
//   }else{
//     console.log("Session No");
//     res.redirect("/products-admin")
//   }




// }

exports.blockProduct=async(req,res)=>{
  try{
    const id=req.params.id;
    
    const result = await Product.findByIdAndUpdate(
      id,
      {
        blocked: true,
      },

      { new: true }

    );


    if(result){
      console.log("pdt blocked");
      res.json({ success: true })
    }
    else{
      console.log("failed to pdt blocked");
      res.json({ success: false, message: "product not found" });
    }
  }
  catch(err){
    res.status(500).send(err.message);
  }
}

exports.unBlockProduct=async(req,res)=>{
  try{
    const id=req.params.id;
    
    const result = await Product.findByIdAndUpdate(
      id,
      {
        blocked: false,
      },

      { new: true }

    );


    if(result){
      console.log("pdt unblocked");
      res.json({ success: true });
    }
    else{
      console.log("failed to pdt unblocked");
      res.json({ success: false, message: "product not found" });
    }
  }
  catch(err){
    res.status(500).send(err.message);
  }
}


// catagory

exports.addcatagory=async(req,res)=>{
  try{
    const newCatagory = req.body.catagory.toLowerCase()
    const capitalizedCatagory = newCatagory.charAt(0).toUpperCase() + newCatagory.slice(1);
    const existing = await Catagory.findOne({catagory:newCatagory})

    if (existing) {

      console.log('Catagory Already Exist');
      return res.json({
        success: false,
        message: 'Catagory Already Exist'
      });
    }

    const catagory =new Catagory({
      catagory:capitalizedCatagory,
      description:req.body.description
    })
    const savedCatagory = await catagory.save();

    res.json({
      success: true,
      message: 'Category Added Successfully',
      category: savedCatagory,
    });
  }
  catch(err){
    console.log("can't add");
    console.log(err);
    res.status(500).send({
      message: "Some error occurred while creating a create operation",
    });
  }
     
}

// update catagory

exports.updateCatagory = async (req,res)=>{
  try {
    const id = req.params.id
    const updatedCatagory = req.body.catagory 

    const existing = await Catagory.findOne({catagory:updatedCatagory})

    if (existing) {
      return res.json({
        success: false,
        message: 'Catagory Already Exist'
      });
    }
    const updatedCata = await Catagory.findByIdAndUpdate(id,{
      catagory:updatedCatagory
    })

    if (updatedCata) {
      return res.json({
        success: true,
        message: 'Catagory Successfully Updated'
      });
    }else{
      return res.json({
        success: false,
        message: 'Not Updated'
      });
    }
  } catch (err) {
    res.status(500).send(err.message)
  }
}

// delete catagory

exports.deleteCategory = async (req, res) => {
  try {
    const id = req.params.id;
    const deleteCategory = await Catagory.findByIdAndRemove(id);

    if (deleteCategory) {
      // Category deleted successfully
      console.log("Cata del successfully");
      res.json({ success: true });
    } else {
      // Category not found or failed to delete
      console.log("Cata del failed");
      res.json({ success: false });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
