const express = require("express");
const router = express.Router();
const twilio = require("twilio");
require("dotenv").config();
const verifyToken = require("../middleware/jwt");

const accountSid = process.env.accountSid;
const authToken = process.env.authToken;

router.get("/sendWhatsAppMessage", (req: any, res: any) => {
  const client = new twilio(accountSid, authToken);

  client.messages
    .create({
      body: "Hello, Shantanu....Suraj Vatsya Express.js server wants to know about rose!",
      to: "whatsapp:+917424948001",
      from: "whatsapp:+14155238886",
    })
    .then((message: any) => console.log(message.sid))
    .catch((err: any) => console.error(err));

  res.send("WhatsApp message sent!");
});

module.exports = router;
