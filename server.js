const express = require('express')

const db = require('./db')
const session = require('express-session')
const betterSqlite = require("better-sqlite3")
const SqliteStore = require('better-sqlite3-session-store')(session)
const csrf = require('csurf')
const flash = require('connect-flash')
require("dotenv").config()

//Importing routes
const authRouter = require("./routes/authRouter")
const mainRouter = require("./routes/mainRouter")

const sessionsDB = new betterSqlite("sessions.db")

const app = express()

app.set("view engine", "ejs")
app.use(express.static('public'))

const csrfProt = csrf()

app.use(session({ secret: "mySecret", resave: false, saveUninitialized: false, store: new SqliteStore({ client: sessionsDB }) }))

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use(csrfProt)
app.use(flash())

//Passing csrfToken to all requests
app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken()

    next()
})

app.use("/auth", authRouter)
app.use("/", mainRouter)

//If entered only domain, it will be redirected to login
app.get("/", (req, res) => {
    res.redirect('/auth/login')
})

//Error handling
app.get("/*", (req, res, next) => {
    res.status(404)
    throw new Error("Page not found");
})

app.use((err, req, res, next) => {
    if (res.statusCode === 404) {
        return res.render("pages/pageNotFound", { message: err.message })
    }
    
    res.send({message: "Unhandled message"})
})

app.listen(3000, () => console.log("Server is running"))