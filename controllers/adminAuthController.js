const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const response = require("../utils/response");
const getLoggedInUser = require("../utils/getLoggedInUser");
const getMenus = require("../utils/getMenus");
const getToken = require("../utils/getToken");

class AdminAuthController {
  async userRegisterPost(req, res) {
    try {
      // no of users is for the clients
      const {
        name,
        email,
        password,
        roleId,
        noOfUsers,
        userIdDemo,
        userIdLive,
      } = req.body;

      const loggedInUser = await getLoggedInUser(req, res);

      // const alreadyRegistered = await prisma.user.findFirst({
      //   where: {
      //     OR: [{ email }],
      //   },
      // });

      const alreadyRegistered = false; // temporary variable for testing uncomment the alreadyRegistered code above

      if (loggedInUser) {
        if (alreadyRegistered) {
          if (alreadyRegistered.email === email) {
            response.error(
              res,
              "User already registered with this Email.",
              alreadyRegistered
            );
          }
        } else if (noOfUsers || userIdDemo || userIdDemo) {
          const alreadyExistingUserForSameClient = await prisma.user.findMany({
            where: {
              email,
            },
          });

          const demoPrefix = userIdDemo;
          const livePrefix = userIdLive;
          const adminId = loggedInUser?.id;
          const role = 4;

          if (alreadyExistingUserForSameClient.length > 0) {
            const newUsers = [];

            for (
              let i = alreadyExistingUserForSameClient.length / 2 + 1;
              i <= alreadyExistingUserForSameClient.length / 2 + noOfUsers;
              i++
            ) {
              const newDemoUser = await prisma.user.create({
                data: {
                  username: `${demoPrefix}_${i}`,
                  email,
                  password,
                  roleId: role,
                  adminId: adminId,
                  status: 1,
                },
              });
              const newLiveUser = await prisma.user.create({
                data: {
                  username: `${livePrefix}_${i}`,
                  email,
                  password,
                  roleId: role,
                  adminId: adminId,
                  status: 1,
                },
              });
              // Assigning role
              await prisma.roleAssign.create({
                data: {
                  roleId: role,
                  userId: newDemoUser.id,
                },
              });
              await prisma.roleAssign.create({
                data: {
                  roleId: role,
                  userId: newLiveUser.id,
                },
              });
              newUsers.push(newDemoUser, newLiveUser);
            }

            return response.success(
              res,
              `${noOfUsers} users registered successfully!`,
              newUsers
            );
          } else {
            const newUsers = [];

            for (let i = 1; i <= noOfUsers; i++) {
              const newDemoUser = await prisma.user.create({
                data: {
                  username: `${demoPrefix}_${i}`,
                  email,
                  password,
                  roleId: role,
                  adminId: adminId,
                  status: 1,
                },
              });
              const newLiveUser = await prisma.user.create({
                data: {
                  username: `${livePrefix}_${i}`,
                  email,
                  password,
                  roleId: role,
                  adminId: adminId,
                  status: 1,
                },
              });
              // Assigning role
              await prisma.roleAssign.create({
                data: {
                  roleId: role,
                  userId: newDemoUser.id,
                },
              });
              await prisma.roleAssign.create({
                data: {
                  roleId: role,
                  userId: newLiveUser.id,
                },
              });

              newUsers.push(newDemoUser, newLiveUser);
            }
            return response.success(
              res,
              `${noOfUsers} users registered successfully!`,
              newUsers
            );
          }
        } else {
          const newUser = await prisma.user.create({
            data: {
              username: name,
              email,
              password,
              roleId: parseInt(roleId),
              adminId: loggedInUser.id,
              status: 1,
            },
          });

          // Assigning role
          await prisma.roleAssign.create({
            data: {
              roleId: parseInt(roleId),
              userId: newUser.id,
            },
          });

          response.success(res, "User registered successfully!", newUser);
        }
      } else {
        const newUser = await prisma.user.create({
          data: {
            username: name,
            email,
            password,
            roleId: 1,
            status: 1,
          },
        });

        // Assigning role
        await prisma.roleAssign.create({
          data: {
            roleId: 1,
            userId: newUser.id,
          },
        });
        response.success(res, "User registered successfully!", newUser);
      }
    } catch (error) {
      console.log("error while user registration ->", error);
    }
  }

  async userLoginPost(req, res) {
    try {
      const { usernameOrEmail, password } = req.body;
      const userIp = req.socket.remoteAddress;

      let userFound = await prisma.user.findFirst({
        where: {
          OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
        },
      });

      if (!userFound) {
        response.error(res, "No user found with this email!");
      } else if (password === userFound.password) {
        const session = await prisma.session.findFirst({
          where: {
            userId: userFound.id,
          },
        });

        if (session) {
          const lastActiveTime = new Date(session.lastActive);
          const currentTime = new Date();

          const timeLimit = 30; // in seconds

          if ((currentTime - lastActiveTime) / 1000 < timeLimit) {
            response.error(res, "You are already logged in somewhere else!");
            return;
          }
        }

        // checking if user is active to prevent him logging again
        if (!userFound.status) {
          response.error(res, "Your account has been deactivated!");
          return;
        }

        // generates a number between 1000 and 10000 to be used as token
        const loginToken = Math.floor(
          Math.random() * (10000 - 1000 + 1) + 1000
        );

        // updating user's token, and isActive status
        const updatedAdmin = await prisma.user.update({
          where: {
            id: userFound.id,
          },
          data: {
            isActive: 1,
            token: loginToken,
            userIp,
          },
        });

        const allUsers = await prisma.user.findMany({
          where: {
            adminId: userFound.id,
          },
          select: {
            id: true,
            username: true,
            password: true,
            email: true,
            roleId: true,
          },
        });

        const menus = await getMenus(req, res, updatedAdmin);

        const { password, ...adminDataWithoutPassword } = updatedAdmin;

        // cookie expiration date - 15 days
        const expirationDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
        res.cookie("token", loginToken, {
          expires: expirationDate,
          httpOnly: true,
          secure: true,
        });

        response.success(res, "User logged in!", {
          ...adminDataWithoutPassword,
          users: allUsers,
          menus,
        });
      } else {
        response.error(res, "Wrong credentials!");
      }
    } catch (error) {
      console.log("error while loggin in user ", error);
    }
  }

  async userUpdatePatch(req, res) {
    try {
      const { name, email, password, roleId, status } = req.body;

      const { userId } = req.params;

      // finding user from id
      const userFound = await prisma.user.findFirst({
        where: {
          id: parseInt(userId),
        },
      });

      let alreadyRegistered;

      if (userFound) {
        if (alreadyRegistered) {
          if (alreadyRegistered.email === email) {
            response.error(
              res,
              "User already registered with this CRM Email.",
              alreadyRegistered
            );
          }
        } else {
          const updatedUser = await prisma.user.update({
            where: {
              id: userFound.id,
            },
            data: {
              username: name,
              email,
              password,
              roleId: parseInt(roleId),
              status,
            },
          });

          response.success(res, "User updated successfully!", {
            updatedUser,
          });
        }
      } else {
        response.error(res, "User not found!");
      }
    } catch (error) {
      console.log("error while updating user in admin controller", error);
    }
  }

  async userRemoveDelete(req, res) {
    try {
      const { userId } = req.params;

      // finding user from userId
      const userFound = await prisma.user.findFirst({
        where: {
          id: parseInt(userId),
        },
      });

      if (userFound) {
        const deletedUser = await prisma.user.delete({
          where: {
            id: parseInt(userId),
          },
        });

        response.success(res, "User deleted successfully!", { deletedUser });
      } else {
        response.error(res, "User does not exist! ");
      }
    } catch (error) {
      console.log("error while deleting user ", error);
    }
  }

  async userLoginGet(req, res) {
    try {
      const token = req.cookies.token;

      if (token) {
        const loggedInUser = await prisma.user.findFirst({
          where: {
            token: parseInt(token),
          },
          select: {
            id: true,
            email: true,
            password: true,
          },
        });

        const users = await prisma.user.findMany({
          where: {
            adminId: loggedInUser.id,
          },
          select: {
            id: true,
            username: true,
            email: true,
            roleId: true,
          },
        });

        const menus = await getMenus(req, res, loggedInUser);

        const { password, ...adminDataWithoutPassword } = loggedInUser;

        response.success(res, "User logged in with token!", {
          ...adminDataWithoutPassword,
          users,
          menus,
        });
      } else {
        // for some reason if we remove status code from response logout thunk in frontend gets triggered multiple times
        response.error(res, "User not logged in!", {});
      }
    } catch (error) {
      console.log("error while loggin in user, get method ", error);
    }
  }

  async adminLogoutGet(req, res) {
    try {
      const loggedInUser = await getLoggedInUser(req, res);

      if (loggedInUser) {
        await prisma.user.update({
          where: {
            id: parseInt(loggedInUser.id),
          },
          data: {
            isActive: 0,
          },
        });

        // delete the session
        const session = await prisma.session.findFirst({
          where: {
            userId: loggedInUser.id,
          },
        });

        await prisma.session.delete({
          where: {
            id: session.id,
          },
        });

        res.clearCookie("token");
        response.success(res, "User logged out successflly!");
      }
    } catch (error) {
      console.log("error while loggin in user ", error);
    }
  }

  async userChangePassword(req, res) {
    try {
      const loggedInUser = await getLoggedInUser(req, res);

      const { currentPassword, newPassword } = req.body;

      if (loggedInUser) {
        if (loggedInUser.password !== currentPassword) {
          response.error(
            res,
            "Current password doesn't match with our records!"
          );
        } else {
          await prisma.user.update({
            where: {
              id: loggedInUser.id,
            },
            data: {
              password: newPassword,
            },
          });

          response.success(res, "Password changed successfully");
        }
      } else {
        res.status(401).json({ message: "User not logged in" });
      }
    } catch (error) {
      console.log("Error while changing password ->", error);
    }
  }
}

module.exports = new AdminAuthController();
