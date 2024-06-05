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
            status: 1,
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
  // async completedDataRemoveDelete(req, res) {
  //   try {
  //     const { dataId } = req.body;

  //     if (Array.isArray(dataId)) {
  //       const websiteDataFound = await prisma.websiteData.findMany({
  //         where: {
  //           id: {
  //             in: dataId,
  //           },
  //           status: 1,
  //         },
  //       });

  //       const completedDataUrlIds = websiteDataFound?.map((data) => {
  //         return data.urlId;
  //       });

  //       if (dataId.length > 0) {
  //         const deletedWebsiteData = await prisma.websiteData.deleteMany({
  //           where: {
  //             id: {
  //               in: dataId,
  //             },
  //             status: 1,
  //           },
  //         });

  //         const updateUrlStatus = await prisma.assignedData.updateMany({
  //           where: {
  //             id: {
  //               in: completedDataUrlIds,
  //             },
  //           },
  //           data: {
  //             status: 0,
  //           },
  //         });

  //         response.success(res, "Website data deleted successfully!", {
  //           deletedCompletedData: websiteDataFound,
  //         });
  //       } else {
  //         response.error(res, "Website data does not exist! ");
  //       }
  //     } else {
  //       const websiteDataFound = await prisma.websiteData.findFirst({
  //         where: {
  //           id: parseInt(dataId),
  //           status: 1,
  //         },
  //       });

  //       if (websiteDataFound) {
  //         const deletedWebsiteData = await prisma.websiteData.delete({
  //           where: {
  //             id: parseInt(dataId),
  //           },
  //         });

  //         const assignedDataForStatusUpdate =
  //           await prisma.assignedData.findFirst({
  //             where: {
  //               id: deletedWebsiteData?.urlId,
  //             },
  //           });

  //         const assignedDataInCompleted = await prisma.assignedData.update({
  //           where: {
  //             id: assignedDataForStatusUpdate.id,
  //           },
  //           data: {
  //             status: 0,
  //           },
  //         });

  //         response.success(res, "Website data deleted successfully!", {
  //           deletedCompletedData: deletedWebsiteData,
  //         });
  //       } else {
  //         response.error(res, "Website data does not exist! ");
  //       }
  //     }
  //   } catch (error) {
  //     console.log("error while deleting Website ", error);
  //   }
  // }
}

module.exports = new CompletedDataController();
