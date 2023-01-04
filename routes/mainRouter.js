const express = require('express')
const router = express.Router()
const mainController = require('../controllers/mainController')
const { defAuth } = require("../middleware/defAuth")

router.get("/home", defAuth, mainController.getHome)
router.get("/quote", defAuth, mainController.getQuote)
router.get("/buy", defAuth, mainController.getBuy)

router.post("/quote", defAuth, mainController.postQuote)
router.post("/buy", defAuth, mainController.postBuy)
module.exports = router