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

const Plan = require("../model/plan");

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
        name: req.body.customerName,
        password: hash,
        email: req.body.email,
        contact: req.body.contact,
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
              name: customer[0].customerName,
              email: customer[0].email,
              contact: customer[0].contact,
              userType: customer[0].userType,
            },
            process.env.JWT_TOKEN,
            {
              expiresIn: "10000000000hr",
            },
          );
          res.status(200).json({
            customer: customer[0].name,
            userType: customer[0].userType,
            contact: customer[0].contact,
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

router.get("/getCustomers", verifyToken, async (req, res) => {
  try {
    const gymOwnerId = req.jwt.ownerId;
    const customers = await Customer.find({ gymId: gymOwnerId });
    const today = new Date();

    const currentDate = today.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const parseCurrDate = new Date(currentDate);
    const groupedData = customers.reduce(
      (acc, customer) => {
        const parseFinishdate = new Date(customer.currentFinishDate);
        if (parseFinishdate >= parseCurrDate) {
          const expiryIndays =
            (parseFinishdate - parseCurrDate) / (1000 * 60 * 60 * 24);
          acc.current.push({
            id: customer.id,
            customerName: customer.name,
            age: customer.age,
            gender: customer.gender,
            bloodGroup: customer.bloodGroup,
            address: customer.address,
            contact: customer.contact,
            email: customer.email,
            currentBeginDate: customer.currentBeginDate,
            currentFinishDate: customer.currentFinishDate,
            gymId: customer.gymId,
            expiring: expiryIndays <= 10 ? expiryIndays : null,
          });
        } else {
          acc.expired.push({
            id: customer.id,
            customerName: customer.name,
            age: customer.age,
            gender: customer.gender,
            bloodGroup: customer.bloodGroup,
            address: customer.address,
            contact: customer.contact,
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

router.post("/registerCustomer", verifyToken, async (req, res) => {
  try {
    const customerId = new mongoose.Types.ObjectId();
    const newPlan = new Plan({
      _id: new mongoose.Types.ObjectId(),
      gymId: req.jwt.ownerId,
      customerId: customerId,
      duration: req.body.validTill,
      fee: req.body.charges,
      startDate: req.body.currentBeginDate,
      endDate: addValidTillToCurrDate(
        req.body.currentBeginDate,
        req.body.validTill,
      ),
    });

    const customer = new Customer({
      _id: customerId,
      name: req.body.customerName,
      email: req.body.email,
      contact: req.body.contact,
      address: req.body.address,
      age: req.body.age,
      gender: req.body.gender,
      bloodGroup: req.body.bloodGroup,
      currentBeginDate: req.body.currentBeginDate,
      currentFinishDate: addValidTillToCurrDate(
        req.body.currentBeginDate,
        req.body.validTill,
      ),
      gymName: req.body.gymName,
      gymId: req.jwt.ownerId,
    });

    const [planResult, customerResult] = await Promise.all([
      newPlan.save(),
      customer.save(),
    ]);

    res
      .status(200)
      .json({ new_plan: planResult, new_customer: customerResult });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
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

router.put("/updateSubscription/:customerId", verifyToken, async (req, res) => {

  let finishDate = addValidTillToCurrDate(
    req.body.currentBeginDate,
    req.body.validTill,
  );

  try {
    const customerId = req.params.customerId;
    const newPlan = new Plan({
      _id: new mongoose.Types.ObjectId(),
      customerId: customerId,
      duration: req.body.validTill,
      fee: req.body.charges,
      startDate: req.body.currentBeginDate,
      endDate: finishDate
    });

    const createPlan = await newPlan.save();

    
    let updateFields = {
      currentBeginDate: req.body.currentBeginDate,
      finishDate,
    };

    const updatedCustomer = await Customer.findByIdAndUpdate(
      customerId,
      updateFields,
      {
        new: true,
      },
    );

    if (!updatedCustomer)
      return res.status(404).json({ message: "Customer not found" });
    if (!createPlan)
      return res.status(404).json({ message: "couldn't createPlan" });
    res.status(200).json({ updatedCustomer, createPlan });
  } catch (error) {
    console.log("Error", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/deleteCustomer/:customerId", verifyToken, async (req, res) => {
  try {
    const customerId = req.params.customerId;
    const deletedCustomer = await Customer.findByIdAndDelete(customerId);
    if (!deletedCustomer)
      return res.status(404).json({ message: "Customer not found" });
    res.status(200).json({ deletedCustomer });
  } catch (error) {
    console.log("Error", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
