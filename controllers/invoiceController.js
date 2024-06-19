const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const response = require("../utils/response");

class InvoiceController {
  async invoiceDataGet(req, res) {
    try {
      const token = req.cookies.token;

      const loggedInUser = await prisma.user.findFirst({
        where: {
          token: parseInt(token),
        },
      });
      if (loggedInUser) {
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
        response.error(res, "User not logged in!", {});
      }
    } catch (error) {
      console.log("error while getting count report data ", error);
    }
  }

  async createInvoicePost(req, res) {
    try {
      const token = req.cookies.token;
      const {
        client,
        formRate,
        totalUsers,
        totalForms,
        correctFields,
        incorrectFields,
        totalAmount,
        costPerField,
      } = req.body;

      if (token) {
        const loggedInUser = await prisma.user.findFirst({
          where: {
            token: parseInt(token),
          },
        });

        const submittedData = await prisma.submittedData.findMany({
          where: {
            token: req.body.token,
          },
        });

        const formIds = submittedData.map((data) => {
          return data.formId;
        });

        const formsData = await prisma.websiteData.findMany({
          where: {
            id: {
              in: formIds,
            },
          },
        });

        // Find the oldest and latest createdAt dates
        if (formsData.length > 0) {
          let oldestDate = new Date(formsData[0].createdAt);
          let latestDate = new Date(formsData[0].createdAt);

          formsData.forEach((data) => {
            const createdAt = new Date(data.createdAt);
            if (createdAt < oldestDate) {
              oldestDate = createdAt;
            }
            if (createdAt > latestDate) {
              latestDate = createdAt;
            }
          });

          // Convert to IST (Indian Standard Time)
          const offsetIST = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
          const oldestDateIST = new Date(oldestDate.getTime() + offsetIST);
          const latestDateIST = new Date(latestDate.getTime() + offsetIST);

          // Extract only the date part (YYYY-MM-DD)
          const formatDateToIST = (date) => {
            const year = date.getUTCFullYear();
            const month = String(date.getUTCMonth() + 1).padStart(2, "0"); // Months are 0-based
            const day = String(date.getUTCDate()).padStart(2, "0");
            return `${day}-${month}-${year}`;
          };

          const oldestDateISTFormatted = formatDateToIST(oldestDateIST);
          const latestDateISTFormatted = formatDateToIST(latestDateIST);

          // Add date range to the new invoice
          const newInvoice = await prisma.invoice.create({
            data: {
              token: req.body.token,
              client,
              formRate,
              noOfUsers: totalUsers,
              totalForms,
              correctFields,
              incorrectFields,
              totalAmount: parseFloat(totalAmount),
              costPerField: parseFloat(costPerField),
              startDate: oldestDateISTFormatted.toString(),
              endDate: latestDateISTFormatted.toString(),
            },
          });

          const { password, ...adminDataWithoutPassword } = loggedInUser;

          response.success(res, "Invoice created!", {
            ...adminDataWithoutPassword,
          });
        } else {
          res
            .status(404)
            .json({ message: "No forms data found.", status: "failure" });
        }
      } else {
        res
          .status(401)
          .json({ message: "User not already logged in.", status: "failure" });
      }
    } catch (error) {
      console.log("Error while getting creating invoice", error);
      res
        .status(500)
        .json({ message: "Internal server error.", status: "failure" });
    }
  }
}

module.exports = new InvoiceController();
