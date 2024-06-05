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

  async addWorkDataUpdatePatch(req, res) {
    try {
      const {
        companyName,
        address,
        agreementDate,
        email,
        contactNo,
        noOfUsers,
        userIdDemo,
        userIdLive,
        password,
        startTime,
        endTime,
        roleId,
        status,
      } = req.body;

      const { clientId } = req.params;

      console.log("ROLE ID WHILE UPDATING ->", roleId);

      // finding user from id
      const clientFound = await prisma.client.findFirst({
        where: {
          id: parseInt(clientId),
        },
      });

      if (clientFound) {
        const updatedClient = await prisma.client.update({
          where: {
            id: parseInt(clientId),
          },
          data: {
            companyName,
            address,
            agreementDate,
            email,
            contactNo,
            noOfUsers,
            userIdDemo,
            userIdLive,
            password,
            startTime,
            endTime,
            roleId: parseInt(roleId),
            status,
          },
        });

        const updatedRoleName = await prisma.role.findFirst({
          where: {
            id: parseInt(roleId),
          },
        });

        response.success(res, "Client updated successfully!", {
          updatedClient: { ...updatedClient, type: updatedRoleName.name },
        });
      } else {
        response.error(res, "Client not found!");
      }
    } catch (error) {
      console.log("error while updating client controller", error);
    }
  }

  async addWorkDataRemoveDelete(req, res) {
    try {
      const { clientId } = req.body;

      if (Array.isArray(clientId)) {
        const clientsFound = await prisma.client.findMany({
          where: {
            id: {
              in: clientId,
            },
          },
        });

        const clientsToBeDeletedIds = clientsFound?.map((client) => {
          return client.id;
        });

        if (clientsToBeDeletedIds.length > 0) {
          const deletedClient = await prisma.client.deleteMany({
            where: {
              id: {
                in: clientsToBeDeletedIds,
              },
            },
          });

          const emailsOfDeletedClients = clientsFound?.map((client) => {
            return client.email;
          });

          console.log(
            "EMAI OF emailsOfDeletedClients ->",
            emailsOfDeletedClients
          );
          const usersOfDeletedClients = await prisma.user.findMany({
            where: {
              email: {
                in: emailsOfDeletedClients,
              },
            },
          });

          console.log(
            "USER OF usersOfDeletedClients ->",
            usersOfDeletedClients
          );

          const idOfUsersToBeDeleted = usersOfDeletedClients?.map((user) => {
            return user.id;
          });

          const deletedUser = await prisma.user.deleteMany({
            where: {
              id: {
                in: idOfUsersToBeDeleted,
              },
            },
          });

          response.success(res, "Cilent deleted successfully!", {
            deletedClient: clientsFound,
          });
        } else {
          response.error(res, "Client does not exist! ");
        }
      } else {
        const clientFound = await prisma.client.findFirst({
          where: {
            id: parseInt(clientId),
          },
        });

        if (clientFound) {
          const deletedClient = await prisma.client.delete({
            where: {
              id: parseInt(clientId),
            },
          });

          const userToBeDeleted = await prisma.user.findFirst({
            where: {
              email: deletedClient?.email,
            },
          });

          const deletedUser = await prisma.user.delete({
            where: {
              id: userToBeDeleted.id,
            },
          });

          response.success(res, "Cilent deleted successfully!", {
            deletedClient,
          });
        } else {
          response.error(res, "Client does not exist! ");
        }
      }
    } catch (error) {
      console.log("error while deleting client ", error);
    }
  }
}

module.exports = new AddWorkDataController();
