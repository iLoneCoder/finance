const express = require("express")
const router = express.Router()
const authController = require("../controllers/authController")
const { verifyToken } = require('../middleware/verifyToken')

router.get("/register", authController.getRegister)
router.get("/login", authController.getLogin)
router.get("/forgot-password", authController.getFrogotPassword)
router.get("/update-password/:token", verifyToken, authController.getUpdatePassword)

router.post("/register", authController.postRegister)
router.post("/login", authController.postlogin)
router.post("/logout", authController.logout)
router.post("/forgot-password", authController.postForgotPassword)
router.post("/update-password", verifyToken, authController.postUpdatePassword)
module.exports = router