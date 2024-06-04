const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const response = require("../utils/response");
const getLoggedInUser = require("../utils/getLoggedInUser");

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

        const completedWorkData = await prisma.websiteData.findMany({
          where: {
            userId: loggedInUser.id,
          },
        });

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

  async completedDataRemoveDelete(req, res) {
    try {
      const { dataId } = req.body;

      console.log("DATA ID HERE ->", dataId);

      if (Array.isArray(dataId)) {
        const websiteDataFound = await prisma.websiteData.findMany({
          where: {
            id: {
              in: dataId,
            },
          },
        });

        const completedDataUrlIds = websiteDataFound?.map((data) => {
          return data.urlId;
        });

        if (dataId.length > 0) {
          const deletedWebsiteData = await prisma.websiteData.deleteMany({
            where: {
              id: {
                in: dataId,
              },
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
          },
        });

        if (websiteDataFound) {
          const deletedWebsiteData = await prisma.websiteData.delete({
            where: {
              id: parseInt(dataId),
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
}

module.exports = new CompletedDataController();
