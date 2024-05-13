const express = require("express");
const app = express();
const customerRoute = require("./api/routes/customer");
const ownerRoute = require("./api/routes/owner");
const messageRoute = require("./api/routes/message");
const notificationRoute = require("./api/routes/firebase");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const { urlencoded, json } = require("body-parser");
const cors = require("cors");

const dbUrl =
  "mongodb+srv://surajkumar742494:J9qYedaef8h5WbSg@gym.ftaj8yk.mongodb.net/?retryWrites=true&w=majority&appName=GYM";

mongoose.connect(dbUrl);

mongoose.connection.on("error", (err: any) => {
  console.log("connection failed");
});

mongoose.connection.on("connected", () => {
  console.log("connected successfully with database");
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(cors());

app.use("/customer", customerRoute);
app.use("/owner", ownerRoute);
app.use("/whatsapp", messageRoute);
app.use("/notification", notificationRoute);

export default app;