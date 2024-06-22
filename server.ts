require("dotenv").config();
import Owner from "./api/model/owner";
import app from './app'
const http = require("http");
const cron = require("node-cron");
import Customer from "./api/model/customer";
import Attendance from "./api/model/attendance";
const admin = require("firebase-admin");
var cors = require('cors')

const serviceAccount = require("./notification.json");

app.use(cors());

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

function midnightTime(date: Date): Date {
    date.setHours(0, 0, 0, 0);
    return date;
}

// for every 5 seconds */5 * * * * *
// for 8 am 0 8 * * * *
const reminderJob = cron.schedule("0 8 * * * *", async () => {

    Customer.find().exec().then((customers:any) => {

        customers.forEach(async (customer:any) => {
            const finishDate = new Date(customer.currentFinishDate);
            const currentDate = new Date();
            let timeDifference = (midnightTime(currentDate).getTime() - midnightTime(new Date(finishDate)).getTime()) / (1000 * 60 * 60 * 24);

            if (timeDifference >= 0 && timeDifference <= 2) {
                Owner.findById(customer.gymId).exec().then((owner:any) => {

                    if (owner && owner.deviceToken) {
                        const title = `Subscription of ${customer.name} has ended`;
                        const body = `Hello ${owner.name}, Subscription of ${customer.name} has ended`;
                        pushNotification(owner.deviceToken, title, body);
                        console.log(title);
                        console.log(body);
                    }
                });


            }
        })
    });
});

//solve issue of 1st date here
const markAbsent = cron.schedule("0 0 * * * *", async () => {
    try{
        const today = new Date().getDate();
        Attendance.find().exec().then((customerAttendance:any) => {
            if (customerAttendance) { // Check if customerAttendance exists
                if (customerAttendance.days.length != today) {
                    customerAttendance.days += '0';
                    customerAttendance.save();
                }
            } else {
                console.log("No attendance record found!"); // Handle no record scenario
            }
        });
    }
    catch (error) {
        console.log("Error", error);
      }
    
});

reminderJob.start();
markAbsent.start();

const port = process.env.PORT;

const server = http.createServer(app);
server.listen(port, () => {
    console.log("this app is running on " + port);
});

