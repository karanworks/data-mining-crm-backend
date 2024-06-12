const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const response = require("../utils/response");
const getLoggedInUser = require("../utils/getLoggedInUser");

class InvoiceController {
  async invoiceDataGet(req, res) {
    try {
      const token = req.cookies.token;
      let correctFields;
      let incorrectFields;

      if (token) {
        const loggedInUser = await prisma.user.findFirst({
          where: {
            token: parseInt(token),
          },
        });

        const submittedData = await prisma.submittedData.findMany({
          where: {
            token: req.params.token,
          },
        });

        const formIds = submittedData.map((data) => {
          return data.formId;
        });

        const correctFormFields = await Promise.all(
          formIds.map(async (id) => {
            const correctFields = await prisma.checkForm.findMany({
              where: {
                formId: id,
                status: 1,
                correct: 1,
              },
            });

            return correctFields.length;
          })
        );

        const totalCorrectFields = correctFormFields.reduce(
          (prev, acc) => prev + acc
        );
        const incorrectFormFields = await Promise.all(
          formIds.map(async (id) => {
            const incorrectFields = await prisma.checkForm.findMany({
              where: {
                formId: id,
                status: 1,
                correct: 0,
              },
            });

            return incorrectFields.length;
          })
        );

        const totalIncorrectFields = incorrectFormFields.reduce(
          (prev, acc) => prev + acc
        );

        // const { password, ...adminDataWithoutPassword } = loggedInUser;

        response.success(res, "Invoice Data fetched!", {
          correctFields: totalCorrectFields,
          incorrectFields: totalIncorrectFields,
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

  async createInvoicePost(req, res) {
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

module.exports = new InvoiceController();
