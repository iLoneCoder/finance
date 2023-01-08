const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer')

const generateToken = (email) => {
    return jwt.sign({
        email
    }, process.env.MY_SECRET, { expiresIn: "10m" })
}


const transporter = nodemailer.createTransport({
    host: "smtp-mail.outlook.com",
    port: 587,
    secure:false,
    auth: {
        user: process.env.MY_MAIL,
        pass: process.env.MY_MAIL_PASS
    }

})


module.exports = {
    generateToken,
    transporter
}