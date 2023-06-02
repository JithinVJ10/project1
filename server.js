const express = require("express")
const path = require("path")
const ejs = require("ejs")
const session = require("express-session")
const nocache = require("nocache")
require('dotenv').config()
const paypal=require('paypal-rest-sdk')

const routeUser = require("./server/route/routeUser")
const routeAdmin = require("./server/route/routeAdmin")
const connectDB = require("./server/database/connection")
const twilioRoute = require("./server/route/twilio-sms")

const app = express()

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

// data getting throught body
app.use(express.urlencoded({extended:true}))
app.use(express.json());

app.use('/twilio-sms',twilioRoute)
// view engine setting up
app.set("view engine", "ejs")
app.set("views",[
    __dirname + "/views/user",
    __dirname + "/views/admin"
])

// database collection
connectDB()

// path setup for assets
app.use(express.static(path.join(__dirname,"public")))

app.use(express.static("uploads"))

app.use(nocache())

// session
app.use(session({
    secret:"mySecret",
    resave:false,
    saveUninitialized:true,
    cookie:{sameSite:"strict"}
}))

paypal.configure({
    'mode':'sandbox',
    'client_id':PAYPAL_CLIENT_ID,
    'client_secret':PAYPAL_CLIENT_SECRET

  })


// user and admin route
app.use("/", routeUser)
app.use("/",routeAdmin)
app.use("/",require("./server/route/twilio-sms"))

app.listen(3000,()=>console.log("Server Start"))