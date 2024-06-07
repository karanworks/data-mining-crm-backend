const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const response = require("../utils/response");
const getLoggedInUser = require("../utils/getLoggedInUser");

class CheckFormController {
  async checkFormPost(req, res) {
    try {
      const { formFields, formId, userId, token } = req.body;

      const loggedInUser = await getLoggedInUser(req, res);

      if (loggedInUser) {
        const formData = Object.entries(formFields);

        for (let formVal of formData) {
          await prisma.checkForm.create({
            data: {
              fieldName: formVal[0],
              status: formVal[1],
              formId,
              userId,
              token,
            },
          });
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
