import mongoose, { Schema, Document } from 'mongoose';

interface ExerciseDesc extends Document {
    templateDescId : mongoose.Schema.Types.ObjectId,
    exerciseId : string, 
    setNumber : number,
    weight : number,
    reps : number
}

const exerciseDescSchema: Schema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    templateDescId : mongoose.Schema.Types.ObjectId,
    exerciseId : String,
    setNumber : Number,
    weight : Number,
    reps : Number
});

const ExerciseDesc = mongoose.model<ExerciseDesc>('exerciseDesc', exerciseDescSchema);

export default ExerciseDesc;
