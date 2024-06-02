import { JWToken, RegisterCustomerRequest, updateSubscriptionRequest, workoutAnalysisRequest } from "../../requests";
import { GetCustomerProfileResponse, GetCustomersResponse, CustomerDetails, MemberLoginResponse, WorkoutAnalysisResponse } from "../../responses";
const mongoose = require("mongoose");
import Customer from '../model/customer'
import Trainee from '../model/trainee'
import Plan from '../model/plan'
import Exercise from '../model/exercise'
import Attendance from '../model/attendance'
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const verifyToken = require("../middleware/jwt");
import { addValidTillToCurrDate, getProfilePic, uploadBase64, deleteFromS3, calculateValidTill } from '../utils'
import express, { Request, Response } from 'express';
import Owner from "../model/owner";
import { getThisWeekAttendance } from '../routes/attendance';
import TemplateDesc from "../model/templateDesc";
import ExerciseDesc from "../model/exerciseDesc";
import { TemplateResponse } from '../../responses';
import WorkoutLog, { WorkoutLogs } from "../model/workoutLog";

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

router.post("/login", (req, res: Response<MemberLoginResponse>) => {
  Customer.find({ contact: req.body.contact })
    .exec()
    .then((customers) => {
      if (customers.length < 1) {
        return res.status(404).json({
          name: null,
          contact: null,
          error: "user or password is incorrect",
          token: null
        });
      }


      let ownerId = customers[0].id;

      const token = jwt.sign(
        {
          ownerId,
          contact: req.body.contact,
        },
        process.env.JWT_TOKEN,
        {
          expiresIn: "10000000000hr",
        },
      );

      res.status(200).json({
        name: customers[0].name,
        contact: customers[0].contact,
        error: null,
        token: token
      });
    })
})

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

    //omit it later a/q to some algo
    // const trainee = Trainee.find({gymId: jwToken.ownerId}, {name : 1, _id : 0})

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
      traineeId: requestBody.mentorId,
      lastUpdatedProfilePic: new Date().getTime().toString(),
      currentPlanId: newPlan.id
    });

    // const current = new Date().getMonth;
    // console.log("new Date().getMonth", current);

    // const todayDate = new Date().getDate();
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
        trainerName: null,
        validTill: null,
        experience: null,
        currentWeekAttendance: null,
        error: "Customer not found",
        template: { templateDesc: null }
      });
    }

    const trainee = await Trainee.findById(customer.traineeId)



    res.status(200).json({
      gymId: customer.gymId.toString(),
      name: customer.name,
      contact: customer.contact,
      currentBeginDate: customer.currentBeginDate,
      currentFinishDate: customer.currentFinishDate,
      trainerName: trainee ? trainee.name : null,
      validTill: calculateValidTill(customer.currentBeginDate, customer.currentFinishDate),
      profilePic: await getProfilePic(customer.id),
      goal: customer.goal,
      experience: customer.experience,
      currentWeekAttendance: null,
      error: null,
      template: { templateDesc: null }
    });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({
      gymId: null,
      name: null,
      contact: null,
      currentBeginDate: null,
      profilePic: null,
      trainerName: null,
      validTill: null,
      goal: null,
      experience: null,
      currentWeekAttendance: null,
      currentFinishDate: null, error: "'Internal Server Error'",
      template: { templateDesc: null }
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
      currentPlanId: newPlan.id
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

router.post("/markAttendance", verifyToken, async (req: any, res) => {
  try {
    const customerId = req.jwt.ownerId;
    const currDay = new Date().getDate();
    const currMonth = new Date().getMonth() + 1;
    const currYear = new Date().getFullYear();
    if (currDay == 1) {
      const createAttandanceRecord = new Attendance({
        _id: new mongoose.Types.ObjectId(),
        customerId,
        year: currYear,
        month: currMonth,
        days: 0
      })

      await createAttandanceRecord.save();
    }

    const attendanceDays = await Attendance.findOne({ customerId, month: currMonth, year: currYear }, { days: 1, _id: 0 });
    console.log(" customerId, currMonth, currYear ", attendanceDays);
    // const todayDate = new Date().getDate;

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

router.get("/details", verifyToken, async (req: any, res: Response<GetCustomerProfileResponse>) => {
  const jwtoken: JWToken = req.jwt
  if (jwtoken == undefined) {
    res.status(404).json({
      contact: null,
      error: "Jwt token is undefined",
      gymId: null,
      name: null,
      trainerName: null,
      validTill: null,
      currentFinishDate: null,
      profilePic: null,
      goal: null,
      experience: null,
      currentBeginDate: null,
      currentWeekAttendance: null,
      template: { templateDesc: null }
    })
  }
  const customer = await Customer.findById(jwtoken.ownerId);
  if (customer) {
    if (customer.traineeId) {
      const trainer = await Trainee.findById(customer.traineeId);
      const thisWeekAttendance = await getThisWeekAttendance(jwtoken.ownerId)
      // const templateRes = await getTemplateByUserId (customer.id)
      res.status(200).json({
        contact: customer.contact,
        error: null,
        gymId: customer.gymId.toString(),
        name: customer.name,
        trainerName: trainer ? trainer.name : null,
        validTill: calculateValidTill(customer.currentBeginDate, customer.currentFinishDate),
        currentFinishDate: customer.currentFinishDate,
        profilePic: customer.lastUpdatedProfilePic,
        goal: customer.goal,
        experience: customer.experience,
        currentBeginDate: customer.currentBeginDate,
        currentWeekAttendance : thisWeekAttendance ? thisWeekAttendance : null,
        template : {templateDesc : null}
      });
    }
    else {
      res.status(404).json({
        contact: customer.contact,
        error: "trainer name not found",
        gymId: null,
        name: customer.name,
        trainerName: null,
        validTill: calculateValidTill(customer.currentBeginDate, customer.currentFinishDate),
        currentFinishDate: customer.currentFinishDate,
        profilePic: null,
        goal: null,
        experience: null,
        currentBeginDate: customer.currentBeginDate,
        currentWeekAttendance: null,
        template: { templateDesc: null }
      });
    }
  }
  else {
    res.status(404).json({
      contact: null,
      error: 'customer not found',
      gymId: null,
      name: null,
      trainerName: null,
      validTill: null,
      currentFinishDate: null,
      profilePic: null,
      goal: null,
      experience: null,
      currentBeginDate: null,
      currentWeekAttendance: null,
      template: { templateDesc: null }
    });
  }
});


// const getTemplateByUserId  = async (userId : string) : Promise<TemplateResponse> =>{
//   try {
//       const customerData = await Customer.findById(userId, {goal:1, experience:1, _id : 0});
//       if (!customerData) {
//           return { templateDesc: null };
//       }
//       const templateDescIds = await Template.find({goal: customerData?.goal, experience:customerData?.experience}, {templateDescId:1, _id :0});
//       if (templateDescIds.length === 0) {
//           return { templateDesc: null };
//       }

//       const templateDescIdList = templateDescIds[0].templateDescId;
//       const fetchTemplateDesc = await Promise.all (templateDescIdList.map(async (templateDescId:any)=>{
//           const templateDesc = await TemplateDesc.findById(templateDescId);
//               if (!templateDesc){
//                   console.log("templateDesc is null");
//                   return null;
//               }
//               const exerciseDesc = await Promise.all (templateDesc.exerciseDescId.map(async (exerciseId:any)=>{
//                   const exercise =  await ExerciseDesc.findById(exerciseId)
//                   return exercise ? {
//                       exerciseName: exercise.exerciseName,
//                       setNumber: exercise.setNumber,
//                       weight: exercise.weight,
//                       reps: exercise.reps
//                   } : null;
//                   }
//               ))

//               return {
//                   day: templateDesc.day,
//                   targetBody: templateDesc.targetBody,
//                   allExercise: exerciseDesc.filter(exercise => exercise !== null) as {
//                       exerciseName: string;
//                       setNumber: number;
//                       weight: number;
//                       reps: number;
//                   }[] 
//               }
//       }))
//       const validTemplateDesc = fetchTemplateDesc.filter(desc => desc !== null) as {
//           day: string;
//           targetBody: string;
//           allExercise: {
//               exerciseName: string;
//               setNumber: number;
//               weight: number;
//               reps: number;
//           }[] | null;
//       }[] ;
//       return {templateDesc : validTemplateDesc }; 
//   } catch (error) {
//       console.log(error);
//      return { templateDesc: null };
//   }
// }

router.post('/workoutAnalysis', verifyToken, async (req: any, res: Response<WorkoutAnalysisResponse>) => {

  const jwtoken: JWToken = req.jwt
  const reqBody: workoutAnalysisRequest = req.body;

  const exercise = await Exercise.findOne({ name: reqBody.exerciseName });

  if (exercise) {

    const initialGrowthGroup: any = {};


    const customerId = jwtoken.ownerId;
    const exerciseId = exercise.id ?? "";

    const logs = await WorkoutLog.find({ customerId, exerciseId }) as WorkoutLogs[];

    logs.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    const groupedLogs: Record<string, WorkoutLogs[]> = logs.reduce((acc, log) => {

      const timestampDate = new Date(Number(log.timestamp));


      // Extract year, month, and day components
      const year = timestampDate.getFullYear();
      const month = timestampDate.getMonth() + 1;
      const day = timestampDate.getDate();

      // Create a composite key using year, month, and day
      const key = `${year}-${month}-${day}`;


      // Use the composite key to group logs
      acc[key] = [...(acc[key] || []), log];
      return acc;
    }, initialGrowthGroup);

    // Map grouped logs to growth data
    const growthData = Object.entries(groupedLogs).map(([keys, logs]) => {
      const totalProduct = logs.reduce((total, log) => total + log.reps * log.weight, 0);
      return { keys, totalProduct };
    });

    // Get unique dates and select the last 10 dates
    const uniqueDates = [...new Set(growthData.map(item => item.keys))];
    const last10Dates = uniqueDates.sort().slice(-10);

    // Filter growthData for the last 10 dates
    const top10GrowthData = growthData.filter(item => last10Dates.includes(item.keys));

    // Extract titles and data
    const growthTitles: string[] = Array.from({ length: top10GrowthData.length }, (_, i) => `s${i + 1}`);
    const growthDatas: number[] = top10GrowthData.map(item => item.totalProduct);

    const pipeline: any = [

      {
        $match:
        {
          "exerciseId": exerciseId,
          "reps": { $gte: 8 }
        }
      },

      // Group workout logs by customer and find the maximum weight for each customer
      {
        $group: {
          _id: "$customerId", // Assuming the field is called 'customerId'
          maxWeight: { $max: "$weight" } // Assuming the field containing weight is 'weight'
        }
      },
      // Define buckets for weight ranges
      {
        $project: {
          bucket: {
            $switch: {
              branches: [
                { case: { $and: [{ $gte: ["$maxWeight", 0] }, { $lt: ["$maxWeight", 10] }] }, then: "10" },
                { case: { $and: [{ $gte: ["$maxWeight", 10] }, { $lt: ["$maxWeight", 20] }] }, then: "20" },
                { case: { $and: [{ $gte: ["$maxWeight", 20] }, { $lt: ["$maxWeight", 30] }] }, then: "30" },
                { case: { $and: [{ $gte: ["$maxWeight", 30] }, { $lt: ["$maxWeight", 40] }] }, then: "40" },
                { case: { $and: [{ $gte: ["$maxWeight", 40] }, { $lt: ["$maxWeight", 50] }] }, then: "50" },
                { case: { $and: [{ $gte: ["$maxWeight", 50] }, { $lt: ["$maxWeight", 60] }] }, then: "60" },
                { case: { $and: [{ $gte: ["$maxWeight", 60] }, { $lt: ["$maxWeight", 70] }] }, then: "70" },
                { case: { $and: [{ $gte: ["$maxWeight", 70] }, { $lt: ["$maxWeight", 80] }] }, then: "80" },
                { case: { $and: [{ $gte: ["$maxWeight", 80] }, { $lt: ["$maxWeight", 90] }] }, then: "90" },
                { case: { $and: [{ $gte: ["$maxWeight", 90] }, { $lte: ["$maxWeight", 100] }] }, then: "100" }
              ],
              default: "Other" // If the weight doesn't fall into any defined range
            }
          }
        }
      },
      // Count the number of customers in each bucket
      {
        $group: {
          _id: "$bucket",
          count: { $sum: 1 }
        }
      },
      // Optionally, sort the buckets by weight range
      {
        $sort: { _id: 1 }
      }
    ];



    const bucketCounts = await WorkoutLog.aggregate(pipeline);




    const userMaxWeightLog = await WorkoutLog.find({ customerId: jwtoken.ownerId }).sort({ weight: -1 }).limit(1)


    const userMaxWeight = Math.ceil(userMaxWeightLog[0].weight / 10) * 10;
    const userIndex = bucketCounts.findIndex(bucket => bucket._id == userMaxWeight)


    const allUsersCount = bucketCounts.reduce((total, bucket) => total + bucket.count, 0)
    const usersWeightLessThanEqCount = bucketCounts.slice(0, userIndex + 1).reduce((total, bucket) => total + bucket.count, 0);


    const maxCount = Math.max(...bucketCounts.map(bucket => bucket.count))

    const percentile = Math.round((usersWeightLessThanEqCount / allUsersCount) * 100);



    res.status(200).json({
      comparisionData: {
        titles: bucketCounts.map((bucket) => bucket._id),
        data: bucketCounts.map((bucket) => bucket.count),
        maxLimitOfData: maxCount,
        minLimitOfData: 0,
        top: percentile,
        highlightTitle: userIndex
      },

      growthData: {
        titles: growthTitles,
        data: growthDatas,
        maxLimitOfData: Math.ceil(Math.max(...growthDatas) * 1.2),
        minLimitOfData: Math.floor(Math.min(...growthDatas) * 0.8)
      },

      error: null

    })

  }
  else {
    res.status(404).json({
      comparisionData: {
        titles: [],
        data: [],
        minLimitOfData: 0,
        maxLimitOfData: 0,
        top: 0,
        highlightTitle: 0
      },

      growthData: {
        titles: [],
        data: [],
        maxLimitOfData: 0,
        minLimitOfData: 0
      },

      error: "Exercise name " + reqBody.exerciseName + " not found"

    });
  }
})

module.exports = router;
