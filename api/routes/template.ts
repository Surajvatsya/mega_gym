import express, { Request, Response } from 'express';
const router = express.Router();
const verifyToken = require("../middleware/jwt");
import Exercise from '../model/exercise'
import ExerciseDesc from '../model/exerciseDesc'
import TemplateDesc from '../model/templateDesc'
import { ExerciseForDayResponse } from '../../responses';
const mongoose = require("mongoose");

router.post("/addSetToExercise", verifyToken, async (req:any, res:any)=>{
    try {
        const customerId = req.jwt.ownerId;
        const today = new Date().getDay();
        const daysOfWeek: string[] = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const templateDescId = await TemplateDesc.findOne({ customerId, day: daysOfWeek[today] }, {_id : 1});
        const newExerciseDesc = new ExerciseDesc({
            _id: new mongoose.Types.ObjectId(),
            exerciseId: req.body.exerciseId,
            exerciseName: req.body.exerciseName,
            setNumber :  new Date(),
            reps : req.body.reps,
            weight : req.body.weight,
            templateDescId: templateDescId,
        });
        await newExerciseDesc.save();
        res.status(200).json({ message: " SetToExercise added " });    
    } catch (error) {
        res.status(500).json({ message: error });    
    }
} )

router.post("/addExerciseToTemplate", verifyToken, async (req:any, res:any)=>{
    try {

    const customerId = req.jwt.ownerId;

    // Get the numeric day value (0-6)
    const today = new Date().getDay();
    const daysOfWeek: string[] = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    // const newExerciseDescId = new mongoose.Types.ObjectId();

    const templateDescId = await TemplateDesc.findOne({ customerId, day: daysOfWeek[today] }, {_id : 1});

    if (templateDescId){
        const newExerciseDesc = new ExerciseDesc({
            _id: new mongoose.Types.ObjectId(),
            exerciseId: req.body.exerciseId,
            exerciseName: req.body.exerciseName,
            setNumber : -1,
            reps : -1,
            weight : -1,
            templateDescId: templateDescId,
        });
        await newExerciseDesc.save();
        res.status(200).json({ message: `Exercise added to existing template for today with id ${newExerciseDesc._id}.` });
    }else{
        const newTemplateDescId = new mongoose.Types.ObjectId();
        const newTemplateDesc = new TemplateDesc({
            _id : newTemplateDescId,
            day : daysOfWeek[today],
            customerId,
        });
        await newTemplateDesc.save();
    
        const newExerciseDesc = new ExerciseDesc({
            _id: new mongoose.Types.ObjectId(),
            exerciseId: req.body.exerciseId,
            exerciseName: req.body.exerciseName,
            setNumber : -1,
            reps : -1,
            weight : -1,
            templateDescId: newTemplateDescId,
        });
        await newExerciseDesc.save();
        res.status(200).json({ message: `Exercise added to new template for today with id ${newExerciseDesc._id}.` });
        
    }

    } catch (error) {
    console.log(error);
    res.status(500).json({ message: `server error ${error}.` });
    }
} )


router.delete("/removeSetFromExercise", verifyToken, async (req:any, res:any)=>{
    try {
    const customerId = req.jwt.ownerId;
    // Get the numeric day value (0-6)
    const today = new Date().getDay();
    const daysOfWeek: string[] = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    const templateDescId = await TemplateDesc.findOne({ customerId, day: daysOfWeek[today] }, {_id : 1});

    if (templateDescId){
        const result = await ExerciseDesc.deleteOne({templateDescId,exerciseId : req.body.exerciseId, setNumber:req.body.setNumber});
        res.status(200).json({ message: `successfully removed set of exercise ${req.body.exerciseId} ${result}` });
    }
    else
    console.log("templateDescId is null", templateDescId);
    
    } catch (error) {
    console.log(error);
    res.status(500).json({ message: `server error ${error}.` });
    }
} )

router.delete("/removeExercise", verifyToken, async (req:any, res:any)=>{
    try {
    const customerId = req.jwt.ownerId;
    // Get the numeric day value (0-6)
    const today = new Date().getDay();
    const daysOfWeek: string[] = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    const templateDescId = await TemplateDesc.findOne({ customerId, day: daysOfWeek[today] }, {_id : 1});

    if (templateDescId){
        const result = await ExerciseDesc.deleteOne({templateDescId,exerciseId : req.body.exerciseId});
        res.status(200).json({ message: `successfully removed exercise ${req.body.exerciseId} ${result}` });
    }
    else
    console.log("templateDescId is null", templateDescId);
    } catch (error) {
    console.log(error);
    res.status(500).json({ message: `server error ${error}.` });
    }
} )

router.get("/getExercisesForDay", verifyToken, async (req: any, res: Response<ExerciseForDayResponse>) => {
    try {
        const customerId = req.jwt.ownerId;
        const today = new Date().getDay();
        const daysOfWeek: string[] = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

        const day = daysOfWeek[today];
        console.log("day ", day);
        
        const exercises = await TemplateDesc.aggregate([
            {
                $match: {
                    customerId,
                    day: day
                }
            },
            {
                $lookup: {
                    from: 'exercisedescs',
                    localField: '_id',
                    foreignField: 'templateDescId',
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
                            setNumber: '$exercises.setNumber',
                            weight: '$exercises.weight',
                            reps: '$exercises.reps'
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
                $sort: { 'exercises.sets.setNumber': 1 }  // Sort the exercises by timestamp
            }
        ]);
        console.log("exercises", exercises);
        if (exercises.length === 0) {
            return res.status(404).json({ exercises: null });
        }
        res.status(200).json(exercises[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ exercises: null });
    }
});



module.exports = router;