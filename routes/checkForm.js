const express = require("express");
const CheckFormRouter = express.Router({ mergeParams: true });
const CheckFormController = require("../controllers/checkFormController");

CheckFormRouter.post("/check-form-data", CheckFormController.checkFormPost);
CheckFormRouter.post(
  "/check-form-data/recheck",
  CheckFormController.recheckFormPost
);

module.exports = CheckFormRouter;
