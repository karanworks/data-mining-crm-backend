const express = require("express");
const ReportRouter = express.Router({ mergeParams: true });
const ReportController = require("../controllers/reportController");

ReportRouter.get("/report", ReportController.completedDataGet);

module.exports = ReportRouter;
