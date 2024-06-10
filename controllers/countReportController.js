const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const response = require("../utils/response");
const getLoggedInUser = require("../utils/getLoggedInUser");

class CountReportController {
  async countReportGet(req, res) {
    try {
      const token = req.cookies.token;

      if (token) {
        const loggedInUser = await prisma.user.findFirst({
          where: {
            token: parseInt(token),
          },
        });

        const totalClients = await prisma.client.findMany({});

        // const assignedData = await Promise.all(
        //   totalClients?.map(async (client) => {

        for (let client of totalClients) {
          const totalUsers = await prisma.user.findMany({
            where: {
              email: client.email,
              status: 1,
            },
          });

          const totalAssignedDataOfUser = await Promise.all(
            totalUsers?.map(async (user) => {
              const userAssignedData = await prisma.assignedData.findMany({
                where: {
                  userId: user.id,
                },
              });

              if (userAssignedData.length > 0) {
                return userAssignedData;
              } else {
                return null;
              }
            })
          );

          const totalCompletedDataOfUser = await Promise.all(
            totalUsers?.map(async (user) => {
              const userWebsiteData = await prisma.websiteData.findMany({
                where: {
                  userId: user.id,
                  status: 1,
                },
              });

              if (userWebsiteData.length > 0) {
                return userWebsiteData;
              } else {
                return null;
              }
            })
          );

          const totalCheckingData = await Promise.all(
            totalUsers?.map(async (user) => {
              const userSubmittedData = await prisma.submittedData.findMany({
                where: {
                  userId: user.id,
                },
              });

              if (userSubmittedData.length > 0) {
                return userSubmittedData;
              } else {
                return null;
              }
            })
          );

          const totalVerifiedData = await Promise.all(
            totalUsers?.map(async (user) => {
              const userVerifiedData = await prisma.submittedData.findMany({
                where: {
                  userId: user.id,
                  status: 1,
                },
              });

              if (userVerifiedData.length > 0) {
                return userVerifiedData;
              } else {
                return null;
              }
            })
          );

          const totalCorrectFields = await Promise.all(
            totalUsers?.map(async (user) => {
              const userCorrectFields = await prisma.checkForm.findMany({
                where: {
                  userId: user.id,
                  status: 1,
                  correct: 1,
                },
              });

              if (userCorrectFields.length > 0) {
                return userCorrectFields;
              } else {
                return null;
              }
            })
          );

          const totalIncorrectFields = await Promise.all(
            totalUsers?.map(async (user) => {
              const userIncorrectFields = await prisma.checkForm.findMany({
                where: {
                  userId: user.id,
                  status: 1,
                  correct: 0,
                },
              });

              if (userIncorrectFields.length > 0) {
                return userIncorrectFields;
              } else {
                return null;
              }
            })
          );

          const workingUsers = totalUsers.filter(Boolean);
          const totalAssignedData = totalAssignedDataOfUser.filter(Boolean);
          const totalCompletedData = totalCompletedDataOfUser.filter(Boolean);
          const forChecking = totalCheckingData.filter(Boolean);
          const verfiedData = totalVerifiedData.filter(Boolean);
          const correctFields = totalCorrectFields.filter(Boolean);
          const incorrectFields = totalIncorrectFields.filter(Boolean);

          client.totalUsers = totalUsers;
          client.totalAssignedData = totalAssignedData.flat();
          client.totalCompletedData = totalCompletedData.flat();
          client.forChecking = forChecking.flat();
          client.verifiedData = verfiedData.flat();
          client.correct = correctFields.flat();
          client.incorrect = incorrectFields.flat();
          // client.correct = correctFields;
          // client.incorrect = incorrectFields;
          client.workingUsers = workingUsers;
        }

        //   })
        // );

        const { password, ...adminDataWithoutPassword } = loggedInUser;

        response.success(res, "Count report Data fetched!", {
          ...adminDataWithoutPassword,
          clients: totalClients,
        });
      } else {
        // for some reason if we remove status code from response logout thunk in frontend gets triggered multiple times
        res
          .status(401)
          .json({ message: "user not already logged in.", status: "failure" });
      }
    } catch (error) {
      console.log("error while getting count report data ", error);
    }
  }

  async filterReportData(req, res) {
    try {
      const token = req.cookies.token;

      const { users, startDate, endDate } = req.body;

      if (token) {
        console.log("FILTER API CALLED", users, startDate, endDate);
        const loggedInUser = await prisma.user.findFirst({
          where: {
            token: parseInt(token),
          },
        });

        const startParsed = new Date(startDate?.split("/").reverse().join("-"));
        const endParsed = new Date(endDate?.split("/").reverse().join("-"));
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

        const { password, ...adminDataWithoutPassword } = loggedInUser;

        response.success(res, "Completed Data fetched!", {
          ...adminDataWithoutPassword,
        });
        response.success(res, "Completed Data fetched!", {
          ...adminDataWithoutPassword,
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
}

module.exports = new CountReportController();
