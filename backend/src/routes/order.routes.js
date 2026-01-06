const express = require("express");
const router = express.Router();
const { getTestMerchant } = require("../controllers/test.controller");
const merchantAuth = require("../middlewares/merchantAuth");
const { createOrder ,getOrderById} = require("../controllers/order.controller");

router.post("/v1/orders", merchantAuth, createOrder);
router.get("/v1/orders/:orderId", merchantAuth, getOrderById);
router.get("/v1/test/merchant", getTestMerchant);
module.exports = router;
