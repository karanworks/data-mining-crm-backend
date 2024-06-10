const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const response = require("../utils/response");
const getLoggedInUser = require("../utils/getLoggedInUser");

class AddWorkDataController {
  async addWorkDataGet(req, res) {
    try {
      const token = req.cookies.token;

      if (token) {
        const loggedInUser = await prisma.user.findFirst({
          where: {
            token: parseInt(token),
          },
        });

        const assignedWorkData = await prisma.assignedData.findMany({
          where: {
            userId: loggedInUser.id,
            status: 0,
          },
        });

        const { password, ...adminDataWithoutPassword } = loggedInUser;

        response.success(res, "Assigned Data fetched!", {
          ...adminDataWithoutPassword,
          assignedWorkData,
        });
      } else {
        // for some reason if we remove status code from response logout thunk in frontend gets triggered multiple times
        res
          .status(401)
          .json({ message: "user not already logged in.", status: "failure" });
      }
    } catch (error) {
      console.log("error while getting assigned data ", error);
    }
  }

  async addWorkDataCreatePost(req, res) {
    try {
      const {
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
            username: loggedInUser.username,
          },
        });

        const assignedData = await prisma.assignedData.findFirst({
          where: {
            id: parseInt(urlId),
          },
        });

        // update the status of completed data
        await prisma.assignedData.update({
          where: {
            id: assignedData.id,
          },
          data: {
            status: 1,
          },
        });

        response.success(res, "Work Data submitted successfully!", {
          ...newWebsiteData,
        });
      }
    } catch (error) {
      console.log("error while adding work data ->", error);
    }
  }
}

module.exports = new AddWorkDataController();
