import { JWToken, RegisterCustomerRequest, updateSubscriptionRequest } from "../../requests";
import { GetCustomerProfileResponse, GetCustomersResponse, CustomerDetails } from "../../responses";
const mongoose = require("mongoose");
import Customer from '../model/customer'
import Plan from '../model/plan'
import Attendance from '../model/attendance'
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const verifyToken = require("../middleware/jwt");
import { addValidTillToCurrDate, getProfilePic, uploadBase64, deleteFromS3 } from '../utils'
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

    const groupedData: GetCustomersResponse = { current: [], expired: [] };
    const profilePicPromises: Promise<string | null | void>[] = [];

    for (const customer of customers) {
      const parseFinishdate = new Date(customer.currentFinishDate);
      const expiryIndays =
        (parseFinishdate.getTime() - parseCurrDate.getTime()) / (1000 * 60 * 60 * 24);

      const customerData: CustomerDetails = {
        id: customer.id,
        customerName: customer.name,
        contact: customer.contact,
        currentBeginDate: customer.currentBeginDate,
        currentFinishDate: customer.currentFinishDate,
        gymId: customer.gymId.toString(),
        expiring: expiryIndays <= 10 && expiryIndays > 0 ? expiryIndays : null,
        expired: expiryIndays > 0 ? null : Math.abs(expiryIndays),
        profilePic: null,
        goal: customer.goal,
        experience: customer.experience,
      };

      profilePicPromises.push(getProfilePic(customer.id).then(profilePic => {
        customerData.profilePic = profilePic;
      }));



      if (expiryIndays <= 0) {
        groupedData.expired.push(customerData);
      } else {
        groupedData.current.push(customerData);
      }
    }

    await Promise.all(profilePicPromises);

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
      name: requestBody.name,
      contact: requestBody.contact,
      currentBeginDate: requestBody.currentBeginDate,
      currentFinishDate: addValidTillToCurrDate(
        requestBody.currentBeginDate,
        requestBody.validTill,
      ),
      gymName: requestBody.gymName,
      gymId: jwToken.ownerId,
      goal: requestBody.goal,
      experience: requestBody.experience,
      lastUpdatedProfilePic: new Date().getTime().toString()
    });

    const current = new Date().getMonth;
    console.log("new Date().getMonth", current);


    const createAttandanceRecord = new Attendance({
      _id: new mongoose.Types.ObjectId(),
      customerId,
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      days: 0
    })

    const [planResult, customerResult, profilePic] = await Promise.all([
      newPlan.save(),
      customer.save(),
      createAttandanceRecord.save(),
      uploadBase64(customerId.toString(), requestBody.profilePic),
      getProfilePic(customer.id)
    ]);

    res
      .status(200)
      .json({ new_plan: planResult, new_customer: customerResult, profilePic: await getProfilePic(customer.id), attandance: createAttandanceRecord });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/registerBulkCustomer", verifyToken, async (req: any, res: any) => {
  try {
    const jwToken: JWToken = req.jwt;

    const newCustomers = req.body.map((customerData: any) => {
      const customerId = new mongoose.Types.ObjectId();

      const newPlan = new Plan({
        _id: new mongoose.Types.ObjectId(),
        gymId: jwToken.ownerId,
        customerId: customerId,
        duration: customerData.validTill,
        fee: customerData.charges,
        startDate: customerData.currentBeginDate,
        endDate: addValidTillToCurrDate(customerData.currentBeginDate, customerData.validTill),
      });

      const customer = new Customer({
        _id: customerId,
        name: customerData.customerName,
        email: customerData.email,
        contact: customerData.contact,
        address: customerData.address,
        age: customerData.age,
        gender: customerData.gender,
        bloodGroup: customerData.bloodGroup,
        currentBeginDate: customerData.currentBeginDate,
        currentFinishDate: addValidTillToCurrDate(customerData.currentBeginDate, customerData.validTill),
        gymName: customerData.gymName,
        gymId: jwToken.ownerId,
      });

      return { plan: newPlan, customer: customer };
    });

    const saveResults = await Promise.allSettled(newCustomers.map((customerObj: any) => {
      return Promise.all([customerObj.plan.save(), customerObj.customer.save()]);
    }));

    const successfullyRegisteredCustomers: { new_plan: any, new_customer: any }[] = [];
    const errors: any[] = [];

    for (const result of saveResults) {
      if (result.status === "fulfilled") {
        const [planResult, customerResult] = result.value;
        successfullyRegisteredCustomers.push({ new_plan: planResult, new_customer: customerResult });
      } else if (result.status === "rejected") {
        errors.push(result.reason.message);
      }
    }

    if (errors.length > 0) {
      res.status(400).json({
        error: "Failed to register some customers. See errors for details.",
        errors: errors,
        successfullyRegisteredCustomers,
      });
    } else {
      res.status(201).json({ successfullyRegisteredCustomers });
    }

  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }

})

router.get("/getCustomerProfile/:customerId", verifyToken, async (req, res: Response<GetCustomerProfileResponse>) => {
  try {
    const customerId = req.params.customerId;
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        gymId: null,
        name: null,
        contact: null,
        currentBeginDate: null,
        currentFinishDate: null,
        profilePic: null,
        goal: null,
        experience: null,

        error: "Customer not found"
      });
    }
    res.status(200).json({
      gymId: customer.gymId.toString(),
      name: customer.name,
      contact: customer.contact,
      currentBeginDate: customer.currentBeginDate,
      currentFinishDate: customer.currentFinishDate,
      profilePic: await getProfilePic(customer.id),
      goal: customer.goal,
      experience: customer.experience,
      error: null
    });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({
      gymId: null,
      name: null,
      contact: null,
      currentBeginDate: null,
      profilePic: null,
      goal: null,
      experience: null,

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
    await deleteFromS3(customerId);
    if (!deletedCustomer)
      return res.status(404).json({ message: "Customer not found" });
    res.status(200).json({ deletedCustomer });
  } catch (error) {
    console.log("Error", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/markAttandance/:customerId", verifyToken, async (req, res) => {
  try {


    const currDay = new Date().getDate();
    const currMonth = new Date().getMonth() + 1;
    const currYear = new Date().getFullYear();
    const customerId = req.params.customerId;
    if (currDay == 1) {
      const createAttandanceRecord = new Attendance({
        _id: new mongoose.Types.ObjectId(),
        customerId,
        year: currYear,
        month: currMonth,
        days: 0
      })
    }

    const attendanceDays = await Attendance.findOne({ customerId, month: currMonth, year: currYear }, { days: 1, _id: 0 });
    console.log(" customerId, currMonth, currYear ", attendanceDays);

    if (!attendanceDays) {
      return res.status(404).json({ message: 'Attendance not found' });
    }

    if (typeof (attendanceDays.days) == 'number') {
      const updateAttandanceDays = attendanceDays.days | (1 << (currDay - 1));
      const updatedAttandanceDays = await Attendance.findOneAndUpdate({ customerId, month: currMonth, year: currYear }, { days: updateAttandanceDays })

      if (!updatedAttandanceDays) {
        return res.status(404).json({ message: 'Attendance could not update' });
      }
      res.status(200).json({ "msg": "updated attandance successfully" })
    }
    else {
      console.log("Empty attandance , couldn't update");

    }
  } catch (error) {
    res.status(503).json({ "msg": "Internal server error" })
    console.log("Error : ", error);

  }
})

module.exports = router;
