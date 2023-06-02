const mongoose = require("mongoose")

const connectDB = async () =>{
    try {
        const con = await mongoose.connect("mongodb://127.0.0.1:27017/Project",{
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })

        console.log("MongoDB Connected");
    } catch (err) {
        console.log(err);
        process.exit(1)
    }
}

module.exports = connectDB