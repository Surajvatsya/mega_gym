const admin = require("firebase-admin");
const express = require("express");
const router = express.Router();

const serviceAccount = require("../../notification.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

router.post("/pushNotification", async (req, res) => {
  try {
    const ownerId = req.jwt.ownerId;
    const owner = await Owner.findById(ownerId);
    if (!owner) {
      res.status(404).json({
        message: "Owner doesn't exist",
      });
    }
    const message = {
      notification: {
        title: req.body.title,
        body: req.body.body,
      },
      token: owner.token,
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
  } catch (err) {
    console.log("Error :", err);
    res.status(500).json({ error: err });
  }
});

module.exports = router;
