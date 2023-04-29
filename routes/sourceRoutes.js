const express = require("express");
const router = new express.Router();
const {
  sourceDetails,
  Connect,
  TestConnect,
} = require("../controllers/sourceController");
const { verifyToken } = require("../controllers/authController");

router.post("/sourcedetails", verifyToken, sourceDetails);
router.post("/connect", verifyToken, Connect);
router.post("/testconnect", verifyToken, TestConnect);

module.exports = router;
