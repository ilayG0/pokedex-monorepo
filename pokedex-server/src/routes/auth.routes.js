const express = require("express");
const { signup, login, getMe } = require("../controllers/auth.controller");
const { auth } = require("../auth/auth");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);

router.get("/me", auth , getMe);

module.exports = router;