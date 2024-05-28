import express, { Request, Response } from 'express';
import Template from "../model/template";
import Customer from "../model/customer";
import TemplateDesc from "../model/templateDesc";
import ExerciseDesc from "../model/exerciseDesc";
const mongoose = require("mongoose");
const verifyToken = require("../middleware/jwt");
import { TemplateRequest } from "../../requests";
import { TemplateResponse } from '../../responses';
const router = express.Router();

router.post("/create", async (req: Request<TemplateRequest>, res) => {
    try {
        const templateDescList = req.body.templateDesc;
        const templateDescIds = await Promise.all(templateDescList.map(async (templateDesc: any) => {
            const allExercisesIds = await Promise.all(templateDesc.allExercise.map(async (exercise:any) => {
                const newExerciseDesc = new ExerciseDesc({
                    _id: new mongoose.Types.ObjectId(),
                    exerciseName: exercise.exerciseName,
                    setNumber: exercise.exerciseDesc.setNumber,
                    weight: exercise.exerciseDesc.weight,
                    reps: exercise.exerciseDesc.reps
                })
                await newExerciseDesc.save();
                return newExerciseDesc._id;
            }))
            const templateDesc_ = new TemplateDesc({
                _id: new mongoose.Types.ObjectId(),
                day: templateDesc.day,
                targetBody: templateDesc.targetBody,
                exerciseDescId: allExercisesIds
            })
            await templateDesc_.save();
            return templateDesc_._id;
        }));

        
        const newTemplate = new Template({
            _id: new mongoose.Types.ObjectId(),
            templateDescId: templateDescIds,
            goal: req.body.goal,
            experience: req.body.experience
        })
        await newTemplate.save();
        res.status(201).json({ message: 'Template created successfully' , newTemplate});
        
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

router.get("/getTemplate/:userId",async (req, res : Response<TemplateResponse>)=>{
    try {
        const userId = req.params.userId;
        const customerData = await Customer.findById(userId, {goal:1, experience:1, _id : 0});
        if (!customerData) {
            return res.status(404).json({ templateDesc: null });
        }
        const templateDescIds = await Template.find({goal: customerData?.goal, experience:customerData?.experience}, {templateDescId:1, _id :0});
        if (templateDescIds.length === 0) {
            return res.status(404).json({ templateDesc: null });
        }

        const templateDescIdList = templateDescIds[0].templateDescId;
        const fetchTemplateDesc = await Promise.all (templateDescIdList.map(async (templateDescId:any)=>{
            const templateDesc = await TemplateDesc.findById(templateDescId);
                if (!templateDesc){
                    console.log("templateDesc is null");
                    return null;
                }
                const exerciseDesc = await Promise.all (templateDesc.exerciseDescId.map(async (exerciseId:any)=>{
                    const exercise =  await ExerciseDesc.findById(exerciseId)
                    return exercise ? {
                        exerciseName: exercise.exerciseName,
                        setNumber: exercise.setNumber,
                        weight: exercise.weight,
                        reps: exercise.reps
                    } : null;
                    }
                ))

                return {
                    day: templateDesc.day,
                    targetBody: templateDesc.targetBody,
                    allExercise: exerciseDesc.filter(exercise => exercise !== null) as {
                        exerciseName: string;
                        setNumber: number;
                        weight: number;
                        reps: number;
                    }[] 
                }
        }))
        const validTemplateDesc = fetchTemplateDesc.filter(desc => desc !== null) as {
            day: string;
            targetBody: string;
            allExercise: {
                exerciseName: string;
                setNumber: number;
                weight: number;
                reps: number;
            }[] | null;
        }[];
        res.status(200).json({templateDesc : validTemplateDesc }); 
    } catch (error) {
        console.log(error);
        res.status(500).json({ templateDesc: null });
    }
} )

module.exports = router;