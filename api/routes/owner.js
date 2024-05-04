const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Owner = require("../model/owner");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const Customer = require("../model/customer");
const verifyToken = require("../middleware/jwt");
const Plan = require("../model/plan");
const Utils = require("../utils")

router.post("/signup", (req, res) => {
  console.log(req.body);
  bcrypt.hash(req.body.password, 10, (err, hash) => {
    if (err) {
      return res.status(500).json({
        error: err,
      });
    } else {
      const ownerId = new mongoose.Types.ObjectId();
      const owner = new Owner({
        _id: ownerId,
        ownerName: req.body.ownerName,
        password: hash,
        email: req.body.email,
        gymName: req.body.gymName,
        contact: req.body.contact,
        address: req.body.address,
        upiId: req.body.upiId,
        deviceToken: req.body.deviceToken,
      });

      owner
        .save()
        .then((result) => {
          if (result) {
            const token = jwt.sign(
              {
                ownerId,
                email: req.body.email,
                contact: req.body.contact,
                userType: req.body.userType,
              },
              process.env.JWT_TOKEN, //second parameter is the secret key used to sign the token
              {
                expiresIn: "10000000000hr",
              },
            );
            res.status(200).json({
              new_owner: result,
              token: token,
            });
          }
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
              ownerId: owner[0].id,
              email: owner[0].email,
              contact: owner[0].contact,
              userType: owner[0].userType,
            },
            process.env.JWT_TOKEN, //second parameter is the secret key used to sign the token
            {
              expiresIn: "10000000000hr",
            },
          );
          res.status(200).json({
            owner: owner[0].ownerName,
            userType: owner[0].userType,
            contact: owner[0].contact,
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

router.get("/analysis", verifyToken, async (req, res) => {
  const gymOwnerId = new mongoose.Types.ObjectId(req.jwt.ownerId);
  const numberOfPeople = await Customer.countDocuments({ gymId: gymOwnerId });
  const customers = await Customer.find({ gymId: gymOwnerId });
  const genderRatio = await Customer.aggregate([
    { $match: { gymId: gymOwnerId } },
    {
      $group: {
        _id: "$gender",
        count: { $sum: 1 },
      },
    },
  ]);
  const gender = genderRatio.reduce(
    (acc, ele) => {
      if (ele._id == "Male") {
        acc.Male = ele.count;
      } else {
        acc.Female = ele.count;
      }
      return acc;
    },
    { Male: 0, Female: 0 },
  );

  const planAnalysis = await Plan.aggregate([
    {
      $match: { gymId: gymOwnerId },
    },
    {
      $group: {
        _id: null, // Group by gender field
        averageMonth: { $avg: "$duration" }, // Count documents in each group
        fee: { $sum: "$fee" }, // Count documents in each group
      },
    },
  ]);

  if (!numberOfPeople)
    return res
      .status(404)
      .json({ message: "No customers records found in DB" });

  if (!genderRatio)
    return res.status(404).json({ message: "No gender data found" });
  if (!planAnalysis)
    return res.status(404).json({ message: "planAnalysis data not found" });

  res.status(200).json({
    males: gender.Male,
    females: gender.Female,
    numberOfPeople,
    averageMonth:
      planAnalysis.length == 0
        ? null
        : Math.round(planAnalysis[0].averageMonth),
    earnings: planAnalysis.length == 0 ? null : planAnalysis[0].fee,
  });
});

router.get("/getUpiId", verifyToken, async (req, res) => {
  try {
    const ownerId = req.jwt.ownerId;
    const owner = await Owner.findById(ownerId);
    if (!owner) {
      res.status(404).json({
        message: "Owner doesn't exist",
      });
    }
    res.status(200).json({ upiId: owner.upiId });
  } catch (err) {
    console.log("Error ", err);
    res.status(500).json({ error: "internal server error" });
  }
});

module.exports = router;


router.post('/analysis/:key', verifyToken, async (req, res) => {
  try {

    const currentDate = new Date();
    const keys = [currentDate.getMonth() - 3, currentDate.getMonth() - 2, currentDate.getMonth() - 1, currentDate.getMonth()];
    const plans = await Plan.find({ gymId: req.jwt.ownerId });


    var total = 0;
    var maxValue = 0;

    if (req.params.key == "earnings") {
      const values = keys.map(month => {

        const plansForMonth = plans.filter(plan => new Date(plan.startDate).getMonth() === month);
        const valuesForMonth = plansForMonth.reduce((total, plan) => total + plan.fee, 0);
        total = total + valuesForMonth;
        maxValue = maxValue < valuesForMonth ? valuesForMonth : maxValue;
        return valuesForMonth;
      });
      responseObject = {
        titles: keys.map(number => Utils.getMonthFromNumber(number)),
        data: values,
        average: (total / keys.length).toString(),
        total: total.toString(),
        maxLimitOfData: (maxValue * 1.2)
      }

      res.status(200).json(responseObject);
    }
    else if (req.params.key == "people") {
      console.log(plans)
      const values = keys.map(month => {
        const valuesForMonth = plans.filter(plan => new Date(plan.startDate).getMonth() <= month && new Date(plan.endDate).getMonth() >= month).length;
        total = total + valuesForMonth;
        maxValue = maxValue < valuesForMonth ? valuesForMonth : maxValue;
        return valuesForMonth;
      });
      responseObject = {
        titles: keys.map(number => Utils.getMonthFromNumber(number)),
        data: values,
        average: (total / keys.length).toString(),
        total: total.toString(),
        maxLimitOfData: (maxValue * 1.2)
      }

      res.status(200).json(responseObject);
    }

  }
  catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
})

function getValue(plan, key) {
  if (key == "earnings") {
    return plan.fee;
  }
  else if (key == "people") {
    return 1;
  }
  else {
    return 0;
  }
}