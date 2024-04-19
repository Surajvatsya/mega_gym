const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Owner = require("../model/owner");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

router.post("/signup", (req, res) => {
  console.log(req.body);
  bcrypt.hash(req.body.password, 10, (err, hash) => {
    if (err) {
      return res.status(500).json({
        error: err,
      });
    } else {
      const owner = new Owner({
        _id: new mongoose.Types.ObjectId(),
        ownerName: req.body.ownerName,
        password: hash,
        email: req.body.email,
        gymName: req.body.gymName,
        contact: req.body.contact,
        address: req.body.address,
      });

      owner
        .save()
        .then((result) => {
          res.status(200).json({
            new_owner: result,
          });
        })
        .catch((err) => {
          console.log(err);
          res.status(500).json({
            error: err,
          });
        });
    }
  });
});

router.post("/login", (req, res) => {
  console.log(req.body);
  Owner.find({ email: req.body.email })
    .exec()
    .then((owner) => {
      if (owner.length < 1) {
        return res.status(404).json({
          msg: "Gym Owner not found",
        });
      }
      bcrypt.compare(req.body.password, owner[0].password, (err, result) => {
        if (!result) {
          return res.status(401).json({
            msg: "password matching failed",
          });
        }
        if (result) {
          const token = jwt.sign(
            {
              ownerName: owner[0].ownerName,
              email: owner[0].email,
              phone: owner[0].phone,
              userType: owner[0].userType,
            },
            "this is demo user api", //second parameter is the secret key used to sign the token
            {
              expiresIn: "24h",
            },
          );
          res.status(200).json({
            owner: owner[0].ownerName,
            userType: owner[0].userType,
            phone: owner[0].phone,
            email: owner[0].email,
            token: token,
          });
        }
      });
    })

    .catch((err) => {
      res.status(500).json({
        error: err,
      });
    });
});

module.exports = router;
