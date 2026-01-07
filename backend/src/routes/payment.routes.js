const express = require("express");
const router = express.Router();

const merchantAuth = require("../middlewares/merchantAuth");
const {
  createPayment,
  getPaymentById
} = require("../controllers/payment.controller");

router.post("/v1/payments", merchantAuth, createPayment);
router.get("/v1/payments/:paymentId", merchantAuth, getPaymentById);

module.exports = router;
