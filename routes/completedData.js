const express = require("express");
const CompletedDataRouter = express.Router({ mergeParams: true });
const CompletedDataController = require("../controllers/completedDataController");

CompletedDataRouter.get(
  "/completed-data",
  CompletedDataController.completedDataGet
);

CompletedDataRouter.post(
  "/completed-data/edit",
  CompletedDataController.completedDataUpdatePatch
);

CompletedDataRouter.patch(
  "/completed-data/delete",
  CompletedDataController.completedDataRemoveDelete
);

CompletedDataRouter.get(
  "/completed-data/export-data",
  CompletedDataController.completedDataExportData
);

CompletedDataRouter.post(
  "/completed-data/filter-data",
  CompletedDataController.completedDataFilterData
);

module.exports = CompletedDataRouter;
