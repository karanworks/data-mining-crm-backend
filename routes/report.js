const express = require("express");
const ReportRouter = express.Router({ mergeParams: true });
const ReportController = require("../controllers/reportController");

ReportRouter.get("/report", ReportController.reportDataGet);
ReportRouter.get("/report/:tokenId/forms", ReportController.reportDataFormsGet);

module.exports = ReportRouter;
