const express = require("express");
const AddDataRouter = express.Router({ mergeParams: true });
const AddDataController = require("../controllers/addDataController");
const multer = require("multer");

// Configure multer to store file in memory
// const storage = multer.diskStorage();
const upload = multer();

AddDataRouter.post(
  "/add-data",
  upload.single("data"),
  AddDataController.addDataPost
);

module.exports = AddDataRouter;
