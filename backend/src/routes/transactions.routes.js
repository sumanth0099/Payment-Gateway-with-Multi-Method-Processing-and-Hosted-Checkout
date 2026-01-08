const express = require("express");
const router = express.Router();
const { getTransactions } = require("../controllers/transactions.controller");

router.get("/dashboard/transactions", getTransactions);

module.exports = router;
