const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const response = require("../utils/response");
const getLoggedInUser = require("../utils/getLoggedInUser");

class CheckFormController {
  async recheckFormPost(req, res) {
    try {
      const { formId, userId, token } = req.body;

      const loggedInUser = await getLoggedInUser(req, res);

      if (loggedInUser) {
        const recheckFormData = await prisma.checkForm.findMany({
          where: { formId, userId, token, status: 1 },
        });

        response.success(res, "form re-checked successfully!", {
          recheckFormData,
        });
      }
    } catch (error) {
      console.log("error while re-checking form data ->", error);
    }
  }
  async checkFormPost(req, res) {
    try {
      const { formFields, formId, userId, token } = req.body;

      const loggedInUser = await getLoggedInUser(req, res);

      if (loggedInUser) {
        const formData = Object.entries(formFields);

        for (let formVal of formData) {
          const alreadyCheckedForm = await prisma.checkForm.findFirst({
            where: {
              fieldName: formVal[0],
              formId,
              userId,
              token,
              status: 1,
            },
          });

          if (alreadyCheckedForm) {
            await prisma.checkForm.update({
              where: {
                id: alreadyCheckedForm.id,
              },
              data: {
                status: 0,
              },
            });

            await prisma.checkForm.create({
              data: {
                fieldName: formVal[0],
                correct: formVal[1],
                formId,
                userId,
                token,
                status: 1,
              },
            });
          } else {
            await prisma.checkForm.create({
              data: {
                fieldName: formVal[0],
                correct: formVal[1],
                formId,
                userId,
                token,
                status: 1,
              },
            });
          }
        }

        const formStatusUpdateToChecked = await prisma.submittedData.findFirst({
          where: {
            token,
            formId,
            userId,
          },
        });

        await prisma.submittedData.update({
          where: {
            id: formStatusUpdateToChecked.id,
          },
          data: {
            status: 1,
          },
        });

        response.success(res, "Form checked successfully!", {});
      }
    } catch (error) {
      console.log("error while checking form data ->", error);
    }
  }
}

module.exports = new CheckFormController();
