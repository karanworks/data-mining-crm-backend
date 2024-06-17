const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const response = require("../utils/response");
const getLoggedInUser = require("../utils/getLoggedInUser");
const getMenus = require("../utils/getMenus");
const getToken = require("../utils/getToken");
const { parse } = require("path");
const { type } = require("os");

class ClientController {
  async clientsGet(req, res) {
    try {
      const token = req.cookies.token;

      if (token) {
        const loggedInUser = await prisma.user.findFirst({
          where: {
            token: parseInt(token),
          },
        });

        const allClients = await prisma.client.findMany({
          where: {
            addedBy: loggedInUser.id,
          },
        });

        const clients = await Promise.all(
          allClients.map(async (client) => {
            const role = await prisma.role.findFirst({
              where: {
                id: parseInt(client.roleId),
              },
            });

            // const users = await prisma.user.findMany({
            //   where: {
            //     email: client.email,
            //   },
            // });

            return { ...client, type: role.name };
          })
        );

        const { password, ...adminDataWithoutPassword } = loggedInUser;

        response.success(res, "Clients fetched!", {
          ...adminDataWithoutPassword,
          clients,
        });
      } else {
        // for some reason if we remove status code from response logout thunk in frontend gets triggered multiple times
        res
          .status(401)
          .json({ message: "user not already logged in.", status: "failure" });
      }
    } catch (error) {
      console.log("error while getting clients ", error);
    }
  }

  async clientCreatePost(req, res) {
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
      } = req.body;

      const loggedInUser = await getLoggedInUser(req, res);

      if (loggedInUser) {
        const newClient = await prisma.client.create({
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
            status: 1,
            addedBy: loggedInUser.id,
          },
        });

        const roleType = await prisma.role.findFirst({
          where: {
            id: parseInt(roleId),
          },
        });

        response.success(res, "Client registered successfully!", {
          ...newClient,
          type: roleType.name,
        });
      }
    } catch (error) {
      console.log("error while client registration ->", error);
    }
  }

  async clientUpdatePatch(req, res) {
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

  async clientRemoveDelete(req, res) {
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
  // async clientRemoveDelete(req, res) {
  //   try {
  //     const { clientId } = req.params;

  //     console.log("DELETE API CALLED WITH MULTIPLE USERS ->", clientId);

  //     const clientFound = await prisma.client.findFirst({
  //       where: {
  //         id: parseInt(clientId),
  //       },
  //     });

  //     if (clientFound) {
  //       const deletedClient = await prisma.client.delete({
  //         where: {
  //           id: parseInt(clientId),
  //         },
  //       });

  //       response.success(res, "Cilent deleted successfully!", {
  //         deletedClient,
  //       });
  //     } else {
  //       response.error(res, "Client does not exist! ");
  //     }
  //   } catch (error) {
  //     console.log("error while deleting client ", error);
  //   }
  // }

  async getClientUsers(req, res) {
    try {
      const { clientEmail } = req.params;

      const clientAllUsers = await prisma.user.findMany({
        where: {
          email: clientEmail,
        },
      });

      // client users with assisgned data and completed data
      const clientUsers = await Promise.all(
        clientAllUsers.map(async (user) => {
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

      response.success(res, "Client users fetched!", clientUsers);
    } catch (error) {
      console.log("error while deleting client ", error);
    }
  }
}

module.exports = new ClientController();
