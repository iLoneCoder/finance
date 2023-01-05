const axios = require("axios")
const db = require("../db")

const { myRound } = require("../util-functions/myMath")
const { retrieveShareData } = require("../util-functions/retrieveShareData")
exports.getHome = (req, res) => {
    let message = req.flash('notification')
    message = message.length > 0 ? message[0] : null
    const userShares = []
    let sql
    //Find user and amount on account
    sql = `SELECT * FROM users WHERE id=?`
    db.get(sql, [req.session.userId], (err, row) => {
        if (err) return console.error(err.message)

        if (row) {
            sql = `
            SELECT
                symbol,
                name,
                quantity AS shares,
                ROUND(amount/quantity, 2) AS price,
                amount AS total
            FROM shares
            WHERE user_id=?
            `
            db.each(sql, [req.session.userId], (err, shareRow) => {
                if (err) return console.error(err.message)
                shareRow.price = myRound(shareRow.price, 2).toFixed(2)  // Number(Math.round(shareRow.price + 'e2') + 'e-2').toFixed(2)
                shareRow.total = myRound(shareRow.total, 2).toFixed(2) // Number(Math.round(shareRow.total + 'e2') + 'e-2').toFixed(2)
                userShares.push(shareRow)
            },
                (err, numberOfRows) => {
                    if (err) return console.error(err.message)

                    const amountOnAccount = myRound(row.amount, 2).toFixed(2) //Number(Math.round(row.amount + 'e2') + 'e-2').toFixed(2)

                    if (numberOfRows === 0) {
                        return res.render("pages/home", { userShares, message: "", amountOnAccount })
                    } else {
                        // console.log(userShares)
                        res.render("pages/home", { userShares, message, amountOnAccount })
                    }
                })
        } else {
            res.redirect("/auth/login")
        }
    })

}

exports.getQuote = (req, res) => {
    let message = req.flash("error")
    message = message.length > 0 ? message[0] : null
    res.render("pages/quote", { errorMessage: message, message: "" })
}

exports.postQuote = async (req, res) => {
    const { quote } = req.body

    try {

        if (!quote) {
            req.flash("error", "Enter quote!")
            return res.redirect("/quote")
        }

        const response = await axios.get(`https://api.iex.cloud/v1/data/core/quote/${quote}/?token=${process.env.API_KEY}`)

        if (Object.keys(response.data[0]).length === 0) {
            res.render("pages/quote", { message: "Wrong symbol", errorMessage: "" })
        } else {
            res.render("pages/quote", {
                success: true, message: `A share of  ${response.data[0].companyName} (${response.data[0].symbol}) costs \$${response.data[0].latestPrice}`,
                errorMessage: ""
            })
        }

    } catch (error) {
        const message = error.response.data.message

        res.json({ success: false, message })
    }
}

exports.getBuy = (req, res) => {
    let message = req.flash("error")
    message = message.length > 0 ? message[0] : null
    res.render("pages/buy", { errorMessage: message })
}

exports.postBuy = (req, res) => {
    let { symbol, shares } = req.body
    shares = parseInt(shares)
    let sql
    try {
        if (!symbol || !shares) {
            req.flash("error", "Provide all required data")
            return res.redirect("/buy")
        }

        //Checking if user exists
        sql = `SELECT id, amount FROM users WHERE id=?`
        db.get(sql, [req.session.userId], async (err, row) => {
            if (err) {
                req.flash("error", "Someting wrong, contact Support")
                return res.redirect("/buy")
            }

            if (row) {
                //user was found
                //now retrieving share data
                const response = await axios.get(`https://api.iex.cloud/v1/data/core/quote/${symbol}/?token=${process.env.API_KEY}`)
                const shareInfo = response.data[0]
                if (Object.keys(response.data[0]).length === 0) {
                    req.flash("error", "Wrong symbol!")
                    return res.redirect("/buy")
                } else {
                    sql = `SELECT * FROM shares WHERE symbol=? AND user_id=?`
                    db.get(sql, [symbol, row.id], (err, shareRow) => {
                        if (err) return console.error(err.message)

                        const name = shareInfo.companyName
                        const amount = shares * shareInfo.latestPrice

                        if (shareRow) {
                            //Let's check if user has enough money on account
                            const currentUserAmount = row.amount - amount

                            if (currentUserAmount < 0) {
                                req.flash('error', 'You don\'t have anough money on account')
                                return res.redirect('/buy')
                            } else {
                                sql = `UPDATE shares SET quantity=?, amount=? WHERE symbol=? AND user_id=?`

                                db.run(sql, [myRound(shareRow.quantity + shares, 1), myRound(shareRow.amount + amount, 2), symbol, row.id], err => {
                                    if (err) return console.error(err.message)
                                    sql = `UPDATE users SET amount=? WHERE id=?`
                                    db.run(sql, [currentUserAmount, row.id], err => {
                                        if (err) return console.error(err.message)

                                        req.flash('notification', 'Bought!')
                                        return res.redirect("/home")
                                    })

                                })
                            }
                        } else {
                            sql = `INSERT INTO shares (name, symbol, quantity, amount, user_id) VALUES(?, ?, ?, ?, ?)`

                            db.run(sql, [name, symbol, shares, amount, row.id], err => {
                                if (err) return console.error(err.message)
                                //update user amount on account
                                const currentUserAmount = row.amount - amount
                                if (currentUserAmount < 0) {
                                    req.flash('error', "Not enough money for this purchase")
                                    return res.redirect("/buy")
                                } else {
                                    sql = `UPDATE users SET amount=? WHERE id=?`
                                    db.run(sql, [myRound(currentUserAmount, 2), row.id], err => {
                                        if (err) console.error(err.message)
                                        // console.log(currentUserAmount)
                                        req.flash("notification", "Bought!")
                                        return res.redirect("/home")
                                    })
                                }

                            })
                        }

                    })
                }
            } else {
                req.flash("error", "Such user does't exist")
                return res.redirect("/buy")
            }
        })
    } catch (error) {
        console.log(error)
    }
}

exports.getSell = (req, res) => {
    let message = req.flash("error")
    message = message.length > 0 ? message[0] : null
    let sql = `SELECT symbol FROM shares WHERE user_id=?`
    db.all(sql, [req.session.userId], (err, rows) => {
        if (err) console.error(err.message)

        if (rows.length > 0) {
            res.render("pages/sell", { myShares: rows, errorMessage: message })
        } else {
            res.render("pages/sell", { myShares: [], errorMessage: message })
        }
    })

}

exports.postSell = (req, res) => {
    let { symbol, shares } = req.body
    shares = parseInt(shares)
    const userId = req.session.userId
    try {
        if (!symbol || !shares || isNaN(shares)) {
            req.flash("error", "Provide all required data")
            return res.redirect("/sell")
        }
        //Checking if user has this type of share
        sql = `SELECT symbol, quantity, amount FROM shares WHERE symbol=? AND user_id=?`
        db.get(sql, [symbol, userId], async (err, row) => {
            if (err) console.error(err.message)

            if (row) {
                //User owns share
                //Checking if user has enough quantity of shares
                const quantityAfterSelling = row.quantity - shares
                if (quantityAfterSelling > 0) {
                    //User has enough quantity of shares
                    //Retrieving data about current share
                    const shareInfo = await retrieveShareData(symbol)
                    if (Object.keys(shareInfo).length > 0) {
                        //Updating shares table
                        const income = shares * shareInfo.latestPrice
                        const newAmountForShares = row.amount - income < 0 ? 0 : row.amount - income
                        sql = `UPDATE shares SET quantity=?, amount=? WHERE symbol=? AND user_id=?`
                        db.run(sql, [quantityAfterSelling, myRound(newAmountForShares, 2), symbol, userId], err => {
                            if (err) return console.error(err.message)
                            //Updating users amount on account
                            sql = `SELECT amount FROM users WHERE id=?`
                            db.get(sql, [userId], (err, userRow) => {
                                if (err) return console.error(err.message)
                                sql = `UPDATE users SET amount=? WHERE id=?`
                                db.run(sql, [myRound(userRow.amount + income, 2), userId], err => {
                                    if (err) return console.error(err.message)

                                    req.flash('notification', "Sold")
                                    return res.redirect("/home")
                                })
                            })

                        })
                    } else {
                        req.flash("error", "Wrong symbol")
                        return res.redirect("/sell")
                    }
                } else if (quantityAfterSelling === 0) {
                    //User has sold all shares he had
                    //Removing this share data from shares table
                    sql = `DELETE FROM shares WHERE symbol=? AND user_id=?`
                    db.run(sql, [symbol, userId], async err => {
                        if (err) return console.error(err.message)
                        const shareInfo = await retrieveShareData(symbol)

                        if (Object.keys(shareInfo).length > 0) {
                            //Updating users amount on account
                            const income = shares * shareInfo.latestPrice
                            sql = `SELECT amount FROM users WHERE id=?`
                            db.get(sql, [userId], (err, userRow) => {
                                if (err) return console.error(err.message)
                                sql = `UPDATE users SET amount=? WHERE id=?`
                                console.log(userRow.amount + income)
                                db.run(sql, [myRound(userRow.amount + income, 2), userId], err => {
                                    if (err) return console.error(err.message)

                                    req.flash('notification', 'Sold')
                                    return res.redirect("/home")
                                })
                            })
                        } else {
                            req.flash('error', 'Wrong symbol')
                            return res.redirect("/sell")
                        }

                    })
                } else {
                    req.flash("error", "You don't have enough shares to sell")
                    return res.redirect("/sell")
                }
            } else {
                req.flash("error", "You don't have this type of share")
                return res.redirect('/sell')
            }
        })
    } catch (error) {
        console.log(error)
    }

}