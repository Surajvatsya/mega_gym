const mongoose = require("mongoose");
import express, { Request, Response } from 'express';
import Exercise from '../model/exercise';
import { ExerciseIdAndName, GetAllExercises, UserExercises } from '../../responses';
import ExerciseDescription from '../model/exerciseDescription'
import Template from '../model/template';
const verifyToken = require("../middleware/jwt");


require("dotenv").config();
const router = express.Router();

router.get('/allExercise', async (req: any, res: Response<GetAllExercises>) => {

    const exerciseList = await Exercise.find();

    res.status(200).json({ 'exercises': exerciseList });

})

router.get('/userExercises', verifyToken, async (req: any, res: Response<UserExercises>) => {

    const customerId = req.jwt.token;

    const templateIds = await Template.find(customerId, { _id: 1 });

    const uniqueExercises = new Map<string, ExerciseIdAndName>();

    for (const template of templateIds) {
        const exercises = await ExerciseDescription.find({ templateId: template._id });
        exercises.forEach(exercise => uniqueExercises.set(exercise.exerciseId, { _id: exercise.exerciseId, name: exercise.exerciseName }));
    }

    const userExercises = Array.from(uniqueExercises.values());

    res.status(200).json({ exercises: userExercises });
})

module.exports = router;