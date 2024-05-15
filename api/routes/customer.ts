import { JWToken, RegisterCustomerRequest, updateSubscriptionRequest } from "../../requests";
import { GetCustomerProfileResponse, GetCustomersResponse } from "../../responses";
const mongoose = require("mongoose");
import Customer from '../model/customer'
import Plan from '../model/plan'
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const verifyToken = require("../middleware/jwt");
import { addValidTillToCurrDate } from '../utils'
import express, { Request, Response } from 'express';

require("dotenv").config();
const router = express.Router();

// future usecase
router.post("/signup", (req: any, res: any) => {
  console.log(req.body);
  bcrypt.hash(req.body.password, 10, (err: any, hash: string) => {
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
      bcrypt.compare(req.body.password, customer[0].password, (err: any, result: any) => {
        if (!result) {
          return res.status(401).json({
            msg: "password matching failed",
          });
        }
        if (result) {
          const token = jwt.sign(
            {
              name: customer[0].name,
              email: customer[0].email,
              contact: customer[0].contact,
            },
            process.env.JWT_TOKEN,
            {
              expiresIn: "10000000000hr",
            },
          );
          res.status(200).json({
            customer: customer[0].name,
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

router.get("/getCustomers", verifyToken, async (req: any, res: Response<GetCustomersResponse>) => {
  try {
    const jwToken: JWToken = req.jwt;
    const gymOwnerId = jwToken.ownerId;
    const customers = await Customer.find({ gymId: gymOwnerId });
    const today = new Date();

    const currentDate = today.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const parseCurrDate = new Date(currentDate);

    const groupedData: GetCustomersResponse = customers.reduce(
      (acc: GetCustomersResponse, customer) => {
        const parseFinishdate = new Date(customer.currentFinishDate);
        if (parseFinishdate >= parseCurrDate) {
          const expiryIndays =
            (parseFinishdate.getTime() - parseCurrDate.getTime()) / (1000 * 60 * 60 * 24);
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
            gymId: customer.gymId.toString(),
            expiring: expiryIndays <= 10 ? expiryIndays : null,
            expired: null
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
            gymId: customer.gymId.toString(),
            expired: (parseCurrDate.getTime() - parseFinishdate.getTime()) / (1000 * 60 * 60 * 24),
            expiring: null
          });
        }
        return acc;
      },
      { current: [], expired: [] },
    );

    groupedData.current.sort(function (a, b) {
      return (a.expiring ?? Infinity) - (b.expiring ?? Infinity)
    })

    groupedData.expired.sort(function (a, b) {
      return (a.expired ?? 0) - (b.expired ?? 0);
    })

    res.status(200).json(groupedData);
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ current: [], expired: [] });
  }
});

router.post("/registerCustomer", verifyToken, async (req: any, res: any) => {
  try {
    const customerId = new mongoose.Types.ObjectId();
    const requestBody: RegisterCustomerRequest = req.body
    const jwToken: JWToken = req.jwt

    const newPlan = new Plan({
      _id: new mongoose.Types.ObjectId(),
      gymId: jwToken.ownerId,
      customerId: customerId,
      duration: requestBody.validTill,
      fee: requestBody.charges,
      startDate: requestBody.currentBeginDate,
      endDate: addValidTillToCurrDate(
        requestBody.currentBeginDate,
        requestBody.validTill,
      ),
    });

    const customer = new Customer({
      _id: customerId,
      name: requestBody.customerName,
      email: requestBody.email,
      contact: requestBody.contact,
      address: requestBody.address,
      age: requestBody.age,
      gender: requestBody.gender,
      bloodGroup: requestBody.bloodGroup,
      currentBeginDate: requestBody.currentBeginDate,
      currentFinishDate: addValidTillToCurrDate(
        requestBody.currentBeginDate,
        requestBody.validTill,
      ),
      gymName: requestBody.gymName,
      gymId: jwToken.ownerId,
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
    res.status(500).json({ error: "err.message" });
  }
});

router.get("/getCustomerProfile/:customerId", verifyToken, async (req, res: Response<GetCustomerProfileResponse>) => {
  try {
    const customerId = req.params.customerId;
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        gymId: null,
        name: null,
        age: null,
        gender: null,
        bloodGroup: null,
        address: null,
        contact: null,
        email: null,
        currentBeginDate: null,
        currentFinishDate: null,

        error: "Customer not found"
      });
    }
    res.status(200).json({
      gymId: customer.gymId.toString(),
      name: customer.name,
      age: customer.age,
      gender: customer.gender,
      bloodGroup: customer.bloodGroup,
      address: customer.address,
      contact: customer.contact,
      email: customer.email,
      currentBeginDate: customer.currentBeginDate,
      currentFinishDate: customer.currentFinishDate,
      error: null
    });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({
      gymId: null,
      name: null,
      age: null,
      gender: null,
      bloodGroup: null,
      address: null,
      contact: null,
      email: null,
      currentBeginDate: null,
      currentFinishDate: null, error: "'Internal Server Error'"
    });
  }
});

router.put("/updateSubscription/:customerId", verifyToken, async (req, res) => {

  const requestBody: updateSubscriptionRequest = req.body;

  let finishDate = addValidTillToCurrDate(
    requestBody.currentBeginDate,
    requestBody.validTill,
  );

  try {
    const customerId = req.params.customerId;
    const newPlan = new Plan({
      _id: new mongoose.Types.ObjectId(),
      customerId: customerId,
      duration: requestBody.validTill,
      fee: requestBody.charges,
      startDate: requestBody.currentBeginDate,
      endDate: finishDate,
    });

    const createPlan = await newPlan.save();

    let updateFields = {
      currentBeginDate: requestBody.currentBeginDate,
      currentFinishDate: finishDate,
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
