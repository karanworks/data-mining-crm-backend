const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const response = require("../utils/response");

class PaymentController {
  async getPayments(req, res) {
    try {
      const token = req.cookies.token;

      const loggedInUser = await prisma.user.findFirst({
        where: {
          token: parseInt(token),
        },
      });
      if (loggedInUser) {
        const paymentInvoices = await prisma.invoice.findMany({});

        const { password, ...adminDataWithoutPassword } = loggedInUser;

        response.success(res, "Invoice Data fetched!", { paymentInvoices });
      } else {
        // for some reason if we remove status code from response logout thunk in frontend gets triggered multiple times
        response.error(res, "User not logged in!", {});
      }
    } catch (error) {
      console.log("error while getting count report data ", error);
    }
  }
}

module.exports = new PaymentController();
