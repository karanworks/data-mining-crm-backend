const express = require("express");
const CompletedDataRouter = express.Router({ mergeParams: true });
const CompletedDataController = require("../controllers/completedDataController");

CompletedDataRouter.get(
  "/completed-data",
  CompletedDataController.completedDataGet
);
// CompletedDataRouter.post(
//   "/add-work-data",
//   CompletedDataController.addWorkDataCreatePost
// );
// CompletedDataRouter.patch(
//   "/user/:userId/edit",
//   CompletedDataController.addWorkDataUpdatePatch
// );
CompletedDataRouter.post(
  "/completed-data/delete",
  CompletedDataController.completedDataRemoveDelete
);

module.exports = CompletedDataRouter;
