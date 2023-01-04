const sqlite3 = require('sqlite3')


const createUserTable = db => {
    db.exec(`
        CREATE TABLE IF NOT EXISTS users
        (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username VARCHAR(80) NOT NULL,
            password VARCHAR(100) NOT NULL,
            amount DECIMAL(15,2) DEFAULT 10000.00 NOT NULL
        )
    `)
}

const createSharesTable = db => {
    db.exec(`
        CREATE TABLE IF NOT EXISTS shares
        (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            symbol VARCHAR(50) NOT NULL,
            name   VARCHAR(50) NOT NULL,
            quantity INTEGER NOT NULL,
            amount DECIMAL(15,2) NOT NULL,
            user_id INTEGER NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    `)
}

const createDbConnection = () => {
    const db = new sqlite3.Database("./finances.db", err => {
        if (err) return console.error(err.message)

        createUserTable(db)
        createSharesTable(db)
    })

    console.log("Connection has been established")
    return db
}

module.exports = createDbConnection()