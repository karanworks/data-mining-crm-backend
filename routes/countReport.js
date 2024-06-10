const express = require("express");
const CountReportRouter = express.Router({ mergeParams: true });
const CountReportController = require("../controllers/countReportController");

CountReportRouter.get("/count-report", CountReportController.countReportGet);
CountReportRouter.post(
  "/count-report/filter-data",
  CountReportController.filterReportData
);

module.exports = CountReportRouter;
