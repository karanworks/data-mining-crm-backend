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
    origin: "http://192.168.1.5:3004",
    // origin: "http://localhost:3004",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://192.168.1.5:3004");
  // res.setHeader("Access-Control-Allow-Origin", "http://localhost:3004");
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

app.use("/", homeRouter);
app.use("/", adminAuthRouter);
app.use("/", adminUsersRouter);
app.use("/", roleRouter);
app.use("/", mappingRouter);
app.use("/", clientRouter);
app.use("/", addDataRouter);
app.use("/", addWorkDataRouter);
app.use("/", completedDataRouter);
app.use("/", reportRouter);
app.use("/", checkFormRouter);
app.use("/", countReportRouter);
app.use("/", invoiceRouter);
app.use("/", paymentRouter);

app.listen(process.env.PORT || 3003, () => {
  console.log(`Server listening at port no -> ${process.env.PORT}`);
});
