const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const response = require("../utils/response");
const getLoggedInUser = require("../utils/getLoggedInUser");
const getMenus = require("../utils/getMenus");
const getToken = require("../utils/getToken");
const stream = require("stream");
const csv = require("csv-parser");
const stringify = require("csv-stringify");
const fs = require("fs");

class AddDataController {
  async addDataPost(req, res) {
    try {
      const { clientId, clientUserId } = req.body;

      console.log(clientId, clientUserId);

      if (!req.file) {
        return res.status(400).send("No file uploaded.");
      }

      const { buffer } = req.file;

      const csvString = buffer.toString();

      // Below code converts file string to key vlaue pair object
      // Split the string into rows
      const rows = csvString.trim().split("\n");

      // Extract column names and initialize the object
      const columns = rows[0].split(",").map((column) => column.trim());
      const dataObj = {};
      columns.forEach((column) => (dataObj[column] = []));

      // Iterate over rows starting from the second row
      for (let i = 1; i < rows.length; i++) {
        const values = rows[i].split(",").map((value) => value.trim());
        // Iterate over values and push them to their corresponding column in the object
        for (let j = 0; j < values.length; j++) {
          dataObj[columns[j]].push(values[j]);
        }
      }

      console.log(dataObj);

      const loggedInUser = await getLoggedInUser(req, res);

      if (loggedInUser) {
        for (let val of dataObj.Url) {
          const data = await prisma.assignedData.create({
            data: {
              url: val,
              userId: parseInt(clientUserId),
              addedBy: loggedInUser.id,
              status: 0,
            },
          });
        }

        response.success(res, "Data added successfully!");
      }
    } catch (error) {
      console.log("error while adding data ->", error);
    }
  }
}

module.exports = new AddDataController();
