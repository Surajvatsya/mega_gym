const mongoose = require("mongoose");
import express, { Request, Response } from 'express';
import { JWToken, AuthenticatedRequest, WorkoutLogsResponse, DeleteWorkoutLogRequest } from '../../requests';
import WorkoutLog from '../model/workoutLog';
import Exercise from '../model/exercise';
const verifyToken = require("../middleware/jwt");

require("dotenv").config();
const router = express.Router();

router.post("/addLogs", verifyToken, async (req: any, res: any) => {

    const jwToken: JWToken = req.jwt;

    const exerciseModel = await Exercise.findOne({ name: req.body.exerciseName });

    if (exerciseModel) {
        const log = new WorkoutLog({
            _id: new mongoose.Types.ObjectId(),
            customerId: jwToken.ownerId,
            exerciseId: exerciseModel ? exerciseModel.id : "",
            weight: req.body.weight,
            reps: req.body.reps,
            setIndex: req.body.setIndex,
            timestamp: Date.now()
        })

        await log.save();

        res.status(200).json({ message: 'Added Successfully' })
    }
    else {
        res.status(200).json({ message: 'Exercise not found' })

    }

})

router.delete("/removeLogs", verifyToken, async (req: any, res: Response<WorkoutLogsResponse>) => {

    const jwToken: JWToken = req.jwt;
    const exerciseModel = await Exercise.findOne({ name: req.body.exerciseName });

    if (exerciseModel) {
        const log = await WorkoutLog.deleteOne({ setIndex: req.body.setIndex, exerciseId: exerciseModel.id });
        res.status(200).json({ message: 'Deleted Successfully' })
    }
    else {
        res.status(200).json({ message: 'Exercise not found' })
    }

})

module.exports = router;