const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// checking if the user has adminId, it ensures that this is not an admin user
async function session(userId) {
  const sessionAlreadyExists = await prisma.session.findFirst({
    where: {
      userId,
    },
  });

  const lastActive = new Date();

  // update session if there is a session that already exists for this user
  if (sessionAlreadyExists) {
    await prisma.session.update({
      where: {
        id: sessionAlreadyExists.id,
        userId,
      },

      data: {
        lastActive,
      },
    });
  } else {
    // create session
    await prisma.session.create({
      data: {
        userId: userId,
        lastActive: new Date(),
      },
    });
  }

  return lastActive;
}

module.exports = session;
