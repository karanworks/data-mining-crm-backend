const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const response = require("../utils/response");
const getLoggedInUser = require("../utils/getLoggedInUser");

class CountReportController {
  async countReportGet(req, res) {
    try {
      const token = req.cookies.token;

      const loggedInUser = await prisma.user.findFirst({
        where: {
          token: parseInt(token),
        },
      });
      if (loggedInUser) {
        const totalClients = await prisma.client.findMany({});

        for (let client of totalClients) {
          const totalUsersOfSingleClient = await prisma.user.findMany({
            where: {
              email: client.email,
              status: 1,
            },
          });
          const totalUsers = await Promise.all(
            totalUsersOfSingleClient.map(async (user) => {
              const dataAssigned = await prisma.assignedData.findMany({
                where: {
                  userId: user.id,
                },
              });

              const completedData = await prisma.assignedData.findMany({
                where: {
                  userId: user.id,
                  status: 1,
                },
              });

              return { ...user, dataAssigned, completedData };
            })
          );

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

              const formWentForChecking = [];

              for (let data of userSubmittedData) {
                const form = await prisma.websiteData.findFirst({
                  where: {
                    id: data.formId,
                  },
                });

                formWentForChecking.push(form);
              }

              if (userSubmittedData.length > 0) {
                return formWentForChecking;
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

              const checkedForms = [];
              for (let data of userVerifiedData) {
                const form = await prisma.websiteData.findFirst({
                  where: {
                    id: data.formId,
                  },
                });

                checkedForms.push(form);
              }

              if (userVerifiedData.length > 0) {
                return checkedForms;
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

          client.workingUsers = workingUsers;
        }

        const { password, ...adminDataWithoutPassword } = loggedInUser;

        response.success(res, "Count report Data fetched!", {
          ...adminDataWithoutPassword,
          clients: totalClients,
        });
      } else {
        // for some reason if we remove status code from response logout thunk in frontend gets triggered multiple times
        response.error(res, "User not logged in!", {});
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
        const loggedInUser = await prisma.user.findFirst({
          where: {
            token: parseInt(token),
          },
        });

        const startParsed = new Date(startDate?.split("/").reverse().join("-"));
        const endParsed = new Date(endDate?.split("/").reverse().join("-"));
        endParsed.setHours(23, 59, 59, 999);

        const whereConditions = {
          username: {
            in: users,
          },
          status: 1,
        };

        if (startDate) {
          whereConditions.createdAt = { gte: startParsed };
        }

        if (endDate) {
          if (!whereConditions.createdAt) {
            whereConditions.createdAt = {};
          }
          whereConditions.createdAt.lte = endParsed;
        }

        const totalUsers = await prisma.user.findMany({
          where: whereConditions,
        });

        const userClientEmails = totalUsers.map((user) => user.email);

        const totalClients = await prisma.client.findMany({
          where: {
            email: {
              in: userClientEmails,
            },
          },
        });

        for (let client of totalClients) {
          const clientUsers = totalUsers.filter(
            (user) => user.email === client.email
          );

          const totalAssignedDataOfUser = await Promise.all(
            clientUsers.map(async (user) => {
              const userAssignedData = await prisma.assignedData.findMany({
                where: {
                  userId: user.id,
                },
              });
              return userAssignedData.length > 0 ? userAssignedData : null;
            })
          );

          const totalCompletedDataOfUser = await Promise.all(
            clientUsers.map(async (user) => {
              const userWebsiteData = await prisma.websiteData.findMany({
                where: {
                  userId: user.id,
                  status: 1,
                },
              });
              return userWebsiteData.length > 0 ? userWebsiteData : null;
            })
          );

          const totalCheckingData = await Promise.all(
            clientUsers.map(async (user) => {
              const userSubmittedData = await prisma.submittedData.findMany({
                where: {
                  userId: user.id,
                },
              });

              return userSubmittedData.length > 0 ? userSubmittedData : null;
            })
          );

          const totalVerifiedData = await Promise.all(
            clientUsers.map(async (user) => {
              const userVerifiedData = await prisma.submittedData.findMany({
                where: {
                  userId: user.id,
                  status: 1,
                },
              });
              return userVerifiedData.length > 0 ? userVerifiedData : null;
            })
          );

          const totalCorrectFields = await Promise.all(
            clientUsers.map(async (user) => {
              const userCorrectFields = await prisma.checkForm.findMany({
                where: {
                  userId: user.id,
                  status: 1,
                  correct: 1,
                },
              });
              return userCorrectFields.length > 0 ? userCorrectFields : null;
            })
          );

          const totalIncorrectFields = await Promise.all(
            clientUsers.map(async (user) => {
              const userIncorrectFields = await prisma.checkForm.findMany({
                where: {
                  userId: user.id,
                  status: 1,
                  correct: 0,
                },
              });
              return userIncorrectFields.length > 0
                ? userIncorrectFields
                : null;
            })
          );

          client.totalUsers = clientUsers;
          client.totalAssignedData = totalAssignedDataOfUser
            .filter(Boolean)
            .flat();
          client.totalCompletedData = totalCompletedDataOfUser
            .filter(Boolean)
            .flat();
          client.forChecking = totalCheckingData.filter(Boolean).flat();
          client.verifiedData = totalVerifiedData.filter(Boolean).flat();
          client.correct = totalCorrectFields.filter(Boolean).flat();
          client.incorrect = totalIncorrectFields.filter(Boolean).flat();
          client.workingUsers = clientUsers.filter(Boolean);
        }

        const { password, ...adminDataWithoutPassword } = loggedInUser;

        response.success(res, "Filtered report data fetched!", {
          ...adminDataWithoutPassword,
          filteredData: totalClients,
        });
      } else {
        res
          .status(401)
          .json({ message: "User not already logged in.", status: "failure" });
      }
    } catch (error) {
      console.log("Error while getting filtered report data", error);
    }
  }
}

module.exports = new CountReportController();
