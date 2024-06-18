const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

// routers
const homeRouter = require("./routes/home");
const adminAuthRouter = require("./routes/adminAuth");
const adminUsersRouter = require("./routes/adminUsers");
const mappingRouter = require("./routes/mapping");
const clientRouter = require("./routes/client");
const addDataRouter = require("./routes/addData");
const addWorkDataRouter = require("./routes/addWorkData");
const completedDataRouter = require("./routes/completedData");
const reportRouter = require("./routes/report");
const checkFormRouter = require("./routes/checkForm");
const countReportRouter = require("./routes/countReport");
const invoiceRouter = require("./routes/invoice");
const paymentRouter = require("./routes/payment");

// cookie parser
const cookieParser = require("cookie-parser");
const roleRouter = require("./routes/roles");

// parsing json
app.use(express.json());

// cors connection
app.use(
  cors({
    // origin: "http://192.168.1.5:3004",
    origin: "http://localhost:3004",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use((req, res, next) => {
  // res.setHeader("Access-Control-Allow-Origin", "http://192.168.1.5:3004");
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3004");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, PUT, POST, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );
  next();
});

app.use(cookieParser());

app.use("/data-mining/", homeRouter);
app.use("/data-mining/", adminAuthRouter);
app.use("/data-mining/", adminUsersRouter);
app.use("/data-mining/", roleRouter);
app.use("/data-mining/", mappingRouter);
app.use("/data-mining/", clientRouter);
app.use("/data-mining/", addDataRouter);
app.use("/data-mining/", addWorkDataRouter);
app.use("/data-mining/", completedDataRouter);
app.use("/data-mining/", reportRouter);
app.use("/data-mining/", checkFormRouter);
app.use("/data-mining/", countReportRouter);
app.use("/data-mining/", invoiceRouter);
app.use("/data-mining/", paymentRouter);

app.listen(process.env.PORT || 3003, () => {
  console.log(`Server listening at port no -> ${process.env.PORT}`);
});
