const myRound = (number, decimal) => {
    return Number(Math.round(number + 'e' + decimal) + 'e-' + decimal)
}

module.exports = { myRound }