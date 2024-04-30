const admin = require("firebase-admin");
const express = require("express");
const router = express.Router();

const serviceAccount = require("/Users/suraj.kumar1/Desktop/MEGA_GYM/notification.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

router.post("/pushNotification", (req, res) => {
  const token = req.body.token;
  if (!token) return res.status(401).json({ error: "Token not provided" });

  const message = {
    notification: {
      title: req.body.title,
      body: req.body.body,
    },
    token: token,
  };

  admin
    .messaging()
    .send(message)
    .then((response) => {
      console.log("Notification sent successfully ", response);
      res.status(200).json({ message: "Notification sent" });
    })
    .catch((err) => {
      console.log("Error sending Notification ", response);
      res.status(500).json({ error: err.message });
    });
});

module.exports = router;