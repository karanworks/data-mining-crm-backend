const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const response = require("../utils/response");

class ReportRouter {
  async reportDataGet(req, res) {
    try {
      const token = req.cookies.token;

      const reportData = [];

      if (token) {
        const loggedInUser = await prisma.user.findFirst({
          where: {
            token: parseInt(token),
          },
        });

        const tokenIds = await prisma.submittedData.findMany({
          distinct: ["token"],
          select: {
            token: true,
          },
        });

        const uniqueTokenIds = tokenIds.map((token) => token.token);

        const submittedData = await prisma.submittedData.findMany({});

        for (let token of uniqueTokenIds) {
          const tempObj = {};

          const totalForms = await prisma.submittedData.count({
            where: {
              token,
            },
          });

          const allUsersIds = submittedData?.map((data) => {
            if (data.token == token) {
              return data.userId;
            }
          });

          // to check the number of checked forms
          const checkedForms = submittedData?.map((data) => {
            if (data.token == token && data.status === 1) {
              return data;
            }
          });

          const uniqueIds = Array.from(new Set(allUsersIds.filter(Boolean)));
          const checkedFormsCount = checkedForms.filter(Boolean).length;

          const clientName = await prisma.websiteData.findFirst({
            where: {
              userId: uniqueIds[0], // since I know that uniqueIds belongs to single client that's why I am using the first id to get the client name other ids also going to have same client
            },
            select: {
              companyName: true,
            },
          });

          tempObj.token = token;
          tempObj.totalForms = totalForms;
          tempObj.checkedFormsCount = checkedFormsCount;
          tempObj.totalUsers = uniqueIds.length;
          tempObj.clientName = clientName.companyName;

          reportData.push(tempObj);
        }

        const { password, ...adminDataWithoutPassword } = loggedInUser;

        response.success(res, "Report Data fetched!", {
          ...adminDataWithoutPassword,
          reportData,
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
  async reportDataFormsGet(req, res) {
    try {
      const token = req.cookies.token;
      const { tokenId } = req.params;

      if (token) {
        const loggedInUser = await prisma.user.findFirst({
          where: {
            token: parseInt(token),
          },
        });

        const submittedData = await prisma.submittedData.findMany({
          where: {
            token: tokenId,
          },
        });

        const formIds = submittedData?.map((form) => {
          return form.formId;
        });

        const forms = await prisma.websiteData.findMany({
          where: {
            id: {
              in: formIds,
            },
          },
        });

        const formWithStatus = [];
        const uncheckedFormWthStatus = [];

        for (let form of forms) {
          const formStatus = await prisma.submittedData.findFirst({
            where: {
              formId: form.id,
              token: tokenId,
            },
          });

          formWithStatus.push({ ...form, status: formStatus?.status });
        }
        for (let form of forms) {
          const formStatus = await prisma.submittedData.findFirst({
            where: {
              formId: form.id,
              token: tokenId,
              status: 0,
            },
          });

          if (formStatus) {
            uncheckedFormWthStatus.push({
              ...form,
              status: formStatus?.status,
            });
          }
        }

        const { password, ...adminDataWithoutPassword } = loggedInUser;

        response.success(res, "Report Data fetched!", {
          ...adminDataWithoutPassword,
          reportDataForms: formWithStatus,
          uncheckedForms: uncheckedFormWthStatus,
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

module.exports = new ReportRouter();
