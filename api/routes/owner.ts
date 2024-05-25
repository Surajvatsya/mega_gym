import express, { Request, Response } from 'express';
const bcrypt = require("bcrypt");
import Customer from "../model/customer";
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const verifyToken = require("../middleware/jwt");
import { AnalysisResponse, DuplicateResponseCheck, ExpandedAnalysisResponse, GetUPIIdResponse, LoginResponse, SignUpResponse } from '../../responses';
import { getMonthFromNumber } from "../utils";
import { SignUpRequest, LoginRequest, JWToken } from '../../requests';
import Owner from '../model/owner';
import Plan from '../model/plan'
import Trainee from '../model/trainee';

require("dotenv").config();
const router = express.Router();

router.get("/contactDuplicateCheck/:contact", async (req: Request<{ contact: string }, {}, {}>, res: Response<DuplicateResponseCheck>) => {
    if (await Owner.exists({ contact: req.params.contact })) {
        res.status(200).json({ unique: false });
    }
    else {
        res.status(200).json({ unique: true });
    }
})

router.post("/signup", async (req: Request<{}, {}, SignUpRequest>, res: Response<SignUpResponse>) => {

    if (await Owner.exists({ contact: req.body.contact })) {
        res.status(500).json({
            owner: null,
            token: null,
            error: "Owner already exists with this contact",
            trainees: null
        });
    }


    const requestBody: SignUpRequest = req.body;
    bcrypt.hash(req.body.password, 10, (err: any, hash: any) => {
        if (err) {
            return res.status(500).json({
                owner: null,
                token: null,
                error: err,
                trainees: null
            });
        } else {
            const ownerId = new mongoose.Types.ObjectId();
            const owner = new Owner({
                _id: ownerId,
                name: req.body.name,
                password: hash,
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
                                contact: req.body.contact,
                            },
                            process.env.JWT_TOKEN,
                            {
                                expiresIn: "10000000000hr",
                            },
                        );

                        const traineeDetails: Trainee[] = []

                        const traineeDetailsPromises = requestBody.trainees.map(trainee => {
                            const newTrainee = new Trainee({
                                _id: new mongoose.Types.ObjectId(),
                                gymId: ownerId,
                                name: trainee.name,
                                experience: parseInt(trainee.experience, 10),
                            });

                            return newTrainee.save();
                        });

                        Promise.all(traineeDetailsPromises)
                            .then(savedTrainees => {
                                res.status(200).json({
                                    owner: result,
                                    trainees: savedTrainees,
                                    token: token,
                                    error: null
                                });
                            })
                            .catch(error => {
                            });

                    }
                })
                .catch((err: any) => {
                    console.log(err);
                    res.status(500).json({
                        owner: null,
                        token: null,
                        error: err,
                        trainees: null
                    });
                });
        }
    });
});

router.post("/login", (req: Request<{}, {}, LoginRequest>, res: Response<LoginResponse, {}>) => {
    Owner.find({ contact: req.body.contact })
        .exec()
        .then((owners) => {
            if (owners.length < 1) {
                return res.status(404).json({
                    name: null,
                    contact: null,
                    email: null,
                    token: null,
                    deviceToken: null,
                    gymName: null,
                    error: "password matching failed",
                });
            }
            bcrypt.compare(req.body.password, owners[0].password, (err: any, result: any) => {
                if (!result) {
                    return res.status(401).json({
                        name: null,
                        contact: null,
                        email: null,
                        token: null,
                        deviceToken: null,
                        gymName: null,

                        error: "password matching failed",
                    });
                }
                if (result) {
                    const token: JWToken = jwt.sign(
                        {
                            ownerId: owners[0].id,
                            contact: owners[0].contact,
                        },
                        process.env.JWT_TOKEN,
                        {
                            expiresIn: "10000000000hr",
                        },
                    );

                    Owner.findOneAndUpdate(
                        { _id: owners[0]._id },
                        { deviceToken: req.body.deviceToken },
                    ).then((docs) => {
                        if (docs) {
                            console.log(docs);
                        }
                        else {
                            console.log("error");
                        }
                    });


                    res.status(200).json({
                        name: owners[0].name ?? null,
                        contact: owners[0].contact,
                        email: owners[0].email ?? null,
                        token: token,
                        gymName: owners[0].gymName ?? null,
                        deviceToken: req.body.deviceToken,
                        error: null,
                    });
                }
            });
        })
        .catch((err) => {
            res.status(500).json({
                gymName: null,
                name: null,
                contact: null,
                email: null,
                token: null,
                deviceToken: null,
                error: err,
            });
        });
});

router.get("/analysis", verifyToken, async (req: any, res: Response<AnalysisResponse>) => {
    try {
        const jwToken: JWToken = req.jwt;
        const gymOwnerId = new mongoose.Types.ObjectId(jwToken.ownerId);
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();

        const numberOfPeople = await Customer.aggregate([
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
            (acc: any, ele: any) => {
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
        res.status(200).json({
            males: 0,
            females: 0,
            numberOfPeople: 0,
            averageMonth: 0,
            earnings: 0
        });
    }
});

router.get("/getUpiId", verifyToken, async (req: any, res: Response<GetUPIIdResponse>) => {
    try {
        const ownerId = req.jwt.ownerId;
        const owner = await Owner.findById(ownerId);
        if (!owner) {
            res.status(404).json({
                upiId: "",
                error: null,
            });
        } else {
            res.status(200).json({ upiId: owner.upiId ?? "", error: null });
        }
    } catch (err) {
        console.log("Error came from getUPIId", err);
        res.status(500).json({ error: "Internal Server Error", upiId: "" });
    }
});

router.post("/analysis/:key", verifyToken, async (req: any, res: Response<ExpandedAnalysisResponse>) => {
    try {
        const jwToken: JWToken = req.jwt
        const currentDate = new Date();
        const keys = [
            currentDate.getMonth() - 3,
            currentDate.getMonth() - 2,
            currentDate.getMonth() - 1,
            currentDate.getMonth(),
        ];
        const plans = await Plan.find({ gymId: jwToken.ownerId });

        var total = 0;
        var maxValue = 0;

        if (req.params.key == "earnings") {
            const values = keys.map((month) => {
                const plansForMonth = plans.filter(
                    (plan: any) => new Date(plan.startDate).getMonth() === month,
                );
                const valuesForMonth = plansForMonth.reduce(
                    (total: any, plan: any) => total + plan.fee,
                    0,
                );
                total = total + valuesForMonth;
                maxValue = maxValue < valuesForMonth ? valuesForMonth : maxValue;
                return valuesForMonth;
            });
            const responseObject: ExpandedAnalysisResponse = {
                titles: keys.map((number) => getMonthFromNumber(number)),
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
                    (plan: any) =>
                        new Date(plan.startDate).getMonth() <= month &&
                        new Date(plan.endDate).getMonth() >= month,
                ).length;
                total = total + valuesForMonth;
                maxValue = maxValue < valuesForMonth ? valuesForMonth : maxValue;
                return valuesForMonth;
            });
            const responseObject: ExpandedAnalysisResponse = {
                titles: keys.map((number) => getMonthFromNumber(number)),
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
    const jwtoken: JWToken = req.jwtl
    await Owner.findByIdAndUpdate(
        jwtoken.ownerId,
        { upiId: req.body.upiId },
        { new: true },
    );
    const owner = await Owner.findById(jwtoken.ownerId);
    res.status(200).json(owner);
});

module.exports = router;