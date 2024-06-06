const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const response = require("../utils/response");
const getToken = require("../utils/getToken");

class AdminUsers {
  async adminUsersGet(req, res) {
    try {
      const token = await getToken(req, res);

      if (token) {
        const { isActive } = await prisma.user.findFirst({
          where: {
            token: parseInt(token),
          },
        });

        if (isActive) {
          const loggedInUser = await prisma.user.findFirst({
            where: {
              token: parseInt(token),
            },
            select: {
              id: true,
              email: true,
              password: true,
              adminId: true,
              roleId: true,
            },
          });

          const users = await prisma.user.findMany({
            where: {
              adminId: loggedInUser.id,
            },
            select: {
              id: true,
              username: true,
              password: true,
              email: true,
              roleId: true,
            },
          });

          // users of other admins as well
          const allUsers = await prisma.user.findMany({
            where: {
              id: {
                not: loggedInUser.id,
              },
            },
          });

          const { password, ...adminDataWithoutPassword } = loggedInUser;

          response.success(res, "Users fetched", {
            ...adminDataWithoutPassword,
            users,
            allUsers,
          });
        } else {
          response.error(res, "User not active");
        }
      } else {
        response.error(res, "User not already logged in.");
      }
    } catch (error) {
      console.log("error while getting users", error);
    }
  }
}

module.exports = new AdminUsers();
