const bcrypt = require('bcryptjs')
const db = require("../db")

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
    const { username, password, confPassword } = req.body
    let sql
    try {
        //Checking if we get all required data
        if (!username || !password || !confPassword) {
            req.flash("error", "Provide all required data")
            return res.redirect("/auth/register")
        }

        //Chaking password confirmation
        if (password !== confPassword) {
            req.flash("error", "Confirm password carefully")
            return res.redirect("/auth/register")
        }
        sql = "SELECT * FROM users WHERE username=?"

        //Looking for username
        db.get(sql, [username], async (err, row) => {
            if (err) {
                res.status(500)
                throw new Error("Something went wrong in registration process, please try again")
            }

            if (!row) {
                const hashedPassword = await bcrypt.hash(password, 12)
                sql = "INSERT INTO users (username, password) VALUES (?,?)"
                //If username is unic we create new user
                db.run(sql, [username, hashedPassword], err => {
                    if (err) {
                        res.status(500)
                        throw new Error("User wasn't registered, try again")
                    }

                    res.redirect("/auth/login")
                })

            } else {
                req.flash('error', 'User has already been registered. Use another username')
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
                    req.session.cookie.maxAge =1 * 60 * 60 * 1000
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