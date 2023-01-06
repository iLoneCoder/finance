const datetime = (myDate) => {
    const year = myDate.getFullYear()
    const month = myDate.getMonth() + 1 < 10 ? "0" + (myDate.getMonth() + 1) : myDate.getMonth() + 1
    const day = myDate.getDay() < 10 ? "0" + myDate.getDay() : myDate.getDay()
    const hours = myDate.getHours() - 4 < 10 ? "0" + (myDate.getHours() - 4) : myDate.getHours() - 4
    const minutes = myDate.getMinutes() < 10 ? "0" + myDate.getMinutes() : myDate.getMinutes()
    const seconds = myDate.getSeconds() < 10 ? "0" + myDate.getSeconds() : myDate.getSeconds()

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

module.exports = { datetime }