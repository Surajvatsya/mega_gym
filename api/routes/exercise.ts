const mongoose = require("mongoose");
import express, { Request, Response } from 'express';
import Exercise from '../model/exercise';

require("dotenv").config();
const router = express.Router();

router.get('/allExercise',  async  (req: any, res: any) => {

    const exerciseList = await Exercise.find();

    res.status(200).json({'exercises': exerciseList});

})

module.exports = router;