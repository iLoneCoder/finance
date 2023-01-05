const axios = require('axios')

const retrieveShareData = async (symbol) => {
    const response = await axios.get(`https://api.iex.cloud/v1/data/core/quote/${symbol}/?token=${process.env.API_KEY}`)

    return response.data[0]
}

module.exports = { retrieveShareData }