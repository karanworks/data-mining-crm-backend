const express = require("express");
const InvoiceRouter = express.Router({ mergeParams: true });
const InvoiceController = require("../controllers/invoiceController");

InvoiceRouter.get("/report/:token/invoice", InvoiceController.invoiceDataGet);
InvoiceRouter.post(
  "/report/:token/invoice",
  InvoiceController.createInvoicePost
);

module.exports = InvoiceRouter;
