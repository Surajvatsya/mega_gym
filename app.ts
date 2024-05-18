require("dotenv").config();
const express = require("express");
const app = express();
const customerRoute = require("./api/routes/customer");
const ownerRoute = require("./api/routes/owner");
const messageRoute = require("./api/routes/message");
const awsRoute = require("./api/routes/aws")
const notificationRoute = require("./api/routes/firebase");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

//NOTE :- Later in PROD change IP address of MONGODB to accept only from our BE server
// add inbound rules in security group
mongoose.connect(process.env.DB_URL);

mongoose.connection.on("error", (err: any) => {
  console.log("connection failed");
});

mongoose.connection.on("connected", () => {
  console.log("connected successfully with database");
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({limit: "5mb"}));

app.use(cors());
app.get("/", (req: any, res: any) => {
  res.status(200).json({
    message: "Nodejs server is up and running",
  });
})
app.use("/customer", customerRoute);
app.use("/owner", ownerRoute);
app.use("/whatsapp", messageRoute);
app.use("/notification", notificationRoute);
app.use("/aws", awsRoute);

export default app;
