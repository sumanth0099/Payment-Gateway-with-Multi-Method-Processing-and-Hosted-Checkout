const express = require("express");
const router = express.Router();

const merchantAuth = require("../middlewares/merchantAuth");
const { createPayment } = require("../controllers/payment.controller");

router.post("/v1/payments", merchantAuth, createPayment);

module.exports = router;
