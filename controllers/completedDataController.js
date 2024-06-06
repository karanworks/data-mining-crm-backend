const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const response = require("../utils/response");
const getLoggedInUser = require("../utils/getLoggedInUser");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const path = require("path");
const fs = require("fs");

class CompletedDataController {
  async completedDataGet(req, res) {
    try {
      const token = req.cookies.token;

      if (token) {
        const loggedInUser = await prisma.user.findFirst({
          where: {
            token: parseInt(token),
          },
        });

        let completedWorkData;

        if (loggedInUser.roleId === 1) {
          completedWorkData = await prisma.websiteData.findMany({
            where: {
              status: 1,
            },
          });
        } else {
          completedWorkData = await prisma.websiteData.findMany({
            where: {
              userId: loggedInUser.id,
              status: 1,
            },
          });
        }

        const { password, ...adminDataWithoutPassword } = loggedInUser;

        response.success(res, "Completed Data fetched!", {
          ...adminDataWithoutPassword,
          completedWorkData,
        });
      } else {
        // for some reason if we remove status code from response logout thunk in frontend gets triggered multiple times
        res
          .status(401)
          .json({ message: "user not already logged in.", status: "failure" });
      }
    } catch (error) {
      console.log("error while getting completed data ", error);
    }
  }

  async completedDataUpdatePatch(req, res) {
    try {
      const {
        websiteDataId,
        urlId,
        url,
        websiteStatus,
        companyLogo,
        companyName,
        contactNo1,
        contactNo2,
        emailId1,
        emailId2,
        faxNo,
        businessType,
        address,
        companyProfile,
        city,
        state,
        pinCode,
        country,
      } = req.body;

      const loggedInUser = await getLoggedInUser(req, res);

      if (loggedInUser) {
        const newWebsiteData = await prisma.websiteData.create({
          data: {
            urlId,
            url,
            websiteStatus,
            companyLogo,
            companyName,
            contactNo1,
            contactNo2,
            emailId1,
            emailId2,
            faxNo,
            businessType,
            address,
            companyProfile,
            city,
            state,
            pinCode,
            country,
            status: 1,
            userId: loggedInUser.id,
          },
        });

        await prisma.websiteData.update({
          where: {
            id: parseInt(websiteDataId),
          },
          data: {
            status: 0,
          },
        });

        response.success(res, "Data updated successfully!", {
          ...newWebsiteData,
        });
      }
    } catch (error) {
      console.log("error while updating completed work data ->", error);
    }
  }

  async completedDataRemoveDelete(req, res) {
    try {
      const { dataId } = req.body;

      if (Array.isArray(dataId)) {
        const websiteDataFound = await prisma.websiteData.findMany({
          where: {
            id: {
              in: dataId,
            },
            status: 1,
          },
        });

        const completedDataUrlIds = websiteDataFound?.map((data) => {
          return data.urlId;
        });

        if (dataId.length > 0) {
          const deletedWebsiteData = await prisma.websiteData.updateMany({
            where: {
              id: {
                in: dataId,
              },
            },
            data: {
              status: 0,
            },
          });

          const updateUrlStatus = await prisma.assignedData.updateMany({
            where: {
              id: {
                in: completedDataUrlIds,
              },
            },
            data: {
              status: 0,
            },
          });

          response.success(res, "Website data deleted successfully!", {
            deletedCompletedData: websiteDataFound,
          });
        } else {
          response.error(res, "Website data does not exist! ");
        }
      } else {
        const websiteDataFound = await prisma.websiteData.findFirst({
          where: {
            id: parseInt(dataId),
            status: 1,
          },
        });

        if (websiteDataFound) {
          const deletedWebsiteData = await prisma.websiteData.update({
            where: {
              id: parseInt(dataId),
            },
            data: {
              status: 0,
            },
          });

          const assignedDataForStatusUpdate =
            await prisma.assignedData.findFirst({
              where: {
                id: deletedWebsiteData?.urlId,
              },
            });

          const assignedDataInCompleted = await prisma.assignedData.update({
            where: {
              id: assignedDataForStatusUpdate.id,
            },
            data: {
              status: 0,
            },
          });

          response.success(res, "Website data deleted successfully!", {
            deletedCompletedData: deletedWebsiteData,
          });
        } else {
          response.error(res, "Website data does not exist! ");
        }
      }
    } catch (error) {
      console.log("error while deleting Website ", error);
    }
  }

  async completedDataExportData(req, res) {
    try {
      const loggedInUser = await getLoggedInUser(req, res);

      if (loggedInUser) {
        const allFilledWebsiteData = await prisma.websiteData.findMany({
          where: {
            userId: loggedInUser.id,
            status: 1,
          },
        });

        const csvWriter = createCsvWriter({
          path: "data.csv", // Path to the CSV file
          header: [
            { id: "id", title: "Id" },
            { id: "url", title: "Url" },
            { id: "urlId", title: "Url Id" },
            { id: "userId", title: "User Id" },
            { id: "websiteStatus", title: "Website Status" },
            { id: "companyName", title: "Company Name" },
            { id: "contactNo1", title: "Contact No 1" },
            { id: "contactNo2", title: "Contact No 2" },
            { id: "emailId1", title: "Email Id 1" },
            { id: "emailId2", title: "Email Id 2" },
            { id: "faxNo", title: "Fax No" },
            { id: "businessType", title: "Business Type" },
            { id: "address", title: "Address" },
            { id: "companyProfile", title: "Company Profile" },
            { id: "city", title: "City" },
            { id: "state", title: "State" },
            { id: "pinCode", title: "Pin Code" },
            { id: "country", title: "Country" },
          ],
        });

        csvWriter
          .writeRecords(allFilledWebsiteData)
          .then(() => {
            const filePath = path.join("./", "data.csv");

            res.setHeader("Content-Type", "text/csv");
            res.setHeader(
              "Content-Disposition",
              "attachment; filename=data.csv"
            );

            res.download(filePath, "data.csv", (err) => {
              if (err) {
                console.error("Error sending CSV file:", err);
                res.status(500).send("Error sending CSV file");
              } else {
                console.log("CSV file sent successfully!");
                fs.unlink(filePath, (err) => {
                  if (err) {
                    console.error("Error deleting CSV file:", err);
                  } else {
                    console.log("CSV file deleted successfully!");
                  }
                });
              }
            });
          })
          .catch((error) => {
            console.error("Error writing CSV file:", error);
            res.status(500).send("Error writing CSV file");
          });
      }
    } catch (error) {
      console.log(
        "error while exporting data in completed work data ->",
        error
      );
    }
  }

  async completedDataFilterData(req, res) {
    try {
      const token = req.cookies.token;

      const { users, startDate, endDate, businessType } = req.body;

      console.log("USERS HERE ->", users);

      if (token) {
        const loggedInUser = await prisma.user.findFirst({
          where: {
            token: parseInt(token),
          },
        });

        const startParsed = new Date(startDate.split("/").reverse().join("-"));
        const endParsed = new Date(endDate.split("/").reverse().join("-"));
        // Adjust end date to include the entire day
        endParsed.setHours(23, 59, 59, 999);

        const whereConditions = {
          status: 1,
          AND: [],
        };

        if (users.length > 0) {
          whereConditions.AND.push({
            username: {
              in: users,
            },
          });
        }

        if (businessType) {
          whereConditions.AND.push({ businessType });
        }

        if (startDate) {
          whereConditions.AND.push({
            createdAt: {
              gte: startParsed,
            },
          });
        }

        if (endDate) {
          whereConditions.AND.push({
            createdAt: {
              lte: endParsed,
            },
          });
        }

        const filteredData = await prisma.websiteData.findMany({
          where: whereConditions,
        });

        const { password, ...adminDataWithoutPassword } = loggedInUser;

        response.success(res, "Completed Data fetched!", {
          ...adminDataWithoutPassword,
          filteredData,
        });
      } else {
        // for some reason if we remove status code from response logout thunk in frontend gets triggered multiple times
        res
          .status(401)
          .json({ message: "user not already logged in.", status: "failure" });
      }
    } catch (error) {
      console.log("error while getting completed data ", error);
    }
  }

  async completedDataSubmit(req, res) {
    try {
      const { forms } = req.body;

      const loggedInUser = await getLoggedInUser(req, res);
      const token = Date.now();

      if (loggedInUser) {
        for (let form of forms) {
          await prisma.submittedData.create({
            data: {
              token,
              userId: form.userId,
              formId: form.id,
              status: 0,
            },
          });
        }

        response.success(res, "Data updated successfully!", {});
      }
    } catch (error) {
      console.log("error while updating completed work data ->", error);
    }
  }
}

module.exports = new CompletedDataController();
