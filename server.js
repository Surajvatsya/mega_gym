const http = require("http");
const app = require("./app");
require("dotenv").config();
const cron = require('node-cron');
const Customer = require("./api/model/customer");
const Owner = require('./api/model/owner');
const admin = require("firebase-admin");

const serviceAccount = require("./notification.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

function pushNotification(deviceToken, title, body) {

  const message = {
    notification: {
      title: title,
      body: body,
    },
    token: deviceToken,
  };

  admin
    .messaging()
    .send(message)
    .then((response) => {
      console.log("Notification sent successfully ", response);
    })
    .catch((err) => {
      console.log("Error sending Notification ", err);
    });
}


const reminderJob = cron.schedule('*/5 * * * * *', async () => {

  const customers = await Customer.find({}).exec();

  customers.forEach(async customer => {
    const finishDate = new Date(customer.currentFinishDate);
    const currentDate = new Date();

    if (currentDate.getDate() == finishDate.getDate() &&
      currentDate.getMonth() == finishDate.getMonth() &&
      currentDate.getFullYear() == finishDate.getFullYear()) {

      const owner = await Owner.findById(customer.gymId).exec();

      const title = `Hello ${owner.name}`;
      const body = `Subscription of ${customer.name} has ended`;
      pushNotification("qweqweqwe", title, body);
      console.log(title);
      console.log(body);
    }
  });
})

reminderJob.start();

const port = process.env.PORT || 3000;

const server = http.createServer(app);
server.listen(port, () => {
  console.log("this app is running on " + port);
});
