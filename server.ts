import Owner from "./api/model/owner";
import app from './app'
const http = require("http");
require("dotenv").config();
const cron = require("node-cron");
const Customer = require("./api/model/customer");
const admin = require("firebase-admin");

const serviceAccount = require("./notification.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

function pushNotification(deviceToken: String, title: String, body: String) {
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
        .then((response: any) => {
            console.log("Notification sent successfully ", response);
        })
        .catch((err: any) => {
            console.log("Error sending Notification ", err);
        });
}

// for every 5 seconds */5 * * * * *
// for 8 am 0 8 * * * *
const reminderJob = cron.schedule("*/1 * * * * *", async () => {
    const customers = await Customer.find({}).exec();

    customers.forEach(async (customer: any) => {
        const finishDate = new Date(customer.currentFinishDate);
        const currentDate = new Date();

        if (
            currentDate.getDate() == finishDate.getDate() &&
            currentDate.getMonth() == finishDate.getMonth() &&
            currentDate.getFullYear() == finishDate.getFullYear()
        ) {
            const owner: Owner | null = await Owner.findById(customer.gymId).exec();

            if (owner) {
                const title = `Hello ${owner.name}`;
                const body = `Subscription of ${customer.name} has ended`;
                pushNotification(owner.deviceToken, title, body);
                console.log(title);
                console.log(body);
            }
        }
    });
});

reminderJob.start();

const port = process.env.PORT || 3000;

const server = http.createServer(app);
server.listen(port, () => {
    console.log("this app is running on " + port);
});
