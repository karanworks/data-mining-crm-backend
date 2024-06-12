const express = require("express");
const PaymentRouter = express.Router({ mergeParams: true });
const PaymentController = require("../controllers/paymentController");

PaymentRouter.get("/payment", PaymentController.getPayments);

module.exports = PaymentRouter;
