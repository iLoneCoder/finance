const bcrypt = require('bcryptjs')
const db = require("../db")

const { generateToken, transporter } = require('../util-functions/someUsefullStuff')

exports.getRegister = (req, res) => {
    if (req.session.loggedIn) {
        return res.redirect("/home")
    }
    let message = req.flash('error')
    message = message.length > 0 ? message[0] : null
    res.render("pages/register", { message })
}

exports.getLogin = (req, res) => {
    if (req.session.loggedIn) {
        return res.redirect("/home")
    }

    let message = req.flash("error")
    message = message.length > 0 ? message[0] : null
    res.render("pages/login", { message })
}

exports.postRegister = async (req, res) => {
    const { username, email, password, confPassword } = req.body
    let sql
    try {

        //Checking if email has valid email form
        if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
            req.flash('error', 'Provide email in appropriate form')
            return res.redirect("/auth/register")
        }
        //Checking if we get all required data
        if (!username || !email || !password || !confPassword) {
            req.flash("error", "Provide all required data")
            return res.redirect("/auth/register")
        }

        //Chaking password confirmation
        if (password !== confPassword) {
            req.flash("error", "Confirm password carefully")
            return res.redirect("/auth/register")
        }
        sql = "SELECT * FROM users WHERE username=? OR email=?"

        //Looking for username
        db.get(sql, [username, email], async (err, row) => {
            if (err) {
                res.status(500)
                throw new Error("Something went wrong in registration process, please try again")
            }

            if (!row) {
                const hashedPassword = await bcrypt.hash(password, 12)
                sql = "INSERT INTO users (username, email, password) VALUES (?,?,?)"
                //If username is unic we create new user
                db.run(sql, [username, email, hashedPassword], err => {
                    if (err) {
                        res.status(500)
                        throw new Error("User wasn't registered, try again")
                    }

                    res.redirect("/auth/login")
                })

            } else {
                req.flash('error', 'User has already been registered. Use another username or email')
                res.redirect("/auth/register")
            }
        })

    } catch (error) {
        const statusCode = res.statusCode !== 200 ? res.statusCode : 500
        res.status(statusCode).json({ message: error.message })
    }
}

exports.postlogin = (req, res) => {
    const { username, password } = req.body
    let sql
    try {
        if (!username || !password) {
            req.flash("error", "Provide all required data")
            return res.redirect("/auth/login")
        }

        sql = `SELECT id, username, password FROM users WHERE username=?`
        db.get(sql, [username], async (err, row) => {
            if (err) {
                req.flash("error", "Something wrong try again")
                return res.redirect("/auth/login")
            }

            if (row) {

                const compared = await bcrypt.compare(password, row.password)

                if (compared) {
                    req.session.loggedIn = true
                    req.session.cookie.maxAge = 1 * 60 * 60 * 1000
                    req.session.userId = row.id
                    res.redirect("/home")
                } else {
                    req.flash("error", "Wrong username or password")
                    return res.redirect("/auth/login")
                }

            } else {
                req.flash("error", "Wrong username or password")
                return res.redirect("/auth/login")
            }
        })
    } catch (error) {
        const statusCode = res.statusCode !== 200 ? res.statusCode : 500
        res.status(statusCode).json({ message: error.message })
    }

}

exports.logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect("/auth/login")
    })
}

exports.getFrogotPassword = (req, res) => {
    let message = req.flash('error')
    message = message.length > 0 ? message[0] : null
    res.render('pages/forgotPassword', { message })
}


exports.postForgotPassword = async (req, res) => {
    const { email } = req.body

    if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
        console.log("not")
        req.flash("error", "Provide email in appropriate form")
        return res.redirect('/auth/forgot-password')
    }

    const token = generateToken(email)
    try {
        await transporter.sendMail({
            from: `ShareMan ${process.env.MY_MAIL}`,
            to: email,
            subject: `Update password`,
            text: `If you haven't send this mail ignore it`,
            html: `
                <h1>Hello</h1>
                <p>To update password on your account follow the link below. Please, don't send/show this link to anyone</p>
                <p>If you want new password <a href=${process.env.MY_DOMAIN}/auth/update-password/${token} target="_blank">click here</a></p>
            `
        })

        return res.redirect('/auth/login')
    } catch (error) {
        console.log(error)
        return res.redirect('/auth/login')
    }

}

exports.getUpdatePassword = (req, res) => {
    const { token } = req.params
    let message = req.flash('error')
    message = message.length > 0 ? message[0] : null
    res.render("pages/updatePassword", { message, token })
}

exports.postUpdatePassword = async (req, res) => {
    const { password, confPassword, token } = req.body

    if ((!password || !confPassword) || password !== confPassword) {
        req.flash('error', "Provide correct data")
        return res.redirect(`/auth/forgot-password/${token}`)
    }
    let sql = `UPDATE users SET password=? WHERE email=?`
    if (req.email) {
        const hashedPassword = await bcrypt.hash(password, 12)
        db.run(sql, [hashedPassword, req.email], err => {
            if (err) return console.error(console.log(err.message))
            console.log("changed")
            return res.redirect("/auth/login")
        })
    }

}