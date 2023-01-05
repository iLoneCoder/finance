const express = require('express')
const router = express.Router()
const mainController = require('../controllers/mainController')
const { defAuth } = require("../middleware/defAuth")

router.get("/home", defAuth, mainController.getHome)
router.get("/quote", defAuth, mainController.getQuote)
router.get("/buy", defAuth, mainController.getBuy)
router.get("/sell", defAuth, mainController.getSell)

router.post("/quote", defAuth, mainController.postQuote)
router.post("/buy", defAuth, mainController.postBuy)
router.post("/sell", defAuth, mainController.postSell)
module.exports = router