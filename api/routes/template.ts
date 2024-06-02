import express, { Request, Response } from 'express';
import Customer from "../model/customer";
import TemplateDesc from "../model/templateDesc";
import ExerciseDesc from "../model/exerciseDesc";
const mongoose = require("mongoose");
const verifyToken = require("../middleware/jwt");
import { TemplateRequest } from "../../requests";
import { TemplateResponse } from '../../responses';
const router = express.Router();

// router.post("/create", async (req: Request<TemplateRequest>, res) => {
//     try {
//         const templateDescList = req.body.templateDesc;
//         const templateDescIds = await Promise.all(templateDescList.map(async (templateDesc: any) => {
//             const allExercisesIds = await Promise.all(templateDesc.allExercise.map(async (exercise:any) => {
//                 const newExerciseDesc = new ExerciseDesc({
//                     _id: new mongoose.Types.ObjectId(),
//                     exerciseName: exercise.exerciseName,
//                     setNumber: exercise.exerciseDesc.setNumber,
//                     weight: exercise.exerciseDesc.weight,
//                     reps: exercise.exerciseDesc.reps
//                 })
//                 await newExerciseDesc.save();
//                 return newExerciseDesc._id;
//             }))
//             const templateDesc_ = new TemplateDesc({
//                 _id: new mongoose.Types.ObjectId(),
//                 day: templateDesc.day,
//                 targetBody: templateDesc.targetBody,
//                 exerciseDescId: allExercisesIds
//             })
//             await templateDesc_.save();
//             return templateDesc_._id;
//         }));

        
//         // const newTemplate = new Template({
//         //     _id: new mongoose.Types.ObjectId(),
//         //     templateDescId: templateDescIds,
//         //     goal: req.body.goal,
//         //     experience: req.body.experience
//         // })
//         // await newTemplate.save();
//         res.status(201).json({ message: 'Template created successfully' , newTemplate});
        
//     } catch (error) {
//         console.log(error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// })


module.exports = router;