const express = require("express");
const router = express.Router();
const twilio = require("twilio");
require("dotenv").config();
const verifyToken = require("../middleware/jwt");

const accountSid = process.env.accountSid;
const authToken = process.env.authToken;

// Your route handler
// router.post("/send-message", async (req, res) => {
router.get("/sendWhatsAppMessage", (req, res) => {
  const client = new twilio(accountSid, authToken);

  client.messages
    .create({
      body: "Hello, Shantanu....Suraj Vatsya Express.js server wants to know about rose!",
      to: "whatsapp:+917424948001", // Your Twilio number
      from: "whatsapp:+14155238886", // Your recipient's number
    })
    .then((message) => console.log(message.sid))
    .catch((err) => console.error(err));

  res.send("WhatsApp message sent!");
});

module.exports = router;
