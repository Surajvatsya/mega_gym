const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");

router.post("/pushNotification", (req: any, res: any) => {
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
    .then((response: any) => {
      console.log("Notification sent successfully ", response);
      res.status(200).json({ message: "Notification sent" });
    })
    .catch((err: any) => {
      res.status(500).json({ error: err.message });
    });
});

module.exports = router;
