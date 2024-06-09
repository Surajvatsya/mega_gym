const mongoose = require("mongoose");
import express, { Request, Response } from 'express';
import Exercise from '../model/exercise';
import { GetAllExercises, UserExercises } from '../../responses';
import ExerciseDesc from '../model/exerciseDesc'
import TemplateDesc from '../model/templateDesc';
const verifyToken = require("../middleware/jwt");


require("dotenv").config();
const router = express.Router();

router.get('/allExercise',  async  (req: any, res: Response<GetAllExercises>) => {

    const exerciseList = await Exercise.find();

    res.status(200).json({'exercises': exerciseList});

})

router.get('/userExercises', verifyToken,  async  (req: any, res: Response<UserExercises>) => {

    const customerId = req.jwt.token;

    const templateDescIds = await TemplateDesc.find(customerId, {_id:1});

    const uniqueExercise = new Set<string>();

    for (const templateDesc of templateDescIds){
        const exercises = await ExerciseDesc.find({templateDescId:templateDesc._id},{exerciseName:1,_id:0} );
        exercises.forEach(exercise => uniqueExercise.add(exercise.exerciseName));
        }

    const userExercises = Array.from(uniqueExercise);

    res.status(200).json({exercises: userExercises});
})

module.exports = router;