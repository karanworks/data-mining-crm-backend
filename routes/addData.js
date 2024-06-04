const express = require("express");
const AddDataRouter = express.Router({ mergeParams: true });
const AddDataController = require("../controllers/addDataController");
const multer = require("multer");

const upload = multer();

AddDataRouter.post(
  "/add-data",
  upload.single("data"),
  AddDataController.addDataPost
);

module.exports = AddDataRouter;
