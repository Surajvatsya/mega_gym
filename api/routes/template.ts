import express, { Request, Response } from 'express';
const router = express.Router();
const verifyToken = require("../middleware/jwt");
import Exercise from '../model/exercise'
import ExerciseDescription from '../model/exerciseDescription'
import Template from '../model/template'
import { ExerciseForDayResponse } from '../../responses';
import { AddSetToExerciseRequest, JWToken, UpdateSetRequest } from '../../requests';
const mongoose = require("mongoose");

router.post("/addSetToExercise", verifyToken, async (req: any, res: any) => {
    try {
        const reqBody: AddSetToExerciseRequest = req.body
        const token: JWToken = req.jwt;
        const customerId = token.ownerId.toString();
        const today = new Date().getDay();
        const daysOfWeek: string[] = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const template = await Template.findOne({ customerId, day: daysOfWeek[today] }, { _id: 1 });
        const newExerciseDescription = new ExerciseDescription({
            _id: new mongoose.Types.ObjectId(),
            exerciseId: reqBody.exerciseId,
            exerciseName: reqBody.exerciseName,
            setNumber: new Date(),
            reps: reqBody.reps,
            weight: reqBody.weight,
            templateId: template?._id,
        });
        await newExerciseDescription.save();
        res.status(200).json({ message: newExerciseDescription._id });
    } catch (error) {
        res.status(500).json({ message: error });
    }
})

router.post("/addExerciseToTemplate", verifyToken, async (req: any, res: any) => {
    try {

        const customerId = req.jwt.ownerId;

        // Get the numeric day value (0-6)
        const today = new Date().getDay();
        const daysOfWeek: string[] = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

        const template = await Template.findOne({ customerId, day: daysOfWeek[today] }, { _id: 1 });

        if (template) {
            const isExercisePresent = await ExerciseDescription.findOne({ exerciseId: req.body.exerciseId, templateId: template._id });
            if (isExercisePresent) {
                res.status(200).json({ message: `EXERCISE_ALREADY_ADDED` });
            }
            else {
                const newExerciseDescription = new ExerciseDescription({
                    _id: new mongoose.Types.ObjectId(),
                    exerciseId: req.body.exerciseId,
                    exerciseName: req.body.exerciseName,
                    setNumber: -1,
                    reps: -1,
                    weight: -1,
                    templateId: template._id,
                });
                await newExerciseDescription.save();
                res.status(200).json({ message: `Exercise added to existing template for today with id ${newExerciseDescription._id}.` });
            }
        } else {
            const newTemplateId = new mongoose.Types.ObjectId();
            const newTemplate = new Template({
                _id: newTemplateId,
                day: daysOfWeek[today],
                customerId,
            });
            await newTemplate.save();

            const newExerciseDesc = new ExerciseDescription({
                _id: new mongoose.Types.ObjectId(),
                exerciseId: req.body.exerciseId,
                exerciseName: req.body.exerciseName,
                setNumber: -1,
                reps: -1,
                weight: -1,
                templateId: newTemplateId,
            });
            await newExerciseDesc.save();
            res.status(200).json({ message: `Exercise added to new template for today with id ${newExerciseDesc._id}.` });

        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: `server error ${error}.` });
    }
})


router.delete("/removeSetFromExercise", verifyToken, async (req: any, res: any) => {
    try {
        const customerId = req.jwt.ownerId;
        // Get the numeric day value (0-6)
        const today = new Date().getDay();
        const daysOfWeek: string[] = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

        const templateId = await Template.findOne({ customerId, day: daysOfWeek[today] }, { _id: 1 });

        if (templateId) {
            const result = await ExerciseDescription.deleteOne({ _id: req.body.exerciseDescriptionId });
            res.status(200).json({ message: `successfully removed set of exercise ${req.body.exerciseDescriptionId} ${result}` });
        }
        else
            console.log("templateId is null", templateId);

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: `server error ${error}.` });
    }
})

router.delete("/removeExercise", verifyToken, async (req: any, res: any) => {
    try {
        const customerId = req.jwt.ownerId;
        // Get the numeric day value (0-6)
        const today = new Date().getDay();
        const daysOfWeek: string[] = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

        const templateId = await Template.findOne({ customerId, day: daysOfWeek[today] }, { _id: 1 });

        if (templateId) {
            const result = await ExerciseDescription.deleteMany({ templateId, exerciseId: req.body.exerciseId });
            res.status(200).json({ message: `successfully removed exercise ${req.body.exerciseId} ${result}` });
        }
        else
            console.log("templateId is null", templateId);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: `server error ${error}.` });
    }
})

router.post("/getExercisesForDay", verifyToken, async (req: any, res: Response<ExerciseForDayResponse>) => {
    try {
        const customerId = req.jwt.ownerId;
        const today = new Date().getDay();
        const daysOfWeek: string[] = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

        const day = daysOfWeek[req.body.day];

        const exercises = await Template.aggregate([
            {
                $match: {
                    customerId,
                    day: day
                }
            },
            {
                $lookup: {
                from: 'exercisedescriptions',
                    localField: '_id',
                    foreignField: 'templateId',
                    as: 'exercises'
                }
            },
            {
                $unwind: '$exercises'
            },
            {
                $group: {
                    _id: {
                        day: '$day',
                        exerciseId: '$exercises.exerciseId',
                        exerciseName: '$exercises.exerciseName'
                    },
                    sets: {
                        $push: {
                            $cond: [
                                {
                                    $and: [
                                        { $ne: ['$exercises.weight', -1] },
                                        { $ne: ['$exercises.reps', -1] }
                                    ]
                                },
                                {
                                    setNumber: '$exercises.setNumber',
                                    exerciseDescriptionId: '$exercises._id',
                                    weight: '$exercises.weight',
                                    reps: '$exercises.reps'
                                },
                                null
                            ]
                        }
                    }
                }
            },
            {
                $addFields: {
                    sets: {
                        $filter: {
                            input: '$sets',
                            as: 'set',
                            cond: { $ne: ['$$set', null] }
                        }
                    }
                }
            },
            {
                $group: {
                    _id: '$_id.day',
                    exercises: {
                        $push: {
                            exerciseId: '$_id.exerciseId',
                            exerciseName: '$_id.exerciseName',
                            sets: '$sets'
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    day: '$_id',
                    exercises: 1
                }
            },
            {
                $sort: { 'exercises.sets.setNumber': 1 }  // Sort the exercises by setNumber
            }
        ]);

        console.log("exercises", exercises);
        if (exercises.length === 0) {
            return res.status(200).json({ exercises: [] });
        }
        res.status(200).json(exercises[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ exercises: [] });
    }
});


router.put('/updateSet', verifyToken, async (req: any, res: any) => {

    const requestBody: UpdateSetRequest = req.body

    await ExerciseDescription.findByIdAndUpdate(

        new mongoose.Types.ObjectId(requestBody.exerciseDescriptionId),
        {
            weight: requestBody.weight,
            reps: requestBody.reps
        },
        {
            new: true,
        },
    );

    res.status(404).json({ message: "Set is updated" });

})

module.exports = router;