const jwt = require('jsonwebtoken')
const flash = require('connect-flash')

exports.verifyToken = (req, res, next) => {
    let { token } = req.params

    try {
        if (!token) {
            token = req.body.token
        }

        if (!token) {
            throw new Error("Provide token!")
        }

        const decoded = jwt.verify(token, process.env.MY_SECRET)
        req.email = decoded.email

        next()
    } catch (error) {
        req.flash('error', `${error.message}`)
        return res.redirect("/auth/forgot-password")
    }

}