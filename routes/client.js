const express = require("express");
const ClientRouter = express.Router({ mergeParams: true });
const ClientController = require("../controllers/clientController");

ClientRouter.get("/clients", ClientController.clientsGet);
ClientRouter.get("/client/:clientEmail/users", ClientController.getClientUsers);
ClientRouter.post("/client/create", ClientController.clientCreatePost);
ClientRouter.patch(
  "/client/:clientId/edit",
  ClientController.clientUpdatePatch
);
// ClientRouter.delete(
//   "/client/:clientId/delete",
//   ClientController.clientRemoveDelete
// );
ClientRouter.post("/client/delete", ClientController.clientRemoveDelete);

module.exports = ClientRouter;
