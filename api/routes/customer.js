const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Customer = require("../model/customer");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const verifyToken = require("../middleware/jwt");
const {
  convertUtcToLongDateFormat,
  addValidTillToCurrDate,
} = require("../utils");
require("dotenv").config();

// future usecase
router.post("/signup", (req, res) => {
  console.log(req.body);
  bcrypt.hash(req.body.password, 10, (err, hash) => {
    if (err) {
      return res.status(500).json({
        error: err,
      });
    } else {
      const customer = new Customer({
        _id: new mongoose.Types.ObjectId(),
        customerName: req.body.customerName,
        password: hash,
        email: req.body.email,
        phone: req.body.phone,
        address: req.body.address,
        age: req.body.age,
        gender: req.body.gender,
        bloodGroup: req.body.bloodGroup,
        currentBeginDate: req.body.currentBeginDate,
        currentFinishDate: req.body.currentFinishDate,
      });

      customer
        .save()
        .then((result) => {
          res.status(200).json({
            new_customer: result,
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

// future usecase
router.post("/login", (req, res) => {
  console.log(req.body);
  Customer.find({ email: req.body.email })
    .exec()
    .then((customer) => {
      console.log("customerFromDB: ", customer);
      if (customer.length < 1) {
        return res.status(404).json({
          msg: "user not found",
        });
      }
      console.log(
        "req.body.password,customer[0].password",
        req.body.password,
        customer[0].password,
      );
      bcrypt.compare(req.body.password, customer[0].password, (err, result) => {
        if (!result) {
          return res.status(401).json({
            msg: "password matching failed",
          });
        }
        if (result) {
          const token = jwt.sign(
            {
              customerName: customer[0].customerName,
              email: customer[0].email,
              phone: customer[0].phone,
              userType: customer[0].userType,
            },
            process.env.JWT_TOKEN,
            {
              expiresIn: "10000000000hr",
            },
          );
          res.status(200).json({
            customer: customer[0].customerName,
            userType: customer[0].userType,
            phone: customer[0].phone,
            email: customer[0].email,
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

// const homePageRes = (req, res, next) => {
// res.createHomePageRes = (Customer) =>{

// }
// };

router.get("/getCustomers", verifyToken, async (req, res) => {
  try {
    const customers = await Customer.find({});

    const today = new Date();

    const currentDate = today.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    console.log("currentDate", currentDate);
    const parseCurrDate = new Date(currentDate);
    const groupedData = customers.reduce(
      (acc, customer) => {
        const parseFinishdate = new Date(customer.currentFinishDate);
        if (parseFinishdate >= parseCurrDate) {
          acc.current.push({
            customerName: customer.customerName,
            age: customer.age,
            gender: customer.gender,
            bloodGroup: customer.bloodGroup,
            address: customer.address,
            phone: customer.phone,
            email: customer.email,
            currentBeginDate: customer.currentBeginDate,
            currentFinishDate: customer.currentFinishDate,
            gymId: customer.gymId,
            expiring: (parseFinishdate - parseCurrDate) / (1000 * 60 * 60 * 24),
          });
        } else {
          acc.expired.push({
            customerName: customer.customerName,
            age: customer.age,
            gender: customer.gender,
            bloodGroup: customer.bloodGroup,
            address: customer.address,
            phone: customer.phone,
            email: customer.email,
            currentBeginDate: customer.currentBeginDate,
            currentFinishDate: customer.currentFinishDate,
            gymId: customer.gymId,
            expired: (parseCurrDate - parseFinishdate) / (1000 * 60 * 60 * 24),
          });
        }
        return acc;
      },
      { current: [], expired: [] },
    );

    res.status(200).json(groupedData);
  } catch (err) {
    // Handle error
    console.error("Error:", err);
    // res.createHomePageRes()
    return res.status(500).json({ error: err });
  }
});

router.post("/postCustomer", verifyToken, (req, res) => {
  const customer = new Customer({
    _id: new mongoose.Types.ObjectId(),
    customerName: req.body.customerName,
    email: req.body.email,
    phone: req.body.phone,
    address: req.body.address,
    age: req.body.age,
    gender: req.body.gender,
    bloodGroup: req.body.bloodGroup,
    currentBeginDate: req.body.currentBeginDate,
    currentFinishDate: addValidTillToCurrDate(
      req.body.currentBeginDate,
      req.body.validTill,
    ),
    gymId: req.body.gymId,
  });

  customer
    .save()
    .then((result) => {
      // console.log(result.currentFinishDate);
      res.status(200).json({
        new_customer: result,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
});

router.get("/getCustomerProfile/:customerId", verifyToken, async (req, res) => {
  try {
    const customerId = req.params.customerId;
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.status(200).json(customer);
  } catch (err) {
    // Handle error
    console.error("Error:", err);
    return res.status(500).json({ error: "'Internal Server Error'" });
  }
});

module.exports = router;
