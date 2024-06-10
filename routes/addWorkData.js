const express = require("express");
const AddWorkDataRouter = express.Router({ mergeParams: true });
const AddWorkDataController = require("../controllers/addWorkDataController");

AddWorkDataRouter.get("/add-work-data", AddWorkDataController.addWorkDataGet);
AddWorkDataRouter.post(
  "/add-work-data",
  AddWorkDataController.addWorkDataCreatePost
);

module.exports = AddWorkDataRouter;
