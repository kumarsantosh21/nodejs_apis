const express = require("express");
const router = new express.Router();
const { chartData } = require("../controllers/chartsController");
const { verifyToken } = require("../controllers/authController");

router.post("/chartData", verifyToken, chartData);

module.exports = router;
