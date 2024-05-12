const router = express.Router();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const Customer = require("../model/customer");
const verifyToken = require("../middleware/jwt");
const Plan = require("../model/plan");
const Utils = require("../utils");
import express, { Request, Response } from 'express';
import Owner from '../model/owner';
import { SignUpRequest, LoginRequest, JWToken } from '../../requests';

router.post("/signup", (req: Request<{}, {}, SignUpRequest>, res: Response) => {
    console.log(req.body);
    bcrypt.hash(req.body.password, 10, (err: any, hash: any) => {
        if (err) {
            return res.status(500).json({
                error: err,
            });
        } else {
            const ownerId = new mongoose.Types.ObjectId();
            const owner = new Owner({
                _id: ownerId,
                name: req.body.ownerName,
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
                .catch((err: any) => {
                    console.log(err);
                    res.status(500).json({
                        error: err,
                    });
                });
        }
    });
});

router.post("/login", (req: Request<{}, {}, LoginRequest>, res: Response) => {
    Owner.find({ email: req.body.email })
        .exec()
        .then((owners) => {
            if (owners.length < 1) {
                return res.status(404).json({
                    msg: "Gym Owner not found",
                });
            }
            bcrypt.compare(req.body.password, owners[0].password, (err, result) => {
                if (!result) {
                    return res.status(401).json({
                        msg: "password matching failed",
                    });
                }
                if (result) {
                    const token: JWToken = jwt.sign(
                        {
                            ownerId: owners[0].id,
                            email: owners[0].email,
                            contact: owners[0].contact,
                        },
                        process.env.JWT_TOKEN, //second parameter is the secret key used to sign the token
                        {
                            expiresIn: "10000000000hr",
                        },
                    );

                    Owner.findByIdAndUpdate(
                        owners[0].id,
                        { deviceToken: req.body.deviceToken },
                        { new: true },
                    );

                    res.status(200).json({
                        owner: owners[0].name,
                        contact: owners[0].contact,
                        email: owners[0].email,
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

router.get("/analysis", verifyToken, async (req: any, res) => {
    try {
        const gymOwnerId = new mongoose.Types.ObjectId(req.jwt.ownerId);
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();

        const numberOfPeople = await Customer.aggregate([
            {
                $match: {
                    gymId: gymOwnerId,
                    $expr: {
                        $and: [ //performs logical and for all 
                            {
                                $eq: [
                                    {
                                        $year: {
                                            $dateFromString: { dateString: "$currentBeginDate" },
                                        },
                                    },
                                    currentYear,
                                ],
                            },
                            {
                                $eq: [
                                    {
                                        $month: {
                                            $dateFromString: { dateString: "$currentBeginDate" },
                                        },
                                    },
                                    currentMonth,
                                ],
                            },
                        ],
                    },
                },
            },
            {
                $group: {
                    _id: "$_id",
                    count: { $sum: 1 },
                },
            },
        ]);

        const genderRatio = await Customer.aggregate([
            {
                $match: {
                    gymId: gymOwnerId,
                    $expr: {
                        $and: [
                            {
                                $eq: [
                                    {
                                        $year: {
                                            $dateFromString: { dateString: "$currentBeginDate" },
                                        },
                                    },
                                    currentYear,
                                ],
                            },
                            {
                                $eq: [
                                    {
                                        $month: {
                                            $dateFromString: { dateString: "$currentBeginDate" },
                                        },
                                    },
                                    currentMonth,
                                ],
                            },
                        ],
                    },
                },
            },
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
                $match: {
                    gymId: gymOwnerId,
                    $expr: {
                        $and: [
                            {
                                $eq: [
                                    {
                                        $year: {
                                            $dateFromString: { dateString: "$startDate" },
                                        },
                                    },
                                    currentYear,
                                ],
                            },
                            {
                                $eq: [
                                    {
                                        $month: {
                                            $dateFromString: { dateString: "$startDate" },
                                        },
                                    },
                                    currentMonth,
                                ],
                            },
                        ],
                    },
                },
            },
            {
                $group: {
                    _id: null, // Group by gender field
                    averageMonth: { $avg: "$duration" }, // Count documents in each group
                    fee: { $sum: "$fee" }, // Count documents in each group
                },
            },
        ]);

        res.status(200).json({
            males: gender.Male,
            females: gender.Female,
            numberOfPeople: numberOfPeople.length,
            averageMonth:
                planAnalysis.length == 0
                    ? 0
                    : Math.round(planAnalysis[0].averageMonth),
            earnings: planAnalysis.length == 0 ? 0 : planAnalysis[0].fee,
        });
    } catch (error) {
        console.log("err", error);
    }
});

router.get("/getUpiId", verifyToken, async (req: any, res) => {
    try {
        const ownerId = req.jwt.ownerId;
        const owner = await Owner.findById(ownerId);
        if (!owner) {
            res.status(404).json({
                upiId: "",
            });
        } else {
            res.status(200).json({ upiId: owner.upiId });
        }
    } catch (err) {
        console.log("Error ", err);
        res.status(500).json({ error: "internal server error" });
    }
});

router.post("/analysis/:key", verifyToken, async (req: any, res) => {
    try {
        const currentDate = new Date();
        const keys = [
            currentDate.getMonth() - 3,
            currentDate.getMonth() - 2,
            currentDate.getMonth() - 1,
            currentDate.getMonth(),
        ];
        const plans = await Plan.find({ gymId: req.jwt.ownerId });

        var total = 0;
        var maxValue = 0;

        if (req.params.key == "earnings") {
            const values = keys.map((month) => {
                const plansForMonth = plans.filter(
                    (plan) => new Date(plan.startDate).getMonth() === month,
                );
                const valuesForMonth = plansForMonth.reduce(
                    (total, plan) => total + plan.fee,
                    0,
                );
                total = total + valuesForMonth;
                maxValue = maxValue < valuesForMonth ? valuesForMonth : maxValue;
                return valuesForMonth;
            });
            const responseObject = {
                titles: keys.map((number) => Utils.getMonthFromNumber(number)),
                data: values,
                average: (total / keys.length).toString(),
                total: total.toString(),
                maxLimitOfData: maxValue * 1.2,
            };

            res.status(200).json(responseObject);
        } else if (req.params.key == "people") {
            console.log(plans);
            const values = keys.map((month) => {
                const valuesForMonth = plans.filter(
                    (plan) =>
                        new Date(plan.startDate).getMonth() <= month &&
                        new Date(plan.endDate).getMonth() >= month,
                ).length;
                total = total + valuesForMonth;
                maxValue = maxValue < valuesForMonth ? valuesForMonth : maxValue;
                return valuesForMonth;
            });
            const responseObject = {
                titles: keys.map((number) => Utils.getMonthFromNumber(number)),
                data: values,
                average: (total / keys.length).toString(),
                total: total.toString(),
                maxLimitOfData: maxValue * 1.2,
            };

            res.status(200).json(responseObject);
        }
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
});

router.put("/upiId", verifyToken, async (req: any, res) => {
    await Owner.findByIdAndUpdate(
        req.jwt.ownerId,
        { upiId: req.body.upiId },
        { new: true },
    );
    const owner = await Owner.findById(req.jwt.ownerId);
    res.status(200).json(owner);
});

module.exports = router;