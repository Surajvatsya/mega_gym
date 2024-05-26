import mongoose, { Schema, Document } from 'mongoose';

interface ExerciseDesc extends Document {
    exerciseName : String, 
    setNumber : Number,
    weight : Number,
    reps : Number
}

const exerciseDescSchema: Schema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    exerciseName : String,
    setNumber : Number,
    weight : Number,
    reps : Number
});

const ExerciseDesc = mongoose.model<ExerciseDesc>('exerciseDesc', exerciseDescSchema);

export default ExerciseDesc;
